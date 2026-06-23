export class MarkerFactory {
  static storeIcon(isOpen) {
    return L.divIcon({
      className: "",
      html: `<div class="store-marker ${isOpen ? "" : "closed"}"><i class="fas fa-store"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38]
    });
  }

  static pickIcon() {
    return L.divIcon({
      className: "pick-marker",
      html: '<div style="background:#d63031;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"><i class="fas fa-map-pin" style="font-size:14px"></i></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  }

  static createStoreMarker(store, onClick) {
    const marker = L.marker(
      [store.geometry.coordinates[1], store.geometry.coordinates[0]],
      { icon: MarkerFactory.storeIcon(store.properties.open !== false) }
    );
    if (onClick) marker.on("click", () => onClick(store));
    return marker;
  }

  static createFieldMarker(coords, name, type) {
    const icon = type === "حي" ? "\u{1F3D8}\uFE0F" : "\u{1F4CD}";
    return L.marker([coords[1], coords[0]], {
      icon: L.divIcon({
        className: "",
        html: `<span class="field-chip ${type === "حي" ? "hood" : "lane"}">${icon} ${name}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      }),
      interactive: false
    });
  }

  static createLabel(lat, lng, className, html, width = 140, height = 24) {
    return L.marker([lat, lng], {
      icon: L.divIcon({
        className,
        html,
        iconSize: [width, height],
        iconAnchor: [width / 2, height / 2]
      }),
      interactive: false
    });
  }
}
