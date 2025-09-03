import BaseState from "./BaseState.js";

export default class FinishedState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config }) {
    super({ whatsappClient, sessionTracker, n8nClient, config });
  }
  async handle({ from, messageId }) {
    const info = this.sessionTracker.getSessionData(from, ["fullName", "recruiterName", "jobPosition"]);
    
    const questions = ["question1", "question2", "question3", "question4", "question5"];
    const sessionData = this.sessionTracker.getSessionData(from, questions);
    const payload = questions.map(q => ({ [q]: sessionData[q] }));
    console.log("📦 Final answers:", payload);
    
    try {
      await this.requestForSaveQuestions(from, payload, info);
      console.log("✅ Datos enviados correctamente a SharePoint.");
      await this.whatsappClient.sendMessage(from, "✅ Thank you! Your responses have been saved.", messageId);
    } catch (error) {
      console.error("❌ Error al finalizar el estado:", error);
      await this.whatsappClient.sendMessage(from, "❌ An error occurred while processing your request, please contact support to solve the issue.", messageId);
    }
    finally {
      this.sessionTracker.removeSession(from);
      await this.whatsappClient.sendMessage(from, "🙌 Good luck with the process!", messageId);
    }

  }

  async requestForSaveQuestions(from, payload, info) {
    console.log("📤 Enviando datos a SharePoint:", {
      wa_id: from,
      data: payload,
      info: info
    });
    try {
      await this.n8nClient.send(
        this.config.N8N_WEBHOOK_SAVE_QUESTIONS,
        {
          wa_id: from,
          data: payload,
          info: info
        },
      );
    } catch (error) {
      throw error;
    }
  }
}
