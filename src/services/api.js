import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8002/api/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer admin-token",
  },
});

export const inventoryService = {
  getProducts: (limit = 10, offset = 0) =>
    api.get(`/products/?limit=${limit}&offset=${offset}`),
  getProductStock: (id) => api.get(`/inventory/${id}`),
  addStock: (data) => api.post("/inventory/add", data),
  removeStock: (data) => api.post("/inventory/remove", data),
  bulkAdd: (updates) => api.post("/inventory/bulk-add", { updates }),
  bulkRemove: (batch) => api.post("/inventory/bulk-remove", { updates: batch }),
  getStats: () => api.get("/inventory/stats"),
  getLowStock: () => api.get("/inventory/low-stock"),
  getMovements: (params) => api.get("/inventory/movements/", { params }),
  addProduct: (data) => api.post("/products/", data),
};

export const reservationService = {
  getReservations: (params) => api.get("/inventory/", { params }),
  getAvailable: (id) => api.get(`/inventory/${id}/available`),
  create: (data) => api.post("/inventory/reserve", data),
  confirm: (id) => api.post(`/inventory/confirm/${id}`),
  release: (id) => api.post(`/inventory/release/${id}`),
};

export default api;
