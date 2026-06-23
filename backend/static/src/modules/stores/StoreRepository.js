import { APP_CONFIG } from "../../core/config/app.js";
import { api } from "../../core/services/ApiService.js";

export class StoreRepository {
  constructor() {
    this._stores = [];
    this._loaded = false;
  }

  async loadFromFile() {
    const res = await fetch(APP_CONFIG.data.stores);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const gj = await res.json();
    this._stores = gj.features || [];
    this._loaded = true;
    return this._stores;
  }

  async loadFromApi(filters = {}) {
    try {
      const data = await api.getStores(filters);
      this._stores = (data.results || data || []).map(s => ({
        type: "Feature",
        properties: {
          store_id: s.store_id,
          name: s.name,
          category: s.category,
          city: s.city,
          neighborhood: s.neighborhood,
          phone: s.phone,
          rating: s.rating,
          delivery_fee: s.delivery_fee,
          open: s.open,
          image: s.image,
          products: [],
        },
        geometry: {
          type: "Point",
          coordinates: [s.longitude, s.latitude]
        }
      }));
      this._loaded = true;
      return this._stores;
    } catch {
      return this.loadFromFile();
    }
  }

  getAll() {
    return this._stores;
  }

  getById(id) {
    return this._stores.find(s => s.properties.store_id === id) || null;
  }

  add(store) {
    this._stores.push(store);
  }

  remove(id) {
    const idx = this._stores.findIndex(s => s.properties.store_id === id);
    if (idx !== -1) this._stores.splice(idx, 1);
  }

  toFeatureCollection() {
    return {
      type: "FeatureCollection",
      name: "yusir_stores",
      crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      features: this._stores
    };
  }
}
