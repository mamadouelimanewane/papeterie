import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  storeId: string
  storeName: string
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  walletBalance?: number
}

interface AppStore {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setUser: (user: User, token: string) => void
  logout: () => void

  // Cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  cartTotal: () => number
  cartCount: () => number

  // Favorites
  favorites: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean

  // Language
  language: "fr" | "wo"
  setLanguage: (lang: "fr" | "wo") => void

  // Notifications
  unreadCount: number
  setUnreadCount: (n: number) => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, cart: [], favorites: [] }),

      // Cart
      cart: [],
      addToCart: (item) => {
        const { cart } = get()
        const existing = cart.find((c) => c.id === item.id)
        if (existing) {
          set({ cart: cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c) })
        } else {
          // Si boutique différente, on vide le panier (choix business classique)
          const differentStore = cart.length > 0 && cart[0].storeId !== item.storeId
          set({ cart: differentStore ? [item] : [...cart, item] })
        }
      },
      removeFromCart: (id) => set({ cart: get().cart.filter((c) => c.id !== id) }),
      updateQuantity: (id, qty) => {
        if (qty <= 0) {
          get().removeFromCart(id)
          return
        }
        set({ cart: get().cart.map((c) => c.id === id ? { ...c, quantity: qty } : c) })
      },
      clearCart: () => set({ cart: [] }),
      cartTotal: () => get().cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
      cartCount: () => get().cart.reduce((sum, c) => sum + c.quantity, 0),

      // Favorites
      favorites: [],
      toggleFavorite: (id) => {
        const { favorites } = get()
        const index = favorites.indexOf(id)
        if (index > -1) {
          set({ favorites: favorites.filter((fid) => fid !== id) })
        } else {
          set({ favorites: [...favorites, id] })
        }
      },
      isFavorite: (id) => get().favorites.includes(id),

      // Language
      language: "fr",
      setLanguage: (language) => set({ language }),

      // Notifications
      unreadCount: 3,
      setUnreadCount: (n) => set({ unreadCount: n }),
    }),
    {
      name: "papeterie-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
