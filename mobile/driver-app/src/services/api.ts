import axios from "axios"

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://ndugumi.vercel.app/api"

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
})

// Inject driver auth token automatically
api.interceptors.request.use(async (config) => {
  try {
    const SecureStore = await import("expo-secure-store")
    const token = await SecureStore.getItemAsync("driver_token")
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
  login: (email: string, password: string) =>
    api.post("/driver/login", { email, password }),
  getProfile: () => api.get("/driver/profile"),
  updateProfile: (data: any) => api.put("/driver/profile", data),
  updateLocation: (lat: number, lng: number) =>
    api.put("/driver/location", { lat, lng }),
  setOnlineStatus: (online: boolean) =>
    api.put("/driver/status", { online }),
}

// ── Orders ────────────────────────────────────────────────────────
export const ordersAPI = {
  getAvailable: () => api.get("/driver/orders/available"),
  getActive: () => api.get("/driver/orders/active"),
  getHistory: () => api.get("/driver/orders/history"),
  accept: (id: string) => api.post(`/driver/orders/${id}/accept`),
  reject: (id: string) => api.post(`/driver/orders/${id}/reject`),
  updateStatus: (id: string, status: string) =>
    api.put(`/driver/orders/${id}/status`, { status }),
}

// ── Earnings ──────────────────────────────────────────────────────
export const earningsAPI = {
  getSummary: () => api.get("/driver/earnings"),
  getHistory: () => api.get("/driver/earnings/history"),
}

// ── Notifications ─────────────────────────────────────────────────
export const notificationsAPI = {
  getAll: () => api.get("/driver/notifications"),
  markRead: (id: string) => api.put(`/driver/notifications/${id}/read`),
}
