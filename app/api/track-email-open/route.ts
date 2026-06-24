import { NextRequest, NextResponse } from "next/server"
import { trackEmailOpen } from "@/lib/email-tracking-service"

/**
 * Track email opens via pixel tracking
 * GET /api/track-email-open?token=XXX
 * Returns 1x1 transparent GIF pixel for email open tracking
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      console.warn("[Track Open] Missing token")
      return createPixel()
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
      console.error("[Track Open] Invalid token format:", error)
      return createPixel()
    }

    // Get client info
    const ipAddress = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Log email open
    const result = await trackEmailOpen({
      recommendationId,
      userId,
      ipAddress,
      userAgent,
    })

    if (!result.success) {
      console.warn("[Track Open] Failed to track open:", result.error)
    }

    // Return 1x1 pixel regardless of success to not break email
    return createPixel()
  } catch (error: any) {
    console.error("[Track Open] Error:", error)
    return createPixel()
  }
}

/**
 * Create 1x1 transparent GIF pixel for email tracking
 */
function createPixel() {
  // 1x1 transparent GIF
  const pixel = Buffer.from([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
    0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
  ])

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
