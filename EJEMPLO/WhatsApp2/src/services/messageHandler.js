const processedMessages = new Set();

import whatsappService from "./whatsappService.js";
import { STATES } from "../utils/conversationState.js";
import sessionTracker from "../utils/sessionTracker.js";
import N8nSenderService from "./n8nSenderService.js";
import supabaseClientService from "./supabaseClientService.js";
import config from "../config/env.js";
import env from "../config/env.js";

class MessageHandler {
  // El controlador envia todos los mensajes a esta  funcion.

  async handleIncomingMessage(message, senderInfo) {
    const messageId = message.id;
    const from = message.from;
    //Buscamos y retemos  duplicados por que Whatsapp al no recibir respuesta de n8n inmediata  tiende a re enviar el mismo mensaje
    if (processedMessages.has(messageId)) {
      console.log("⚠️ Mensaje duplicado ignorado:", messageId);
      return;
    }
    // despues de 5 minutos   eliminamos mensajes
    processedMessages.add(messageId);
    setTimeout(() => processedMessages.delete(messageId), 5 * 60 * 1000);

    // Miramos si el mensaje es de tipo texto
    if (message?.type === "text") {
      const incomingText = message.text.body.toLowerCase().trim();
      const currentStep = sessionTracker.getSessionStep(from) || STATES.INITIAL;
      await this.sendToN8n_logs(from, incomingText, messageId, "otro");

      // Validamos el estado de validacion
      if (currentStep === STATES.INVALID_OPTION) {
        await this.handleInvalidState(from, message.text.body, messageId);
        
        return;
      }

      // Interno al escribir menu  te lleva al menu principal
      if (incomingText === "menú" || incomingText === "menu") {
        await this.sendWelcomeMenu(from);
        sessionTracker.addSession(from, STATES.MAIN_MENU);
        return;
      }
      // si no tinee estado Quiere decir que es  primer mensaje pone el estado de menu  y  envia el menu  con el mensaje de bienvenida
      if (currentStep === STATES.INITIAL) {
        await this.sendWelcomeMessage(from, messageId, senderInfo);
        await this.sendWelcomeMenu(from);
        sessionTracker.addSession(from, STATES.MAIN_MENU);
      } else if (
        currentStep === STATES.INFO_DETAIL ||
        currentStep === STATES.RAG_CONVERSATION ||
        currentStep === STATES.OTHER_DETAIL ||
        currentStep === STATES.OPTION_1 ||
        currentStep === STATES.VALIDATION
      ) {
        // si tiene alguno de estos estados  ira a la funcion enrutadora que envia el mensaje directamente al webhook n8n
        await this.routeTextByState(from, incomingText, messageId, currentStep);

        //  el ultimo estado sera finished si se deecta ese paso  se envia el menu principla de nuevo  y se elimina el estado anterior como contingencia
      } else if (currentStep === STATES.FINISHED) {
        await whatsappService.sendMessage(
          from,
          "✅ Tu solicitud anterior fue procesada. Si deseas iniciar otra consulta, selecciona una opción del menú."
        );
        sessionTracker.removeSession(from);
        await this.sendWelcomeMenu(from);
        sessionTracker.addSession(from, STATES.MAIN_MENU);
        // Ante culquier otra situacion el usuario  recibe este mensaje
      } else {
        await whatsappService.sendMessage(
          from,
          "🚫 Acción inválida. Para continuar, escribe La palabra screta."
        );
        sessionTracker.addSession(from, STATES.INVALID_OPTION);
      }
      //  se maerca como read  para enviar una respuesta 200  a whatsap  y que no replique mensajes
      await whatsappService.markAsRead(messageId);
      // si el uisuario usa el menu  el mensajhe sera de tipo interactive
    } else if (message.type === "interactive") {
      const optionId = message?.interactive?.button_reply?.id;
      await this.handleMenuOption(from, optionId);
      await whatsappService.markAsRead(messageId);
    }
  }
  // Esta  funcion fue llamada antes es para gestinar los flujos
  async routeTextByState(from, text, messageId, currentStep) {
    switch (currentStep) {
      case STATES.INFO_DETAIL:
        await this.handleInfoRequest(from, text, messageId);
        break;
      case STATES.RAG_CONVERSATION:
        await this.handleRAG_CONVERSATION(from, text, messageId);
        break;
      case STATES.OTHER_DETAIL:
        await this.handleOtherRequest(from, text, messageId);
        break;
      case STATES.OPTION_1:
        await this.sendEmailRequestToN8n(
          from,
          text,
          messageId,
          STATES.OPTION_1,
          "00000"
        );
        await whatsappService.sendMessage(
          from,
          "Correo Enviado  exitosamente, Digite el Codigo recibido"
        );
        whatsappService.markAsRead(messageId);
        break;
      case STATES.VALIDATION:
        const respuesta_validacion = await this.sendEmailRequestToN8n(
          from,
          text,
          messageId,
          STATES.VALIDATION,
          "00002"
        );
        console.log("📥 Respuesta validación completa:", respuesta_validacion);

        const mensaje =
          typeof respuesta_validacion === "string"
            ? respuesta_validacion
            : respuesta_validacion?.text;

        if (mensaje?.trim()) {
          await whatsappService.sendMessage(from, mensaje.trim(), messageId);

          if (mensaje.trim() === "✅ Código ingresado exitosamente.") {
            sessionTracker.removeSession(from);
          }
        } else {
          console.warn("⚠️ No se recibió un mensaje válido para enviar.");
          await whatsappService.sendMessage(
            from,
            "❌ Hubo un problema al procesar tu código. Intenta de nuevo.",
            messageId
          );
        }

        await whatsappService.markAsRead(messageId);

        break;

      default:
        await whatsappService.sendMessage(from, `Echo: ${text}`, messageId);
    }
  }
  //  esta es la opcion uno del menu interactivo
  async handleInfoRequest(from, text, messageId) {
    await whatsappService.sendMessage(
      from,
      "✅ Procesando tu solicitud de información..."
    );
    // este es parte de lo que se le envia al webhook
    const payload = {
      wa_id: from,
      message: text,
      context: "info_request",
      timestamp: new Date().toISOString(),
    };

    const response = await N8nSenderService.send(
      config.N8N_WEBHOOK_URL,
      payload
    );
    await this.sendCleanedResponse(from, response, messageId);
    sessionTracker.addSession(from, STATES.FINISHED);
  }

  async handleRAG_CONVERSATION(from, text, messageId) {
    try {
      const payload = {
        wa_id: from,
        message: text,
        context: "rag_conversation",
        timestamp: new Date().toISOString(),
      };

      const response = await N8nSenderService.send(
        config.N8N_WEBHOOK_RAG_CALCULATOR,
        payload
      );

      if (response?.body && typeof response.body === "string") {
        console.log("📤 Payload enviado:", payload.message);
        console.log("📥 Respuesta desde n8n:", response.body);

        // ✅ Usar función para extraer mensaje y estado
        const { message, finished } = this.parseN8nMessage(response.body);

        // Enviar solo el mensaje limpio al usuario
        await whatsappService.sendMessage(from, message, messageId);

        // Cambiar estado si finished es true
        if (finished) {
          sessionTracker.addSession(from, STATES.FINISHED);
        }
      } else {
        console.warn("⚠️ Respuesta inválida desde n8n:", response.body);
        await whatsappService.sendMessage(
          from,
          "❌ No se pudo generar una respuesta válida.",
          messageId
        );
      }
    } catch (error) {
      console.error("❌ Error en handleRAG_CONVERSATION:", error);
      await whatsappService.sendMessage(
        from,
        "⚠️ Ocurrió un error al procesar tu solicitud. Intenta nuevamente más tarde."
      );
    }
  }

  ////// Verificar si el mensaje es invalido ////////

  async handleInvalidState(from, incomingText, messageId) {
    if (incomingText === env.PalabraSecreta) {
      await whatsappService.sendMessage(
        from,
        "✅ Activación exitosa. Puedes continuar con el menú."
      );
      await this.sendToN8n_logs(from, incomingText + " " +"✅ Activación exitosa. Puedes continuar con el menú., messageId, ",messageId, "Palabra secreta");
      await this.sendWelcomeMenu(from);
      sessionTracker.addSession(from, STATES.MAIN_MENU);
    } else {
      await whatsappService.sendMessage(
        from,
        "🚫 Acción inválida. Para continuar, escribe *La palabra screta*."
      );
      await this.sendToN8n_logs(from, incomingText + " " + "🚫 Acción inválida. Para continuar, escribe *La palabra screta*.", messageId, "Palabra Secreta");
    }
  }
  // PPRUEBA  FUNCION DE ENVIO DE LOGS
  async sendToN8n_logs(from, text, messageId, tipo) {
    try {
      const payload = {
        wa_id: from,
        message: text,
        context: tipo,
        timestamp: new Date().toISOString(),
      };

      await N8nSenderService.send(config.N8N_WEBHOOK_Logs, payload);

      console.log("📤 Payload enviado a N8N PARA LOGS :", payload);
    } catch (error) {
      console.error("❌ Error al enviar a N8N:", error);
    }
  }

  // PRUEBA FUNCION DE SEGUNDO ENVIO A N8N PARA ENVIAR MENSAJES

  async sendEmailRequestToN8n(from, body, messageId, estado, codigo) {
    try {
      const payload = {
        from,
        body, 
        tipo: estado,
        timestamp: new Date().toISOString(),
        codigo: codigo,
      };

    //  await this.sendToN8n_logs(from, body, messageId, "Nombre");

      // Capturamos la respuesta de N8N
      const response = await N8nSenderService.send(
        config.N8N_WEBHOOK_Envio_correos,
        payload
      );

      console.log("📤 Payload de correo enviado correctamente:", payload);
      console.log("📥 Respuesta completa de N8N:", response);

      sessionTracker.addSession(from, STATES.VALIDATION);

      return (
        response?.data ||
        response?.body ||
        response?.text ||
        (typeof response === "string" ? { text: response } : response) ||
        null
      );
    } catch (error) {
      await whatsappService.sendMessage(from, "❌ Error al enviar el correo.");
      console.error("❌ Error al enviar el correo a N8N:", error);
      return null;
    }
  }

  //////////////////////////////////////////////////////////////////////////

  async handleOtherRequest(from, text, messageId) {
    await whatsappService.sendMessage(
      from,
      "✅ Procesando tu consulta personalizada..."
    );
    const response = await N8nSenderService.send({
      wa_id: from,
      message: text,
    });
    await this.sendCleanedResponse(from, response, messageId);
    sessionTracker.addSession(from, STATES.FINISHED);
  }

  async sendCleanedResponse(to, rawResponse, messageId) {
    if (!Array.isArray(rawResponse) || !rawResponse[0]?.text) {
      await whatsappService.sendMessage(
        to,
        "❌ La respuesta del servidor no es válida.",
        messageId
      );
      return;
    }

    let texto = rawResponse[0].text.trim();
    const classMatch = texto?.match(/class\s*=\s*["']([^"']+)["']/i);
    const classUrl = classMatch ? classMatch[1] : null;

    if (texto) {
      texto = texto
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<a [^>]*>(.*?)<\/a>/gi, "$1")
        .replace(/<[^>]+>/g, "");

      if (classUrl && classUrl.startsWith("http")) {
        texto += `\n🔗 Enlace: ${classUrl}`;
      }

      await whatsappService.sendMessage(to, texto, messageId);
    } else {
      await whatsappService.sendMessage(
        to,
        "❌ No se pudo obtener una respuesta válida.",
        messageId
      );
    }
  }

  async handleMenuOption(to, optionId) {
    switch (optionId) {
      case "option_1":
        await this.sendBackToMenuButton(to);
        await this.sendToN8n_logs(to, "enviar un correo", to, "opcion");

        await whatsappService.sendMessage(
          to,
          `📝 Envia un Caracter cualquiera para continuar con el proceso `
        );

        sessionTracker.addSession(to, STATES.OPTION_1);


        break;

      case "option_2":
        await this.sendBackToMenuButton(to);
        await whatsappService.sendMessage(
          to,
          "📌 Usted ha elegido la opcion 2 no tiene  opciones click menu principal"
        );
        sessionTracker.addSession(to, STATES.RAG_CONVERSATION);
        const payload = {
          wa_id: to,
          message: "primera interaccion",
          context: "rag_conversation",
          timestamp: new Date().toISOString(),
        };

        const response = await N8nSenderService.send(
          config.N8N_WEBHOOK_RAG_CALCULATOR,
          payload
        );
        console.log(response);
        const messageWhatsap =
          response?.body || "❌ No se pudo generar una respuesta";
        console.log(messageWhatsap);
        await whatsappService.sendMessage(to, messageWhatsap);
        break;

      case "option_3":
        await this.sendBackToMenuButton(to);
        await whatsappService.sendMessage(
          to,
          "✏️ Usted ha elegido la opcion 3 no tiene  opciones click menu principal"
        );
        sessionTracker.addSession(to, STATES.OTHER_DETAIL);
        break;

      case "option_back":
        await this.sendWelcomeMenu(to);
        sessionTracker.addSession(to, STATES.MAIN_MENU);
        break;

      default:
        await whatsappService.sendMessage(to, "❌ Opción no válida.");
    }
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const firstName = this.getSenderName(senderInfo);
    const welcome = `👋 Hola ${firstName}, bienvenido. ¿En qué puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcome, messageId);
  }

  async sendWelcomeMenu(to) {
    const buttons = this.buildMainMenuButtons();
    const menuMessage = `📋 Elige una opción:`;
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendBackToMenuButton(to) {
    const backButton = [
      { type: "reply", reply: { id: "option_back", title: "Menú principal" } },
    ];
    await whatsappService.sendInteractiveButtons(
      to,
      "⬅️ Puedes volver al menú en cualquier momento:",
      backButton
    );
  }

  getSenderName(senderInfo) {
    if (!senderInfo) return "usuario";
    const fullName = senderInfo.profile?.name || senderInfo.wa_id || "usuario";
    const cleanName = fullName.replace(/[^\p{L}\s]/gu, "").trim();
    return cleanName.split(" ")[0] || "usuario";
  }

  async sendMedia(to) {
    const mediaUrl = "";
    const caption = "";
    const type = "audio";
    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

  parseN8nMessage(rawText) {
    const parts = rawText.split("|").map((part) => part.trim());

    const messageText = parts[0] || "";
    const marker = parts[1] || "";

    const isFinished = marker.toLowerCase() === "finished: true";

    return {
      message: messageText,
      finished: isFinished,
    };
  }

  buildMainMenuButtons() {
    return [
      { type: "reply", reply: { id: "option_1", title: "Mandame un  Correo" } },
      { type: "reply", reply: { id: "option_2", title: "option_2" } },
      { type: "reply", reply: { id: "option_3", title: "option_3" } },
    ];
  }
}

export default new MessageHandler();
