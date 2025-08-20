import axios from "axios";
import config from "../config/env.js";
import FormData from "form-data";

class WhatsAppClient {
  async sendMessage(to, body, messageId) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
        data: {
          messaging_product: "whatsapp",
          to,
          text: { body },
          // context: {
          //   message_id: messageId,
          // },
        },
      });
    } catch (error) {
      // console.error("Error sending message:", error);
      throw error;
    }
  }

  async markAsRead(messageId) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId,
        },
      });

      console.log(`✅ Mensaje ${messageId} marcado como leído`);
    } catch (error) {
      // console.error("❌ Error al marcar mensaje como leído:", error.response?.data || error.message);
      throw error;
    }
  }

  async sendInteractiveButtons(to, BodyText, buttons) {
    try {
      await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: {
          messaging_product: "whatsapp",
          to,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: BodyText },
            action: {
              buttons: buttons,
            },
          },
        },
      });
    } catch (error) {
      // console.error(
      //   "❌ Error al enviar botones interactivos:",
      //   error.response?.data || error.message
      // );
      throw error;
    }
  }

  async sendMediaMessage(to, type, mediaId) {
    try {
      // 2️⃣ Enviar el audio al destinatario
    const sendRes = await axios.post(
      `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: type,
        audio: { id: mediaId },
      },
      {
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
          "Content-Type": "application/json",
        },
      } 
    );
    } catch (error) {
      // console.error("❌ Error al enviar mensaje de audio:", error);
      throw error;
    }
  }

  async getMediaUrl(mediaId) {
    try {
      const response = await axios({
        method: "GET",
        url: `https://graph.facebook.com/${config.API_VERSION}/${mediaId}`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
        },
      });
      return response.data.url;
    } catch (error) {
      // console.error("Error fetching media URL:", error);
      throw error;
    }
  }
  async uploadMedia(mediaStream, mediaType) {
    try {
      const formData = new FormData();
      formData.append("file", mediaStream);
      formData.append("type", mediaType);
      formData.append("messaging_product", "whatsapp");

      const response = await axios({
        method: "POST",
        url: `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/media`,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`,
          ...formData.getHeaders(),
        },
        data: formData,
      });
      console.log("✅ Media uploaded successfully:", response.data);
      return response.data.id;
    } catch (error) {
      // console.error("Error uploading media:", error);
      throw error;
    }
  }
}
export default new WhatsAppClient();
