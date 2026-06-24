import { NextResponse } from "next/server"
import { processScheduledEmails } from "@/lib/email-scheduler"

// This configuration tells Vercel to run this function as a cron job
export const config = {
  schedule: "0 23 * * *", // Run at 11 PM UTC (6 AM Vietnam time)
}

async function handleCron() {
  try {
    console.log("[CRON] Email scheduler triggered")
    const result = await processScheduledEmails()

    if (!result.success) {
      console.error("[CRON] Email scheduler failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[CRON] Unhandled error:", error)
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 })
  }
}

export async function GET() {
  return handleCron()
}

export async function POST() {
  return handleCron()
}
