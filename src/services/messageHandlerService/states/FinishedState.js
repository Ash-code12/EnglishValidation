import BaseState from "./BaseState.js";
import n8nSenderService from "../../../clients/n8nClient.js";
import config from "../../../config/env.js";

export default class FinishedState extends BaseState {
  async handle({ from, messageId }) {
    const sessionData = this.sessionService.getData(from);
    const payload = Object.keys(sessionData)
      .filter(k => k.startsWith("question"))
      .map(k => ({ [k]: sessionData[k] }));

    console.log("📦 Final answers:", payload);
    await n8nSenderService.send(config.N8N_WEBHOOK_SAVE_QUESTIONS, { wa_id: from, data: payload });

    this.sessionService.remove(from);

    await this.whatsappService.sendMessage(from, "✅ Thank you! Your responses have been saved.", messageId);
    await this.whatsappService.sendMessage(from, "🙌 Good luck with the process!", messageId);
  }
}
