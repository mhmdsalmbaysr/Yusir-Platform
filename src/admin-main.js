import { MapManager } from "./modules/map/MapManager.js";
import { LayerManager } from "./modules/map/LayerManager.js";
import { MapEvents } from "./modules/map/MapEvents.js";
import { GovernorateService } from "./modules/governorates/GovernorateService.js";
import { DistrictService } from "./modules/districts/DistrictService.js";
import { StoreRepository } from "./modules/stores/StoreRepository.js";
import { StoreService } from "./modules/stores/StoreService.js";
import { FieldDataService } from "./modules/fielddata/FieldDataService.js";
import { Toast } from "./shared/ui/Toast.js";
import { SearchController } from "./modules/search/SearchController.js";
import { APP_CONFIG } from "./core/config/app.js";
import { $ } from "./core/helpers/dom.js";
import { formatPrice } from "./core/helpers/format.js";
import { GeoJsonService } from "./modules/map/GeoJsonService.js";
import { MarkerFactory } from "./modules/map/MarkerFactory.js";

class AdminApp {
  constructor() {
    this._toast = new Toast();
    this._stores = new StoreRepository();
    this._storeService = new StoreService(this._stores);
    this._pickedLatLng = null;
    this._pickMarker = null;
    this._draftProducts = [];
    this._fieldData = null;
  }

  async init() {
    try {
      this._initMap();
      this._initSearch();
      this._initGovernorates();
      await this._initDistricts();
      await this._initStores();
      this._initFieldData();
      this._initMapClick();
      this._initStoreForm();
      this._initProductForm();
      this._initExport();
    } catch (e) {
      console.error("[AdminApp]", e);
    }
  }

  _initMap() {
    const mm = MapManager.getInstance();
    mm.init();
    this._map = mm.map;
    this._layers = new LayerManager(this._map);
    this._events = new MapEvents(this._map);
    const layers = APP_CONFIG.map.tileLayers;
    this._layers.addBaseTile("satellite", layers.satellite.url, { attribution: layers.satellite.attribution });
    this._layers.addBaseTile("osm", layers.osm.url, { attribution: layers.osm.attribution });
    this._layers.setBase("satellite");
  }

  _initSearch() {
    new SearchController(this._map);
  }

  _initGovernorates() {
    new GovernorateService(this._map).load().catch(() => {});
  }

  async _initDistricts() {
    const ds = new DistrictService(this._map, this._events);
    try {
      const opts = await ds.load();
      this._populateDistricts(opts);
    } catch {}
  }

  _populateDistricts(opts) {
    const sel = $("fdDist");
    if (!sel) return;
    opts.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    opts.forEach(d => {
      const o = document.createElement("option");
      o.value = d.code;
      o.textContent = `${d.name} (${d.adm1})`;
      sel.appendChild(o);
    });
  }

  async _initStores() {
    try {
      const stores = await this._storeService.loadAll();
      stores.forEach(s => {
        const marker = MarkerFactory.createStoreMarker(s);
        marker.addTo(this._map);
      });
      this._renderSavedStores();
    } catch {}
  }

  async _initFieldData() {
    this._fieldData = new FieldDataService(this._map);
    try {
      await this._fieldData.load();
    } catch {}
    document.getElementById("addFieldBtn")?.addEventListener("click", () => this._addFieldItem());
    document.getElementById("exportFieldBtn")?.addEventListener("click", () => this._fieldData.download());
  }

  _initMapClick() {
    this._map.on("click", (e) => {
      this._pickedLatLng = e.latlng;
      $("f_lat").value = e.latlng.lat.toFixed(5);
      $("f_lng").value = e.latlng.lng.toFixed(5);
      if (this._pickMarker) this._pickMarker.setLatLng(e.latlng);
      else {
        this._pickMarker = L.marker(e.latlng, { icon: MarkerFactory.pickIcon(), draggable: true }).addTo(this._map);
        this._pickMarker.on("dragend", (ev) => {
          this._pickedLatLng = ev.target.getLatLng();
          $("f_lat").value = this._pickedLatLng.lat.toFixed(5);
          $("f_lng").value = this._pickedLatLng.lng.toFixed(5);
        });
      }
    });
  }

  _initStoreForm() {
    $("saveStoreBtn")?.addEventListener("click", () => this._saveStore());
  }

  _initProductForm() {
    $("addProdBtn")?.addEventListener("click", () => this._addDraftProduct());
  }

  _addDraftProduct() {
    const name = $("p_name")?.value.trim();
    const price = parseFloat($("p_price")?.value);
    if (!name || !price) return this._toast.show("⚠️ أدخل اسم المنتج وسعره");
    this._draftProducts.push({
      id: "P-" + Date.now(),
      name, price,
      unit: $("p_unit")?.value.trim() || "وحدة",
      image: $("p_image")?.value.trim() || APP_CONFIG.defaults.productImage,
      in_stock: true
    });
    ["p_name", "p_price", "p_unit", "p_image"].forEach(id => $(id).value = "");
    this._renderDraftProducts();
  }

  _renderDraftProducts() {
    const wrap = $("prodList");
    if (!wrap) return;
    wrap.innerHTML = "";
    this._draftProducts.forEach((p, i) => {
      const el = document.createElement("div");
      el.className = "prod-item";
      el.innerHTML = `<span>${p.name}</span> <b>${formatPrice(p.price)}</b> <button title="حذف"><i class="fas fa-trash"></i></button>`;
      el.querySelector("button").addEventListener("click", () => {
        this._draftProducts.splice(i, 1);
        this._renderDraftProducts();
      });
      wrap.appendChild(el);
    });
  }

  _saveStore() {
    const name = $("f_name")?.value.trim();
    if (!name) return this._toast.show("⚠️ اسم المتجر مطلوب");
    if (!this._pickedLatLng) return this._toast.show("⚠️ حدّد موقع المتجر على الخريطة");
    if (this._draftProducts.length === 0) return this._toast.show("⚠️ أضف منتجاً واحداً على الأقل");

    const feature = this._storeService.createStore({
      name,
      category: $("f_cat")?.value.trim(),
      city: $("f_city")?.value.trim(),
      neighborhood: $("f_hood")?.value.trim(),
      phone: $("f_phone")?.value.trim(),
      rating: parseFloat($("f_rating")?.value) || 4.5,
      delivery_fee: parseInt($("f_delivery")?.value) || 500,
      open: $("f_open")?.checked !== false,
      image: $("f_image")?.value.trim() || "",
      products: this._draftProducts.slice()
    }, this._pickedLatLng);

    this._stores.add(feature);
    MarkerFactory.createStoreMarker(feature).addTo(this._map);
    this._resetForm();
    this._renderSavedStores();
    this._toast.show(`✅ حُفظ المتجر «${name}»`);
  }

  _resetForm() {
    ["f_name", "f_cat", "f_city", "f_hood", "f_phone", "f_image", "f_lat", "f_lng"].forEach(id => {
      const el = $(id);
      if (el) el.value = "";
    });
    this._draftProducts = [];
    this._pickedLatLng = null;
    if (this._pickMarker) {
      this._map.removeLayer(this._pickMarker);
      this._pickMarker = null;
    }
    this._renderDraftProducts();
  }

  _renderSavedStores() {
    const count = $("storeCount");
    if (count) count.textContent = this._stores.getAll().length;
    const wrap = $("savedStores");
    if (!wrap) return;
    wrap.innerHTML = "";
    this._stores.getAll().forEach((f, i) => {
      const p = f.properties;
      const row = document.createElement("div");
      row.className = "saved-row";
      row.innerHTML = `<span>${p.name} <small>(${(p.products || []).length} منتج)</small></span>
        <button title="حذف"><i class="fas fa-trash"></i></button>`;
      row.querySelector("button").addEventListener("click", () => {
        this._stores.getAll().splice(i, 1);
        this._renderSavedStores();
      });
      wrap.appendChild(row);
    });
  }

  _addFieldItem() {
    const name = $("fdName")?.value.trim();
    const type = $("fdType")?.value;
    const distEl = $("fdDist");
    if (!name || !this._pickedLatLng) return this._toast.show("⚠️ أدخل الاسم وحدّد الموقع");
    const distCode = distEl?.value || "";
    const distText = distEl?.selectedOptions[0]?.textContent?.split(" (")[0] || "";
    this._fieldData.add(name, type, distCode, distText, this._pickedLatLng);
    $("fdName").value = "";
    this._renderFieldItems();
    this._toast.show(`✅ أُضيف ${type}`);
  }

  _renderFieldItems() {
    const wrap = $("fieldList");
    if (!wrap) return;
    wrap.innerHTML = "";
    this._fieldData.getAll().forEach((f, i) => {
      const p = f.properties;
      const row = document.createElement("div");
      row.className = "field-row";
      row.innerHTML = `<span><b>${p.name}</b> <small>(${p.type})</small></span>
        <button title="حذف"><i class="fas fa-trash"></i></button>`;
      row.querySelector("button").addEventListener("click", () => {
        this._fieldData.remove(i);
        this._renderFieldItems();
      });
      wrap.appendChild(row);
    });
  }

  _initExport() {
    $("downloadBtn")?.addEventListener("click", () => {
      new GeoJsonService().downloadJSON(this._stores.toFeatureCollection(), "stores.geojson");
    });
    $("copyBtn")?.addEventListener("click", async () => {
      const ok = await new GeoJsonService().copyToClipboard(this._stores.toFeatureCollection());
      this._toast.show(ok ? "📋 نُسخ JSON" : "⚠️ تعذّر النسخ");
    });
  }
}

const admin = new AdminApp();
document.addEventListener("DOMContentLoaded", () => admin.init());
