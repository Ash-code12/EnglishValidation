import BaseState from "./BaseState.js";
import { STATES } from "../../../utils/conversationState.js";
import getStateHandler from "./stateFactory.js";
import { getAudioStream } from "./../../../utils/getAudioStream.js"

export default class QuestionState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config, questionNumber, nextState }) {
    super({ whatsappClient, sessionTracker, n8nClient, config });
    this.nextState = nextState;
    this.questionNumber = questionNumber;
  }

  QUESTIONS = {
    "QUESTION_1": "./src/assets/audios/audio1.mp3",
    "QUESTION_2": "./src/assets/audios/audio2.mp3",
    "QUESTION_3": "./src/assets/audios/audio3.mp3",
    "QUESTION_4": "./src/assets/audios/audio4.mp3",
    "QUESTION_5": "./src/assets/audios/audio5.mp3"
  };

  async handle({ from, message, messageId }) {
    try {
      // Validar el audio
      if (!message.audio) {
        await this.whatsappClient.sendMessage(from, "❌ Please, provide an audio response.", messageId);
        return;
      }
      const audioUrl = await this.handleAudioMessage(message.audio);
      if (!audioUrl) return;

      await this.sessionTracker.updateSessionData(from, { [`question${this.questionNumber}`]: audioUrl });

      if (this.nextState !== STATES.FINISHED) {
        const audioId = await this.whatsappClient.uploadMedia(await getAudioStream(this.QUESTIONS[this.nextState]), "audio/mp3");
        await this.whatsappClient.sendMediaMessage(from, "audio", audioId, "");
        this.sessionTracker.updateSessionStep(from, this.nextState);
      } else {
        this.sessionTracker.updateSessionStep(from, this.nextState);
        await getStateHandler(this.sessionTracker.getSessionStep(from)).handle({ from, message, messageId });
      }
    } catch (error) {
      // console.error("❌ Error al manejar el estado Question:", error);
      throw error;
    }
  }
}
