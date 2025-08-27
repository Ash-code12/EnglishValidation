import BaseState from "./BaseState.js";

export default class GettingRecruiterNameState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config, nextState }) {
    super({ whatsappClient, sessionTracker, n8nClient, config });
    this.nextState = nextState;
  }
  async handle({ from, message, messageId }) {
    try {
      console.log("Nombre reclutador:", message.interactive?.list_reply?.title);
      if (!message.text && !message.interactive?.list_reply?.title) {
        await this.whatsappClient.sendMessage(from, "❌ Please, provide your recruiter's name.", messageId);
        return;
      }
      const recruiterName = message.text ? message.text.body : message.interactive?.list_reply?.title;
      if (!this.validateRecruiterName(recruiterName)) {
        await this.whatsappClient.sendMessage(from, "❌ Name you provided is not in our valid recruiters list.", messageId);
        return;
      }
      const recruiterNameNormalized = await this.handleTextMessage(recruiterName);

      this.sessionTracker.updateSessionData(from, { recruiterName: recruiterNameNormalized });
      await this.whatsappClient.sendMessage(from, "💼 What is the job position you are applying for?", messageId);
      this.sessionTracker.updateSessionStep(from, this.nextState);
    } catch (error) {
      throw error;
    }

  }
}
