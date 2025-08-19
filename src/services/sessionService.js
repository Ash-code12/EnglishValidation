import sessionTracker from "../utils/sessionTracker.js";

export default {
  getStep(from) {
    return sessionTracker.getSessionStep(from);
  },

  updateStep(from, step) {
    sessionTracker.updateSessionStep(from, step);
  },

  updateData(from, data) {
    sessionTracker.updateSessionData(from, data);
  },

  getData(from) {
    return sessionTracker.getSessionData(from);
  },

  add(from, step) {
    sessionTracker.addSession(from, step);
  },

  remove(from) {
    sessionTracker.removeSession(from);
  }
};