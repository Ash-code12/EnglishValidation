const processedMessages = new Set();

import whatsappClient from "../../clients/whatsappClient.js";
import { STATES } from "../../utils/conversationState.js";
import sessionTracker from "../../utils/sessionTracker.js";
import config from "../../config/env.js";
import n8nClient from "../../clients/n8nClient.js";

class MessageHandler {
  // El controlador envia todos los mensajes a esta  funcion.
  async handleIncomingMessage(message, senderInfo) {
    const messageId = message.id;
    const from = message.from;
    //Buscamos y retemos  duplicados por que  el Whatsapp al no recibir respuesta de n8n inmediata  tiende a re enviar el mismo mensaje
    if (processedMessages.has(messageId)) {
      console.log("⚠️ Mensaje duplicado ignorado:", messageId);
      return;
    }
    // despues de 5 minutos   eliminamos mensajes
    processedMessages.add(messageId);
    setTimeout(() => processedMessages.delete(messageId), 5 * 60 * 1000);
    
    let currentStep = sessionTracker.getSessionStep(from);
    if (!currentStep) {
      // Si no hay un paso de sesión, inicializamos uno
      sessionTracker.addSession(from, STATES.INITIAL);
      currentStep = STATES.INITIAL;
    }

    // Enrutamos el mensaje segun el estado actual
    try {
      await this.routeMessageByState(from, message, messageId, currentStep, senderInfo);
    } catch (error) {
      console.error("❌ Error al procesar el mensaje:", error);
      sessionTracker.removeSession(from);
    }
  }

  // Esta  funcion fue llamada antes es para gestinar los flujos
  async routeMessageByState(from, message, messageId, currentStep, senderInfo) {
    switch (currentStep) {
      case STATES.INITIAL:
        await this.handleInitialRequest(from, message, messageId, senderInfo);
        break;
      case STATES.GETTING_FULL_NAME:
        await this.handleGettingFullName(from, message, messageId);
        break;
      case STATES.GETTING_RECRUITER_NAME:
        await this.handleGettingRecruiterName(from, message, messageId);
        break;
      case STATES.GETTING_JOB_POSITION:
        await this.handleGettingJobPosition(from, message, messageId);
        break;
      case STATES.QUESTION_1:
        await this.handleQuestion1(from, message, messageId);
        break;
      case STATES.QUESTION_2:
        await this.handleQuestion2(from, message, messageId);
        break;
      case STATES.QUESTION_3:
        await this.handleQuestion3(from, message, messageId);
        break;
      case STATES.QUESTION_4:
        await this.handleQuestion4(from, message, messageId);
        break;
      case STATES.QUESTION_5:
        await this.handleQuestion5(from, message, messageId);
        break;
      case STATES.FINISHED:
        await this.handleFinishedState(from, message, messageId, senderInfo);
        break;
      default:
        await whatsappClient.sendMessage(from, 'Echo: ', message.text, " ", messageId);
    }
  }

  async handleInitialRequest(from, message, messageId, senderInfo) {
    await this.sendWelcomeMessage(from, messageId, senderInfo);
    await this.askForFullName(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.GETTING_FULL_NAME);
  }

  async handleGettingFullName(from, message, messageId, senderInfo) {
    if (!message.text) {
      await whatsappClient.sendMessage(from, "❌ Please, provide your full name.", messageId);
      return;
    }
    const fullName = await this.handleTextMessage(message.text);
    sessionTracker.updateSessionData(from, { fullName });

    await this.askForRecruiterName(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.GETTING_RECRUITER_NAME);
  }

  async handleGettingRecruiterName(from, message, messageId, senderInfo) {
    if (!message.text) {
      await whatsappClient.sendMessage(from, "❌ Please, provide your recruiter's name.", messageId);
      return;
    }
    const recruiterName = await this.handleTextMessage(message.text);
    sessionTracker.updateSessionData(from, { recruiterName });
    await this.askForJobPosition(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.GETTING_JOB_POSITION);
  }

  async handleGettingJobPosition(from, message, messageId, senderInfo) {
    if (!message.text) {
      await whatsappClient.sendMessage(from, "❌ Please, provide the job position you are applying for.", messageId);
      return;
    }
    const jobPosition = await this.handleTextMessage(message.text);
    sessionTracker.updateSessionData(from, { jobPosition });
    const payload = sessionTracker.getSessionData(from);
    console.log("📦 Datos recopilados del usuario:", payload);
    await this.requestForSharePointValidation(from, payload);
    await whatsappClient.sendMessage(from, "Perfect! thanks", messageId);
    await this.infoDetails(from, messageId);
    await this.askQuestion_1(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.QUESTION_1);
  }

  async requestForSharePointValidation(from, payload) {
    console.log("📤 Enviando datos a SharePoint:", {
      wa_id: from,
      data: payload,
    });
    await n8nClient.send(
      config.N8N_WEBHOOK_URL,
      {
        wa_id: from,
        data: payload,
      },
    );
  }

  async requestForSaveQuestions(from, payload) {
    console.log("📤 Enviando datos para guardar preguntas:", {
      wa_id: from,
      data: payload,
    });
    await n8nClient.send(
      config.N8N_WEBHOOK_SAVE_QUESTIONS,
      {
        wa_id: from,
        data: payload,
      },
    );
  }

  async handleQuestion1(from, message, messageId) {
    if (!message.audio) {
      await whatsappClient.sendMessage(from, "❌ Please, provide an audio response.", messageId);
      return;
    }
    const audioUrl = await this.handleAudioMessage(message.audio);
    sessionTracker.updateSessionData(from, { question1: audioUrl });
    await this.askQuestion_2(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.QUESTION_2);
  }

  async handleQuestion2(from, message, messageId) {
    if (!message.audio) {
      await whatsappClient.sendMessage(from, "❌ Please, provide an audio response.", messageId);
      return;
    }
    const audioUrl = await this.handleAudioMessage(message.audio);
    sessionTracker.updateSessionData(from, { question2: audioUrl });
    await this.askQuestion_3(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.QUESTION_3);
  }

  async handleQuestion3(from, message, messageId) {
    if (!message.audio) {
      await whatsappClient.sendMessage(from, "❌ Please, provide an audio response.", messageId);
      return;
    }
    const audioUrl = await this.handleAudioMessage(message.audio);
    sessionTracker.updateSessionData(from, { question3: audioUrl });
    await this.askQuestion_4(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.QUESTION_4);
  }

  async handleQuestion4(from, message, messageId) {
    if (!message.audio) {
      await whatsappClient.sendMessage(from, "❌ Please, provide an audio response.", messageId);
      return;
    }
    const audioUrl = await this.handleAudioMessage(message.audio);
    sessionTracker.updateSessionData(from, { question4: audioUrl });
    await this.askQuestion_5(from, messageId);
    sessionTracker.updateSessionStep(from, STATES.QUESTION_5);
  }

  async handleQuestion5(from, message, messageId) {
    if (!message.audio) {
      await whatsappClient.sendMessage(from, "❌ Please, provide an audio response.", messageId);
      return;
    }
    const audioUrl = await this.handleAudioMessage(message.audio);
    sessionTracker.updateSessionData(from, { question5: audioUrl });
    sessionTracker.updateSessionStep(from, STATES.FINISHED);
    await this.handleFinishedState(from, messageId);
  }

  async handleFinishedState(from, message, messageId, senderInfo) {
    const sessionData = sessionTracker.getSessionData(from);
    const payload = [
      { question1: sessionData.question1 },
      { question2: sessionData.question2 },
      { question3: sessionData.question3 },
      { question4: sessionData.question4 },
      { question5: sessionData.question5 },
    ];
    await this.requestForSaveQuestions(from, payload);
    sessionTracker.removeSession(from);
    await whatsappClient.sendMessage(from, "✅ Thank you! Your responses have been successfully saved.\nA recruiter will review your answers and reach out to you shortly.", messageId);
    await whatsappClient.sendMessage(from, "🙌 We appreciate your time and effort!\n💼 Good luck with the process, and have a great day! 🌟", messageId);
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    const firstName = this.getSenderName(senderInfo);
    const welcome = `Hi ${firstName}!👋 Welcome to the English validation bot!
In this bot, you’ll need to answer a series of questions in English to help us pre-assess your English level 💪
First, I have a few questions for you. Let's get started! 🚀`;
    await whatsappClient.sendMessage(to, welcome, messageId);
  }

  async askForFullName(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "📝 What is your full name?",
      messageId
    );
  }

  async askForRecruiterName(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "🙋 Who is your recruiter at Softgic?",
      messageId
    );
  }

  async askForJobPosition(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "💼 What is the job position you are applying for?",
      messageId
    );
  }

  async infoDetails(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      `🎤 You’ll be asked 5 questions about yourself, and each voice note should be no longer than 1 minute.
⏳ IMPORTANT: If you don’t respond within the time limit, your answer will be partially taken.

🗄 Your audio responses will be stored in our database for later evaluation.

🚫 Please refrain from using external tools such as AI, translators, or similar.
If the use of such tools is detected, your test will be canceled and you will be removed from the selection process — we will notice.

🕒 The maximum total duration of the test is 10 minutes. After this time, the bot will disconnect automatically.

💡 We suggest you answer in a way that allows us to assess you properly. Avoid just saying “yes” or “no” or giving very short answers, as that may negatively affect your evaluation.

📌 You MUST always respond only with voice notes.

✨ Best of luck! ✨`,
      messageId
    );
  }

  async askQuestion_1(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "🎧 Alright, let’s break the ice with a quick riddle. Can you guess the answer?",
      messageId
    );
    await whatsappClient.sendMessage(
      to,
      "Audio",
      messageId
    );
  }

  async askQuestion_2(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "👵 Imagine your grandma asked you what your job is about. How would you explain it to her?",
      messageId
    );
  }

  async askQuestion_3(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "🧠 If you had to mentor a junior in your area, what’s one concept you think they must understand well, and how would you explain it?",
      messageId
    );
  }

  async askQuestion_4(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "🤼 Tell me about a time when you had to work with someone who had a different approach or opinion. How did you manage it?",
      messageId
    );
  }

  async askQuestion_5(to, messageId) {
    await whatsappClient.sendMessage(
      to,
      "💻 Can you describe a tool or software you use often in your job, and explain what it’s used for, as if you were training a new teammate?",
      messageId
    );
  }

  getSenderName(senderInfo) {
    if (!senderInfo) return "user";
    const fullName = senderInfo.profile?.name || senderInfo.wa_id || "user";
    const cleanName = fullName.replace(/[^\p{L}\s]/gu, "").trim();
    return cleanName.split(" ")[0] || "user";
  }

  async sendMedia(to) {
    const mediaUrl = "";
    const caption = "";
    const type = "audio";
    await whatsappClient.sendMediaMessage(to, type, mediaUrl, caption);
  }

  async handleAudioMessage(audio) {
    const audioUrl = await whatsappClient.getMediaUrl(audio.id);
    console.log('📥 Audio recibido :', audioUrl);
    return audioUrl;
  }

  async handleTextMessage(text) {
    //Necesito normalizar el texto, sin caracteres especiales ni acentos
    const normalizedText = text.body
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    console.log(`📥 Mensaje de texto recibido: ${normalizedText}`);
    return normalizedText;
  }
}
export default new MessageHandler();