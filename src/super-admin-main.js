import { auth } from "./modules/users/AuthService.js";
import { Toast } from "./shared/ui/Toast.js";
import { $, clearElement } from "./core/helpers/dom.js";
import { fmt } from "./core/helpers/format.js";

const PLANS = {
  basic: { name: "أساسي", price: 5000 },
  pro: { name: "احترافي", price: 12000 },
  premium: { name: "متقدم", price: 25000 }
};

const statusLabel = { active: "فعّال", expired: "منتهٍ", suspended: "معلّق" };

class SuperAdminApp {
  constructor() {
    this._toast = new Toast();
  }

  init() {
    const session = auth.checkSession();
    if (!session || session.role !== "superadmin") {
      location.replace("login.html?redirect=superadmin");
      return;
    }
    this._initPlanSelect();
    this._initEvents();
    this._render();
  }

  _initPlanSelect() {
    const sel = $("mPlan");
    sel.innerHTML = Object.entries(PLANS)
      .map(([k, v]) => `<option value="${k}">${v.name} — ${fmt(v.price)} ريال/شهر</option>`)
      .join("");
  }

  _initEvents() {
    $("logout").addEventListener("click", () => { auth.logout(); location.reload(); });
    $("addM").addEventListener("click", () => this._addMerchant());
  }

  _statusOf(m) {
    if (m.suspended) return "suspended";
    return new Date(m.expiry) >= new Date() ? "active" : "expired";
  }

  _addMerchant() {
    const store = $("mStore").value.trim();
    const owner = $("mOwner").value.trim();
    const email = $("mEmail").value.trim();
    const pass = $("mPass").value.trim();
    const plan = $("mPlan").value;
    const months = parseInt($("mMonths").value) || 1;
    if (!store || !owner || !email || !pass) {
      this._toast.show("⚠️ أكمل كل الحقول");
      return;
    }
    const list = auth.getMerchants();
    if (list.some(m => m.email === email)) {
      this._toast.show("⚠️ البريد مستخدم مسبقاً");
      return;
    }
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + months);
    list.push({
      id: "M-" + Date.now(),
      store, owner, email, pass, plan,
      store_id: "ST-" + String(Date.now()).slice(-6),
      suspended: false,
      created: new Date().toISOString(),
      expiry: expiry.toISOString()
    });
    auth.saveMerchants(list);
    ["mStore", "mOwner", "mEmail", "mPass"].forEach(id => $(id).value = "");
    $("mMonths").value = 1;
    this._render();
    this._toast.show("✅ أُنشئ اشتراك المتجر");
  }

  _renew(m, list) {
    const d = new Date(m.expiry);
    d.setMonth(d.getMonth() + 1);
    m.expiry = d.toISOString();
    this._persist(list);
    this._toast.show("✅ تمديد شهر");
  }

  _toggle(m, list) {
    m.suspended = !m.suspended;
    this._persist(list);
    this._toast.show(m.suspended ? "⏸️ عُلّق المتجر" : "▶️ فُعّل المتجر");
  }

  _delete(m, list) {
    if (!confirm("حذف هذا الاشتراك نهائياً؟")) return;
    auth.saveMerchants(list.filter(x => x.id !== m.id));
    this._render();
    this._toast.show("🗑️ حُذف");
  }

  _persist(list) {
    auth.saveMerchants(list);
    this._render();
  }

  _render() {
    const list = auth.getMerchants();
    const body = $("mBody");
    clearElement(body);

    let active = 0, expired = 0, revenue = 0;

    list.forEach(m => {
      const st = this._statusOf(m);
      if (st === "active") { active++; revenue += PLANS[m.plan] ? PLANS[m.plan].price : 0; }
      else expired++;

      const tr = document.createElement("tr");
      const esc = (s) => String(s).replace(/[&<>"']/g,
        c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));

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

      tr.querySelector('[data-act="renew"]').onclick = () => this._renew(m, list);
      tr.querySelector('[data-act="toggle"]').onclick = () => this._toggle(m, list);
      tr.querySelector('[data-act="del"]').onclick = () => this._delete(m, list);

      body.appendChild(tr);
    });

    $("stTotal").textContent = list.length;
    $("stActive").textContent = active;
    $("stExpired").textContent = expired;
    $("stRevenue").textContent = fmt(revenue);
    $("emptyM").style.display = list.length ? "none" : "block";
  }
}

const app = new SuperAdminApp();
document.addEventListener("DOMContentLoaded", () => app.init());
