"use client"

import { useState } from "react"
import { UserRole } from "@prisma/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Loader2 } from "lucide-react"

interface Props {
  userId: string
  currentRole: UserRole
  actorRole?: string
}

const ALL_ROLE_OPTIONS: Array<{ value: "USER" | "REVIEWER" | "ADMIN" | "SUPERADMIN"; label: string }> = [
  { value: "USER", label: "Usuario" },
  { value: "REVIEWER", label: "Revisor" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPERADMIN", label: "SuperAdmin" },
]

export function UserRoleToggle({ userId, currentRole, actorRole }: Props) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const isSuperAdmin = actorRole === "SUPERADMIN"
  const roleOptions = isSuperAdmin
    ? ALL_ROLE_OPTIONS
    : ALL_ROLE_OPTIONS.filter((o) => o.value !== "ADMIN" && o.value !== "SUPERADMIN")

  if (!isSuperAdmin && (role === "ADMIN" || role === "SUPERADMIN")) return null

  async function changeRole(newRole: "USER" | "REVIEWER" | "ADMIN" | "SUPERADMIN") {
    if (newRole === role) return
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) {
      const data = await res.json()
      setRole(data.role)
    }
    setLoading(false)
  }

  const current = ALL_ROLE_OPTIONS.find((o) => o.value === role)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          {current?.label ?? role}
          <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {roleOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => changeRole(option.value)}
            className={role === option.value ? "font-semibold" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
