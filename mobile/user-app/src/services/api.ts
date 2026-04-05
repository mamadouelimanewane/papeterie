import axios from "axios"

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://papeterie-h2rj9fu6w-mamadou-dias-projects-979b1f4f.vercel.app/api"

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
})

// Inject auth token automatically
api.interceptors.request.use(async (config) => {
  try {
    const SecureStore = await import("expo-secure-store")
    const token = await SecureStore.getItemAsync("user_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || "Erreur réseau"
    return Promise.reject(new Error(msg))
  }
)

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials: { email?: string, phone?: string, password: string }) =>
    api.post("/user/login", credentials),
  register: (data: any) => api.post("/user/register", data),
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data: any) => api.put("/user/profile", data),
}

// ── Stores ────────────────────────────────────────────────────────
export const storesAPI = {
  getAll: (params?: any) => api.get("/stores", { params }),
  getById: (id: string) => api.get(`/stores/${id}`),
  getProducts: (id: string) => api.get(`/stores/${id}/products`),
}

// ── Categories ───────────────────────────────────────────────────
export const categoriesAPI = {
  getAll: () => api.get("/categories"),
}

// ── Orders ────────────────────────────────────────────────────────
export const ordersAPI = {
  create: (data: any) => api.post("/orders", data),
  getAll: () => api.get("/orders/my"),
  getById: (id: string) => api.get(`/orders/${id}`),
  track: (id: string) => api.get(`/orders/${id}/track`),
}

// ── Wallet ────────────────────────────────────────────────────────
export const walletAPI = {
  getBalance: () => api.get("/wallet/balance"),
  getTransactions: () => api.get("/wallet/transactions"),
  recharge: (amount: number) => api.post("/wallet/recharge", { amount }),
}

// ── Notifications ─────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
}

// ── Slider ────────────────────────────────────────────────────────
export const sliderAPI = {
  getBanners: () => api.get("/slider"),
}
