import { APP_CONFIG } from "../../core/config/app.js";
import { debounce } from "../../core/utils/debounce.js";
import { $ } from "../../core/helpers/dom.js";

export class SearchController {
  constructor(map) {
    this._map = map;
    this._input = document.getElementById("osmSearch");
    this._results = document.getElementById("osmResults");
    this._ctrl = null;
    this._init();
  }

  _init() {
    this._ctrl = L.control({ position: "topleft" });
    this._ctrl.onAdd = () => {
      const d = L.DomUtil.create("div", "osm-search-wrap");
      d.innerHTML = `<input id="osmSearch" class="osm-search-input" placeholder="🔍 ابحث..." autocomplete="off">
        <div id="osmResults" class="osm-results"></div>`;
      L.DomEvent.disableClickPropagation(d);
      return d;
    };
    this._ctrl.addTo(this._map);

    const searchFn = debounce((q) => this._search(q), APP_CONFIG.nominatim.debounceMs);
    document.getElementById("osmSearch").addEventListener("input", (e) => {
      const q = e.target.value.trim();
      if (q.length < 3) { this._clear(); return; }
      searchFn(q);
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".osm-search-wrap")) this._clear();
    });
  }

  async _search(q) {
    try {
      const url = `${APP_CONFIG.nominatim.endpoint}/search?format=json&q=${encodeURIComponent(q)}&limit=${APP_CONFIG.nominatim.maxResults}&accept-language=${APP_CONFIG.nominatim.acceptLanguage}&countrycodes=${APP_CONFIG.nominatim.countryCodes}`;
      const r = await fetch(url);
      const data = await r.json();
      this._results.innerHTML = data.map(i =>
        `<div class="osm-result-item" data-lat="${i.lat}" data-lon="${i.lon}">${i.display_name}</div>`
      ).join("");
      this._results.querySelectorAll(".osm-result-item").forEach(el => {
        el.addEventListener("click", () => {
          this._map.setView([parseFloat(el.dataset.lat), parseFloat(el.dataset.lon)], 13);
          this._clear();
          this._input.value = el.textContent.split(",")[0];
        });
      });
    } catch { /* noop */ }
  }

  _clear() {
    this._results.innerHTML = "";
  }
}
