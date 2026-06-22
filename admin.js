/* ===================================================================
   لوحة تحكم يُسر — admin.js
   إضافة المتاجر والمنتجات على الخريطة وتوليد stores.geojson
   =================================================================== */
"use strict";

const ADMIN = {
    stores: [],          // المتاجر المُسجّلة (Features)
    draftProducts: [],   // منتجات المتجر قيد الإنشاء
    pickedLatLng: null,  // الإحداثيات المختارة من الخريطة
    seq: 1               // عدّاد المعرّفات
};
const fmt = (n) => Number(n).toLocaleString("ar-EG");

/* تهيئة الخريطة */
const map = L.map("map").setView([15.5527, 48.5164], 7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);

let pickMarker = null;
map.on("click", (e) => {
    ADMIN.pickedLatLng = e.latlng;
    document.getElementById("f_lat").value = e.latlng.lat.toFixed(5);
    document.getElementById("f_lng").value = e.latlng.lng.toFixed(5);
    if (pickMarker) pickMarker.setLatLng(e.latlng);
    else pickMarker = L.marker(e.latlng, { draggable: true }).addTo(map)
        .on("dragend", (ev) => { ADMIN.pickedLatLng = ev.target.getLatLng();
            document.getElementById("f_lat").value = ADMIN.pickedLatLng.lat.toFixed(5);
            document.getElementById("f_lng").value = ADMIN.pickedLatLng.lng.toFixed(5); });
});

/* تحميل المتاجر الحالية إن وُجدت */
fetch("data/stores.geojson").then(r => r.ok ? r.json() : null).then(gj => {
    if (gj && gj.features) {
        gj.features.forEach(f => ADMIN.stores.push(f));
        renderSavedStores();
        L.geoJSON(gj).addTo(map);
    }
}).catch(() => {});

/* ---- إدارة منتجات المسودّة ---- */
document.getElementById("addProdBtn").addEventListener("click", () => {
    const name = val("p_name"), price = parseFloat(val("p_price"));
    if (!name || !price) return showToast("⚠️ أدخل اسم المنتج وسعره");
    ADMIN.draftProducts.push({
        id: "P-" + Date.now(),
        name, price,
        unit: val("p_unit") || "وحدة",
        image: val("p_image") || "https://via.placeholder.com/300x200?text=Product",
        in_stock: true
    });
    ["p_name", "p_price", "p_unit", "p_image"].forEach(id => document.getElementById(id).value = "");
    renderDraftProducts();
});

function renderDraftProducts() {
    const wrap = document.getElementById("prodList");
    wrap.innerHTML = "";
    ADMIN.draftProducts.forEach((p, i) => {
        const el = document.createElement("div");
        el.className = "prod-item";
        el.innerHTML = `<span>${p.name}</span> <b>${fmt(p.price)} ريال</b> <button title="حذف"><i class="fas fa-trash"></i></button>`;
        el.querySelector("button").addEventListener("click", () => { ADMIN.draftProducts.splice(i, 1); renderDraftProducts(); });
        wrap.appendChild(el);
    });
}

/* ---- حفظ المتجر ---- */
document.getElementById("saveStoreBtn").addEventListener("click", () => {
    const name = val("f_name");
    if (!name) return showToast("⚠️ اسم المتجر مطلوب");
    if (!ADMIN.pickedLatLng) return showToast("⚠️ حدّد موقع المتجر على الخريطة");
    if (ADMIN.draftProducts.length === 0) return showToast("⚠️ أضف منتجاً واحداً على الأقل");

    const feature = {
        type: "Feature",
        properties: {
            store_id: "ST-" + String(Date.now()).slice(-6),
            name,
            category: val("f_cat") || "متجر",
            city: val("f_city"), neighborhood: val("f_hood"),
            phone: val("f_phone"),
            rating: parseFloat(val("f_rating")) || 0,
            delivery_fee: parseInt(val("f_delivery")) || 0,
            open: document.getElementById("f_open").checked,
            image: val("f_image") || "https://via.placeholder.com/600x300?text=Store",
            products: ADMIN.draftProducts.slice()
        },
        geometry: { type: "Point", coordinates: [ADMIN.pickedLatLng.lng, ADMIN.pickedLatLng.lat] }
    };
    ADMIN.stores.push(feature);
    L.marker(ADMIN.pickedLatLng).addTo(map).bindPopup(`<b>${name}</b>`);

    // تصفير النموذج
    ["f_name","f_cat","f_city","f_hood","f_phone","f_image","f_lat","f_lng"].forEach(id => document.getElementById(id).value = "");
    ADMIN.draftProducts = []; ADMIN.pickedLatLng = null;
    if (pickMarker) { map.removeLayer(pickMarker); pickMarker = null; }
    renderDraftProducts(); renderSavedStores();
    showToast(`✅ حُفظ المتجر «${name}»`);
});

function renderSavedStores() {
    document.getElementById("storeCount").textContent = ADMIN.stores.length;
    const wrap = document.getElementById("savedStores");
    wrap.innerHTML = "";
    ADMIN.stores.forEach((f, i) => {
        const p = f.properties;
        const row = document.createElement("div");
        row.className = "saved-row";
        row.innerHTML = `<span>${p.name} <small>(${(p.products||[]).length} منتج)</small></span>
            <button title="حذف"><i class="fas fa-trash"></i></button>`;
        row.querySelector("button").addEventListener("click", () => { ADMIN.stores.splice(i, 1); renderSavedStores(); });
        wrap.appendChild(row);
    });
}

/* ---- التصدير ---- */
function buildGeoJSON() {
    return {
        type: "FeatureCollection",
        name: "yusir_stores",
        crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: ADMIN.stores
    };
}
document.getElementById("downloadBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(buildGeoJSON(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stores.geojson";
    a.click();
    URL.revokeObjectURL(a.href);
});
document.getElementById("copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(buildGeoJSON(), null, 2)); showToast("📋 نُسخ JSON إلى الحافظة"); }
    catch (_) { showToast("⚠️ تعذّر النسخ"); }
});

/* أدوات مساعدة */
function val(id) { return document.getElementById(id).value.trim(); }
let toastTimer;
function showToast(text) {
    const t = document.getElementById("toast");
    t.textContent = text; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
