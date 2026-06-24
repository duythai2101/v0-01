import { NextResponse } from "next/server"
import { processScheduledEmails } from "@/lib/email-scheduler"
import { getCurrentVietnamTime } from "@/lib/time-utils"
import { validateEnvironmentVariables } from "@/lib/env-validation"

export async function POST(request: Request) {
  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables()

    if (!envValidation.isValid) {
      console.error(`Missing required environment variables: ${envValidation.missing.join(", ")}`)
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
    console.log(`[API] Manual email trigger at ${vietnamTime.toISOString()}`)

    // Parse request body for options
    let targetTime
    let forceAll = false

    try {
      const body = await request.json()
      targetTime = body.time // Optional time parameter
      forceAll = !!body.forceAll // Optional force parameter
    } catch (e) {
      // No body or invalid JSON, proceed with default behavior
      console.log("[API] No request body or invalid JSON, using defaults")
    }

    console.log(`[API] Target time: ${targetTime || "current time"}, Force all: ${forceAll}`)

    // Process emails for the specified time or all pending emails
    const result = await processScheduledEmails(targetTime, forceAll)

    if (!result.success) {
      console.error("[API] Email processing failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: vietnamTime.toISOString(),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Emails processed successfully",
      timestamp: vietnamTime.toISOString(),
      result,
    })
  } catch (error: any) {
    console.error("[API] Unhandled error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal Server Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
