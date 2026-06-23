import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { $ } from "../../core/helpers/dom.js";
import { api } from "../../core/services/ApiService.js";

export class CheckoutManager {
  constructor(cartManager) {
    this._cart = cartManager;
    this._modal = document.getElementById("checkoutModal");
    this._submitBtn = document.getElementById("coSubmit");

    if (this._submitBtn) {
      this._submitBtn.addEventListener("click", () => this._submit());
    }
    if (this._modal) {
      this._modal.addEventListener("click", (e) => {
        if (e.target === this._modal) this._close();
      });
    }
    document.getElementById("coClose")?.addEventListener("click", () => this._close());
  }

  async _submit() {
    const name = $("coName")?.value.trim();
    const phone = $("coPhone")?.value.trim();
    const address = $("coAddress")?.value.trim();
    if (!name || !phone) return;

    const items = this._cart.items;
    const total = this._cart.total;

    const storeId = items.length > 0 ? items[0].storeId : null;

    eventBus.emit(EVENTS.CHECKOUT_SUBMITTED, {
      items,
      total,
      customer: { name, phone, address, notes: $("coNotes")?.value.trim() },
      date: new Date().toISOString()
    });

    if (storeId) {
      try {
        await api.createOrder({
          store: storeId,
          customer_name: name,
          customer_phone: phone,
          customer_address: address,
          notes: $("coNotes")?.value.trim() || '',
          total,
          items,
        });
      } catch (e) {
        console.warn("[Checkout] order not saved to server:", e);
      }
    }

    this._cart.clear();
    this._close();
  }

  _close() {
    if (this._modal) this._modal.classList.remove("active");
  }
}
