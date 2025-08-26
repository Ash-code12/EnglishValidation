import dotenv from 'dotenv';

dotenv.config();

export default {
  // Meta verification
  
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
  API_TOKEN: process.env.API_TOKEN,
  BUSINESS_PHONE: process.env.BUSINESS_PHONE,
  API_VERSION: process.env.API_VERSION,

  // Puerto  Expuesto 
  PORT: process.env.PORT || 3000,

  // n8n  webhooks 
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  N8N_WEBHOOK_SAVE_QUESTIONS: process.env.N8N_WEBHOOK_SAVE_QUESTIONS,
  // N8N_WEBHOOK_SAVE_QUESTIONS: process.env.N8N_WEBHOOK_SAVE_QUESTIONS_PRUEBAS,

  // Supabase 
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  PalabraSecreta:process.env.PalabraSecreta,
  SESSION_LIFETIME: process.env.SESSION_LIFETIME

};