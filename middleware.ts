import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (!session) {
    if (pathname.startsWith("/app") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith("/admin")) {
    const role = session.user.role
    if (role !== "REVIEWER" && role !== "ADMIN" && role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/app/forms", req.url))
    }
    if (role === "REVIEWER") {
      const isFormsIndex = pathname === "/admin/forms"
      const isSubmissionsPage = /^\/admin\/forms\/[^/]+\/submissions/.test(pathname)
      if (!isFormsIndex && !isSubmissionsPage) {
        return NextResponse.redirect(new URL("/admin/forms", req.url))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/api/admin/:path*"],
}
