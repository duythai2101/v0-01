"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

export function AuthStatus({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    if (auth) {
      setIsInitialLoading(false)
    }
  }, [auth])

  // Nếu auth context không tồn tại, hiển thị loading
  if (!auth || isInitialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { isLoading, refreshSession } = auth

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
