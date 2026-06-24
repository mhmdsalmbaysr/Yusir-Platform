export const APP_CONFIG = Object.freeze({
  name: "يُسر",
  version: "2.0.0",
  apiBaseUrl: "/api/v1",
  map: {
    center: [15.5527, 48.5164],
    zoom: 7,
    minZoom: 6,
    maxZoom: 19,
    maxBounds: [[12.0, 42.0], [20.0, 55.0]],
    maxBoundsViscosity: 1,
    tileLayers: {
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: 'Tiles &copy; Esri'
      },
      osm: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }
    }
  },
  storage: {
    merchantsKey: "yusir_merchants",
    storePrefix: "yusir_store_",
    sessionMerchant: "yusir_merchant_session",
    sessionSA: "yusir_sa_session",
    cartKey: "yusir_cart",
    reviewsKey: "yusir_reviews",
    ordersKey: "yusir_orders",
  },
  data: {
    admin1: "/static/data/yem_admin1.geojson",
    admin2: "/static/data/yem_admin2.geojson",
    stores: "/static/data/stores.geojson",
    fieldData: "/static/data/yem_field_data.geojson"
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
