import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { CartStorage } from "./CartStorage.js";

export class CartManager {
  constructor() {
    this._storage = new CartStorage();
    this._items = this._storage.load();
  }

  get items() {
    return [...this._items];
  }

  get count() {
    return this._items.reduce((sum, i) => sum + i.quantity, 0);
  }

  get total() {
    return this._items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  add(product, storeId) {
    const existing = this._items.find(i =>
      i.product.id === product.id && i.storeId === storeId
    );
    if (existing) {
      existing.quantity++;
    } else {
      this._items.push({ product, storeId, quantity: 1 });
    }
    this._persist();
  }

  remove(productId, storeId) {
    const idx = this._items.findIndex(i =>
      i.product.id === productId && i.storeId === storeId
    );
    if (idx !== -1) this._items.splice(idx, 1);
    this._persist();
  }

  updateQuantity(productId, storeId, qty) {
    const item = this._items.find(i =>
      i.product.id === productId && i.storeId === storeId
    );
    if (item) {
      item.quantity = Math.max(1, qty);
      this._persist();
    }
  }

  clear() {
    this._items = [];
    this._storage.clear();
    eventBus.emit(EVENTS.CART_UPDATED, { items: [], count: 0, total: 0 });
    eventBus.emit(EVENTS.CART_CLEARED);
  }

  _persist() {
    this._storage.save(this._items);
    eventBus.emit(EVENTS.CART_UPDATED, {
      items: this.items,
      count: this.count,
      total: this.total
    });
  }
}
