"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserRole } from "@prisma/client"

interface Props {
  userId: string
  currentRole: UserRole
}

export function UserRoleToggle({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  if (role === "SUPERADMIN") return null

  async function toggle() {
    setLoading(true)
    const newRole = role === "ADMIN" ? "USER" : "ADMIN"
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

  return (
    <Button
      variant={role === "ADMIN" ? "destructive" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
    >
      {role === "ADMIN" ? "Quitar Admin" : "Hacer Admin"}
    </Button>
  )
}
