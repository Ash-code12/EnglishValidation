// Rutas de express que recibirán las peticiones de whatsapp

import express from 'express';
import webhookController from '../controllers/webhookController.js';

const router = express.Router();  // "mini servidor" donde se defien rutas y luego se conecta al servidor principal

router.post('/webhook', webhookController.handleIncoming);  //recibe mensajes de whatsapp
router.get('/webhook', webhookController.verifyWebhook);    // verifica el webhook con meta al configurarlo

export default router;