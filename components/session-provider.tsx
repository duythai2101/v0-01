"use client"

import type React from "react"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, refreshSession } = useAuth()

  useEffect(() => {
    // Set up session refresh interval
    const refreshInterval = setInterval(
      async () => {
        await refreshSession()
      },
      5 * 60 * 1000,
    ) // Refresh every 5 minutes

    return () => clearInterval(refreshInterval)
  }, [refreshSession])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
