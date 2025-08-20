import BaseState from "./BaseState.js";
import { STATES } from "../../../utils/conversationState.js";
import getStateHandler from "./stateFactory.js";

export default class QuestionState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config, questionNumber, nextState }) {
    super({ whatsappClient, sessionTracker, n8nClient, config });
    this.nextState = nextState;
    this.questionNumber = questionNumber;
  }

  QUESTIONS = {
    "QUESTION_1": "🎧 Alright, let’s break the ice with a quick riddle. Can you guess the answer?",
    "QUESTION_2": "👵 Imagine your grandma asked you what your job is about. How would you explain it to her?",
    "QUESTION_3": "🧠 If you had to mentor a junior in your area, what’s one concept you think they must understand well, and how would you explain it?",
    "QUESTION_4": "🤼 Tell me about a time when you had to work with someone who had a different approach or opinion. How did you manage it?",
    "QUESTION_5": "💻 Can you describe a tool or software you use often in your job, and explain what it’s used for, as if you were training a new teammate?"
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
        await this.whatsappClient.sendMessage(from, this.QUESTIONS[this.nextState], messageId);
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
