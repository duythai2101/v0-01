import { NextRequest, NextResponse } from "next/server"
import { trackEmailClick } from "@/lib/email-tracking-service"

/**
 * Track email clicks (button interactions)
 * GET /api/track-email-click?token=XXX&action=suitable_yes|suitable_no
 * Logs click and performs action based on type
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    const action = request.nextUrl.searchParams.get("action") as 
      | "suitable_yes"
      | "suitable_no"
      | undefined

    if (!token) {
      return NextResponse.json(
        { error: "Missing tracking token" },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: "Missing action parameter" },
        { status: 400 }
      )
    }

    // Decode token to get recommendation ID and user ID
    let recommendationId: string
    let userId: string

    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8")
      const [recId, uid] = decoded.split(":")
      recommendationId = recId
      userId = uid

      if (!recommendationId || !userId) {
        throw new Error("Invalid token format")
      }
    } catch (error) {
      console.error("[Track Click] Invalid token format:", error)
      return NextResponse.json(
        { error: "Invalid tracking token" },
        { status: 400 }
      )
    }

    // Get client info
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Track the click
    const result = await trackEmailClick({
      recommendationId,
      userId,
      actionType: action,
      ipAddress,
      userAgent,
      clickUrl: request.url,
    })

    if (!result.success) {
      console.error("[Track Click] Failed to track click:", result.error)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    console.log(
      `[Track Click] Successfully tracked: ${action} for recommendation ${recommendationId}`
    )

    // Redirect to dashboard or confirmation page
    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (error: any) {
    console.error("[Track Click] Error:", error)
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    )
  }
}
