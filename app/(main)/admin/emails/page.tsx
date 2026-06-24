"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminEmailsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const triggerEmailSending = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch("/api/send-daily-highlight", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger email sending")
      }

      setResult(data)
    } catch (err: any) {
      console.error("Error triggering emails:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
        <p className="text-muted-foreground mt-2">Manage and monitor automated email sending</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Email Trigger</CardTitle>
          <CardDescription>Manually trigger the email sending process for all eligible users</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will send emails to all users whose scheduled time matches the current time. Use this feature for
            testing or if the automated process failed.
          </p>

          {error && (
            <Alert className="border border-destructive/20 bg-destructive/10 mb-4">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border border-green-500/20 bg-green-500/10 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Process completed successfully!
                <ul className="mt-2 list-disc list-inside">
                  <li>Total users: {result.results.total}</li>
                  <li>Emails sent: {result.results.sent}</li>
                  <li>Skipped: {result.results.skipped}</li>
                  <li>Failed: {result.results.failed}</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={triggerEmailSending} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Emails Now
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
