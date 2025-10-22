import dotenv from 'dotenv';  //Libreria para poder cargar variables

dotenv.config(); //Inicializa, busca archivo .env y copia sus pares clave=valor a process.env

export default {  //exporta por defecto un objeto de configuración
  // Meta verification
  
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,  //lee de proceess.env token de verificación
  API_TOKEN: process.env.API_TOKEN,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE,  //ID Asociado
  API_VERSION: process.env.API_VERSION,

  // Puerto  Expuesto 
  PORT: process.env.PORT || 3000,

  // n8n  webhooks 
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,  //webhook base o principal
  N8N_WEBHOOK_RAG_CALCULATOR: process.env.N8N_WEBHOOK_RAG_CALCULATOR,   //webhook para un flujo
  N8N_WEBHOOK_Logs: process.env.N8N_WEBHOOK_Logs,              //envía eventos a n8n
  N8N_WEBHOOK_Envio_correos: process.env.N8N_WEBHOOK_Envio_correos, //envío de correos desde n8n


  // Supabase 
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY, //tiene permisos elevados, conservar privada

  
  PalabraSecreta:process.env.PalabraSecreta


};