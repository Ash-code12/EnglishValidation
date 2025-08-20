import BaseState from "./BaseState.js";

export default class QuestionState extends BaseState {
  constructor({ whatsappService, sessionService, messageValidator, config, questionNumber, nextState }) {
    super({ whatsappService, sessionService, messageValidator, config });
    this.questionNumber = questionNumber;
    this.nextState = nextState;
  }

  QUESTIONS = {
    1: "🎧 Alright, let’s break the ice with a quick riddle. Can you guess the answer?",
    2: "👵 Imagine your grandma asked you what your job is about. How would you explain it to her?",
    3: "🧠 If you had to mentor a junior in your area, what’s one concept you think they must understand well, and how would you explain it?",
    4: "🤼 Tell me about a time when you had to work with someone who had a different approach or opinion. How did you manage it?",
    5: "💻 Can you describe a tool or software you use often in your job, and explain what it’s used for, as if you were training a new teammate?"
  };

  async handle({ from, message, messageId }) {
    if (!message.audio) {
      await this.whatsappClient.sendMessage(from, "❌ Please, provide an audio response.", messageId);
      return;
    }
    const audioUrl = await this.handleAudioMessage(message);
    if (!audioUrl) return;

    this.sessionService.updateData(from, { [`question${this.questionNumber}`]: audioUrl });

    if (this.nextState) {
      await this.whatsappService.sendMessage(from, `Question ${this.nextState.replace("QUESTION_", "")}`, messageId);
      this.sessionService.updateStep(from, this.nextState);
    } else {
      this.sessionService.updateStep(from, "FINISHED");
    }
  }
}
