import { EVENTS } from "../../core/constants/app.js";
import { eventBus } from "../../core/services/EventBus.js";
import { api } from "../../core/services/ApiService.js";

export class ReviewService {
  constructor() {
    this._reviews = [];
    this._load();
  }

  _load() {
    this._loadFromApi();
    try {
      const raw = localStorage.getItem("yusir_reviews");
      if (raw) this._reviews = JSON.parse(raw);
    } catch { this._reviews = []; }
  }

  async _loadFromApi() {
    try {
      this._apiReviews = await api.getReviews();
    } catch { this._apiReviews = []; }
  }

  getForStore(storeId) {
    const local = this._reviews.filter(r => r.storeId === storeId);
    const fromApi = (this._apiReviews || [])
      .filter(r => String(r.store) === storeId)
      .map(r => ({
        id: r.id,
        storeId: String(r.store),
        rating: r.rating,
        comment: r.comment,
        customerName: r.customer_name,
        date: r.created_at,
      }));
    return [...fromApi, ...local];
  }

  async addReview(storeId, rating, comment, customerName) {
    const review = {
      store: storeId,
      rating: Math.min(5, Math.max(1, rating)),
      comment: comment.trim(),
      customer_name: customerName.trim() || "مجهول",
    };
    try {
      await api.createReview(review);
    } catch { /* fallback to local */ }
    eventBus.emit(EVENTS.REVIEW_SUBMITTED, { ...review, storeId });
  }

  getAverage(storeId) {
    const reviews = this.getForStore(storeId);
    if (reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }
}
