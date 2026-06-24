"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Play, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { getCurrentVietnamTime, formatDate } from "@/lib/time-utils"

export default function TestCronPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date>(getCurrentVietnamTime())
  const [nextRunTime, setNextRunTime] = useState<Date | null>(null)
  const [testEmail, setTestEmail] = useState<string>("")

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getCurrentVietnamTime()
      setCurrentTime(newTime)
      calculateNextRunTime(newTime)
    }, 60000)

    // Initial calculation
    calculateNextRunTime(currentTime)

    return () => clearInterval(timer)
  }, [])

  // Calculate the next run time (every 10 minutes)
  const calculateNextRunTime = (now: Date) => {
    const minutes = now.getMinutes()
    const nextMinutes = Math.ceil(minutes / 10) * 10
    const nextRun = new Date(now)

    if (nextMinutes === 60) {
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0)
    } else {
      nextRun.setMinutes(nextMinutes, 0, 0)
    }

    setNextRunTime(nextRun)
  }

  // Fetch recent email logs
  useEffect(() => {
    fetchLogs()
  }, [user])

  const fetchLogs = async () => {
    if (!user) return

    try {
      setIsLoadingLogs(true)

      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      // Filter logs to only show test cron emails
      const testCronLogs =
        data?.filter(
          (log) =>
            log.details && (log.details.message?.includes("TEST CRON") || log.details.subject?.includes("Test Cron")),
        ) || []

      setLogs(testCronLogs)
    } catch (err: any) {
      console.error("Error fetching logs:", err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const triggerTestCron = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch("/api/cron/test-email", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger test cron job")
      }

      setResult(data)

      // Refresh logs after successful email sending
      setTimeout(() => {
        fetchLogs()
      }, 2000)
    } catch (err: any) {
      console.error("Error triggering test cron:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const updateTestEmail = async () => {
    if (!testEmail) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Store the test email in localStorage for simplicity
      localStorage.setItem("testCronEmail", testEmail)

      setIsLoading(false)
      setResult({
        success: true,
        message: `Test email recipient updated to ${testEmail}`,
      })
    } catch (err: any) {
      console.error("Error updating test email:", err)
      setError(err.message || "An unexpected error occurred")
      setIsLoading(false)
    }
  }

  // Load saved test email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("testCronEmail")
    if (savedEmail) {
      setTestEmail(savedEmail)
    }
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Cron Job</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage the test cron job for email sending</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system time and scheduled tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Time (Vietnam):</span>
              <span className="text-sm">{currentTime.toLocaleTimeString("en-US")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Date:</span>
              <span className="text-sm">{formatDate(currentTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Next Scheduled Run:</span>
              <span className="text-sm">
                {nextRunTime ? nextRunTime.toLocaleTimeString("en-US") : "Calculating..."}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cron Schedule:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">*/10 * * * *</code>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Email Configuration</CardTitle>
          <CardDescription>Configure the recipient for test cron emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="test-email" className="text-sm font-medium">
              Test Email Recipient
            </label>
            <div className="flex space-x-2">
              <input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button onClick={updateTestEmail} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This email will be used as the recipient for test cron emails. Make sure it's a valid email address.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Trigger</CardTitle>
          <CardDescription>Manually trigger the test cron job</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the button below to manually trigger the test cron job. This will send a test email to the configured
            recipient.
          </p>

          {error && (
            <Alert className="border border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>{result.message || "Test cron job triggered successfully!"}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={triggerTestCron} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Trigger Test Cron
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Test Cron Logs</CardTitle>
            <CardDescription>Last 20 test cron job executions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoadingLogs}>
            {isLoadingLogs ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingLogs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No test cron logs found</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {log.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                      )}
                      <span className="font-medium">{log.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <p>User ID: {log.user_id}</p>
                    {log.details && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
