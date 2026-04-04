import { create } from "zustand"

interface Driver {
  id: string
  name: string
  phone: string
  email?: string
  vehicleType?: string
  rating?: number
  totalOrders?: number
  walletBalance?: number
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

import { ordersAPI } from "../services/api"

export const useDriverStore = create<DriverStore>((set, get) => ({
  driver: null,
  token: null,
  isAuthenticated: false,
  isOnline: false,
  setDriver: (driver, token) => set({ driver, token, isAuthenticated: true }),
  logout: () => set({ driver: null, token: null, isAuthenticated: false, isOnline: false }),
  toggleOnline: () => set({ isOnline: !get().isOnline }),

  currentOrder: null,
  pendingOrders: [
    {
      id: "ORD-3253",
      storeAddress: "Marché Keur Massar, Dakar",
      deliveryAddress: "Cité Fadia, Appartement B4, Dakar",
      customerName: "Fatou Diallo",
      customerPhone: "+221 77 123 45 67",
      total: 12500,
      items: 3,
      distance: "2.4 km",
      earnings: 800,
      status: "pending",
    },
    {
      id: "ORD-3254",
      storeAddress: "Marché Rufisque",
      deliveryAddress: "HLM Grand Yoff, Dakar",
      customerName: "Oumar Ba",
      customerPhone: "+221 78 987 65 43",
      total: 8750,
      items: 2,
      distance: "4.1 km",
      earnings: 1000,
      status: "pending",
    },
  ],
  setCurrentOrder: (order) => set({ currentOrder: order }),
  acceptOrder: (order) => set({
    currentOrder: { ...order, status: "accepted" },
    pendingOrders: get().pendingOrders.filter((o) => o.id !== order.id),
  }),
  completeDelivery: () => {
    const { currentOrder, todayEarnings, todayOrders } = get()
    if (!currentOrder) return
    set({
      currentOrder: null,
      todayEarnings: todayEarnings + currentOrder.earnings,
      todayOrders: todayOrders + 1,
    })
  },

  todayEarnings: 3200,
  todayOrders: 4,
  addEarning: (amount) => set({ todayEarnings: get().todayEarnings + amount }),

  fetchOrders: async () => {
    try {
      const res = await ordersAPI.getAvailable()
      if (res.data && Array.isArray(res.data)) {
        set({ pendingOrders: res.data })
      }
    } catch (e) {
      console.log("Error fetching orders", e)
    }
  }
}))
