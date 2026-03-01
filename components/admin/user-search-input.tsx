"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function UserSearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = e.target.value
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (q) params.set("q", q)
      else params.delete("q")
      startTransition(() => router.replace(`?${params.toString()}`))
    }, 300)
  }

  return (
    <div className="relative w-64">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        defaultValue={searchParams.get("q") ?? ""}
        onChange={handleChange}
        placeholder="Buscar usuario..."
        className="pl-9"
      />
    </div>
  )
}
