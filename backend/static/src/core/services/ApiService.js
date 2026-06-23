const API_BASE = '/api/v1';

function getToken() {
  return sessionStorage.getItem('yusir_api_token');
}

function setToken(token) {
  if (token) {
    sessionStorage.setItem('yusir_api_token', token);
  } else {
    sessionStorage.removeItem('yusir_api_token');
  }
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // --- Auth ---
  async login(username, password) {
    const data = await request('POST', '/auth/login/', { username, password });
    setToken(data.access);
    return data;
  },

  async refreshToken(refresh) {
    const data = await request('POST', '/auth/token/refresh/', { refresh });
    setToken(data.access);
    return data;
  },

  async me() {
    return request('GET', '/auth/me/');
  },

  logout() {
    setToken(null);
  },

  // --- Merchants ---
  async getMerchants() {
    return request('GET', '/auth/merchants/');
  },

  async createMerchant(data) {
    return request('POST', '/auth/merchants/', data);
  },

  async updateMerchant(storeId, data) {
    return request('PUT', `/auth/merchants/${storeId}/`, data);
  },

  async deleteMerchant(storeId) {
    return request('DELETE', `/auth/merchants/${storeId}/`);
  },

  // --- Governorates ---
  async getGovernorates(search = '') {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request('GET', `/governorates/${qs}`);
  },

  async getGovernorate(pcode) {
    return request('GET', `/governorates/${pcode}/`);
  },

  async getDistricts(governorate = '', search = '') {
    const params = new URLSearchParams();
    if (governorate) params.set('governorate', governorate);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params}` : '';
    return request('GET', `/districts/${qs}`);
  },

  // --- Stores ---
  async getStores(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    });
    const qs = params.toString() ? `?${params}` : '';
    return request('GET', `/stores/${qs}`);
  },

  async getStore(storeId) {
    return request('GET', `/stores/${storeId}/`);
  },

  async createStore(data) {
    return request('POST', '/stores/', data);
  },

  async updateStore(storeId, data) {
    return request('PUT', `/stores/${storeId}/`, data);
  },

  async deleteStore(storeId) {
    return request('DELETE', `/stores/${storeId}/`);
  },

  async getStoreProducts(storeId) {
    return request('GET', `/stores/${storeId}/products/`);
  },

  async createProduct(storeId, data) {
    return request('POST', `/stores/${storeId}/products/`, data);
  },

  async updateProduct(productId, data) {
    return request('PUT', `/products/${productId}/`, data);
  },

  async deleteProduct(productId) {
    return request('DELETE', `/products/${productId}/`);
  },

  // --- Reviews ---
  async getReviews(storeId = '') {
    const qs = storeId ? `?store=${storeId}` : '';
    return request('GET', `/reviews/${qs}`);
  },

  async createReview(data) {
    return request('POST', '/reviews/', data);
  },

  // --- Orders ---
  async getOrders(storeId = '', status = '') {
    const params = new URLSearchParams();
    if (storeId) params.set('store', storeId);
    if (status) params.set('status', status);
    const qs = params.toString() ? `?${params}` : '';
    return request('GET', `/orders/${qs}`);
  },

  async createOrder(data) {
    return request('POST', '/orders/', data);
  },

  async updateOrderStatus(orderId, status) {
    return request('PATCH', `/orders/${orderId}/`, { status });
  },

  // --- Field Data ---
  async getFieldData(district = '', type = '') {
    const params = new URLSearchParams();
    if (district) params.set('district', district);
    if (type) params.set('type', type);
    const qs = params.toString() ? `?${params}` : '';
    return request('GET', `/field-data/${qs}`);
  },

  async createFieldData(data) {
    return request('POST', '/field-data/', data);
  },

  async deleteFieldData(id) {
    return request('DELETE', `/field-data/${id}/`);
  },
};

export { setToken };
