import { $, clearElement } from "../../core/helpers/dom.js";

export class ReviewUI {
  constructor(reviewService) {
    this._service = reviewService;
    this._currentStoreId = null;
    this._starInputs = document.querySelectorAll("#starInput i");
    this._submitBtn = document.getElementById("revSubmit");

    this._init();
  }

  _init() {
    this._starInputs.forEach(el => {
      el.addEventListener("click", () => {
        const val = parseInt(el.dataset.v);
        this._starInputs.forEach(s => {
          s.className = parseInt(s.dataset.v) <= val ? "fas fa-star" : "far fa-star";
        });
      });
    });
    if (this._submitBtn) {
      this._submitBtn.addEventListener("click", () => this._submit());
    }
  }

  setStore(storeId) {
    this._currentStoreId = storeId;
    this._render();
  }

  _render() {
    if (!this._currentStoreId) return;
    const reviews = this._service.getForStore(this._currentStoreId);
    const avg = this._service.getAverage(this._currentStoreId);

    const avgEl = $("revAvg");
    const starsEl = $("revStars");
    const countEl = $("revCount");
    const listEl = $("reviewsList");

    if (avgEl) avgEl.textContent = avg.toFixed(1);
    if (starsEl) {
      starsEl.innerHTML = "";
      for (let i = 1; i <= 5; i++) {
        const s = document.createElement("i");
        s.className = (i <= Math.round(avg) ? "fas" : "far") + " fa-star";
        starsEl.appendChild(s);
      }
    }
    if (countEl) countEl.textContent = `(${reviews.length} تقييم)`;

    if (listEl) {
      clearElement(listEl);
      if (reviews.length === 0) {
        listEl.innerHTML = '<p class="muted" style="text-align:center">لا توجد مراجعات بعد — كن أول من يُقيّم!</p>';
      } else {
        reviews.slice().reverse().forEach(r => {
          const div = document.createElement("div");
          div.className = "review-item";
          let stars = "";
          for (let i = 1; i <= 5; i++) stars += `<i class="fa${i <= r.rating ? "s" : "r"} fa-star"></i>`;
          div.innerHTML = `
            <div class="ri-head">
              <strong>${r.customerName}</strong>
              <span>${stars}</span>
            </div>
            ${r.comment ? `<p class="ri-text">${r.comment}</p>` : ""}
            <span class="ri-date">${new Date(r.date).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</span>
          `;
          listEl.appendChild(div);
        });
      }
    }

    $("revName").value = "";
    $("revText").value = "";
    this._starInputs.forEach(s => s.className = "far fa-star");
  }

  _submit() {
    const name = document.getElementById("revName")?.value.trim() || "مجهول";
    const comment = document.getElementById("revText")?.value.trim();
    let rating = 0;
    this._starInputs.forEach(s => {
      if (s.className.includes("fas")) rating = Math.max(rating, parseInt(s.dataset.v));
    });
    if (!rating) return;
    this._service.addReview(this._currentStoreId, rating, comment, name);
    this._render();
  }
}
