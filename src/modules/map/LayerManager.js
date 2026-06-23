import { APP_CONFIG } from "../../core/config/app.js";

export class LayerManager {
  constructor(map) {
    this._map = map;
    this._layers = new Map();
    this._currentBase = null;
  }

  addBaseTile(name, url, options = {}) {
    const layer = L.tileLayer(url, {
      maxZoom: APP_CONFIG.map.maxZoom,
      attribution: APP_CONFIG.map.tileLayer.attribution,
      ...options
    });
    this._layers.set(name, layer);
    return layer;
  }

  setBase(name) {
    const layer = this._layers.get(name);
    if (!layer) return;
    if (this._currentBase) this._map.removeLayer(this._currentBase);
    layer.addTo(this._map);
    this._currentBase = layer;
  }

  addOverlay(name, layer) {
    this._layers.set(name, layer);
    layer.addTo(this._map);
  }

  removeOverlay(name) {
    const layer = this._layers.get(name);
    if (layer && layer !== this._currentBase) {
      this._map.removeLayer(layer);
      this._layers.delete(name);
    }
  }

  toggleOverlay(name) {
    const layer = this._layers.get(name);
    if (!layer) return;
    if (this._map.hasLayer(layer)) this._map.removeLayer(layer);
    else this._map.addLayer(layer);
  }

  get(name) {
    return this._layers.get(name);
  }
}
