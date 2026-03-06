"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { TableHead } from "@/components/ui/table"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SortKey = "globalName" | "role" | "submissions" | "lastLoginAt" | "createdAt"

interface UserSortHeaderProps {
  label: string
  sortKey: SortKey
  currentSort: string
  currentDir: string
  className?: string
}

export function UserSortHeader({ label, sortKey, currentSort, currentDir, className }: UserSortHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const isActive = currentSort === sortKey
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc"

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", sortKey)
    params.set("dir", nextDir)
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  )
}
