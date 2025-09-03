import config  from "../config/env.js";
import {safeClearTimeout} from "../utils/safeClearTimeout.js";

class SessionTracker {
  static ONE_MINUTE = 60 * 1000;
  constructor() {
    // Mapea wa_id -> step actual
    this.sessions = new Map();
  }

  // Guarda o actualiza el paso actual para un usuario
  addSession(wa_id, step) {
    this.sessions.set(wa_id, { step, data: {}, startTime: Date.now(), processedMessages: [] });
    console.log(`🆕 Sesión iniciada: ${wa_id} en paso ${step}`);
  }

  // Actualiza el paso actual para un usuario
  updateSessionStep(wa_id, newStep) {
    const current = this.sessions.get(wa_id);

    if (current) {
      this.sessions.set(wa_id, { ...current, step: newStep });
      console.log(`🔄 Paso actualizado para ${wa_id}: ${newStep}`);
    } else {
      console.warn(`⚠️ No existe sesión para ${wa_id}. No se pudo actualizar el paso.`);
    }
  }

  // Actualiza los datos de la sesión del usuario
  updateSessionData(wa_id, newData) {
    const current = this.sessions.get(wa_id);
    if (current) {
      // Combinar lo que ya hay en data con lo nuevo
      const updatedData = { ...current.data, ...newData };

      // Guardar la sesión actualizada
      this.sessions.set(wa_id, { ...current, data: updatedData });

      console.log(`🔄 Datos de sesión actualizados para: ${wa_id}`);
    }
  }

  // Elimina la sesión de un usuario
  removeSession(wa_id) {
    if (!this.isSessionActive(wa_id)){
      return
    }
    const { questionsAlert, questionsTimeout, sessionTimeout } = this.getSessionData(wa_id, ["questionsAlert", "questionsTimeout", "sessionTimeout"])
    safeClearTimeout(questionsAlert, questionsTimeout, sessionTimeout);
    this.sessions.delete(wa_id);
    console.log(`🗑️ Sesión eliminada para: ${wa_id}`);
  }

  // Verifica si el usuario tiene una sesión activa
  isSessionActive(wa_id) {
    return this.sessions.has(wa_id);
  }

  // Obtiene los datos de la sesión del usuario
  getSessionData(wa_id, keys=[]) {
    const session = this.sessions.get(wa_id) || null;
    if (keys.length > 0) {
      // Si se proporcionan claves, filtrar los datos de la sesión
      return session ? Object.fromEntries(Object.entries(session.data).filter(([key]) => keys.includes(key))) : null;
    }
    return session ? session.data : null;
  }

  // Obtiene el paso actual del usuario
  getSessionStep(wa_id) {
    const session = this.sessions.get(wa_id) || null;
    return session ? session.step : null;
  }

  // Limpia todas las sesiones (por si se reinicia todo)
  clearAllSessions() {
    this.sessions.clear();
    console.log("🧹 Todas las sesiones eliminadas.");
  }

  // Solo para debugging
  listSessions() {
    return Array.from(this.sessions.entries());
  }

  // Gestión de vida de la sesión
  isSessionLifeCycleEnded(wa_id) {
    // implementa la lógica para gestionar la vida de la sesión
    const session = this.sessions.get(wa_id);
    if (!session) {
      console.warn(`⚠️ No existe sesión activa para: ${wa_id}`);
    } else {
      // Si la sesión existe, verificar si ya se cumplio su ciclo de vida
      const currentTime = Date.now();
      const sessionStartTime = session.startTime || currentTime;
      const sessionDuration = currentTime - sessionStartTime;

      if (sessionDuration > config.SESSION_LIFETIME * SessionTracker.ONE_MINUTE) {
        console.warn(`⚠️ La sesión ha expirado para: ${wa_id}`);
        return true;
      } else {
        console.log(`🔄 La sesión está activa para: ${wa_id}`);
        return false;
      }
    }
  }
  addProcessedMessage(wa_id, messageId) {
    const session = this.sessions.get(wa_id);
    if (session) {
      session.processedMessages.push(messageId);
      console.log(`✅ Mensaje procesado agregado para ${wa_id}: ${messageId}`);
    } else {
      console.warn(`⚠️ No existe sesión activa para: ${wa_id}`);
    }
  }
  messageWasProcessed(wa_id, message) {
    const session = this.sessions.get(wa_id);
    // 1. Si el mensaje es demasiado viejo, lo consideramos procesado
    const isExpired = message.timestamp*1000 < Date.now() - config.SESSION_LIFETIME * SessionTracker.ONE_MINUTE;
    if (isExpired) return true;

    // 2. Si hay sesión, revisamos si ya está en la lista de procesados
    return session?.processedMessages.includes(message.id) ?? false;
  }
}

const sessionTracker = new SessionTracker();

export default sessionTracker;
