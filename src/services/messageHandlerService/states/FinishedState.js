import BaseState from "./BaseState.js";

export default class FinishedState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config }) {
    super({ whatsappClient, sessionTracker, n8nClient, config });
  }
  async handle({ from, messageId }) {
    try {
      const questions = ["question1", "question2", "question3", "question4", "question5"];
      const sessionData = this.sessionTracker.getSessionData(from, questions);
      const payload = questions.map(q => ({ [q]: sessionData[q] }));
      console.log("📦 Final answers:", payload);

      await this.requestForSaveQuestions(from, payload);

      this.sessionTracker.removeSession(from);

      await this.whatsappClient.sendMessage(from, "✅ Thank you! Your responses have been saved.", messageId);
      await this.whatsappClient.sendMessage(from, "🙌 Good luck with the process!", messageId);
    } catch (error) {
      throw error;
    }

  }

  async requestForSaveQuestions(from, payload) {
    console.log("📤 Enviando datos a SharePoint:", {
      wa_id: from,
      data: payload,
    });
    try {
      await this.n8nClient.send(
        this.config.N8N_WEBHOOK_SAVE_QUESTIONS,
        {
          wa_id: from,
          data: payload,
        },
      );
    } catch (error) {
      throw error;
    }
  }
}
