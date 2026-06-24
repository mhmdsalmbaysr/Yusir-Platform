import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { formatPrice } from "../../core/helpers/format.js";
import { $, clearElement } from "../../core/helpers/dom.js";

export class CartUI {
  constructor(cartManager) {
    this._cart = cartManager;
    this._panel = document.getElementById("cartPanel");
    this._toggle = document.getElementById("cartToggle");
    this._badge = document.getElementById("cartBadge");
    this._items = document.getElementById("cartItems");
    this._total = document.getElementById("cartTotal");
    this._close = document.getElementById("closeCart");
    this._checkoutBtn = document.getElementById("checkoutBtn");

    this._initEvents();
    eventBus.on(EVENTS.CART_UPDATED, (data) => this._onUpdate(data));
  }

  _initEvents() {
    if (this._toggle) {
      this._toggle.addEventListener("click", () => this._togglePanel());
    }
    if (this._panel) {
      this._panel.addEventListener("click", (e) => {
        if (e.target === this._panel) this._panel.classList.remove("active");
      });
    }
    if (this._close) {
      this._close.addEventListener("click", () => this._panel.classList.remove("active"));
    }
    if (this._checkoutBtn) {
      this._checkoutBtn.addEventListener("click", () => {
        const modal = document.getElementById("checkoutModal");
        if (modal) {
          this._renderSummary();
          modal.classList.add("active");
        }
      });
    }
  }

  _togglePanel() {
    if (this._panel) {
      this._panel.classList.toggle("active");
      if (this._panel.classList.contains("active")) this._render();
    }
  }

  _renderSummary() {
    const el = $("coSummary");
    if (!el) return;
    const items = this._cart.items;
    if (items.length === 0) { el.innerHTML = '<div class="cart-empty">السلة فارغة</div>'; return; }
    let html = "";
    items.forEach(item => {
      const p = item.product;
      html += `<div class="co-summary-item">
        <span class="si-name">${p.name}</span>
        <span class="si-qty">×${item.quantity}</span>
        <span class="si-price">${formatPrice(p.price * item.quantity)}</span>
      </div>`;
    });
    html += `<div class="co-total-row">
      <span class="co-total-label">المجموع</span>
      <span class="co-total-value">${formatPrice(this._cart.total)}</span>
    </div>`;
    el.innerHTML = html;
  }

  _onUpdate(data) {
    if (this._badge) {
      this._badge.textContent = data.count;
      this._badge.style.display = data.count > 0 ? "flex" : "none";
    }
  }

  _render() {
    const items = this._cart.items;
    clearElement(this._items);
    if (items.length === 0) {
      this._items.innerHTML = '<div class="cart-empty">السلة فارغة</div>';
      if (this._total) this._total.textContent = "0 ريال";
      if (this._checkoutBtn) this._checkoutBtn.disabled = true;
      return;
    }
    items.forEach((item, i) => {
      const p = item.product;
      const card = document.createElement("div");
      card.className = "cart-item";
      card.innerHTML = `
        <img src="${p.image}" onerror="this.src='https://via.placeholder.com/60?text=—'" loading="lazy">
        <div class="ci-info">
          <div class="ci-name">${p.name}</div>
          <div class="ci-price">${formatPrice(p.price)}</div>
        </div>
        <div class="ci-qty">
          <button class="qty-btn" data-i="${i}" data-dir="-1">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-i="${i}" data-dir="1">+</button>
        </div>
        <div class="ci-total">${formatPrice(p.price * item.quantity)}</div>
        <button class="ci-remove" data-i="${i}"><i class="fas fa-trash"></i></button>
      `;
      card.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.currentTarget.dataset.i);
          const dir = parseInt(e.currentTarget.dataset.dir);
          const newQty = item.quantity + dir;
          if (newQty < 1) {
            this._cart.remove(p.id, item.storeId);
          } else {
            this._cart.updateQuantity(p.id, item.storeId, newQty);
          }
          this._render();
        });
      });
      card.querySelector(".ci-remove").addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.i);
        this._cart.remove(p.id, item.storeId);
        this._render();
      });
      this._items.appendChild(card);
    });
    if (this._total) this._total.textContent = formatPrice(this._cart.total);
    if (this._checkoutBtn) this._checkoutBtn.disabled = false;
  }
}
