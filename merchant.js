/* ===================================================================
   لوحة التاجر — إدارة المتجر والمنتجات
   الدخول يتحقق من سجل yusir_merchants (تنشئه لوحة السوبر أدمن)
   منتجات/بيانات المتجر تُحفظ في yusir_store_<store_id>
   =================================================================== */
"use strict";

const MKEY = "yusir_merchants";
const SESSION_KEY = "yusir_merchant_session";
const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString("ar-EG");

let CURRENT = null;            // التاجر الحالي
let STORE = null;              // بيانات المتجر (properties)
let PRODUCTS = [];             // منتجات المتجر

function loadMerchants() { try { return JSON.parse(localStorage.getItem(MKEY)) || []; } catch (_) { return []; } }
const storeKey = (sid) => "yusir_store_" + sid;

/* ---------- استعادة الجلسة ---------- */
$("logout").addEventListener("click", () => { sessionStorage.removeItem(SESSION_KEY); location.reload(); });

(function () {
  const sid = sessionStorage.getItem(SESSION_KEY);
  const m = loadMerchants().find((x) => x.id === sid);
  if (m) start(m);
})();

/* ---------- بدء اللوحة ---------- */
async function start(m) {
  CURRENT = m;
  $("storeBadge").textContent = m.store;

  // حالة الاشتراك
  const expired = new Date(m.expiry) < new Date();
  const banner = $("subBanner");
  if (m.suspended || expired) {
    banner.className = "sub-banner bad";
    banner.innerHTML = `<i class="fas fa-triangle-exclamation"></i> ${m.suspended ? "تم تعليق اشتراكك من الإدارة." : "انتهى اشتراكك بتاريخ " + new Date(m.expiry).toLocaleDateString("ar-EG")}. التعديل معطّل — يرجى التجديد.`;
  } else {
    banner.className = "sub-banner ok";
    banner.innerHTML = `<i class="fas fa-circle-check"></i> اشتراكك فعّال حتى ${new Date(m.expiry).toLocaleDateString("ar-EG")}.`;
  }
  CURRENT.locked = m.suspended || expired;

  await loadStoreData(m);
  fillStoreForm();
  renderProducts();
}

/* ---------- تحميل بيانات المتجر (من localStorage أو من stores.geojson) ---------- */
async function loadStoreData(m) {
  const saved = localStorage.getItem(storeKey(m.store_id));
  if (saved) { const o = JSON.parse(saved); STORE = o.store; PRODUCTS = o.products || []; return; }

  // محاولة المطابقة مع متجر موجود في stores.geojson بالاسم
  try {
    const gj = await (await fetch("data/stores.geojson")).json();
    const f = (gj.features || []).find((x) => x.properties.name === m.store);
    if (f) {
      STORE = { ...f.properties }; PRODUCTS = (f.properties.products || []).slice();
      STORE.store_id = m.store_id; delete STORE.products;
      STORE._coords = f.geometry.coordinates;
      return;
    }
  } catch (_) {}

  // متجر جديد فارغ
  STORE = { store_id: m.store_id, name: m.store, category: "متجر", city: "", neighborhood: "",
            phone: "", rating: 4.5, delivery_fee: 0, open: true, image: "", _coords: [48.0, 15.5] };
  PRODUCTS = [];
}
function persistStore() { localStorage.setItem(storeKey(CURRENT.store_id), JSON.stringify({ store: STORE, products: PRODUCTS })); }

/* ---------- بيانات المتجر ---------- */
function fillStoreForm() {
  $("sName").value = STORE.name || ""; $("sCat").value = STORE.category || "";
  $("sCity").value = STORE.city || ""; $("sHood").value = STORE.neighborhood || "";
  $("sPhone").value = STORE.phone || ""; $("sDelivery").value = STORE.delivery_fee || 0;
  $("sImage").value = STORE.image || ""; $("sOpen").value = String(STORE.open !== false);
}
$("saveStore").addEventListener("click", () => {
  if (guard()) return;
  STORE.name = $("sName").value.trim(); STORE.category = $("sCat").value.trim();
  STORE.city = $("sCity").value.trim(); STORE.neighborhood = $("sHood").value.trim();
  STORE.phone = $("sPhone").value.trim(); STORE.delivery_fee = parseInt($("sDelivery").value) || 0;
  STORE.image = $("sImage").value.trim(); STORE.open = $("sOpen").value === "true";
  persistStore(); toast("✅ حُفظت بيانات المتجر");
});

/* ---------- المنتجات ---------- */
$("addProd").addEventListener("click", () => {
  if (guard()) return;
  const name = $("pName").value.trim(), price = parseFloat($("pPrice").value);
  if (!name || !price) return toast("⚠️ أدخل اسم المنتج وسعره");
  const p = {
    id: "P-" + Date.now(), name, price,
    category: $("pCat").value.trim() || "عام",
    unit: $("pUnit").value.trim() || "وحدة",
    image: $("pImage").value.trim() || "https://via.placeholder.com/300x200?text=Product",
    desc: $("pDesc").value.trim(), in_stock: true, rating: 4.5
  };
  const old = parseFloat($("pOld").value); if (old > price) p.old_price = old;
  PRODUCTS.push(p); persistStore(); renderProducts();
  ["pName", "pCat", "pPrice", "pOld", "pUnit", "pImage", "pDesc"].forEach((id) => $(id).value = "");
  toast("✅ أُضيف المنتج");
});

function renderProducts() {
  const grid = $("prodGrid"); grid.innerHTML = "";
  PRODUCTS.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "pc";
    card.innerHTML = `
      <img src="${p.image}" onerror="this.src='https://via.placeholder.com/300x200?text=%E2%80%94'">
      <div class="pcb">
        <div class="pcn">${esc(p.name)}</div>
        <div class="pcp">${fmt(p.price)} ريال <span class="muted">/ ${esc(p.unit || "وحدة")}</span></div>
        <div class="muted">${esc(p.category || "عام")} • ${p.in_stock ? "متوفّر" : "نافد"}</div>
        <div class="pca">
          <button class="btn btn-g btn-sm" data-a="stock">${p.in_stock ? "تعليم كنافد" : "تعليم كمتوفّر"}</button>
          <button class="btn-icon del" data-a="del" title="حذف"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    card.querySelector('[data-a="stock"]').onclick = () => { if (guard()) return; p.in_stock = !p.in_stock; persistStore(); renderProducts(); };
    card.querySelector('[data-a="del"]').onclick = () => { if (guard()) return; if (confirm("حذف المنتج؟")) { PRODUCTS.splice(i, 1); persistStore(); renderProducts(); } };
    grid.appendChild(card);
  });
  $("emptyP").style.display = PRODUCTS.length ? "none" : "block";
  $("stProducts").textContent = PRODUCTS.length;
  $("stInStock").textContent = PRODUCTS.filter((p) => p.in_stock).length;
  $("stOut").textContent = PRODUCTS.filter((p) => !p.in_stock).length;
}

/* ---------- التصدير ---------- */
function buildFeature() {
  const props = { ...STORE }; const coords = props._coords || [48.0, 15.5]; delete props._coords;
  props.products = PRODUCTS;
  return { type: "Feature", properties: props, geometry: { type: "Point", coordinates: coords } };
}
$("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(buildFeature(), null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = (CURRENT.store_id || "store") + ".geojson"; a.click(); URL.revokeObjectURL(a.href);
});
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(JSON.stringify(buildFeature(), null, 2)); toast("📋 نُسخ JSON"); }
  catch (_) { toast("⚠️ تعذّر النسخ"); }
});

/* ---------- أدوات ---------- */
function guard() { if (CURRENT && CURRENT.locked) { toast("🔒 الاشتراك غير فعّال — التعديل معطّل"); return true; } return false; }
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
let tt; function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2200); }
