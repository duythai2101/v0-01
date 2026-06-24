import { NextResponse } from "next/server"
import { sendTestEmail } from "@/lib/email-service"
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

    // Parse request body
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email address is required",
        },
        { status: 400 },
      )
    }

    console.log(`[API] Sending test email to ${email}`)

    // Send test email
    const result = await sendTestEmail(email)

    if (!result.success) {
      console.error(`[API] Failed to send test email to ${email}:`, result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      data: result.data,
    })
  } catch (error: any) {
    console.error("[API] Unhandled error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal Server Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
