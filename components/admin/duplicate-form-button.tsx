"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DuplicateFormButton({ formId }: { formId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)
    const res = await fetch(`/api/admin/forms/${formId}/duplicate`, { method: "POST" })
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/admin/forms/${id}/edit`)
    }
    setLoading(false)
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDuplicate} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
