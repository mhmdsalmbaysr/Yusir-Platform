import { generateId } from "../../core/helpers/format.js";
import { APP_CONFIG } from "../../core/config/app.js";

export class StoreService {
  constructor(repository) {
    this._repo = repository;
  }

  async loadAll() {
    try {
      return await this._repo.loadFromApi();
    } catch {
      return this._repo.loadFromFile();
    }
  }

  getAll() {
    return this._repo.getAll();
  }

  getById(id) {
    return this._repo.getById(id);
  }

  createStore(data, latlng) {
    return {
      type: "Feature",
      properties: {
        store_id: "ST-" + String(Date.now()).slice(-6),
        name: data.name,
        category: data.category || "متجر",
        city: data.city || "",
        neighborhood: data.neighborhood || "",
        phone: data.phone || "",
        rating: parseFloat(data.rating) || APP_CONFIG.defaults.rating,
        delivery_fee: parseInt(data.delivery_fee) || APP_CONFIG.defaults.deliveryFee,
        open: data.open !== false,
        image: data.image || APP_CONFIG.defaults.storeImage,
        products: data.products || []
      },
      geometry: {
        type: "Point",
        coordinates: [latlng.lng, latlng.lat]
      }
    };
  }

  save(store) {
    this._repo.add(store);
  }

  delete(id) {
    this._repo.remove(id);
  }

  filterByCity(city) {
    const stores = this._repo.getAll();
    if (!city || city === "الكل") return stores;
    return stores.filter(s =>
      s.properties.city === city || s.properties.neighborhood === city
    );
  }

  search(query) {
    const q = query.toLowerCase();
    return this._repo.getAll().filter(s => {
      const p = s.properties;
      return p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q);
    });
  }
}
