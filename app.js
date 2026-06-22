/* ===================================================================
   منصة يُسر — المحرك الإجرائي (app.js)
   المنطق الإجرائي، مستمعات الأحداث، وجلب البيانات جغرافياً
   =================================================================== */

"use strict";

/* ------------------------------------------------------------------
   الحالة العامة (Global State)
------------------------------------------------------------------ */
const CART_KEY = "yusir_cart_v1";
const STATE = {
    cart: loadCart(),    // مصفوفة السلة المحلية (محفوظة في المتصفح)
    storesById: {},      // فهرس المتاجر بالمعرّف للوصول السريع
    markersById: {},     // فهرس مؤشرات الخريطة للفلترة
    activeStore: null    // المتجر المفتوح حالياً
};

// حفظ/استرجاع السلة من localStorage لتبقى بعد تحديث الصفحة
function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (_) { return []; }
}
function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(STATE.cart)); } catch (_) {}
}

const fmt = (n) => Number(n).toLocaleString("ar-EG"); // تنسيق الأرقام

/* ------------------------------------------------------------------
   الخطوة 1: تهيئة بيئة الخريطة وتثبيت النطاق الجغرافي لليمن
------------------------------------------------------------------ */
const map = L.map("map", { zoomControl: true, attributionControl: true })
    .setView([15.5527, 48.5164], 7); // المركز الجغرافي لليمن + Zoom = 7

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

// أيقونة مخصصة لمؤشر المتجر (Marker)
function buildStoreIcon(isOpen) {
    return L.divIcon({
        className: "",
        html: `<div class="store-marker ${isOpen ? "" : "closed"}"><i class="fas fa-store"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38]
    });
}

/* ------------------------------------------------------------------
   الخطوة 1.b: الاستدعاء غير المتزامن لجلب ملف stores.geojson
------------------------------------------------------------------ */
fetch("data/stores.geojson")
    .then((res) => {
        if (!res.ok) throw new Error("تعذّر تحميل ملف المتاجر (" + res.status + ")");
        return res.json();                       // تحويل الاستجابة الخام إلى JSON Object
    })
    .then((geojson) => renderStores(geojson))    // تمرير البيانات لمحرك الرسم
    .catch((err) => {
        console.error(err);
        showToast("⚠️ خطأ في تحميل المتاجر");
    })
    .finally(() => {
        document.getElementById("loader").classList.add("hidden");
    });

/* ------------------------------------------------------------------
   الخطوة 2: معالجة البيانات الجغرافية ورسم المتاجر (Geographic Parsing)
------------------------------------------------------------------ */
function renderStores(geojson) {
    const layer = L.geoJSON(geojson, {
        // التحقق من نوع الهندسة (Point) وتثبيت المؤشر في الموقع المحدّد
        pointToLayer: (feature, latlng) => {
            const props = feature.properties;
            STATE.storesById[props.store_id] = feature;      // فهرسة المتجر
            const marker = L.marker(latlng, { icon: buildStoreIcon(props.open) });
            STATE.markersById[props.store_id] = marker; // مرجع للفلترة
            return marker;
        },
        // ربط كل مؤشر بمستمع حدث النقر (Event Listener)
        onEachFeature: (feature, lyr) => {
            const p = feature.properties;
            lyr.bindTooltip(`<b>${p.name}</b><br>${p.city} — ${p.neighborhood}`, { direction: "top" });
            lyr.on("click", (e) => {
                if (e.originalEvent) L.DomEvent.stopPropagation(e); // منع تداخل الخريطة الخلفية
                openStore(feature.properties.store_id);             // النفق الإجرائي
            });
        }
    }).addTo(map);

    // ملاءمة حدود العرض لتشمل كل المتاجر
    try { map.fitBounds(layer.getBounds().pad(0.2)); } catch (_) {}

    STATE.storeLayer = layer;
    setupSearch();
}

/* ------------------------------------------------------------------
   فلترة المتاجر عبر شريط البحث (الاسم / المدينة / التصنيف)
------------------------------------------------------------------ */
function setupSearch() {
    const input = document.getElementById("searchInput");
    const counter = document.getElementById("searchCount");
    const toggle = document.getElementById("openOnlyToggle");
    const ids = Object.keys(STATE.storesById);

    function apply() {
        const q = input.value.trim().toLowerCase();
        const openOnly = toggle.classList.contains("active");
        let visible = 0;
        ids.forEach((id) => {
            const p = STATE.storesById[id].properties;
            const hay = `${p.name} ${p.city} ${p.neighborhood} ${p.category}`.toLowerCase();
            const match = (!q || hay.includes(q)) && (!openOnly || p.open);
            const marker = STATE.markersById[id];
            if (match) { if (!map.hasLayer(marker)) marker.addTo(map); visible++; }
            else if (map.hasLayer(marker)) map.removeLayer(marker);
        });
        counter.textContent = (q || openOnly) ? `${visible} نتيجة` : `${ids.length} متجر`;
    }
    input.addEventListener("input", apply);
    toggle.addEventListener("click", () => { toggle.classList.toggle("active"); apply(); });
    apply();
}

/* ------------------------------------------------------------------
   الخطوة 3: النفق الإجرائي عند النقر (The Click Tunnel)
   عزل النطاق + حقن DOM التفاعلي + التحريك البصري
------------------------------------------------------------------ */
function openStore(storeId) {
    const feature = STATE.storesById[storeId];
    if (!feature) return;

    const p = feature.properties;          // عزل النطاق: properties الخاص بالمتجر فقط
    STATE.activeStore = p;

    // --- حقن بيانات الهوية الرقمية للمتجر ---
    document.getElementById("storeImage").src = p.image || "";
    document.getElementById("storeName").textContent = p.name;
    document.getElementById("storeCategory").textContent = p.category || "متجر";
    document.getElementById("storeLocation").textContent = `${p.city} - ${p.neighborhood}`;
    document.getElementById("storeRating").textContent = p.rating ?? "—";
    document.getElementById("storeDelivery").textContent = p.delivery_fee ? fmt(p.delivery_fee) + " ريال" : "مجاني";

    const status = document.getElementById("storeStatus");
    status.textContent = p.open ? "مفتوح الآن" : "مغلق";
    status.className = "status-pill " + (p.open ? "open" : "closed");

    // --- تصفير حاوية المنتجات لتجنّب تداخل متجر آخر ---
    STATE.activeProducts = p.products || [];
    STATE.activeCategory = "الكل";
    document.getElementById("productSearch").value = "";
    buildCategoryBar(STATE.activeProducts);
    renderProducts();

    // --- التحريك البصري: تفعيل اللوحة الجانبية (right: -400px → 0) ---
    renderReviews(p.store_id);
    document.getElementById("revName").value = "";
    document.getElementById("revText").value = "";
    setStarInput(0);
    openPanel("storeSidebar");
}

/* ------------------------------------------------------------------
   نظام التقييمات والمراجعات (يُحفظ في متصفح العميل)
------------------------------------------------------------------ */
const REVIEWS_KEY = "yusir_reviews_v1";
function loadReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {}; }
    catch (_) { return {}; }
}
function saveReviews(obj) {
    try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(obj)); } catch (_) {}
}
function starsHtml(n) {
    let s = "";
    for (let i = 1; i <= 5; i++) s += `<i class="fa${i <= Math.round(n) ? "s" : "r"} fa-star"></i>`;
    return s;
}
function setStarInput(v) {
    STATE.reviewStars = v;
    document.querySelectorAll("#starInput i").forEach((el) => {
        const on = parseInt(el.dataset.v) <= v;
        el.className = (on ? "fas" : "far") + " fa-star";
    });
}
function renderReviews(storeId) {
    const store = STATE.storesById[storeId];
    const baseRating = store ? (store.properties.rating || 0) : 0;
    const all = loadReviews()[storeId] || [];

    // المتوسط = تقييم المتجر الأساسي + مراجعات العملاء
    const nums = all.map((r) => r.stars);
    const avg = (baseRating + nums.reduce((a, b) => a + b, 0)) / (1 + nums.length);

    document.getElementById("revAvg").textContent = avg.toFixed(1);
    document.getElementById("revStars").innerHTML = starsHtml(avg);
    document.getElementById("revCount").textContent = `(${all.length} مراجعة عميل)`;

    const list = document.getElementById("reviewsList");
    list.innerHTML = "";
    if (all.length === 0) {
        list.innerHTML = '<div class="reviews-empty">كن أول من يكتب مراجعة لهذا المتجر ✍️</div>';
        return;
    }
    all.slice().reverse().forEach((r) => {
        const card = document.createElement("div");
        card.className = "review-card";
        card.innerHTML = `
            <div class="rc-top">
                <span class="rc-name">${escapeHtml(r.name)}</span>
                <span class="rc-stars">${starsHtml(r.stars)}</span>
            </div>
            <div class="rc-text">${escapeHtml(r.text)}</div>
            <div class="rc-date">${r.date}</div>`;
        list.appendChild(card);
    });
}
function submitReview() {
    if (!STATE.activeStore) return;
    const name = document.getElementById("revName").value.trim();
    const text = document.getElementById("revText").value.trim();
    const stars = STATE.reviewStars || 0;
    if (!name || !text || !stars) { showToast("⚠️ أدخل اسمك، تقييماً بالنجوم، ونص المراجعة"); return; }

    const storeId = STATE.activeStore.store_id;
    const data = loadReviews();
    (data[storeId] = data[storeId] || []).push({
        name, text, stars,
        date: new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    });
    saveReviews(data);
    document.getElementById("revName").value = "";
    document.getElementById("revText").value = "";
    setStarInput(0);
    renderReviews(storeId);
    showToast("✅ شكراً! نُشرت مراجعتك");
}
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* بناء شريط التصنيفات داخل المتجر */
function buildCategoryBar(products) {
    const cats = ["الكل", ...Array.from(new Set(products.map((p) => p.category || "عام")))];
    const bar = document.getElementById("categoryBar");
    bar.innerHTML = "";
    cats.forEach((c) => {
        const chip = document.createElement("button");
        chip.className = "cat-chip" + (c === STATE.activeCategory ? " active" : "");
        chip.textContent = c;
        chip.addEventListener("click", () => {
            STATE.activeCategory = c;
            bar.querySelectorAll(".cat-chip").forEach((x) => x.classList.toggle("active", x.textContent === c));
            renderProducts();
        });
        bar.appendChild(chip);
    });
}

/* عرض المنتجات وفق التصنيف والبحث النشطين */
function renderProducts() {
    const container = document.getElementById("productsContainer");
    const q = document.getElementById("productSearch").value.trim().toLowerCase();
    container.innerHTML = "";

    const list = STATE.activeProducts.filter((p) => {
        const okCat = STATE.activeCategory === "الكل" || (p.category || "عام") === STATE.activeCategory;
        const okSearch = !q || `${p.name} ${p.desc || ""}`.toLowerCase().includes(q);
        return okCat && okSearch;
    });

    document.getElementById("noProducts").style.display = list.length ? "none" : "block";

    list.forEach((product) => {
        const hasDiscount = product.old_price && product.old_price > product.price;
        const off = hasDiscount ? Math.round((1 - product.price / product.old_price) * 100) : 0;
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <div class="p-img">
                <img src="${product.image}" alt="${product.name}" loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=%E2%80%94'">
                ${hasDiscount ? `<span class="discount-badge">خصم ${off}%</span>` : ""}
                ${product.rating ? `<span class="rating-badge"><i class="fas fa-star"></i> ${product.rating}</span>` : ""}
                ${product.in_stock ? "" : '<div class="out-badge">نفد المخزون</div>'}
            </div>
            <div class="p-body">
                <div class="p-cat">${product.category || "عام"}</div>
                <div class="p-name">${product.name}</div>
                <div class="price-line">
                    <span class="p-price">${fmt(product.price)} <small>ريال / ${product.unit || "وحدة"}</small></span>
                    ${hasDiscount ? `<span class="p-old">${fmt(product.old_price)}</span>` : ""}
                </div>
                <button class="btn-add" ${product.in_stock ? "" : "disabled"}>
                    <i class="fas fa-plus"></i> ${product.in_stock ? "إضافة للسلة" : "غير متوفر"}
                </button>
            </div>`;
        // النقر على البطاقة يفتح نافذة التفاصيل (Quick View)
        card.addEventListener("click", (e) => {
            if (e.target.closest(".btn-add")) return;
            openProductModal(product);
        });
        const btn = card.querySelector(".btn-add");
        if (product.in_stock) {
            btn.addEventListener("click", () => addToCart(STATE.activeStore.store_id, product));
        }
        container.appendChild(card);
    });
}

/* نافذة تفاصيل المنتج مع منتقي الكمية */
function openProductModal(product) {
    STATE.modalProduct = product;
    STATE.modalQty = 1;
    const hasDiscount = product.old_price && product.old_price > product.price;
    document.getElementById("pmImage").src = product.image;
    document.getElementById("pmImage").onerror = function () { this.src = "https://via.placeholder.com/400x300?text=%E2%80%94"; };
    document.getElementById("pmCategory").textContent = product.category || "عام";
    document.getElementById("pmName").textContent = product.name;
    document.getElementById("pmRating").textContent = product.rating ? product.rating + " / 5" : "—";
    document.getElementById("pmDesc").textContent = product.desc || "لا يوجد وصف متاح لهذا المنتج.";
    document.getElementById("pmPrice").textContent = fmt(product.price) + " ريال";
    document.getElementById("pmOld").textContent = hasDiscount ? fmt(product.old_price) + " ريال" : "";
    document.getElementById("pmQty").textContent = "1";
    const addBtn = document.getElementById("pmAdd");
    addBtn.disabled = !product.in_stock;
    addBtn.innerHTML = product.in_stock
        ? '<i class="fas fa-cart-plus"></i> أضف للسلة'
        : "غير متوفر";
    document.getElementById("productModal").classList.add("active");
}

/* ------------------------------------------------------------------
   الخطوة 4: التفاعل مع السلة (State Management)
------------------------------------------------------------------ */
function addToCart(storeId, product, qty) {
    qty = qty || 1;
    const existing = STATE.cart.find((it) => it.id === product.id && it.store_id === storeId);
    if (existing) {
        existing.qty += qty;
    } else {
        STATE.cart.push({
            id: product.id,            // المعرّف الفريد للمنتج
            store_id: storeId,         // معرّف المتجر
            name: product.name,
            price: product.price,
            image: product.image,
            qty: qty
        });
    }
    saveCart();
    refreshCart();
    showToast(`✅ أُضيف «${product.name}»${qty > 1 ? " ×" + qty : ""} إلى السلة`);
}

function changeQty(id, storeId, delta) {
    const item = STATE.cart.find((it) => it.id === id && it.store_id === storeId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        STATE.cart = STATE.cart.filter((it) => !(it.id === id && it.store_id === storeId));
    }
    saveCart();
    refreshCart();
}

function cartTotal() {
    return STATE.cart.reduce((sum, it) => sum + it.price * it.qty, 0);
}

function refreshCart() {
    // تحديث الشارة
    const count = STATE.cart.reduce((n, it) => n + it.qty, 0);
    document.getElementById("cartBadge").textContent = count;

    // إعادة بناء عناصر السلة
    const wrap = document.getElementById("cartItems");
    wrap.innerHTML = "";
    if (STATE.cart.length === 0) {
        wrap.innerHTML = '<div class="cart-empty"><i class="fas fa-cart-shopping" style="font-size:34px;opacity:.3"></i><p>سلتك فارغة حالياً</p></div>';
    } else {
        STATE.cart.forEach((it) => {
            const store = STATE.storesById[it.store_id];
            const storeName = store ? store.properties.name : "";
            const row = document.createElement("div");
            row.className = "cart-row";
            row.innerHTML = `
                <img src="${it.image}" alt="${it.name}">
                <div class="c-info">
                    <div class="c-name">${it.name}</div>
                    <div class="c-store">${storeName}</div>
                    <div class="c-price">${fmt(it.price * it.qty)} ريال</div>
                </div>
                <div class="qty">
                    <button data-act="dec">−</button>
                    <span>${it.qty}</span>
                    <button data-act="inc">+</button>
                </div>`;
            row.querySelector('[data-act="inc"]').addEventListener("click", () => changeQty(it.id, it.store_id, +1));
            row.querySelector('[data-act="dec"]').addEventListener("click", () => changeQty(it.id, it.store_id, -1));
            wrap.appendChild(row);
        });
    }

    document.getElementById("cartTotal").textContent = fmt(cartTotal()) + " ريال";
    document.getElementById("checkoutBtn").disabled = STATE.cart.length === 0;
}

/* ------------------------------------------------------------------
   إتمام الطلب (تجميع الطلب تمهيداً للدفع)
------------------------------------------------------------------ */
function checkout() {
    if (STATE.cart.length === 0) return;
    // عرض ملخص الطلب داخل النموذج ثم فتحه
    const summary = document.getElementById("coSummary");
    let html = "";
    STATE.cart.forEach((it) => {
        html += `<div>• ${it.name} ×${it.qty} — ${fmt(it.price * it.qty)} ريال</div>`;
    });
    html += `<div class="co-total">الإجمالي: ${fmt(cartTotal())} ريال</div>`;
    summary.innerHTML = html;
    closePanels();
    document.getElementById("checkoutModal").classList.add("active");
}

/* إرسال الطلب بعد تعبئة بيانات العميل — طلب منفصل لكل متجر */
function submitOrder() {
    const name = document.getElementById("coName").value.trim();
    const phone = document.getElementById("coPhone").value.trim();
    const address = document.getElementById("coAddress").value.trim();
    const notes = document.getElementById("coNotes").value.trim();
    if (!name || !phone || !address) { showToast("⚠️ يرجى تعبئة الاسم والهاتف والعنوان"); return; }

    const groups = {};
    STATE.cart.forEach((it) => { (groups[it.store_id] = groups[it.store_id] || []).push(it); });

    Object.keys(groups).forEach((sid, idx) => {
        const props = (STATE.storesById[sid] || {}).properties || {};
        let total = 0;
        let msg = `🛒 طلب جديد من منصة يُسر%0A`;
        msg += `🏪 المتجر: ${props.name || sid}%0A%0A`;
        msg += `👤 العميل: ${name}%0A📞 الهاتف: ${phone}%0A📍 العنوان: ${address}%0A`;
        if (notes) msg += `📝 ملاحظات: ${notes}%0A`;
        msg += `%0A— الطلبات —%0A`;
        groups[sid].forEach((it) => {
            total += it.price * it.qty;
            msg += `• ${it.name} ×${it.qty} = ${fmt(it.price * it.qty)} ريال%0A`;
        });
        if (props.delivery_fee) { total += props.delivery_fee; msg += `🛵 التوصيل: ${fmt(props.delivery_fee)} ريال%0A`; }
        msg += `%0A💰 الإجمالي: ${fmt(total)} ريال`;

        const wa = (props.phone || "").replace(/[^0-9]/g, "");
        const url = wa ? `https://wa.me/${wa}?text=${msg}` : `https://wa.me/?text=${msg}`;
        setTimeout(() => window.open(url, "_blank"), idx * 350);
    });

    document.getElementById("checkoutModal").classList.remove("active");
    STATE.cart = []; saveCart(); refreshCart();
    showToast("✅ تم إرسال طلبك! تحقق من واتساب");
}

/* ------------------------------------------------------------------
   إدارة فتح/إغلاق اللوحات + الإشعارات
------------------------------------------------------------------ */
function openPanel(id) {
    document.getElementById(id).classList.add("active");
    document.getElementById("backdrop").classList.add("active");
}
function closePanels() {
    document.getElementById("storeSidebar").classList.remove("active");
    document.getElementById("cartPanel").classList.remove("active");
    document.getElementById("backdrop").classList.remove("active");
}

let toastTimer;
function showToast(text) {
    const t = document.getElementById("toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ------------------------------------------------------------------
   ربط مستمعات الأحداث للعناصر الثابتة
------------------------------------------------------------------ */
document.getElementById("closeSidebar").addEventListener("click", closePanels);
document.getElementById("closeCart").addEventListener("click", closePanels);
document.getElementById("backdrop").addEventListener("click", closePanels);
document.getElementById("checkoutBtn").addEventListener("click", checkout);
document.getElementById("cartToggle").addEventListener("click", () => {
    document.getElementById("storeSidebar").classList.remove("active");
    openPanel("cartPanel");
});

// البحث داخل المتجر
document.getElementById("productSearch").addEventListener("input", renderProducts);

// عناصر نافذة تفاصيل المنتج
function closeProductModal() { document.getElementById("productModal").classList.remove("active"); }
document.getElementById("pmClose").addEventListener("click", closeProductModal);
document.getElementById("productModal").addEventListener("click", (e) => {
    if (e.target.id === "productModal") closeProductModal();
});
document.getElementById("pmPlus").addEventListener("click", () => {
    STATE.modalQty++;
    document.getElementById("pmQty").textContent = STATE.modalQty;
});
document.getElementById("pmMinus").addEventListener("click", () => {
    if (STATE.modalQty > 1) STATE.modalQty--;
    document.getElementById("pmQty").textContent = STATE.modalQty;
});
document.getElementById("pmAdd").addEventListener("click", () => {
    if (STATE.modalProduct && STATE.activeStore) {
        addToCart(STATE.activeStore.store_id, STATE.modalProduct, STATE.modalQty);
        closeProductModal();
    }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProductModal(); });

// نموذج إتمام الطلب
document.getElementById("coClose").addEventListener("click", () => document.getElementById("checkoutModal").classList.remove("active"));
document.getElementById("checkoutModal").addEventListener("click", (e) => {
    if (e.target.id === "checkoutModal") e.currentTarget.classList.remove("active");
});
document.getElementById("coSubmit").addEventListener("click", submitOrder);

// تقييمات المتاجر — إدخال النجوم والإرسال
document.querySelectorAll("#starInput i").forEach((el) => {
    el.addEventListener("click", () => setStarInput(parseInt(el.dataset.v)));
});
document.getElementById("revSubmit").addEventListener("click", submitReview);

// تهيئة عرض السلة عند الإقلاع
refreshCart();
