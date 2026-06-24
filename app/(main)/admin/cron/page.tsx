"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { getCurrentVietnamTime, formatDate, getNextRunTime } from "@/lib/time-utils"

export default function AdminCronPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date>(getCurrentVietnamTime())
  const [selectedTime, setSelectedTime] = useState<string>("now")
  const [customTime, setCustomTime] = useState<string>("06:00")
  const [forceAll, setForceAll] = useState(false)
  const [nextScheduledRun, setNextScheduledRun] = useState<Date>(getNextRunTime("06:00"))

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getCurrentVietnamTime()
      setCurrentTime(newTime)
      setNextScheduledRun(getNextRunTime("06:00"))
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Fetch recent email logs
  useEffect(() => {
    fetchLogs()
  }, [user])

  const triggerEmails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setResult(null)

      // Determine which time to use
      const timeToUse = selectedTime === "custom" ? customTime : selectedTime === "morning" ? "06:00" : undefined

      const response = await fetch("/api/send-daily-highlight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          time: timeToUse,
          forceAll: forceAll,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger email sending")
      }

      setResult(data)

      // Refresh logs after successful email sending
      setTimeout(() => {
        fetchLogs()
      }, 2000)
    } catch (err: any) {
      console.error("Error triggering emails:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

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

      setLogs(data || [])
    } catch (err: any) {
      console.error("Error fetching logs:", err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const getTimeString = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cron Job Management</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage automated email delivery</p>
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
                {nextScheduledRun.toLocaleTimeString("en-US")} ({formatDate(nextScheduledRun)})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
          <TabsTrigger value="manual">Manual Trigger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cron Job Configuration</CardTitle>
              <CardDescription>Current configuration for automated email delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Morning Email Delivery</h3>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Runs daily at 6:00 AM Vietnam time to send scheduled emails
                </p>
                <div className="mt-2 text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Schedule: <code className="ml-1 bg-muted px-1 py-0.5 rounded">0 23 * * *</code> (UTC)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Email Logs</CardTitle>
                <CardDescription>Last 20 email delivery attempts</CardDescription>
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
                <div className="text-center py-8 text-muted-foreground">No email logs found</div>
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
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
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
        </TabsContent>

        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Email Trigger</CardTitle>
              <CardDescription>Manually trigger the email sending process</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Select when to send emails. You can send to all users with a specific delivery time preference, or send
                to all users regardless of their preference.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="time-now"
                    name="time-option"
                    value="now"
                    checked={selectedTime === "now"}
                    onChange={() => setSelectedTime("now")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="time-now" className="text-sm font-medium">
                    Send to users with current time preference ({getTimeString(currentTime)})
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="time-morning"
                    name="time-option"
                    value="morning"
                    checked={selectedTime === "morning"}
                    onChange={() => setSelectedTime("morning")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="time-morning" className="text-sm font-medium">
                    Send to users with 6:00 AM preference
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="time-custom"
                    name="time-option"
                    value="custom"
                    checked={selectedTime === "custom"}
                    onChange={() => setSelectedTime("custom")}
                    className="h-4 w-4"
                  />
                  <label htmlFor="time-custom" className="text-sm font-medium">
                    Send to users with custom time preference:
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    disabled={selectedTime !== "custom"}
                    className="ml-2 px-2 py-1 border rounded"
                  />
                </div>

                <div className="flex items-center space-x-2 mt-6 pt-4 border-t">
                  <input
                    type="checkbox"
                    id="force-all"
                    checked={forceAll}
                    onChange={(e) => setForceAll(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="force-all" className="text-sm font-medium">
                    Force send to all users (ignore time preferences)
                  </label>
                </div>
              </div>

              {error && (
                <Alert className="border border-destructive/20 bg-destructive/10 mt-4">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert className="border border-green-500/20 bg-green-500/10 mt-4">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Process completed successfully!
                    {result.result?.results && (
                      <ul className="mt-2 list-disc list-inside">
                        <li>Total users: {result.result.results.total}</li>
                        <li>Emails sent: {result.result.results.sent}</li>
                        <li>Skipped: {result.result.results.skipped}</li>
                        <li>Failed: {result.result.results.failed}</li>
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={triggerEmails} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Send Emails Now
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
