import BaseState from "./BaseState.js";

export default class InitialState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config, nextState }) {
    super({ whatsappClient, sessionTracker, n8nClient, config });
    this.nextState = nextState;
  }
  async handle({ from, messageId, senderInfo }) {
    try {
      const firstName = senderInfo?.profile?.name?.split(" ")[0] || "user";
      const welcome = `Hi ${firstName}!👋 Welcome to the English validation bot!
In this bot, you’ll need to answer a series of questions in English to help us pre-assess your English level 💪
First, I have a few questions for you. Let's get started! 🚀`;

      await this.whatsappClient.sendMessage(from, welcome, messageId);
      await this.whatsappClient.sendMessage(from, "📝 What is your full name?", messageId);

      this.sessionTracker.updateSessionStep(from, this.nextState);
    } catch (error) {
      throw error;
    }

  }
}
