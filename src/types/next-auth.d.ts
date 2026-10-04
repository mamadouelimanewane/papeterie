import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    role?: string
    permissions?: string[]
    storeId?: string
  }
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      permissions?: string[]
      storeId?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    permissions?: string[]
    storeId?: string // session marchand uniquement
    loginAt?: number // ms, date de connexion (révocation des sessions)
  }
}
