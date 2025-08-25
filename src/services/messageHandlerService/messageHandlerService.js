import { STATES } from "../../utils/conversationState.js";
import getStateHandler from "./states/stateFactory.js";

import whatsappClient from "../../clients/whatsappClient.js";
import sessionTracker from "../../utils/sessionTracker.js";

class MessageHandler {
  constructor({ whatsappClient, sessionTracker }) {
    this.whatsappClient = whatsappClient;
    this.sessionTracker = sessionTracker;
  }
  // El controlador envia todos los mensajes a esta  funcion.
  async handleIncomingMessage(message, senderInfo) {
    const messageId = message.id;
    const from = message.from;
    //Buscamos y retemos  duplicados por que  el Whatsapp al no recibir respuesta de n8n inmediata  tiende a re enviar el mismo mensaje
    if (this.sessionTracker.messageWasProcessed(from, message)) {
      console.log("⚠️ Mensaje duplicado ignorado:", messageId);
      return;
    }

    let currentStep = this.sessionTracker.getSessionStep(from);
    if (!currentStep) {
      // Si no hay un paso de sesión, inicializamos uno
      this.sessionTracker.addSession(from, STATES.INITIAL);
      currentStep = STATES.INITIAL;
    }
    if (this.sessionTracker.isSessionLifeCycleEnded(from)) {
      await this.whatsappClient.sendMessage(from, "❌ The session has expired. You need to start a new session.", messageId);
      this.sessionTracker.removeSession(from);
      return;
    }
    this.sessionTracker.addProcessedMessage(from, messageId);

    // Enrutamos el mensaje segun el estado actual
    try {
      const stateHandler = getStateHandler(currentStep);
      await stateHandler.handle({ from, message, messageId, senderInfo });
    } catch (error) {
      console.error("❌ Error al procesar el mensaje:", error);
      this.sessionTracker.removeSession(from);
    }
  }
}

export default new MessageHandler({ whatsappClient, sessionTracker });