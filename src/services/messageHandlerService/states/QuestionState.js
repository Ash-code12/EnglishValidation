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
  "QUESTION_1": "./src/assets/audios/Audio1IA.mp3",
  "QUESTION_2": "./src/assets/audios/Audio2IA.mp3",
  "QUESTION_3": "./src/assets/audios/Audio3IA.mp3",
  "QUESTION_4": "./src/assets/audios/Audio4IA.mp3",
  "QUESTION_5": "./src/assets/audios/Audio5IA.mp3"
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
      throw error;
    }
  }
}
