export class Toast {
  constructor() {
    this._el = document.getElementById("toast");
    this._timer = null;
  }

  show(text, duration = 2200) {
    if (!this._el) return;
    this._el.textContent = text;
    this._el.classList.add("show");
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this._el.classList.remove("show"), duration);
  }
}
