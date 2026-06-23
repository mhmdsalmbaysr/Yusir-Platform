import { Toast } from "./shared/ui/Toast.js";
import { formatPrice, generateId } from "./core/helpers/format.js";
import { $ } from "./core/helpers/dom.js";
import { APP_CONFIG } from "./core/config/app.js";
import { storage } from "./core/services/StorageService.js";
import { auth } from "./modules/users/AuthService.js";

class MerchantApp {
  constructor() {
    this._toast = new Toast();
    this._user = null;
    this._store = null;
    this._products = [];
    this._orders = [];
  }

  init() {
    this._user = auth.checkSession();
    if (!this._user || this._user.role !== "merchant") {
      location.replace("login.html?redirect=merchant");
      return;
    }
    this._loadStore();
    this._initForm();
    this._initProductUpload();
    this._initProductForm();
    this._renderOrders();
  }

  _loadStore() {
    const data = storage.getLocal(APP_CONFIG.storage.storePrefix + this._user.id);
    if (data) {
      this._store = data.store || {};
      this._products = data.products || [];
    }
    this._fillForm();
    this._renderProducts();
  }

  _persist() {
    storage.setLocal(APP_CONFIG.storage.storePrefix + this._user.id, {
      store: this._store,
      products: this._products
    });
  }

  _fillForm() {
    if (!this._store) return;
    $("sName").value = this._store.name || "";
    $("sCat").value = this._store.category || "";
    $("sCity").value = this._store.city || "";
    $("sHood").value = this._store.neighborhood || "";
    $("sPhone").value = this._store.phone || "";
    $("sDelivery").value = this._store.delivery_fee || 0;
    $("sOpen").value = String(this._store.open !== false);
    if (this._store.image && this._store.image.startsWith("data:")) {
      $("sImagePreview").src = this._store.image;
      $("sImagePreview").style.display = "block";
    }
  }

  _initForm() {
    $("saveStore")?.addEventListener("click", () => this._saveStore());
    $("sImage")?.addEventListener("change", function () {
      const f = this.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (e) => { $("sImagePreview").src = e.target.result; $("sImagePreview").style.display = "block"; };
      r.readAsDataURL(f);
    });
  }

  _saveStore() {
    this._store.name = $("sName").value.trim();
    this._store.category = $("sCat").value.trim();
    this._store.city = $("sCity").value.trim();
    this._store.neighborhood = $("sHood").value.trim();
    this._store.phone = $("sPhone").value.trim();
    this._store.delivery_fee = parseInt($("sDelivery").value) || 0;
    this._store.open = $("sOpen").value === "true";
    const sf = $("sImage").files[0];
    if (sf) {
      const r = new FileReader();
      r.onload = () => { this._store.image = r.result; this._persist(); this._toast.show("✅ حُفظت"); };
      r.readAsDataURL(sf);
    } else {
      this._persist();
      this._toast.show("✅ حُفظت بيانات المتجر");
    }
  }

  _initProductUpload() {
    $("pImage")?.addEventListener("change", function () {
      const f = this.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (e) => { $("pImagePreview").src = e.target.result; $("pImagePreview").style.display = "block"; };
      r.readAsDataURL(f);
    });
  }

  _initProductForm() {
    $("addProd")?.addEventListener("click", () => this._addProduct());
  }

  _addProduct() {
    const name = $("pName").value.trim();
    const price = parseFloat($("pPrice").value);
    if (!name || !price) return this._toast.show("⚠️ أدخل اسم المنتج وسعره");

    const f = $("pImage").files[0];
    if (f) {
      const r = new FileReader();
      r.onload = (e) => { this._pushProduct(name, price, e.target.result); };
      r.readAsDataURL(f);
    } else {
      this._pushProduct(name, price, null);
    }
  }

  _pushProduct(name, price, imgData) {
    const p = {
      id: generateId("P"),
      name, price,
      category: $("pCat").value.trim() || "عام",
      unit: $("pUnit").value.trim() || "وحدة",
      image: imgData || APP_CONFIG.defaults.productImage,
      desc: $("pDesc").value.trim(),
      in_stock: true,
      rating: 4.5
    };
    const old = parseFloat($("pOld").value);
    if (old > price) p.old_price = old;
    this._products.push(p);
    this._persist();
    this._renderProducts();
    ["pName", "pCat", "pPrice", "pOld", "pUnit", "pDesc"].forEach(id => $(id).value = "");
    $("pImage").value = "";
    $("pImagePreview").style.display = "none";
    this._toast.show("✅ أُضيف المنتج");
  }

  _renderProducts() {
    const wrap = $("prodGrid");
    if (!wrap) return;
    wrap.innerHTML = "";
    this._products.forEach((p, i) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" onerror="this.src='${APP_CONFIG.defaults.productImage}'" loading="lazy">
        <div class="pc-body">
          <h4>${p.name}</h4>
          <div class="pc-price">${formatPrice(p.price)}</div>
          <div class="pc-meta">${p.category} · ${p.unit}</div>
          <button class="btn-del" data-i="${i}"><i class="fas fa-trash"></i> حذف</button>
        </div>`;
      card.querySelector(".btn-del").addEventListener("click", () => {
        this._products.splice(i, 1);
        this._persist();
        this._renderProducts();
      });
      wrap.appendChild(card);
    });
  }

  _renderOrders() {
    const wrap = $("orderList");
    if (!wrap) return;
    const allOrders = storage.getLocal("yusir_orders") || [];
    const myOrders = allOrders.filter(o => o.storeId === this._user.id || this._products.some(p => p.id === o.productId));
    wrap.innerHTML = myOrders.length === 0
      ? "<p style='color:#b2bec3;text-align:center'>لا توجد طلبات حتى الآن</p>"
      : myOrders.map(o => `<div class="order-item"><span>${o.customer?.name || "عميل"}</span><b>${formatPrice(o.total)}</b></div>`).join("");
  }
}

const merchant = new MerchantApp();
document.addEventListener("DOMContentLoaded", () => merchant.init());
