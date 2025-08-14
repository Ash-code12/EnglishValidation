class SessionTracker {
  constructor() {
    // Mapea wa_id -> step actual
    this.sessions = new Map();
  }

  // Guarda o actualiza el paso actual para un usuario
  addSession(wa_id, step) {
    this.sessions.set(wa_id, { step, data: {} });
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
    this.sessions.delete(wa_id);
    console.log(`🗑️ Sesión eliminada para: ${wa_id}`);
  }

  // Verifica si el usuario tiene una sesión activa
  isSessionActive(wa_id) {
    return this.sessions.has(wa_id);
  }

  // Obtiene los datos de la sesión del usuario
  getSessionData(wa_id) {
    const session = this.sessions.get(wa_id) || null;
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
}

const sessionTracker = new SessionTracker();

export default sessionTracker;
