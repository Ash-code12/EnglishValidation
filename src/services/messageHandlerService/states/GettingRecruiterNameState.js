import BaseState from "./BaseState.js";

export default class GettingRecruiterNameState extends BaseState {
  constructor({ whatsappService, sessionService, messageValidator, nextState }) {
    super({ whatsappService, sessionService, messageValidator });
    this.nextState = nextState;
  }
  async handle({ from, message, messageId }) {
    if (!message.text) {
      await this.whatsappClient.sendMessage(from, "❌ Please, provide your recruiter's name.", messageId);
      return;
    }
    if (!await this.validateFullName(message.text)) {
      await this.whatsappClient.sendMessage(from, "❌ Please provide at least your recruiter's first name and last name.", messageId);
      return;
    }
    const recruiterName = await this.handleTextMessage(message.text);

    this.sessionTracker.updateSessionData(from, { recruiterName });
    await this.whatsappClient.sendMessage(from, "💼 What is the job position you are applying for?", messageId);
    this.sessionTracker.updateSessionStep(from, this.nextState);
  }
}
