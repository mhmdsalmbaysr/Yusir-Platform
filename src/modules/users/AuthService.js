import { storage } from "../../core/services/StorageService.js";
import { APP_CONFIG } from "../../core/config/app.js";
import { SESSION_TYPES } from "../../core/constants/app.js";

class AuthService {
  constructor() {
    this._currentUser = null;
  }

  loginSuperAdmin(username, password) {
    const sa = APP_CONFIG.auth.superAdmin;
    if (username === sa.user && password === sa.pass) {
      storage.setSession(APP_CONFIG.storage.sessionSA, "1");
      this._currentUser = { role: SESSION_TYPES.SUPER_ADMIN };
      return true;
    }
    return false;
  }

  loginMerchant(email, password) {
    const merchants = this.getMerchants();
    const m = merchants.find(x => x.email === email && x.pass === password);
    if (m) {
      storage.setSession(APP_CONFIG.storage.sessionMerchant, m.id);
      this._currentUser = { role: SESSION_TYPES.MERCHANT, ...m };
      return true;
    }
    return false;
  }

  checkSession() {
    if (storage.getSession(APP_CONFIG.storage.sessionSA)) {
      this._currentUser = { role: SESSION_TYPES.SUPER_ADMIN };
      return this._currentUser;
    }
    const mId = storage.getSession(APP_CONFIG.storage.sessionMerchant);
    if (mId) {
      const merchants = this.getMerchants();
      const m = merchants.find(x => x.id === mId);
      if (m) {
        this._currentUser = { role: SESSION_TYPES.MERCHANT, ...m };
        return this._currentUser;
      }
    }
    return null;
  }

  getCurrentUser() {
    return this._currentUser;
  }

  logout() {
    storage.removeSession(APP_CONFIG.storage.sessionSA);
    storage.removeSession(APP_CONFIG.storage.sessionMerchant);
    this._currentUser = null;
  }

  getMerchants() {
    try { return JSON.parse(localStorage.getItem(APP_CONFIG.storage.merchantsKey)) || []; } catch { return []; }
  }

  saveMerchants(list) {
    localStorage.setItem(APP_CONFIG.storage.merchantsKey, JSON.stringify(list));
  }
}

export const auth = new AuthService();
