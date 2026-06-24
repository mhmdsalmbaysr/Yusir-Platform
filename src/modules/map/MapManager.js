import { APP_CONFIG } from "../../core/config/app.js";

let instance = null;

export class MapManager {
  constructor(containerId = "map") {
    if (instance) return instance;
    this._map = null;
    this._containerId = containerId;
    this._ready = false;
    instance = this;
  }

  static getInstance() {
    if (!instance) new MapManager();
    return instance;
  }

  init(options = {}) {
    if (this._ready) return this;
    const cfg = APP_CONFIG.map;
    this._map = L.map(this._containerId, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: cfg.maxBounds,
      maxBoundsViscosity: cfg.maxBoundsViscosity,
      minZoom: cfg.minZoom,
      ...options
    }).setView(options.center || cfg.center, options.zoom || cfg.zoom);
    this._ready = true;
    return this;
  }

  get map() {
    return this._map;
  }

  isReady() {
    return this._ready;
  }

  setView(lat, lng, zoom) {
    this._map.setView([lat, lng], zoom);
  }

  fitBounds(bounds, padding) {
    this._map.fitBounds(bounds, { padding: padding || [20, 20] });
  }

  on(event, handler) {
    this._map.on(event, handler);
  }

  destroy() {
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
    this._ready = false;
    instance = null;
  }
}
