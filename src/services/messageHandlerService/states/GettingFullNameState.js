import BaseState from "./BaseState.js";

export default class GettingFullNameState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config, nextState }) {
    super({ whatsappClient, sessionTracker, config, n8nClient });
    this.nextState = nextState;
  }
  async handle({ from, message, messageId }) {
    try {
      if (!message.text) {
        await this.whatsappClient.sendMessage(from, "❌ Please, provide your full name.", messageId);
        return;
      }
      if (!await this.validateFullName(message.text)) {
        await this.whatsappClient.sendMessage(from, "❌ Please provide at least your first name and last name.", messageId);
        return;
      }
      const fullName = await this.handleTextMessage(message.text.body);

      
      this.sessionTracker.updateSessionData(from, { fullName });
      await this.whatsappClient.sendMessage(from, "🙋 Who is your recruiter at Softgic?", messageId);
      const reclutadores = this.config.RECRUITERS;
      await this.whatsappClient.sendInteractiveList(
        from,
        "Select your recruiter",
        "Swipe to see more options",
        "View recruiters",
        [
          {
            title: "Recruiters",
            rows: 
              reclutadores.map((name, index) => ({
                id: String(index + 1),
                title: name
              })),
            
          }
        ]
      );
      this.sessionTracker.updateSessionStep(from, this.nextState);
    } catch (error) {
      throw error;
    }

  }
}