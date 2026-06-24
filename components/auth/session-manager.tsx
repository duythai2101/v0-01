"use client"

import { useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { debugAuth } from "@/lib/debug"

export function SessionManager() {
  const { refreshSession, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    // Refresh session on component mount
    refreshSession()

    // Set up interval to refresh session every 10 minutes
    const interval = setInterval(
      () => {
        debugAuth("Interval session refresh", {})
        refreshSession()
      },
      10 * 60 * 1000,
    ) // 10 minutes

    return () => clearInterval(interval)
  }, [refreshSession, isAuthenticated])

  return null
}
