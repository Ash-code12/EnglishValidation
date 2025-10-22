//Eventos entrantes de whatsapp

import config from '../config/env.js';  //importa el archivo
import messageHandler from '../services/messageHandler.js'; //importa el servicio que procesa los mensajes

class WebhookController {
 async handleIncoming(req, res) {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  const message = value?.messages?.[0];     //extrae primer mensaje
  const senderInfo = value?.contacts?.[0];  //extrae primer contacto

  if (!message || !senderInfo) {
    // No hay mensaje válido o información del remitente
    return res.sendStatus(200);  //devuelve 200 ok para que meta no vuelva a reenviar el evento
  }

  console.log("📥 Mensaje recibido:", JSON.stringify(message, null, 2));
  console.log("👤 Sender info:", JSON.stringify(senderInfo, null, 2));

  try {
    await messageHandler.handleIncomingMessage(message, senderInfo);  //llama al servicio para procesar el mensaje recibido
  } catch (error) {
    console.error("❌ Error al procesar el mensaje:", error);
  }

  res.sendStatus(200);  // responde 200 ok a meta despues de procesar el mensaje para que no intente enviarlo varias veces
}


  verifyWebhook(req, res) {          // meta envía petición get con ciertos parametros para comprobar que eres tu
    const mode = req.query['hub.mode'];      // modo de la solicitud ej: subscribe
    const token = req.query['hub.verify_token'];    // token definido en .env
    const challenge = req.query['hub.challenge'];   // número aleatorio que se devuelve si todo está correcto

    if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {    // si el mode y el token coincide con el que está en env.js...
      res.status(200).send(challenge);            // responde con challenge, meta verifica que el webhook es correcto
      console.log('Webhook verified successfully!'); 
    } else {
      res.sendStatus(403);  // responde "no autorizado"
    }
  }
}

export default new WebhookController();  //exporta instancia única del controlador para usar en rutas