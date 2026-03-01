import type { NextAuthConfig } from "next-auth"
import Discord from "next-auth/providers/discord"

function getAdminIds(): string[] {
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
        token.role = ((user as { role?: string }).role ?? "USER") as "USER" | "ADMIN"
      }
      if (account?.provider === "discord" && profile) {
        const discordId = (profile as { id: string }).id
        const adminIds = getAdminIds()
        token.role = (adminIds.includes(discordId) ? "ADMIN" : "USER") as "USER" | "ADMIN"
        token.discordId = discordId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as "USER" | "ADMIN"
      session.user.discordId = token.discordId as string
      return session
    },
  },
}
