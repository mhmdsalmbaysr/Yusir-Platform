export const APP_CONFIG = Object.freeze({
  name: "يُسر",
  version: "2.0.0",
  map: {
    center: [15.5527, 48.5164],
    zoom: 7,
    minZoom: 6,
    maxZoom: 19,
    maxBounds: [[12.0, 42.0], [20.0, 55.0]],
    maxBoundsViscosity: 1,
    tileLayer: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }
  },
  storage: {
    merchantsKey: "yusir_merchants",
    storePrefix: "yusir_store_",
    sessionMerchant: "yusir_merchant_session",
    sessionSA: "yusir_sa_session"
  },
  data: {
    admin1: "data/yem_admin1.geojson",
    admin2: "data/yem_admin2.geojson",
    stores: "data/stores.geojson",
    fieldData: "data/yem_field_data.geojson"
  },
  nominatim: {
    endpoint: "https://nominatim.openstreetmap.org",
    acceptLanguage: "ar",
    countryCodes: "ye",
    debounceMs: 400,
    maxResults: 7
  },
  defaults: {
    productImage: "https://via.placeholder.com/300x200?text=%E2%80%94",
    storeImage: "https://via.placeholder.com/600x300?text=Store",
    deliveryFee: 500,
    rating: 4.5
  },
  auth: {
    superAdmin: { user: "superadmin", pass: "yusir@2024" },
    supabaseUrl: "",
    supabaseAnonKey: ""
  }
});
