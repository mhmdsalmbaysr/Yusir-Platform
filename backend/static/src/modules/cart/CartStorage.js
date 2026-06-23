const CART_KEY = "yusir_cart";

export class CartStorage {
  load() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  save(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* noop */ }
  }

  clear() {
    try { localStorage.removeItem(CART_KEY); } catch { /* noop */ }
  }
}
