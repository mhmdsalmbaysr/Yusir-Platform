import { formatPrice, truncate } from "../../core/helpers/format.js";
import { createElement } from "../../core/helpers/dom.js";

export class StoreCard {
  constructor(store, onAddToCart, onSelect) {
    this._store = store;
    this._onAddToCart = onAddToCart;
    this._onSelect = onSelect;
  }

  render() {
    const p = this._store.properties;
    const el = createElement("div", { className: "store-card" }, [
      createElement("div", { className: "store-card-img" }, [
        createElement("img", {
          src: p.image || "",
          onerror: "this.src='https://via.placeholder.com/300x200'",
          loading: "lazy",
          alt: p.name
        })
      ]),
      createElement("div", { className: "store-card-body" }, [
        createElement("h4", { className: "store-card-title" }, [p.name]),
        createElement("p", { className: "store-card-meta" }, [
          `${p.city || ""} ⭐ ${p.rating || ""}`
        ]),
        createElement("div", { className: "store-card-footer" }, [
          createElement("span", { className: "store-card-count" }, [
            `${(p.products || []).length} منتج`
          ]),
          createElement("button", {
            className: "btn-sm",
            onclick: () => this._onSelect(this._store)
          }, ["عرض"])
        ])
      ])
    ]);
    return el;
  }
}
