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
    this._initLocationPicker();
    this._initForm();
    this._initProductUpload();
    this._initProductForm();
    this._initEditModal();
    this._initExport();
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
    if (this._store.lat && this._store.lng) {
      $("locLat").textContent = this._store.lat.toFixed(5);
      $("locLng").textContent = this._store.lng.toFixed(5);
    }
  }

  _initLocationPicker() {
    this._loc = { lat: 15.3694, lng: 44.191 };
    if (this._store && this._store.lat && this._store.lng) {
      this._loc = { lat: this._store.lat, lng: this._store.lng };
    }
    const el = $("locMap");
    if (!el) return;
    const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([this._loc.lat, this._loc.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
    const marker = L.marker([this._loc.lat, this._loc.lng], { draggable: true }).addTo(map);
    const update = (ll) => {
      this._loc = { lat: ll.lat, lng: ll.lng };
      $("locLat").textContent = ll.lat.toFixed(5);
      $("locLng").textContent = ll.lng.toFixed(5);
    };
    update(this._loc);
    marker.on("dragend", (e) => update(e.target.getLatLng()));
    map.on("click", (e) => { marker.setLatLng(e.latlng); update(e.latlng); });
    setTimeout(() => map.invalidateSize(), 300);
  }

  _initForm() {
    this._croppedStore = null;
    $("saveStore")?.addEventListener("click", () => this._saveStore());
    $("sImage")?.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      this._openCrop(f, (dataUrl) => {
        this._croppedStore = dataUrl;
        $("sImagePreview").src = dataUrl;
        $("sImagePreview").style.display = "block";
      }, 16 / 9);
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
    if (this._loc) {
      this._store.lat = this._loc.lat;
      this._store.lng = this._loc.lng;
    }
    if (this._croppedStore) {
      this._store.image = this._croppedStore;
      this._croppedStore = null;
    }
    this._persist();
    this._toast.show("✅ حُفظت بيانات المتجر");
  }

  _initProductUpload() {
    this._cropped = null;
    $("pImage")?.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      this._openCrop(f, (dataUrl) => {
        this._cropped = dataUrl;
        $("pImagePreview").src = dataUrl;
        $("pImagePreview").style.display = "block";
      });
    });
  }

  _initProductForm() {
    $("addProd")?.addEventListener("click", () => this._addProduct());
  }

  _initExport() {
    $("exportBtn")?.addEventListener("click", () => {
      if (!this._store || !this._store.name) return this._toast.show("⚠️ احفظ بيانات المتجر أولاً");
      const X = window.XLSX;
      const rows = this._products.map((p, i) => ({
        "#": i + 1,
        "المنتج": p.name,
        "السعر": p.price,
        "التصنيف": p.category || "عام",
        "الوحدة": p.unit || "وحدة",
        "الكمية": p.stock_qty ?? 1,
        "متوفر": p.in_stock !== false ? "نعم" : "لا"
      }));
      const ws = X.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 4 }, { wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];
      const wb = X.utils.book_new();
      X.utils.book_append_sheet(wb, ws, "المنتجات");
      const info = [
        ["المتجر", this._store.name || ""],
        ["التصنيف", this._store.category || ""],
        ["المدينة", this._store.city || ""],
        ["الحي", this._store.neighborhood || ""],
        ["واتساب", this._store.phone || ""],
        ["", ""],
        ["إجمالي المنتجات", this._products.length]
      ];
      const wsInfo = X.utils.aoa_to_sheet(info);
      wsInfo["!cols"] = [{ wch: 18 }, { wch: 30 }];
      X.utils.book_append_sheet(wb, wsInfo, "بيانات المتجر");
      X.writeFile(wb, `${this._store.name.replace(/\s+/g, "_")}.xlsx`);
      this._toast.show("✅ تم تصدير إكسل");
    });

    $("importFile")?.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (ev) => {
        try {
          const X = window.XLSX;
          const wb = X.read(ev.target.result, { type: "array" });
          const ws = wb.Sheets["المنتجات"] || wb.Sheets[wb.SheetNames[0]];
          const data = X.utils.sheet_to_json(ws);
          let added = 0;
          data.forEach(row => {
            const name = String(row["المنتج"] || row["name"] || "").trim();
            const price = parseFloat(row["السعر"] || row["price"]);
            if (!name || !price) return;
            const qty = parseInt(row["الكمية"] || row["stock_qty"]) || 1;
            this._products.push({
              id: generateId("P"),
              name, price,
              category: String(row["التصنيف"] || row["category"] || "عام").trim(),
              unit: String(row["الوحدة"] || row["unit"] || "وحدة").trim(),
              stock_qty: qty,
              image: APP_CONFIG.defaults.productImage,
              desc: "",
              in_stock: qty > 0,
              rating: 4.5
            });
            added++;
          });
          if (added) {
            this._persist();
            this._renderProducts();
            this._toast.show(`✅ استُورد ${added} منتج`);
          } else {
            this._toast.show("⚠️ لم يُعثر على منتجات صالحة");
          }
        } catch (err) {
          this._toast.show("⚠️ فشل قراءة الملف");
        }
      };
      r.readAsArrayBuffer(f);
      e.target.value = "";
    });

    $("copyBtn")?.addEventListener("click", () => {
      const data = JSON.stringify({ store: this._store, products: this._products }, null, 2);
      navigator.clipboard.writeText(data).then(() => {
        this._toast.show("✅ نُسخ JSON");
      }).catch(() => {
        this._toast.show("⚠️ فشل النسخ");
      });
    });
  }

  _openCrop(file, onDone, ratio) {
    const modal = $("cropModal");
    const img = $("cropImage");
    const r = new FileReader();
    r.onload = () => {
      img.src = r.result;
      modal.classList.add("active");
      const cropper = new Cropper(img, {
        aspectRatio: ratio || 3 / 2,
        viewMode: 1,
        autoCropArea: 0.9,
        background: false
      });
      const cleanup = () => { cropper.destroy(); modal.classList.remove("active"); };
      $("cropConfirm").onclick = () => {
        const canvas = cropper.getCroppedCanvas({ width: ratio === 16 / 9 ? 800 : 600 });
        onDone(canvas.toDataURL("image/jpeg", 0.85));
        cleanup();
      };
      $("cropCancel").onclick = cleanup;
      $("cropClose").onclick = cleanup;
    };
    r.readAsDataURL(file);
  }

  _addProduct() {
    const name = $("pName").value.trim();
    const price = parseFloat($("pPrice").value);
    if (!name || !price) return this._toast.show("⚠️ أدخل اسم المنتج وسعره");

    this._pushProduct(name, price, this._cropped);
  }

  _pushProduct(name, price, imgData) {
    const p = {
      id: generateId("P"),
      name, price,
      category: $("pCat").value.trim() || "عام",
      unit: $("pUnit").value.trim() || "وحدة",
      image: imgData || APP_CONFIG.defaults.productImage,
      desc: $("pDesc").value.trim(),
      stock_qty: parseInt($("pQty").value) || 1,
      in_stock: (parseInt($("pQty").value) || 1) > 0,
      rating: 4.5
    };
    const old = parseFloat($("pOld").value);
    if (old > price) p.old_price = old;
    this._products.push(p);
    this._persist();
    this._renderProducts();
    ["pName", "pCat", "pPrice", "pOld", "pUnit", "pDesc"].forEach(id => $(id).value = "");
    $("pQty").value = 1;
    $("pImage").value = "";
    $("pImagePreview").style.display = "none";
    this._cropped = null;
    this._toast.show("✅ أُضيف المنتج");
  }

  _initEditModal() {
    this._editIndex = -1;
    $("editClose").onclick = () => $("editModal").classList.remove("active");
    $("editCancel").onclick = () => $("editModal").classList.remove("active");
    $("editImage")?.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      $("editModal").classList.remove("active");
      this._openCrop(f, (dataUrl) => {
        $("editImagePreview").src = dataUrl;
        $("editImagePreview").style.display = "block";
        $("editModal").classList.add("active");
      });
    });
    $("editSave").onclick = () => this._saveEditProduct();
  }

  _openEditProduct(i) {
    this._editIndex = i;
    const p = this._products[i];
    $("editName").value = p.name;
    $("editPrice").value = p.price;
    $("editCat").value = p.category || "";
    $("editUnit").value = p.unit || "";
    $("editDesc").value = p.desc || "";
    $("editQty").value = p.stock_qty ?? 1;
    $("editInStock").checked = p.in_stock !== false;
    if (p.image && p.image.startsWith("data:")) {
      $("editImagePreview").src = p.image;
      $("editImagePreview").style.display = "block";
    } else {
      $("editImagePreview").style.display = "none";
    }
    $("editImage").value = "";
    $("editModal").classList.add("active");
  }

  _saveEditProduct() {
    const i = this._editIndex;
    if (i < 0) return;
    const p = this._products[i];
    p.name = $("editName").value.trim();
    p.price = parseFloat($("editPrice").value) || 0;
    p.category = $("editCat").value.trim() || "عام";
    p.unit = $("editUnit").value.trim() || "وحدة";
    p.desc = $("editDesc").value.trim();
    p.stock_qty = parseInt($("editQty").value) || 0;
    p.in_stock = p.stock_qty > 0 && $("editInStock").checked;
    const preview = $("editImagePreview");
    if (preview.src && preview.src.startsWith("data:") && preview.style.display !== "none") {
      p.image = preview.src;
    }
    this._persist();
    this._renderProducts();
    $("editModal").classList.remove("active");
    this._toast.show("✅ حُفظ التعديل");
  }

  _renderProducts() {
    const wrap = $("prodGrid");
    if (!wrap) return;
    wrap.innerHTML = "";
    const total = this._products.length;
    const inStock = this._products.filter(p => p.in_stock !== false).length;
    const out = total - inStock;
    const totalQty = this._products.reduce((s, p) => s + (parseInt(p.stock_qty) || 1), 0);
    $("stProducts").textContent = total + " (" + totalQty + " قطعة)";
    $("stInStock").textContent = inStock;
    $("stOut").textContent = out;
    this._products.forEach((p, i) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" onerror="this.src='${APP_CONFIG.defaults.productImage}'" loading="lazy">
        <div class="pc-body">
          <h4>${p.name}</h4>
          <div class="pc-price">${formatPrice(p.price)}</div>
          <div class="pc-meta">${p.category} · ${p.unit} · <span style="color:${(p.stock_qty ?? 1) > 0 ? '#F28E6B' : '#dc2626'};font-weight:700">${(p.stock_qty ?? 1) > 0 ? (p.stock_qty ?? 1) + ' قطعة' : 'نفد'}</span></div>
          <div class="pc-actions">
            <button class="btn-edit" data-i="${i}"><i class="fas fa-pen"></i></button>
            <button class="btn-del" data-i="${i}"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
      card.querySelector(".btn-del").addEventListener("click", () => {
        this._products.splice(i, 1);
        this._persist();
        this._renderProducts();
      });
      card.querySelector(".btn-edit").addEventListener("click", () => {
        this._openEditProduct(i);
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
