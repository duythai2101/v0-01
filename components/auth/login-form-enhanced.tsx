"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RedirectProgress } from "./redirect-progress"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const REDIRECT_DELAY = 1500 // 1.5 seconds

  const validateForm = () => {
    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address" })
      return false
    }

    if (!password || password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsLoading(true)
      setMessage(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Show success message and set redirecting state
      setMessage({
        type: "success",
        text: "Login successful! Redirecting to dashboard...",
      })
      setIsRedirecting(true)

      // Use setTimeout for redirection
      setTimeout(() => {
        router.push("/")
        router.refresh() // Refresh to ensure all components recognize the auth state
      }, REDIRECT_DELAY)
    } catch (error: any) {
      console.error("Error during login:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to login. Please check your credentials and try again.",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card border-muted focus:border-primary transition-colors"
            disabled={isLoading || isRedirecting}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium leading-none">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card border-muted focus:border-primary transition-colors pr-10"
              disabled={isLoading || isRedirecting}
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isRedirecting}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || isRedirecting}>
          {isLoading || isRedirecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRedirecting ? "Redirecting..." : "Signing in..."}
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {message && (
        <Alert
          className={`border ${
            message.type === "success"
              ? "border-green-500/20 bg-green-500/10"
              : "border-destructive/20 bg-destructive/10"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {isRedirecting && <RedirectProgress duration={REDIRECT_DELAY} />}
    </div>
  )
}
