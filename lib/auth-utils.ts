import type { UserRole } from "@prisma/client"

export function hasReviewerAccess(role: UserRole | string | undefined): boolean {
  return role === "REVIEWER" || role === "ADMIN" || role === "SUPERADMIN"
}

export function hasAdminAccess(role: UserRole | string | undefined): boolean {
  return role === "ADMIN" || role === "SUPERADMIN"
}

export function isSuperAdmin(role: UserRole | string | undefined): boolean {
  return role === "SUPERADMIN"
}
