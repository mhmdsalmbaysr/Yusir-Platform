import { auth } from "./modules/users/AuthService.js";
import { Toast } from "./shared/ui/Toast.js";
import { $ } from "./core/helpers/dom.js";

class LoginApp {
  constructor() {
    this._toast = new Toast();
    this._currentRole = "merchant";
  }

  init() {
    if (auth.checkSession()) {
      const user = auth.getCurrentUser();
      if (user.role === "superadmin") location.replace("super-admin.html");
      else location.replace("merchant.html");
      return;
    }

    this._initTabs();
    this._checkRedirect();
    this._initEvents();
  }

  _initTabs() {
    document.querySelectorAll(".role-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".role-tab").forEach(t => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        this._currentRole = tab.dataset.role;
        $("formMerchant").classList.toggle("hidden", this._currentRole !== "merchant");
        $("formSuperadmin").classList.toggle("hidden", this._currentRole !== "superadmin");
        $("lgErr").textContent = "";
      });
    });
  }

  _checkRedirect() {
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get("redirect");
    if (redirectTo === "superadmin") {
      document.querySelector('[data-role="superadmin"]').click();
    } else if (redirectTo === "merchant") {
      document.querySelector('[data-role="merchant"]').click();
    }
  }

  _initEvents() {
    $("lgBtnMerchant").addEventListener("click", () => this._loginMerchant());
    $("lgBtnSuperadmin").addEventListener("click", () => this._loginSuperadmin());
    $("lgPass").addEventListener("keydown", (e) => { if (e.key === "Enter") this._loginMerchant(); });
    $("saPass").addEventListener("keydown", (e) => { if (e.key === "Enter") this._loginSuperadmin(); });
  }

  _loginMerchant() {
    const email = $("lgEmail").value.trim();
    const pass = $("lgPass").value;
    if (!email || !pass) { $("lgErr").textContent = "أدخل البريد الإلكتروني وكلمة المرور"; return; }
    if (auth.loginMerchant(email, pass)) {
      location.href = "merchant.html";
    } else {
      $("lgErr").textContent = "بيانات الدخول غير صحيحة";
    }
  }

  _loginSuperadmin() {
    const user = $("saUser").value.trim();
    const pass = $("saPass").value;
    if (!user || !pass) { $("lgErr").textContent = "أدخل اسم المستخدم وكلمة المرور"; return; }
    if (auth.loginSuperAdmin(user, pass)) {
      location.href = "super-admin.html";
    } else {
      $("lgErr").textContent = "بيانات الدخول غير صحيحة";
    }
  }
}

const login = new LoginApp();
document.addEventListener("DOMContentLoaded", () => login.init());
