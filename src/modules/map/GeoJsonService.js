import { storage } from "../../core/services/StorageService.js";

export class GeoJsonService {
  async load(url) {
    return storage.fetchJSON(url);
  }

  createFeature(geometry, properties) {
    return {
      type: "Feature",
      properties,
      geometry
    };
  }

  createCollection(features, name = "") {
    return {
      type: "FeatureCollection",
      name,
      crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      features
    };
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async copyToClipboard(data) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      return true;
    } catch {
      return false;
    }
  }
}
