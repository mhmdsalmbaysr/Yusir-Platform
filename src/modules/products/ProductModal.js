import { formatPrice } from "../../core/helpers/format.js";
import { $ } from "../../core/helpers/dom.js";

export class ProductModal {
  constructor(onAddToCart) {
    this._modal = document.getElementById("productModal");
    this._close = document.getElementById("pmClose");
    this._addBtn = document.getElementById("pmAdd");
    this._currentProduct = null;
    this._currentStoreId = null;
    this._onAddToCart = onAddToCart;

    if (this._close) {
      this._close.addEventListener("click", () => this.close());
    }
    if (this._modal) {
      this._modal.addEventListener("click", (e) => {
        if (e.target === this._modal) this.close();
      });
    }
    if (this._addBtn) {
      this._addBtn.addEventListener("click", () => this._addToCart());
    }
    document.getElementById("pmMinus")?.addEventListener("click", () => {
      const q = parseInt($("pmQty").textContent) || 1;
      if (q > 1) $("pmQty").textContent = q - 1;
    });
    document.getElementById("pmPlus")?.addEventListener("click", () => {
      const q = parseInt($("pmQty").textContent) || 1;
      $("pmQty").textContent = q + 1;
    });
  }

  open(product, storeId, storeName) {
    this._currentProduct = product;
    this._currentStoreId = storeId;
    $("pmName").textContent = product.name;
    $("pmPrice").textContent = formatPrice(product.price);
    $("pmDesc").textContent = product.desc || "";
    $("pmCategory").textContent = product.category || "";
    $("pmRating").textContent = product.rating ?? "";
    $("pmImage").src = product.image || "https://via.placeholder.com/400x300?text=—";
    $("pmImage").onerror = function () { this.src = "https://via.placeholder.com/400x300?text=—"; };
    $("pmOld").style.display = product.old_price ? "" : "none";
    if (product.old_price) $("pmOld").innerHTML = `<del>${formatPrice(product.old_price)}</del>`;
    $("pmQty").textContent = "1";
    if (this._modal) this._modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  close() {
    if (this._modal) this._modal.classList.remove("active");
    document.body.style.overflow = "";
    this._currentProduct = null;
  }

  _addToCart() {
    if (this._currentProduct) {
      const qty = parseInt($("pmQty").textContent) || 1;
      for (let i = 0; i < qty; i++) {
        this._onAddToCart(this._currentProduct, this._currentStoreId);
      }
      this.close();
    }
  }
}
