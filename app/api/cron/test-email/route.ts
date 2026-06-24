import { NextResponse } from "next/server"
import { validateEnvironmentVariables } from "@/lib/env-validation"
import { getCurrentVietnamTime, formatDate } from "@/lib/time-utils"
import { sendTestCronEmail } from "@/lib/test-cron-email-service"

// This configuration tells Vercel to run this function as a cron job
// Running every 10 minutes for testing purposes
export const config = {
  schedule: "*/10 * * * *",
}

export async function GET(request: Request) {
  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables()
    if (!envValidation.isValid) {
      console.error(`[TEST CRON] Missing required environment variables: ${envValidation.missing.join(", ")}`)
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
    console.log(`[TEST CRON] Starting test cron job at ${vietnamTime.toISOString()}`)

    // Set the recipient email - replace with your test email
    // Try to get from environment variable first, then use a default
    const testRecipientEmail = process.env.TEST_EMAIL_RECIPIENT || "test@example.com"

    // Send a test email
    const emailResult = await sendTestCronEmail(testRecipientEmail, vietnamTime)

    return NextResponse.json({
      success: emailResult.success,
      message: `Test cron job executed at ${formatDate(vietnamTime)}`,
      timestamp: vietnamTime.toISOString(),
      emailResult,
    })
  } catch (error: any) {
    console.error("[TEST CRON] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
