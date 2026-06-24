import { NextResponse } from "next/server"
import { processMorningEmails } from "@/lib/email-scheduler"
import { getCurrentVietnamTime, formatDate } from "@/lib/time-utils"
import { validateEnvironmentVariables } from "@/lib/env-validation"

// This endpoint will be called once a day by Vercel Cron at 23:00 UTC (6:00 AM Vietnam time)
export async function GET(request: Request) {
  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables()

    if (!envValidation.isValid) {
      console.error(`[DAILY CRON] Missing required environment variables: ${envValidation.missing.join(", ")}`)
      return NextResponse.json(
        {
          success: false,
          error: `Server configuration error: Missing environment variables`,
          missingVars: envValidation.missing,
        },
        { status: 500 },
      )
    }

    const vietnamTime = getCurrentVietnamTime()
    console.log(`[DAILY CRON] Starting daily email processing at ${vietnamTime.toISOString()}`)
    console.log(`[DAILY CRON] Vietnam date: ${formatDate(vietnamTime)}`)
    console.log(`[DAILY CRON] Vietnam time: ${vietnamTime.toLocaleTimeString()}`)

    // Process morning emails (6:00 AM)
    const emailResult = await processMorningEmails()

    return NextResponse.json({
      success: true,
      message: `Daily email processing completed for ${formatDate(vietnamTime)}`,
      timestamp: vietnamTime.toISOString(),
      emailResult,
    })
  } catch (error: any) {
    console.error("[DAILY CRON] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
