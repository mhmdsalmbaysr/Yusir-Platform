import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { MarkerFactory } from "../map/MarkerFactory.js";
import { PopupFactory } from "../map/PopupFactory.js";
import { $ } from "../../core/helpers/dom.js";

export class StoreController {
  constructor(map, storeService) {
    this._map = map;
    this._service = storeService;
    this._markers = [];
    this._selectedStore = null;
    this._listeners = new Map();
  }

  get selectedStore() {
    return this._selectedStore;
  }

  async init() {
    const stores = await this._service.loadAll();
    this._renderMarkers(stores);
    eventBus.emit(EVENTS.STORES_LOADED, stores);
    return stores;
  }

  _renderMarkers(stores) {
    this._clearMarkers();
    stores.forEach(store => {
      const marker = MarkerFactory.createStoreMarker(store, (s) => this._selectStore(s));
      marker.addTo(this._map);
      marker.bindPopup(PopupFactory.storePopup(store), { closeButton: false });
      marker.on("popupopen", () => {
        const btn = document.querySelector(".btn-view-store");
        if (btn) {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = e.target.dataset.store;
            this._selectStore(this._service.getById(id));
          });
        }
      });
      this._markers.push(marker);
    });
  }

  _clearMarkers() {
    this._markers.forEach(m => this._map.removeLayer(m));
    this._markers = [];
  }

  _selectStore(store) {
    this._selectedStore = store;
    eventBus.emit(EVENTS.STORE_SELECTED, store);
  }

  deselectStore() {
    this._selectedStore = null;
    eventBus.emit(EVENTS.STORE_DESELECTED);
  }

  addStoreMarker(store) {
    const marker = MarkerFactory.createStoreMarker(store);
    marker.addTo(this._map);
    this._markers.push(marker);
    return marker;
  }

  refresh() {
    this._clearMarkers();
    const stores = this._service.getAll();
    this._renderMarkers(stores);
  }
}
