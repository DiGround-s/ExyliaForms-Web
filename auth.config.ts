import type { NextAuthConfig } from "next-auth"
import Discord from "next-auth/providers/discord"

function getSuperAdminIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
}

export const authConfig: NextAuthConfig = {
  providers: [Discord],
  pages: { signIn: "/" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.role = ((user as { role?: string }).role ?? "USER") as "USER" | "REVIEWER" | "ADMIN" | "SUPERADMIN"
      }
      if (account?.provider === "discord" && profile) {
        token.discordId = (profile as { id: string }).id
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
      session.user.id = token.id as string
      session.user.role = token.role as "USER" | "REVIEWER" | "ADMIN" | "SUPERADMIN"
      session.user.discordId = token.discordId as string
      return session
    },
  },
}
