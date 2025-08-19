import config from '../config/env.js';
import messageHandler from '../services/messageHandlerService/messageHandler.js';

class WebhookController {
  async handleIncoming(req, res) {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const message = value?.messages?.[0];
    const senderInfo = value?.contacts?.[0];

    if (!message || !senderInfo) {
      // No hay mensaje válido o información del remitente
      return res.sendStatus(200);
    }

    console.log("📥 Mensaje recibido:", JSON.stringify(message, null, 2));
    console.log("👤 Sender info:", JSON.stringify(senderInfo, null, 2));

    try {
      await messageHandler.handleIncomingMessage(message, senderInfo);
    } catch (error) {
      console.error("❌ Error al procesar el mensaje:", error);
    }

    res.sendStatus(200);
  }
  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      console.log('Webhook verified successfully!');
    } else {
      console.log('Webhook verification failed.');
      res.sendStatus(200).send(JSON.stringify({ TOKEN: config.WEBHOOK_VERIFY_TOKEN }));
    }
  }
}

export default new WebhookController();