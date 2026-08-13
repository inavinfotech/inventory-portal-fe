import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses by redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      // The basename is /inventory, so the login page is at /inventory/login
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/inventory/login";
      }
    }
    return Promise.reject(error);
  },
);

export const inventoryService = {
  getProducts: (limit = 10, offset = 0, search = "") => {
    const params = { limit, offset };
    if (search && search.trim()) {
      params.search = search.trim();
    }
    return api.get("/products/", { params });
  },
  getProduct: (id) => api.get(`/products/${id}`),
  getProductById: (id) => api.get(`/products/${id}`),
  getProductStock: (id) => api.get(`/inventory/${id}`),
  addStock: (data) => api.post("/inventory/add", data),
  removeStock: (data) => api.post("/inventory/remove", data),
  bulkAdd: (updates) => api.post("/inventory/bulk-add", { updates }),
  bulkRemove: (batch) => api.post("/inventory/bulk-remove", { updates: batch }),
  getStats: () => api.get("/inventory/stats"),
  getLowStock: () => api.get("/inventory/low-stock"),
  getMovements: (params) => api.get("/inventory/movements/", { params }),
  addProduct: (data) => api.post("/products/", data),
  createProduct: (data) => api.post("/products/", data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  updateStock: (id, amount, variantId = null) =>
    api.post(`/inventory/adjust`, {
      product_id: id,
      new_quantity: amount,
      variant_id: variantId,
    }),
  addMovement: (data) => api.post("/movements/", data),
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post("/products/upload-images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const reservationService = {
  getReservations: (params) => api.get("/inventory/", { params }),
  getAvailable: (id) => api.get(`/inventory/${id}/available`),
  create: (data) => api.post("/inventory/reserve", data),
  confirm: (id) => api.post(`/inventory/confirm/${id}`),
  release: (id) => api.post(`/inventory/release/${id}`),
};

export default api;
