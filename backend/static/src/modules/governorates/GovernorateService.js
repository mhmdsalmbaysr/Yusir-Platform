import { APP_CONFIG } from "../../core/config/app.js";
import { GeoJsonService } from "../map/GeoJsonService.js";

export class GovernorateService {
  constructor(map) {
    this._map = map;
    this._geoJson = new GeoJsonService();
    this._layer = null;
  }

  async load() {
    const gj = await this._geoJson.load(APP_CONFIG.data.admin1);
    this._layer = L.geoJSON(gj, {
      style: { color: "#c8ccd0", weight: 1.5, fillOpacity: 0, interactive: false }
    }).addTo(this._map);
    return gj;
  }

  getLayer() {
    return this._layer;
  }
}
