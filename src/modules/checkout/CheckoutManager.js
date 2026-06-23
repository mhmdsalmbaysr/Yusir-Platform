import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { $ } from "../../core/helpers/dom.js";

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

  _submit() {
    const name = $("coName")?.value.trim();
    const phone = $("coPhone")?.value.trim();
    const address = $("coAddress")?.value.trim();
    if (!name || !phone) return;

    eventBus.emit(EVENTS.CHECKOUT_SUBMITTED, {
      items: this._cart.items,
      total: this._cart.total,
      customer: { name, phone, address, notes: $("coNotes")?.value.trim() },
      date: new Date().toISOString()
    });
    this._cart.clear();
    this._close();
  }

  _close() {
    if (this._modal) this._modal.classList.remove("active");
  }
}
