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
  }

  init() {
    this._user = auth.checkSession();
    if (!this._user || this._user.role !== "merchant") {
      location.replace("login.html?redirect=merchant");
      return;
    }
    this._initLogout();
    this._govs = []; this._dists = [];
    this._loadLocations().then(() => {
      this._loadStore();
      this._initLocationPicker();
      this._initForm();
      this._initProductUpload();
      this._initProductForm();
      this._initEditModal();
      this._initExport();
    });
  }

  _initLogout() {
    const btn = $("logout");
    if (btn) btn.addEventListener("click", () => { auth.logout(); location.href = "login.html"; });
  }

  async _loadLocations() {
    try {
      const r1 = await fetch("data/yem_admin1.geojson");
      const govData = await r1.json();
      this._govFeatures = govData.features;
      this._govs = govData.features.map(f => ({
        code: f.properties.adm1_pcode,
        name: f.properties.adm1_name1 || f.properties.adm1_name
      })).filter(g => g.name).sort((a, b) => a.name.localeCompare(b.name, "ar"));
      const r2 = await fetch("data/yem_admin2.geojson");
      const distData = await r2.json();
      this._dists = distData.features.map(f => ({
        code: f.properties.adm2_pcode,
        name: f.properties.adm2_name1 || f.properties.adm2_name,
        govCode: f.properties.adm1_pcode,
        lat: f.properties.center_lat,
        lng: f.properties.center_lon
      })).filter(d => d.name);
    } catch (e) { console.warn("Failed to load location data", e); }
    const govSel = $("sGov");
    const distSel = $("sDist");
    if (govSel) {
      govSel.innerHTML = '<option value="">— اختر المحافظة —</option>' +
        this._govs.map(g => `<option value="${g.code}">${g.name}</option>`).join("");
      govSel.addEventListener("change", () => {
        this._filterDists();
        this._flyToGov(govSel.value);
        if (distSel) distSel.value = "";
      });
    }
    if (distSel) {
      distSel.addEventListener("change", () => this._flyToDist(distSel.value));
    }
  }

  _flyToGov(code) {
    if (!code || typeof L === "undefined" || !this._locMap) return;
    const feat = this._govFeatures?.find(f => f.properties.adm1_pcode === code);
    if (!feat) return;
    try {
      const layer = L.geoJSON(feat);
      this._locMap.flyToBounds(layer.getBounds(), { padding: [30, 30], maxZoom: 10 });
    } catch (e) { /* ignore */ }
  }

  _flyToDist(code) {
    if (!code || typeof L === "undefined" || !this._locMap) return;
    const dist = this._dists.find(d => d.code === code);
    if (!dist || !dist.lat || !dist.lng) return;
    this._locMap.flyTo([dist.lat, dist.lng], 10, { duration: 1 });
  }

  _filterDists() {
    const govSel = $("sGov"); const distSel = $("sDist");
    if (!govSel || !distSel) return;
    const selected = govSel.value;
    distSel.innerHTML = '<option value="">— اختر المديرية —</option>' +
      this._dists.filter(d => d.govCode === selected)
        .map(d => `<option value="${d.code}">${d.name}</option>`).join("");
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
    const setVal = (id, val) => { const el = $(id); if (el) el.value = val; };
    setVal("sName", this._store.name || "");
    setVal("sCat", this._store.category || "");
    setVal("sGov", this._store.gov_code || "");
    this._filterDists();
    setVal("sDist", this._store.dist_code || "");
    setVal("sHood", this._store.neighborhood || "");
    setVal("sPhone", this._store.phone || "");
    setVal("sDelivery", this._store.delivery_fee || 0);
    setVal("sOpen", String(this._store.open !== false));
    const preview = $("sImagePreview");
    if (this._store.image && this._store.image.startsWith("data:")) {
      if (preview) { preview.src = this._store.image; preview.style.display = "block"; }
    }
    if (this._store.lat && this._store.lng) {
      const latEl = $("locLat"); const lngEl = $("locLng");
      if (latEl) latEl.textContent = this._store.lat.toFixed(5);
      if (lngEl) lngEl.textContent = this._store.lng.toFixed(5);
    }
  }

  _initLocationPicker() {
    if (typeof L === "undefined") return;
    this._loc = { lat: 15.3694, lng: 44.191 };
    if (this._store && this._store.lat && this._store.lng) {
      this._loc = { lat: this._store.lat, lng: this._store.lng };
    }
    const el = $("locMap");
    if (!el) return;
    const map = L.map(el, { zoomControl: false, attributionControl: false }).setView([this._loc.lat, this._loc.lng], 13);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { attribution: false }).addTo(map);
    const marker = L.marker([this._loc.lat, this._loc.lng], { draggable: true }).addTo(map);
    const update = (ll) => {
      this._loc = { lat: ll.lat, lng: ll.lng };
      const latEl = $("locLat"); const lngEl = $("locLng");
      if (latEl) latEl.textContent = ll.lat.toFixed(5);
      if (lngEl) lngEl.textContent = ll.lng.toFixed(5);
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
        const preview = $("sImagePreview");
        if (preview) { preview.src = dataUrl; preview.style.display = "block"; }
      }, 16 / 9);
    });
  }

  _saveStore() {
    if (!this._store) this._store = {};
    const sName = $("sName"); const sCat = $("sCat"); const sGov = $("sGov"); const sDist = $("sDist");
    const sHood = $("sHood"); const sPhone = $("sPhone"); const sDelivery = $("sDelivery"); const sOpen = $("sOpen");
    if (!sName || !sCat || !sGov || !sDist || !sHood || !sPhone || !sDelivery || !sOpen) {
      this._toast.show("⚠️ أكمل جميع الحقول"); return;
    }
    if (!sGov.value) { this._toast.show("⚠️ اختر المحافظة"); return; }
    if (!sDist.value) { this._toast.show("⚠️ اختر المديرية"); return; }
    this._store.name = sName.value.trim();
    this._store.category = sCat.value.trim();
    this._store.gov_code = sGov.value;
    this._store.dist_code = sDist.value;
    this._store.city = sGov.options[sGov.selectedIndex]?.text || "";
    this._store.district = sDist.options[sDist.selectedIndex]?.text || "";
    this._store.neighborhood = sHood.value.trim();
    this._store.phone = sPhone.value.trim();
    this._store.delivery_fee = parseInt(sDelivery.value) || 0;
    this._store.open = sOpen.value === "true";
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
        const preview = $("pImagePreview");
        if (preview) { preview.src = dataUrl; preview.style.display = "block"; }
      });
    });
  }

  _initProductForm() {
    $("addProd")?.addEventListener("click", () => this._addProduct());
  }

  _initExport() {
    $("exportBtn")?.addEventListener("click", () => {
      if (!this._store || !this._store.name) return this._toast.show("⚠️ احفظ بيانات المتجر أولاً");
      if (typeof window.XLSX === "undefined") return this._toast.show("⚠️ مكتبة Excel لم تحمل بعد");
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
        ["المحافظة", this._store.city || ""],
        ["المديرية", this._store.district || ""],
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
          if (typeof window.XLSX === "undefined") { this._toast.show("⚠️ مكتبة Excel لم تحمل"); return; }
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
    if (typeof Cropper === "undefined") { this._toast.show("⚠️ مكتبة قص الصور لم تحمل"); return; }
    const modal = $("cropModal");
    const img = $("cropImage");
    if (!modal || !img) return;
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
      const cleanup = () => { cropper.destroy(); if (modal) modal.classList.remove("active"); };
      const confirmBtn = $("cropConfirm");
      const cancelBtn = $("cropCancel");
      const closeBtn = $("cropClose");
      if (confirmBtn) confirmBtn.onclick = () => {
        const canvas = cropper.getCroppedCanvas({ width: ratio === 16 / 9 ? 800 : 600 });
        onDone(canvas.toDataURL("image/jpeg", 0.85));
        cleanup();
      };
      if (cancelBtn) cancelBtn.onclick = cleanup;
      if (closeBtn) closeBtn.onclick = cleanup;
    };
    r.readAsDataURL(file);
  }

  _addProduct() {
    const pName = $("pName"); const pPrice = $("pPrice");
    if (!pName || !pPrice) return;
    const name = pName.value.trim();
    const price = parseFloat(pPrice.value);
    if (!name || !price) return this._toast.show("⚠️ أدخل اسم المنتج وسعره");

    this._pushProduct(name, price, this._cropped);
  }

  _pushProduct(name, price, imgData) {
    const getVal = (id, fallback) => { const el = $(id); return el ? el.value.trim() : fallback; };
    const getInt = (id, fallback) => { const el = $(id); return el ? parseInt(el.value) || fallback : fallback; };
    const p = {
      id: generateId("P"),
      name, price,
      category: getVal("pCat", "عام"),
      unit: getVal("pUnit", "وحدة"),
      image: imgData || APP_CONFIG.defaults.productImage,
      desc: getVal("pDesc", ""),
      stock_qty: getInt("pQty", 1),
      in_stock: (getInt("pQty", 1)) > 0,
      rating: 4.5
    };
    const old = parseFloat($("pOld")?.value);
    if (old > price) p.old_price = old;
    this._products.push(p);
    this._persist();
    this._renderProducts();
    ["pName", "pCat", "pPrice", "pOld", "pUnit", "pDesc"].forEach(id => { const el = $(id); if (el) el.value = ""; });
    const qtyEl = $("pQty"); if (qtyEl) qtyEl.value = 1;
    const imgEl = $("pImage"); if (imgEl) imgEl.value = "";
    const previewEl = $("pImagePreview"); if (previewEl) previewEl.style.display = "none";
    this._cropped = null;
    this._toast.show("✅ أُضيف المنتج");
  }

  _initEditModal() {
    this._editIndex = -1;
    const closeEdit = () => { const m = $("editModal"); if (m) m.classList.remove("active"); };
    const ec = $("editClose"); if (ec) ec.onclick = closeEdit;
    const ec2 = $("editCancel"); if (ec2) ec2.onclick = closeEdit;
    $("editImage")?.addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const em = $("editModal"); if (em) em.classList.remove("active");
      this._openCrop(f, (dataUrl) => {
        const preview = $("editImagePreview");
        if (preview) { preview.src = dataUrl; preview.style.display = "block"; }
        if (em) em.classList.add("active");
      });
    });
    const es = $("editSave"); if (es) es.onclick = () => this._saveEditProduct();
  }

  _openEditProduct(i) {
    this._editIndex = i;
    const p = this._products[i];
    if (!p) return;
    const setVal = (id, val) => { const el = $(id); if (el) el.value = val; };
    setVal("editName", p.name);
    setVal("editPrice", p.price);
    setVal("editCat", p.category || "");
    setVal("editUnit", p.unit || "");
    setVal("editDesc", p.desc || "");
    setVal("editQty", p.stock_qty ?? 1);
    const inStock = $("editInStock"); if (inStock) inStock.checked = p.in_stock !== false;
    const preview = $("editImagePreview");
    if (p.image && p.image.startsWith("data:")) {
      if (preview) { preview.src = p.image; preview.style.display = "block"; }
    } else {
      if (preview) preview.style.display = "none";
    }
    const imgEl = $("editImage"); if (imgEl) imgEl.value = "";
    const modal = $("editModal"); if (modal) modal.classList.add("active");
  }

  _saveEditProduct() {
    const i = this._editIndex;
    if (i < 0) return;
    const p = this._products[i];
    if (!p) return;
    p.name = ($("editName")?.value || "").trim();
    p.price = parseFloat($("editPrice")?.value) || 0;
    p.category = ($("editCat")?.value || "عام").trim();
    p.unit = ($("editUnit")?.value || "وحدة").trim();
    p.desc = ($("editDesc")?.value || "").trim();
    p.stock_qty = parseInt($("editQty")?.value) || 0;
    const inStockCheck = $("editInStock");
    p.in_stock = p.stock_qty > 0 && (!inStockCheck || inStockCheck.checked);
    const preview = $("editImagePreview");
    if (preview && preview.src && preview.src.startsWith("data:") && preview.style.display !== "none") {
      p.image = preview.src;
    }
    this._persist();
    this._renderProducts();
    const modal = $("editModal"); if (modal) modal.classList.remove("active");
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
    const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    setText("stProducts", total + " (" + totalQty + " قطعة)");
    setText("stInStock", inStock);
    setText("stOut", out);
    const emptyP = $("emptyP");
    if (emptyP) emptyP.style.display = total ? "none" : "block";
    this._products.forEach((p, i) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <div class="pc-img-wrap">
          <img src="${p.image}" loading="lazy">
        </div>
        <div class="pc-body">
          <h4>${p.name}</h4>
          <div class="pc-price">${formatPrice(p.price)}</div>
          <div class="pc-meta">${p.category} · ${p.unit} · <span style="color:${(p.stock_qty ?? 1) > 0 ? '#F28E6B' : '#dc2626'};font-weight:700">${(p.stock_qty ?? 1) > 0 ? (p.stock_qty ?? 1) + ' قطعة' : 'نفد'}</span></div>
          <div class="pc-actions">
            <button class="btn-edit" data-i="${i}"><i class="fas fa-pen"></i></button>
            <button class="btn-del" data-i="${i}"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
      const img = card.querySelector("img");
      if (img) img.onerror = function () { if (this.src !== APP_CONFIG.defaults.productImage) this.src = APP_CONFIG.defaults.productImage; };
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

}

const merchant = new MerchantApp();
document.addEventListener("DOMContentLoaded", () => merchant.init());
