class StorageService {
  getSession(key) {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }

  setSession(key, value) {
    try { sessionStorage.setItem(key, value); } catch { /* noop */ }
  }

  removeSession(key) {
    try { sessionStorage.removeItem(key); } catch { /* noop */ }
  }

  getLocal(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  setLocal(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
  }

  removeLocal(key) {
    try { localStorage.removeItem(key); } catch { /* noop */ }
  }

  async fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  }
}

export const storage = new StorageService();
