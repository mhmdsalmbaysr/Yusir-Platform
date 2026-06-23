export const EVENTS = Object.freeze({
  STORE_SELECTED: "store:selected",
  STORE_DESELECTED: "store:deselected",
  STORES_LOADED: "stores:loaded",
  CART_UPDATED: "cart:updated",
  CART_CLEARED: "cart:cleared",
  CHECKOUT_SUBMITTED: "checkout:submitted",
  REVIEW_SUBMITTED: "review:submitted",
  SEARCH_RESULTS: "search:results",
  SEARCH_CLEARED: "search:cleared",
  MAP_CLICKED: "map:clicked",
  MARKER_CLICKED: "marker:clicked",
  FILTER_CHANGED: "filter:changed",
  TOAST_SHOW: "toast:show",
  MODAL_OPEN: "modal:open",
  MODAL_CLOSE: "modal:close",
  PRODUCT_SELECTED: "product:selected"
});

export const FIELD_TYPES = Object.freeze({
  HOOD: "حي",
  LANE: "حارة"
});

export const SESSION_TYPES = Object.freeze({
  MERCHANT: "merchant",
  SUPER_ADMIN: "superadmin"
});

export const ZOOM_THRESHOLDS = Object.freeze({
  DISTRICTS: 9,
  FIELD_DATA: 11
});
