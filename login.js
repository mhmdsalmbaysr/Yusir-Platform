/* ===================================================================
   صفحة تسجيل الدخول الموحّدة — تُسر
   تدعم دخول التاجر (بالبريد الإلكتروني) والسوبر أدمن (باسم المستخدم)
   =================================================================== */
"use strict";

const MKEY = "yusir_merchants";
const SA = (window.YUSIR_CONFIG && window.YUSIR_CONFIG.SUPER_ADMIN) || { user: "superadmin", pass: "yusir@2024" };
const $ = (id) => document.getElementById(id);
let currentRole = "merchant";

// إذا كان المستخدم مسجّل الدخول بالفعل وجّهه إلى لوحته
(function () {
  if (sessionStorage.getItem("yusir_merchant_session")) return location.replace("merchant.html");
  if (sessionStorage.getItem("yusir_sa_session") === "1") return location.replace("super-admin.html");
})();

// تبديل نوع الحساب (تاجر / سوبر أدمن)
document.querySelectorAll(".role-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".role-tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    currentRole = tab.dataset.role;
    $("formMerchant").classList.toggle("hidden", currentRole !== "merchant");
    $("formSuperadmin").classList.toggle("hidden", currentRole !== "superadmin");
    $("lgErr").textContent = "";
  });
});

// تفعيل التبويب بناءً على معامل redirect في URL
const params = new URLSearchParams(location.search);
const redirectTo = params.get("redirect");
if (redirectTo === "superadmin") {
  document.querySelector('[data-role="superadmin"]').click();
} else if (redirectTo === "merchant") {
  document.querySelector('[data-role="merchant"]').click();
}

// مستمعو الأحداث
$("lgBtnMerchant").addEventListener("click", loginMerchant);
$("lgBtnSuperadmin").addEventListener("click", loginSuperadmin);
$("lgPass").addEventListener("keydown", (e) => { if (e.key === "Enter") loginMerchant(); });
$("saPass").addEventListener("keydown", (e) => { if (e.key === "Enter") loginSuperadmin(); });

/* ---------- دخول التاجر ---------- */
function loginMerchant() {
  const email = $("lgEmail").value.trim();
  const pass = $("lgPass").value;
  if (!email || !pass) { $("lgErr").textContent = "أدخل البريد الإلكتروني وكلمة المرور"; return; }

  let merchants;
  try { merchants = JSON.parse(localStorage.getItem(MKEY)) || []; } catch (_) { merchants = []; }

  const m = merchants.find((x) => x.email === email && x.pass === pass);
  if (!m) { $("lgErr").textContent = "بيانات الدخول غير صحيحة"; return; }

  sessionStorage.setItem("yusir_merchant_session", m.id);
  location.href = "merchant.html";
}

/* ---------- دخول السوبر أدمن ---------- */
function loginSuperadmin() {
  const user = $("saUser").value.trim();
  const pass = $("saPass").value;
  if (!user || !pass) { $("lgErr").textContent = "أدخل اسم المستخدم وكلمة المرور"; return; }

  if (user === SA.user && pass === SA.pass) {
    sessionStorage.setItem("yusir_sa_session", "1");
    location.href = "super-admin.html";
  } else {
    $("lgErr").textContent = "بيانات الدخول غير صحيحة";
  }
}
