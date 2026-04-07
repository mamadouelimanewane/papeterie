import axios from "axios"
import * as SecureStore from "expo-secure-store"

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://papeterie.vercel.app/api"

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

// Inject auth token automatically
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("user_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      return Promise.reject(new Error("Délai de connexion dépassé. Vérifiez votre connexion internet."))
    }
    if (!err.response) {
      return Promise.reject(new Error("Impossible de joindre le serveur. Vérifiez votre connexion internet."))
    }
    const msg = err.response?.data?.error || err.response?.data?.message || "Erreur serveur, veuillez réessayer."
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
