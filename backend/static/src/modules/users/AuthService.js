import { storage } from "../../core/services/StorageService.js";
import { APP_CONFIG } from "../../core/config/app.js";
import { SESSION_TYPES } from "../../core/constants/app.js";
import { api, setToken } from "../../core/services/ApiService.js";

class AuthService {
  constructor() {
    this._currentUser = null;
  }

  async loginSuperAdmin(username, password) {
    try {
      const data = await api.login(username, password);
      if (data.user && data.user.role === 'superadmin') {
        storage.setSession(APP_CONFIG.storage.sessionSA, "1");
        this._currentUser = { role: SESSION_TYPES.SUPER_ADMIN, ...data.user };
        return true;
      }
    } catch { /* fallback to local */ }
    const sa = APP_CONFIG.auth.superAdmin;
    if (username === sa.user && password === sa.pass) {
      storage.setSession(APP_CONFIG.storage.sessionSA, "1");
      this._currentUser = { role: SESSION_TYPES.SUPER_ADMIN };
      setToken('superadmin-fallback');
      return true;
    }
    return false;
  }

  async loginMerchant(email, password) {
    try {
      const data = await api.login(email, password);
      if (data.user && data.user.role === 'merchant') {
        storage.setSession(APP_CONFIG.storage.sessionMerchant, data.user.id);
        this._currentUser = { role: SESSION_TYPES.MERCHANT, ...data.user, ...(data.merchant || {}) };
        return true;
      }
    } catch { /* fallback to local */ }
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
    api.logout();
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
