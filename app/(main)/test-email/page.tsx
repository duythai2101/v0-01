"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [envStatus, setEnvStatus] = useState<{ isValid: boolean; missing: string[] } | null>(null)
  const [isCheckingEnv, setIsCheckingEnv] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Please enter an email address")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch("/api/send-test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send test email")
      }

      setResult(data)
    } catch (err: any) {
      console.error("Error sending test email:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const checkEnvironment = async () => {
    try {
      setIsCheckingEnv(true)
      setEnvStatus(null)

      const response = await fetch("/api/check-environment", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check environment")
      }

      setEnvStatus({
        isValid: data.isValid,
        missing: data.missing || [],
      })
    } catch (err: any) {
      console.error("Error checking environment:", err)
      setError(err.message || "Failed to check environment")
    } finally {
      setIsCheckingEnv(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Email Functionality</h1>
        <p className="text-muted-foreground mt-2">
          Send a test email to verify that the email sending functionality is working correctly
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Environment Status</CardTitle>
            <CardDescription>Check if all required environment variables are set</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkEnvironment} disabled={isCheckingEnv}>
            {isCheckingEnv ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {envStatus === null ? (
            <p className="text-sm text-muted-foreground">Click the button to check environment variables</p>
          ) : envStatus.isValid ? (
            <Alert className="border border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>All required environment variables are set</AlertDescription>
            </Alert>
          ) : (
            <Alert className="border border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                Missing required environment variables:
                <ul className="mt-2 list-disc list-inside">
                  {envStatus.missing.map((variable) => (
                    <li key={variable}>{variable}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>Enter an email address to send a test email and verify the configuration</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <Alert className="border border-destructive/20 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert className="border border-green-500/20 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  {result.message}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Email ID: {result.data.id}
                    <br />
                    Sent to: {result.data.to}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>Common issues and solutions for email sending problems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Email Not Received</h3>
              <p className="text-sm text-muted-foreground">
                Check your spam folder. Some email providers may mark automated emails as spam.
              </p>
            </div>
            <div>
              <h3 className="font-medium">API Key Error</h3>
              <p className="text-sm text-muted-foreground">
                Verify that your Resend API key is correctly set in the environment variables.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Rate Limiting</h3>
              <p className="text-sm text-muted-foreground">
                Resend has rate limits for sending emails. If you're sending too many emails too quickly, you may hit
                these limits.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Sender Domain</h3>
              <p className="text-sm text-muted-foreground">
                Using a generic sender domain like "onboarding@resend.dev" can trigger spam filters. Consider setting up
                a custom domain in Resend.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
