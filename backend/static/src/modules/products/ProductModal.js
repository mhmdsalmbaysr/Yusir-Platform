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
  }

  open(product, storeId, storeName) {
    this._currentProduct = product;
    this._currentStoreId = storeId;
    $("pmStore").textContent = storeName || "";
    $("pmName").textContent = product.name;
    $("pmPrice").textContent = formatPrice(product.price);
    $("pmUnit").textContent = product.unit || "";
    $("pmDesc").textContent = product.desc || "";
    $("pmCat").textContent = product.category || "";
    $("pmImage").src = product.image || "https://via.placeholder.com/400x300?text=—";
    $("pmImage").onerror = function () { this.src = "https://via.placeholder.com/400x300?text=—"; };
    $("pmOld").style.display = product.old_price ? "block" : "none";
    if (product.old_price) $("pmOld").innerHTML = `<del>${formatPrice(product.old_price)}</del>`;
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
      this._onAddToCart(this._currentProduct, this._currentStoreId);
    }
  }
}
