import { APP_CONFIG } from "../../core/config/app.js";
import { ZOOM_THRESHOLDS } from "../../core/constants/app.js";
import { GeoJsonService } from "../map/GeoJsonService.js";
import { MarkerFactory } from "../map/MarkerFactory.js";

export class DistrictService {
  constructor(map, events) {
    this._map = map;
    this._events = events;
    this._geoJson = new GeoJsonService();
    this._boundaryLayer = null;
    this._labels = [];
    this._loaded = false;
    this._options = [];
  }

  async load() {
    const gj = await this._geoJson.load(APP_CONFIG.data.admin2);
    this._boundaryLayer = L.geoJSON(gj, {
      style: { color: "#dde0e5", weight: 1, fillOpacity: 0, interactive: false }
    }).addTo(this._map);
    gj.features.forEach(f => {
      const p = f.properties;
      if (p.center_lat && p.center_lon && p.adm2_name1) {
        const m = MarkerFactory.createLabel(
          p.center_lat, p.center_lon, "dist-label", p.adm2_name1, 90, 16
        ).addTo(this._map);
        this._labels.push(m);
      }
      if (p.adm2_name1 && p.adm2_pcode) {
        this._options.push({ code: p.adm2_pcode, name: p.adm2_name1, adm1: p.adm1_name1 || "" });
      }
    });
    this._events.onZoomChange((z) => this._toggle(z));
    this._loaded = true;
    return this._options;
  }

  _toggle(z) {
    const show = z >= ZOOM_THRESHOLDS.DISTRICTS;
    if (this._boundaryLayer) {
      this._boundaryLayer.eachLayer(l => {
        if (l.setStyle) l.setStyle({ weight: show ? 1 : 0 });
      });
    }
    this._labels.forEach(m => m.setOpacity(show ? 1 : 0));
  }
}
