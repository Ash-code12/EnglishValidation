import BaseState from "./BaseState.js";
import { getAudioStream } from "./../../../utils/getAudioStream.js"

export default class GetJobPositionState extends BaseState {
  constructor({ whatsappClient, sessionTracker, n8nClient, config, nextState }) {
    super({ whatsappClient, sessionTracker, n8nClient, config });
    this.nextState = nextState;
  }

  INFORMATION = `🎤 You’ll be asked 5 questions about yourself, and each voice note should be no longer than 1 minute.
⏳ IMPORTANT: If you don’t respond within the time limit, your answer will be partially taken.
    
🗄 Your audio responses will be stored in our database for later evaluation.
    
🚫 Please refrain from using external tools such as AI, translators, or similar.
If the use of such tools is detected, your test will be canceled and you will be removed from the selection process — we will notice.
    
🕒 The maximum total duration of the test is ${this.config.SESSION_LIFETIME / 60000} minutes. After this time, the bot will disconnect automatically.
    
💡 We suggest you answer in a way that allows us to assess you properly. Avoid just saying “yes” or “no” or giving very short answers, as that may negatively affect your evaluation.
    
📌 You MUST always respond only with voice notes.
    
✨ Best of luck! ✨`

  async handle({ from, message, messageId }) {
    try {
      if (!message.text) {
        await this.whatsappClient.sendMessage(from, "❌ Please, provide the job position you are applying for.", messageId);
        return;
      }
      const jobPosition = await this.handleTextMessage(message.text);
      this.sessionTracker.updateSessionData(from, { jobPosition });

      // Log user data
      const payload = this.sessionTracker.getSessionData(from, ["fullName", "recruiterName", "jobPosition"]);
      console.log("📦 Datos recopilados del usuario:", payload);
      await this.requestForSharePointValidation(from, payload);

      // Send confirmation messages
      await this.whatsappClient.sendMessage(from, "Perfect! Thanks!", messageId);

      // Provide information about the test
      await this.whatsappClient.sendMessage(
        from,
        this.INFORMATION,
        messageId);
      await this.whatsappClient.sendMessage(from, "🎧 Please listen to this audio and tell us what it is about.", messageId);

      // Upload audio for next question
      const audioId = await this.whatsappClient.uploadMedia(await getAudioStream("./src/assets/audios/audio1.mp3"), "audio/mp3");
      await this.whatsappClient.sendMediaMessage(from, "audio", audioId, "");

      // Update session step
      this.sessionTracker.updateSessionStep(from, this.nextState);
    } catch (error) {

      throw error;
    }
  }

  async requestForSharePointValidation(from, payload) {
    console.log("📤 Enviando datos a SharePoint:", {
      wa_id: from,
      data: payload,
    });
    try {
      await this.n8nClient.send(
        this.config.N8N_WEBHOOK_URL,
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
