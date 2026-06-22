/* ===================================================================
   لوحة السوبر أدمن — إدارة اشتراكات المتاجر
   البيانات مشتركة عبر localStorage بمفتاح yusir_merchants
   =================================================================== */
"use strict";

// بيانات دخول السوبر أدمن (غيّرها في config.js عبر YUSIR_CONFIG.SUPER_ADMIN)
const SA = (window.YUSIR_CONFIG && window.YUSIR_CONFIG.SUPER_ADMIN) || { user: "superadmin", pass: "yusir@2024" };
const SESSION_KEY = "yusir_sa_session";
const MKEY = "yusir_merchants";

// الباقات
const PLANS = {
  basic:   { name: "أساسي",   price: 5000 },
  pro:     { name: "احترافي", price: 12000 },
  premium: { name: "متقدم",   price: 25000 }
};

const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString("ar-EG");

/* ---------- تسجيل الدخول ---------- */
function showApp() { $("login").classList.add("hidden"); $("app").classList.remove("hidden"); init(); }
if (sessionStorage.getItem(SESSION_KEY) === "1") showApp();

$("lgBtn").addEventListener("click", () => {
  if ($("lgUser").value.trim() === SA.user && $("lgPass").value === SA.pass) {
    sessionStorage.setItem(SESSION_KEY, "1"); showApp();
  } else { $("lgErr").textContent = "بيانات الدخول غير صحيحة"; }
});
$("lgPass").addEventListener("keydown", (e) => { if (e.key === "Enter") $("lgBtn").click(); });
$("logout").addEventListener("click", () => { sessionStorage.removeItem(SESSION_KEY); location.reload(); });

/* ---------- مخزن المتاجر ---------- */
function loadMerchants() { try { return JSON.parse(localStorage.getItem(MKEY)) || []; } catch (_) { return []; } }
function saveMerchants(a) { localStorage.setItem(MKEY, JSON.stringify(a)); }

function statusOf(m) {
  if (m.suspended) return "suspended";
  return new Date(m.expiry) >= new Date() ? "active" : "expired";
}
const statusLabel = { active: "فعّال", expired: "منتهٍ", suspended: "معلّق" };

/* ---------- التهيئة ---------- */
function init() {
  const sel = $("mPlan");
  sel.innerHTML = Object.entries(PLANS).map(([k, v]) => `<option value="${k}">${v.name} — ${fmt(v.price)} ريال/شهر</option>`).join("");
  render();
}

function render() {
  const list = loadMerchants();
  const body = $("mBody");
  body.innerHTML = "";
  let active = 0, expired = 0, revenue = 0;

  list.forEach((m) => {
    const st = statusOf(m);
    if (st === "active") { active++; revenue += PLANS[m.plan] ? PLANS[m.plan].price : 0; } else expired++;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${esc(m.store)}</b><br><span class="muted">${esc(m.email)}</span></td>
      <td>${esc(m.owner)}</td>
      <td>${PLANS[m.plan] ? PLANS[m.plan].name : m.plan}</td>
      <td><span class="pill ${st}">${statusLabel[st]}</span></td>
      <td>${new Date(m.expiry).toLocaleDateString("ar-EG")}</td>
      <td><div class="row-actions">
        <button class="btn btn-g btn-sm" data-act="renew">+شهر</button>
        <button class="btn btn-g btn-sm" data-act="toggle">${m.suspended ? "تفعيل" : "تعليق"}</button>
        <button class="btn-icon del" data-act="del" title="حذف"><i class="fas fa-trash"></i></button>
      </div></td>`;
    tr.querySelector('[data-act="renew"]').onclick = () => { const d = new Date(m.expiry); d.setMonth(d.getMonth() + 1); m.expiry = d.toISOString(); persist(list); toast("✅ تمديد شهر"); };
    tr.querySelector('[data-act="toggle"]').onclick = () => { m.suspended = !m.suspended; persist(list); toast(m.suspended ? "⏸️ عُلّق المتجر" : "▶️ فُعّل المتجر"); };
    tr.querySelector('[data-act="del"]').onclick = () => { if (confirm("حذف هذا الاشتراك نهائياً؟")) { persist(list.filter((x) => x.id !== m.id)); toast("🗑️ حُذف"); } };
    body.appendChild(tr);
  });

  $("stTotal").textContent = list.length;
  $("stActive").textContent = active;
  $("stExpired").textContent = expired;
  $("stRevenue").textContent = fmt(revenue);
  $("emptyM").style.display = list.length ? "none" : "block";
}
function persist(list) { saveMerchants(list); render(); }

/* ---------- إضافة متجر ---------- */
$("addM").addEventListener("click", () => {
  const store = $("mStore").value.trim(), owner = $("mOwner").value.trim();
  const email = $("mEmail").value.trim(), pass = $("mPass").value.trim();
  const plan = $("mPlan").value, months = parseInt($("mMonths").value) || 1;
  if (!store || !owner || !email || !pass) return toast("⚠️ أكمل كل الحقول");
  const list = loadMerchants();
  if (list.some((m) => m.email === email)) return toast("⚠️ البريد مستخدم مسبقاً");
  const expiry = new Date(); expiry.setMonth(expiry.getMonth() + months);
  list.push({
    id: "M-" + Date.now(),
    store, owner, email, pass, plan,
    store_id: "ST-" + String(Date.now()).slice(-6),
    suspended: false,
    created: new Date().toISOString(),
    expiry: expiry.toISOString()
  });
  saveMerchants(list);
  ["mStore", "mOwner", "mEmail", "mPass"].forEach((id) => $(id).value = "");
  $("mMonths").value = 1;
  render(); toast("✅ أُنشئ اشتراك المتجر");
});

/* ---------- أدوات ---------- */
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
let tt; function toast(t) { const el = $("toast"); el.textContent = t; el.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("show"), 2200); }
