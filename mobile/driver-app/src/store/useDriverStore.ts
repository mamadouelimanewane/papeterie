import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { ordersAPI } from "../services/api"

interface Driver {
  id: string
  name: string
  phone?: string
  email?: string
  vehicleType?: string
  rating?: number
  totalOrders?: number
  walletBalance?: number
  approvalStatus?: string
  status?: string
}

interface Order {
  id: string
  storeAddress: string
  deliveryAddress: string
  customerName: string
  customerPhone: string
  total: number
  items: number
  distance: string
  earnings: number
  status: "pending" | "accepted" | "pickedup" | "delivered"
}

interface DriverStore {
  driver: Driver | null
  token: string | null
  isAuthenticated: boolean
  isOnline: boolean
  setDriver: (driver: Driver, token: string) => void
  logout: () => void
  toggleOnline: () => void
  currentOrder: Order | null
  pendingOrders: Order[]
  setCurrentOrder: (order: Order | null) => void
  acceptOrder: (order: Order) => void
  completeDelivery: () => void
  todayEarnings: number
  todayOrders: number
  addEarning: (amount: number) => void
  fetchOrders: () => Promise<void>
}

export const useDriverStore = create<DriverStore>()(
  persist(
    (set, get) => ({
      driver: null,
      token: null,
      isAuthenticated: false,
      isOnline: false,
      setDriver: (driver, token) => set({ driver, token, isAuthenticated: true }),
      logout: () => set({ driver: null, token: null, isAuthenticated: false, isOnline: false, currentOrder: null, pendingOrders: [], todayEarnings: 0, todayOrders: 0 }),
      toggleOnline: () => set({ isOnline: !get().isOnline }),
      currentOrder: null,
      pendingOrders: [],
      setCurrentOrder: (order) => set({ currentOrder: order }),
      acceptOrder: (order) => set({
        currentOrder: { ...order, status: "accepted" },
        pendingOrders: get().pendingOrders.filter((o) => o.id !== order.id),
      }),
      completeDelivery: () => {
        const { currentOrder, todayEarnings, todayOrders } = get()
        if (!currentOrder) return
        set({ currentOrder: null, todayEarnings: todayEarnings + currentOrder.earnings, todayOrders: todayOrders + 1 })
      },
      todayEarnings: 0,
      todayOrders: 0,
      addEarning: (amount) => set({ todayEarnings: get().todayEarnings + amount }),
      fetchOrders: async () => {
        try {
          const res = await ordersAPI.getAvailable()
          if (res.data && Array.isArray(res.data)) {
            set({ pendingOrders: res.data })
          }
        } catch (e) {
          console.log("fetchOrders error", e)
        }
      },
    }),
    {
      name: "driver-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ driver: state.driver, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
