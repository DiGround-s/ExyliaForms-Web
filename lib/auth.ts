import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { cache } from "react"
import { prisma } from "./prisma"
import { authConfig } from "@/auth.config"
import type { UserRole } from "@prisma/client"

const ROLE_TTL = 60_000

const fetchUserRole = cache(async (userId: string): Promise<UserRole | null> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return user?.role ?? null
})

function getSuperAdminIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = ((user as { role?: string }).role ?? "USER") as UserRole
        token.roleCheckedAt = Date.now()
      }
      if (account?.provider === "discord" && profile) {
        token.discordId = (profile as { id: string }).id
      }
      if (!token.id && token.sub) {
        token.id = token.sub
      }
      const stale = !user && token.id &&
        (!token.roleCheckedAt || Date.now() - token.roleCheckedAt > ROLE_TTL)
      if (stale) {
        const role = await fetchUserRole(token.id as string)
        if (role) token.role = role
        token.roleCheckedAt = Date.now()
      }
      if (token.discordId) {
        const superAdminIds = getSuperAdminIds()
        if (superAdminIds.includes(token.discordId as string)) {
          token.role = "SUPERADMIN"
        }
      }
      return token
    },
    session({ session, token }) {
      session.user.id = (token.id as string) || (token.sub as string)
      session.user.role = token.role as UserRole
      session.user.discordId = token.discordId as string
      return session
    },
  },
  providers: [
    Discord({
      authorization: {
        params: {
          scope: "identify guilds.join applications.commands",
          integration_type: 1,
        },
      },
      profile(profile) {
        const superAdminIds = getSuperAdminIds()
        const role: UserRole = superAdminIds.includes(profile.id) ? "SUPERADMIN" : "USER"
        return {
          id: profile.id,
          discordId: profile.id,
          name: profile.global_name ?? profile.username,
          username: profile.username,
          globalName: profile.global_name ?? null,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
          role,
        }
      },
    }),
  ],
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord" && profile && user.id) {
        const discordId = (profile as { id: string }).id
        const superAdminIds = getSuperAdminIds()
        const isSuperAdmin = superAdminIds.includes(discordId)

        await prisma.user.update({
          where: { id: user.id },
          data: {
            discordId,
            username: (profile as { username: string }).username,
            globalName: (profile as { global_name?: string }).global_name ?? null,
            ...(isSuperAdmin ? { role: "SUPERADMIN" } : {}),
            lastLoginAt: new Date(),
          },
        })
      }
    },
  },
})
