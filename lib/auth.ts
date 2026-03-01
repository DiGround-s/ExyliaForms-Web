import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { authConfig } from "@/auth.config"
import type { UserRole } from "@prisma/client"

function getSuperAdminIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      authorization: {
        params: {
          scope: "identify email applications.commands",
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
