import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { formatPrice } from "../../core/helpers/format.js";
import { $, clearElement } from "../../core/helpers/dom.js";

export class StoreSidebar {
  constructor() {
    this._sidebar = $("storeSidebar");
    this._isOpen = false;
    this._products = [];
    this._storeId = null;
    this._storeName = "";
    this._category = "الكل";
    this._query = "";

    $("closeSidebar")?.addEventListener("click", () => this.hide());
    if (this._sidebar) {
      this._sidebar.addEventListener("click", (e) => {
        if (e.target === this._sidebar) this.hide();
      });
    }
    $("productSearch")?.addEventListener("input", (e) => {
      this._query = e.target.value.trim().toLowerCase();
      this._renderProducts();
    });

    eventBus.on(EVENTS.STORE_SELECTED, (store) => this._open(store));
    eventBus.on(EVENTS.STORE_DESELECTED, () => this.hide());
  }

  hide() {
    this._isOpen = false;
    this._sidebar?.classList.remove("active");
    document.getElementById("backdrop")?.classList.remove("active");
  }

  _open(store) {
    const p = store.properties;
    this._products = p.products || [];
    this._storeId = p.store_id;
    this._storeName = p.name;
    this._category = "الكل";
    this._query = "";

    $("storeImage").src = p.image || "";
    $("storeName").textContent = p.name;
    $("storeCategory").textContent = p.category || "متجر";
    $("storeLocation").textContent = `${p.city || ""}${p.neighborhood ? ` — ${p.neighborhood}` : ""}`;
    $("storeRating").textContent = p.rating ?? "—";
    $("storeDelivery").textContent = p.delivery_fee ? formatPrice(p.delivery_fee) : "مجاني";

    const status = $("storeStatus");
    status.textContent = p.open ? "مفتوح الآن" : "مغلق";
    status.className = "status-pill " + (p.open ? "open" : "closed");

    $("productSearch").value = "";
    this._buildCategoryBar();
    this._renderProducts();

    this._isOpen = true;
    this._sidebar?.classList.add("active");
    document.getElementById("backdrop")?.classList.add("active");
  }

  _buildCategoryBar() {
    const bar = $("categoryBar");
    if (!bar) return;
    const cats = ["الكل", ...new Set(this._products.map(pr => pr.category).filter(Boolean))];
    bar.innerHTML = cats.map(c =>
      `<button class="cat-chip${c === this._category ? " active" : ""}" data-cat="${c}">${c}</button>`
    ).join("");
    bar.querySelectorAll(".cat-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        this._category = btn.dataset.cat;
        bar.querySelectorAll(".cat-chip").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this._renderProducts();
      });
    });
  }

  _renderProducts() {
    const container = $("productsContainer");
    const emptyMsg = $("noProducts");
    if (!container) return;

    const filtered = this._products.filter(pr => {
      if (this._category !== "الكل" && pr.category !== this._category) return false;
      if (this._query && !pr.name.toLowerCase().includes(this._query)) return false;
      return true;
    });

    clearElement(container);

    if (filtered.length === 0) {
      if (emptyMsg) emptyMsg.style.display = "block";
      return;
    }
    if (emptyMsg) emptyMsg.style.display = "none";

    filtered.forEach(pr => {
      const card = document.createElement("div");
      card.className = "product-card-sm";
      card.innerHTML = `
        <img src="${pr.image}" onerror="this.src='https://via.placeholder.com/300x200?text=—'" loading="lazy">
        <div class="pcs-info">
          <b>${pr.name}</b>
          <span class="pcs-price">${formatPrice(pr.price)}</span>
        </div>
        <button class="btn-add"><i class="fas fa-cart-plus"></i> أضف للسلة</button>
      `;
      card.querySelector(".btn-add").addEventListener("click", (e) => {
        e.stopPropagation();
        eventBus.emit(EVENTS.PRODUCT_SELECTED, { product: pr, storeId: this._storeId, storeName: this._storeName });
      });
      card.addEventListener("click", () => {
        eventBus.emit(EVENTS.PRODUCT_SELECTED, { product: pr, storeId: this._storeId, storeName: this._storeName });
      });
      container.appendChild(card);
    });
  }
}
