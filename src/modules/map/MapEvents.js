import { APP_CONFIG } from "../../core/config/app.js";
import { debounce } from "../../core/utils/debounce.js";

export class MapEvents {
  constructor(map) {
    this._map = map;
    this._handlers = new Map();
  }

  onZoomChange(callback) {
    const handler = () => callback(this._map.getZoom());
    this._map.on("zoomend", handler);
    this._handlers.set("zoomend", handler);
    handler();
  }

  onClick(callback) {
    const handler = (e) => callback(e.latlng);
    this._map.on("click", handler);
    this._handlers.set("click", handler);
  }

  onContextMenu(callback) {
    const handler = (e) => callback(e.latlng);
    this._map.on("contextmenu", handler);
    this._handlers.set("contextmenu", handler);
  }

  onMoveEnd(callback) {
    const handler = debounce(() => callback(this._map.getCenter(), this._map.getZoom()), 200);
    this._map.on("moveend", handler);
    this._handlers.set("moveend", handler);
  }

  removeAll() {
    this._handlers.forEach((handler, event) => {
      this._map.off(event, handler);
    });
    this._handlers.clear();
  }
}
