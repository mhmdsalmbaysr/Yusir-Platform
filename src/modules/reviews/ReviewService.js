import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { generateId } from "../../core/helpers/format.js";

export class ReviewService {
  constructor() {
    this._reviews = [];
    this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem("yusir_reviews");
      if (raw) this._reviews = JSON.parse(raw);
    } catch { this._reviews = []; }
  }

  _save() {
    try { localStorage.setItem("yusir_reviews", JSON.stringify(this._reviews)); } catch { /* noop */ }
  }

  getForStore(storeId) {
    return this._reviews.filter(r => r.storeId === storeId);
  }

  addReview(storeId, rating, comment, customerName) {
    const review = {
      id: generateId("REV"),
      storeId,
      rating: Math.min(5, Math.max(1, rating)),
      comment: comment.trim(),
      customerName: customerName.trim() || "مجهول",
      date: new Date().toISOString()
    };
    this._reviews.push(review);
    this._save();
    eventBus.emit(EVENTS.REVIEW_SUBMITTED, review);
    return review;
  }

  getAverage(storeId) {
    const reviews = this.getForStore(storeId);
    if (reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }
}
