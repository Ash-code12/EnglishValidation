export default class BaseState {
  static ONE_MINUTE = 60 * 1000;
  constructor({ whatsappClient, sessionTracker, n8nClient, config }) {
    this.whatsappClient = whatsappClient;
    this.sessionTracker = sessionTracker;
    this.n8nClient = n8nClient;
    this.config = config;
  }

  async handle() {
    throw new Error("Method 'handle()' must be implemented in subclass.");
  }

  async handleTextMessage(text) {
    //Normalizar el texto, sin caracteres especiales ni acentos
    const normalizedText = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    console.log(`📥 Mensaje de texto recibido: ${normalizedText}`);
    return normalizedText;
  }

  async handleAudioMessage(audio) {
    const audioUrl = await this.whatsappClient.getMediaUrl(audio.id);
    console.log('📥 Audio recibido :', audioUrl);
    return audioUrl;
  }

  async validateFullName(fullName) {
    const text = fullName.body;
    if (typeof text !== "string") return false;
    const nameParts = text
      .trim()
      .split(/\s+/) // divide por uno o más espacios
      .filter(Boolean);

    return nameParts.length >= 2;
  }

  async validateRecruiterName(recruiterName) {
    return (this.config.RECRUITERS.includes(recruiterName));
  }

  async setAsyncQuestionsTimeout(from) {
    setTimeout(async () => {
      console.log("Se envia alerta de cierre de sesion");
      await this.whatsappClient.sendMessage(from, `⏳ Your session will expire in ${this.config.REMINDER_BEFORE_TIMEOUT} minutes. Hurry up!`);
    }, (this.config.QUESTIONARY_TIMEOUT - this.config.REMINDER_BEFORE_TIMEOUT) * BaseState.ONE_MINUTE);
    setTimeout(() => {
      this.sessionTracker.removeSession(from);
    }, this.config.QUESTIONARY_TIMEOUT * BaseState.ONE_MINUTE);
  }

  async setAsyncSessionTimeout(from){
    setTimeout(async () => {
      await this.whatsappClient.sendMessage(from, `⏳ Your session has expired. Please start over.`);
      this.sessionTracker.removeSession(from);
    }, this.config.SESSION_LIFETIME * BaseState.ONE_MINUTE);
  }
}