import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/**
 * Track recommendation feedback from email links
 * GET /api/recommendations/track?token=XXX&action=suitable_yes|suitable_no|opened|add_to_library
 *
 * Token format: base64(recommendationId:userId:timestamp)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    const action = request.nextUrl.searchParams.get("action")

    if (!token) {
      return NextResponse.json({ error: "Missing tracking token" }, { status: 400 })
    }

    console.log(`[Track] Processing action: ${action}`)

    // Decode token
    let recommendationId: string
    let userId: string
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8")
      const [recId, uid] = decoded.split(":")
      recommendationId = recId
      userId = uid
      if (!recommendationId || !userId) throw new Error("Invalid token format")
    } catch {
      return NextResponse.json({ error: "Invalid tracking token" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // ─── Handle tracking pixel (email open) ─────────────────────────────────
    if (action === "opened") {
      await supabase.from("email_open_events").insert({
        recommendation_id: recommendationId,
        user_id: userId,
        user_agent: request.headers.get("user-agent"),
      }).catch((err: any) => console.warn("[Track] Failed to log open event:", err))

      const pixelBuffer = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      )
      return new NextResponse(pixelBuffer, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })
    }

    // ─── Build base URL for redirects ────────────────────────────────────────
    const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host
    const baseUrl = `${proto}://${host}`

    // ─── Handle Yes / No feedback ────────────────────────────────────────────
    if (action === "suitable_yes" || action === "suitable_no") {
      const isPositive = action === "suitable_yes"

      // 1. Update book_recommendations (find by matching id OR create if doesn't exist)
      const { data: existing } = await supabase
        .from("book_recommendations")
        .select("id")
        .eq("id", recommendationId)
        .eq("user_id", userId)
        .maybeSingle()

      if (existing) {
        const { error: updateError } = await supabase
          .from("book_recommendations")
          .update({
            user_feedback: isPositive,
            feedback_given_at: new Date().toISOString(),
            status: "feedback_given",
          })
          .eq("id", recommendationId)
          .eq("user_id", userId)

        if (updateError) {
          console.error("[Track] Failed to update book_recommendations:", updateError)
        }
      }

      // 2. Insert into recommendation_feedback
      const { error: feedbackError } = await supabase
        .from("recommendation_feedback")
        .insert({
          recommendation_id: recommendationId,
          user_id: userId,
          feedback_type: action,
        })

      if (feedbackError) {
        console.error("[Track] Failed to insert recommendation_feedback:", feedbackError)
      }

      // 3. Insert into email_click_events
      const { error: clickError } = await supabase
        .from("email_click_events")
        .insert({
          recommendation_id: recommendationId,
          user_id: userId,
          action_type: action,
          user_agent: request.headers.get("user-agent"),
        })

      if (clickError) {
        console.error("[Track] Failed to insert email_click_events:", clickError)
      }

      // 4. Update vote in recommendation_email_logs matched by the raw token
      const voteValue = isPositive ? "yes" : "no"
      const { error: logError } = await supabase
        .from("recommendation_email_logs")
        .update({
          vote: voteValue,
          voted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("tracking_token", token)

      if (logError) {
        console.error("[Track] Failed to update recommendation_email_logs vote:", logError)
      }

      console.log(`[Track] Recorded feedback: ${action} for recommendation ${recommendationId}`)

      // Redirect to thank-you page
      return NextResponse.redirect(
        new URL(`/recommendation-feedback-thank-you?feedback=${voteValue}`, baseUrl)
      )
    }

    // ─── Handle add_to_library ───────────────────────────────────────────────
    if (action === "add_to_library") {
      await supabase.from("email_click_events").insert({
        recommendation_id: recommendationId,
        user_id: userId,
        action_type: action,
        user_agent: request.headers.get("user-agent"),
      }).catch((err: any) => console.warn("[Track] click event failed:", err))

      return NextResponse.redirect(new URL("/library", baseUrl))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Track] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
