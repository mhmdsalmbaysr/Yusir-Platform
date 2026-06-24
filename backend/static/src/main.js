import { MapManager } from "./modules/map/MapManager.js";
import { LayerManager } from "./modules/map/LayerManager.js";
import { MapEvents } from "./modules/map/MapEvents.js";
import { GovernorateService } from "./modules/governorates/GovernorateService.js";
import { DistrictService } from "./modules/districts/DistrictService.js";
import { StoreRepository } from "./modules/stores/StoreRepository.js";
import { StoreService } from "./modules/stores/StoreService.js";
import { StoreController } from "./modules/stores/StoreController.js";
import { StoreSidebar } from "./modules/stores/StoreSidebar.js";
import { CartManager } from "./modules/cart/CartManager.js";
import { CartUI } from "./modules/cart/CartUI.js";
import { ProductModal } from "./modules/products/ProductModal.js";
import { CheckoutManager } from "./modules/checkout/CheckoutManager.js";
import { ReviewService } from "./modules/reviews/ReviewService.js";
import { ReviewUI } from "./modules/reviews/ReviewUI.js";
import { SearchController } from "./modules/search/SearchController.js";
import { Toast } from "./shared/ui/Toast.js";
import { APP_CONFIG } from "./core/config/app.js";
import { eventBus } from "./core/services/EventBus.js";
import { EVENTS } from "./core/constants/app.js";
import { storage } from "./core/services/StorageService.js";

class App {
  constructor() {
    this._toast = new Toast();
    this._cart = new CartManager();
  }

  async init() {
    try {
      this._initMap();
      this._initSearch();
      this._initGovernorates();
      this._initDistricts();
      await this._initStores();
      this._initCartUI();
      this._initProductModal();
      this._initCheckout();
      this._initReviews();
      this._initFieldData();
      this._initGlobalHandlers();
      this._hideLoader();
    } catch (e) {
      console.error("[App] init error:", e);
      this._toast.show("⚠️ خطأ في تحميل التطبيق");
      this._hideLoader();
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
    try {
      await new DistrictService(this._map, this._events).load();
    } catch {}
  }

  async _initStores() {
    const repo = new StoreRepository();
    const service = new StoreService(repo);
    this._storeCtrl = new StoreController(this._map, service);
    const stores = await this._storeCtrl.init();
    if (stores.length > 0) {
      this._initStoreSidebar();
    }
  }

  _initStoreSidebar() {
    new StoreSidebar();
  }

  _initCartUI() {
    new CartUI(this._cart);
  }

  _initProductModal() {
    const modal = new ProductModal((product, storeId) => {
      this._cart.add(product, storeId);
      this._toast.show("✅ أُضيف للسلة");
    });
    eventBus.on(EVENTS.PRODUCT_SELECTED, ({ product, storeId }) => {
      const s = this._storeCtrl?.selectedStore;
      modal.open(product, storeId, s?.properties?.name);
    });
  }

  _initCheckout() {
    new CheckoutManager(this._cart);
    eventBus.on(EVENTS.CHECKOUT_SUBMITTED, (data) => {
      this._toast.show("✅ تم إرسال الطلب");
    });
  }

  _initReviews() {
    const rv = new ReviewService();
    const reviewUi = new ReviewUI(rv);
    eventBus.on(EVENTS.STORE_SELECTED, (store) => {
      reviewUi.setStore(store.properties.store_id);
    });
  }

  _initFieldData() {
    storage.fetchJSON(APP_CONFIG.data.fieldData)
      .then(gj => {
        if (!gj.features || gj.features.length === 0) return;
        const fieldLayer = L.geoJSON(gj, {
          pointToLayer: (f, ll) => {
            const p = f.properties;
            const icon = p.type === "حي" ? "\u{1F3D8}\uFE0F" : "\u{1F4CD}";
            return L.marker(ll, {
              icon: L.divIcon({
                className: "",
                html: `<span class="field-chip ${p.type === "حي" ? "hood" : "lane"}">${icon} ${p.name}</span>`,
                iconSize: [0, 0], iconAnchor: [0, 0]
              }),
              interactive: false
            });
          }
        }).addTo(this._map);
        this._events.onZoomChange((z) => {
          fieldLayer.eachLayer(l => l.setOpacity(z >= 11 ? 1 : 0));
        });
      })
      .catch(() => {});
  }

  _initGlobalHandlers() {
    this._map.on("contextmenu", async (e) => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=ar`);
        const d = await r.json();
        if (d.display_name) {
          L.popup().setLatLng(e.latlng)
            .setContent(`<div dir="rtl" style="font-size:13px;line-height:1.6"><b>📍 الموقع</b><br>${d.display_name}</div>`)
            .openOn(this._map);
        }
      } catch {}
    });

    document.getElementById("backdrop")?.addEventListener("click", () => {
      document.querySelectorAll(".store-sidebar.active, .cart-panel.active, .modal.active").forEach(el => el.classList.remove("active"));
      document.getElementById("backdrop")?.classList.remove("active");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".store-sidebar.active, .cart-panel.active, .modal.active").forEach(el => el.classList.remove("active"));
        document.getElementById("backdrop")?.classList.remove("active");
      }
    });

    const dd = document.getElementById("controlDropdown");
    if (dd) {
      dd.querySelector(".dropdown-btn")?.addEventListener("click", (e) => {
        e.stopPropagation();
        dd.classList.toggle("open");
      });
      document.addEventListener("click", () => dd.classList.remove("open"));

      dd.querySelectorAll(".drop-item[data-layer]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const name = btn.dataset.layer;
          this._layers.setBase(name);
          dd.querySelectorAll(".drop-item[data-layer]").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          dd.classList.remove("open");
        });
      });
    }
  }

  _hideLoader() {
    const loader = document.getElementById("loader");
    if (loader) loader.classList.add("hidden");
  }
}

const app = new App();
document.addEventListener("DOMContentLoaded", () => app.init());
