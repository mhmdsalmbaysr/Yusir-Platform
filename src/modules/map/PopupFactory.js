import { formatPrice } from "../../core/helpers/format.js";

export class PopupFactory {
  static storePopup(store) {
    const p = store.properties;
    const status = p.open !== false
      ? '<span style="color:#27ae60">مفتوح</span>'
      : '<span style="color:#d63031">مغلق</span>';
    const img = p.image
      ? `<img src="${p.image}" style="width:100%;height:120px;object-fit:cover;border-radius:6px;margin-bottom:6px" onerror="this.style.display='none'">`
      : "";
    const products = (p.products || []).slice(0, 3);
    const prodList = products.map(pr =>
      `<div style="display:flex;justify-content:space-between;padding:2px 0;font-size:12px">
        <span>${pr.name}</span>
        <b>${formatPrice(pr.price)}</b>
      </div>`
    ).join("");
    return `
      <div dir="rtl" style="font-family:'Cairo',sans-serif;min-width:200px">
        ${img}
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">${p.name}</div>
        <div style="font-size:11px;color:#636e72;margin-bottom:6px">
          ${p.city || ""} ${p.neighborhood ? `— ${p.neighborhood}` : ""} | ${status}
          ${p.delivery_fee ? ` | التوصيل ${formatPrice(p.delivery_fee)}` : ""}
        </div>
        ${prodList}
        <button class="btn-view-store" data-store="${p.store_id}"
          style="width:100%;margin-top:6px;padding:6px;background:#d63031;color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:'Cairo',sans-serif">
          عرض المتجر ←
        </button>
      </div>`;
  }
}
