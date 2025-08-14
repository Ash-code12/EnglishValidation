// src/services/n8nSenderService.js
import axios from "axios";
import config from "../config/env.js";

class N8nClient {
  async send(url, data) {
    try {
      const response = await axios.post(url, data);
      console.log("✅ Datos enviados a n8n correctamente");
      return response.data;
    } catch (error) {
      console.error("❌ Error enviando a n8n:", error.response?.data || error.message);
      throw error;
    }
  }
}

export default new N8nClient();