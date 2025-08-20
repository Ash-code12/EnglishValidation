export default class BaseState {
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
    const normalizedText = text.body
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
    const nameParts = fullName.split(" ");
    return nameParts.length >= 2;
  }
}
