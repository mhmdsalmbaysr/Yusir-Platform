import { APP_CONFIG } from "../../core/config/app.js";
import { GeoJsonService } from "../map/GeoJsonService.js";
import { MarkerFactory } from "../map/MarkerFactory.js";
import { generateId } from "../../core/helpers/format.js";

export class FieldDataService {
  constructor(map) {
    this._map = map;
    this._geoJson = new GeoJsonService();
    this._items = [];
    this._markers = [];
  }

  async load() {
    const gj = await this._geoJson.load(APP_CONFIG.data.fieldData);
    this._items = gj.features || [];
    this._render();
    return this._items;
  }

  add(name, type, distCode, distName, latlng) {
    const item = {
      type: "Feature",
      properties: {
        id: generateId("FD"),
        name, type,
        parent_adm2: distCode,
        parent_adm2_name: distName
      },
      geometry: { type: "Point", coordinates: [latlng.lng, latlng.lat] }
    };
    this._items.push(item);
    this._render();
    return item;
  }

  remove(index) {
    this._items.splice(index, 1);
    this._render();
  }

  getAll() {
    return this._items;
  }

  _render() {
    this._markers.forEach(m => this._map.removeLayer(m));
    this._markers = [];
    this._items.forEach(item => {
      const p = item.properties;
      const c = item.geometry.coordinates;
      const marker = MarkerFactory.createFieldMarker(c, p.name, p.type);
      marker.addTo(this._map);
      this._markers.push(marker);
    });
  }

  toFeatureCollection() {
    return { type: "FeatureCollection", features: this._items };
  }

  download() {
    this._geoJson.downloadJSON(this.toFeatureCollection(), "yem_field_data.geojson");
  }
}
