import BaseState from "./BaseState.js";

export default class GettingFullNameState extends BaseState {
  constructor({ whatsappService, sessionService, messageValidator, nextState }) {
    super({ whatsappService, sessionService, messageValidator });
    this.nextState = nextState;
  }
  async handle({ from, message, messageId }) {
    if (!message.text) {
      await this.whatsappClient.sendMessage(from, "❌ Please, provide your full name.", messageId);
      return;
    }
    if (!await this.validateFullName(message.text)) {
      await this.whatsappClient.sendMessage(from, "❌ Please provide at least your first name and last name.", messageId);
      return;
    }
    const fullName = await this.handleTextMessage(message.text);

    this.sessionTracker.updateSessionData(from, { fullName });
    await this.whatsappClient.sendMessage(from, "🙋 Who is your recruiter at Softgic?", messageId);
    this.sessionTracker.updateSessionStep(from, this.nextState);
  }
}