import axios from "axios";
import config from "../config/env.js";

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
      console.error("Error sending message:", error);
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
      console.error("❌ Error al marcar mensaje como leído:", error.response?.data || error.message);
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
      console.error(
        "❌ Error al enviar botones interactivos:",
        error.response?.data || error.message
      );
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      const mediaObject = {};
      switch (type) {
        case `image`:
          mediaObject.image = { link: mediaUrl, caption: caption };
          break;
        case `audio`:
          mediaObject.audio = { link: mediaUrl };
          break;
        case `video`:
          mediaObject.video = { link: mediaUrl, caption: caption };
          break;
        case `document`:
          mediaObject.document = {
            link: mediaUrl,
            caption: caption,
            filename: `Name file`,
          };
          break;

        default:
          throw new Error(`not supported Media Type`);
      }
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
          type: type,
          ...mediaObject
        },
      });


    } catch (error) {
      console.error(`${error}  error sending media`);
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
      console.error("Error fetching media URL:", error);
      throw error;
    }
  }
}

export default new WhatsAppClient();
