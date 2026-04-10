import axios from "axios"
import * as SecureStore from "expo-secure-store"

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://papeterie.vercel.app/api"

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
})

// Inject driver auth token automatically
api.interceptors.request.use(async (config: any) => {
  try {
    const token = await SecureStore.getItemAsync("driver_token")
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

api.interceptors.response.use(
  (res: any) => res,
  (err: any) => {
    if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
      return Promise.reject(new Error("DÃ©lai de connexion dÃ©passÃ©. VÃ©rifiez votre connexion internet."))
    }
    if (!err.response) {
      return Promise.reject(new Error("Impossible de joindre le serveur. VÃ©rifiez votre connexion internet."))
    }
    const msg = err.response?.data?.error || err.response?.data?.message || "Erreur serveur, veuillez rÃ©essayer."
    return Promise.reject(new Error(msg))
  }
)


// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const authAPI = {
  login: (data: { email?: string; phone?: string; password?: string }) =>
    api.post("/driver/login", data),
  register: (data: { name: string; email?: string; phone?: string; password: string; vehicleType?: string; serviceArea?: string }) =>
    api.post("/driver/register", data),
  getProfile: () => api.get("/driver/profile"),
  updateProfile: (data: any) => api.put("/driver/profile", data),
  updateLocation: (lat: number, lng: number) =>
    api.put("/driver/location", { lat, lng }),
  setOnlineStatus: (online: boolean) =>
    api.put("/driver/status", { online }),
}

// â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ordersAPI = {
  getAvailable: () => api.get("/driver/orders/available"),
  getActive: () => api.get("/driver/orders/active"),
  getHistory: () => api.get("/driver/orders/history"),
  accept: (id: string) => api.post(`/driver/orders/${id}/accept`),
  reject: (id: string) => api.post(`/driver/orders/${id}/reject`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}`, { status }),
}

// â”€â”€ Earnings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const earningsAPI = {
  getSummary: () => api.get("/driver/earnings"),
  getHistory: () => api.get("/driver/earnings/history"),
}

// â”€â”€ Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const notificationsAPI = {
  getAll: () => api.get("/driver/notifications"),
  markRead: (id: string) => api.put(`/driver/notifications/${id}/read`),
}

