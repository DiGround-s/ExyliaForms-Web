import { UserRole } from "@prisma/client"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      discordId: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    role?: UserRole
    discordId?: string
    username?: string
    globalName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    discordId?: string
    roleCheckedAt?: number
  }
}
