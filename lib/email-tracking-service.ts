import { getSupabaseAdmin } from "./supabase-admin"

interface TrackingData {
  recommendationId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}

interface ClickTrackingData extends TrackingData {
  actionType: "suitable_yes" | "suitable_no" | "opened"
  clickUrl?: string
}

/**
 * Log an email open event via pixel tracking
 */
export async function trackEmailOpen(data: TrackingData) {
  try {
    const supabase = getSupabaseAdmin()
    
    // Generate unique pixel ID
    const pixelId = `pixel_${data.recommendationId}_${Date.now()}`

    // Insert open event
    const { data: openEvent, error: openError } = await supabase
      .from("email_open_events")
      .insert({
        recommendation_id: data.recommendationId,
        user_id: data.userId,
        tracking_pixel_id: pixelId,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        opened_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (openError) {
      console.error("[Tracking] Error logging email open:", openError)
      return { success: false, error: openError.message }
    }

    console.log(
      `[Tracking] Email opened for recommendation ${data.recommendationId}`
    )

    // Update engagement summary
    await updateEngagementSummary({
      recommendationId: data.recommendationId,
      userId: data.userId,
      emailOpenedAt: new Date().toISOString(),
    })

    // Update book_recommendations status
    await supabase
      .from("book_recommendations")
      .update({ status: "opened" })
      .eq("id", data.recommendationId)
      .catch((err) =>
        console.warn("[Tracking] Failed to update recommendation status:", err)
      )

    return { success: true, pixelId }
  } catch (error: any) {
    console.error("[Tracking] Error tracking email open:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Log an email click event (button clicks)
 */
export async function trackEmailClick(data: ClickTrackingData) {
  try {
    const supabase = getSupabaseAdmin()

    // Insert click event
    const { error: clickError } = await supabase
      .from("email_click_events")
      .insert({
        recommendation_id: data.recommendationId,
        user_id: data.userId,
        action_type: data.actionType,
        click_url: data.clickUrl,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        clicked_at: new Date().toISOString(),
      })

    if (clickError) {
      console.error("[Tracking] Error logging email click:", clickError)
      return { success: false, error: clickError.message }
    }

    console.log(
      `[Tracking] Email clicked: ${data.actionType} for recommendation ${data.recommendationId}`
    )

    // Update engagement summary
    const summary = await supabase
      .from("email_engagement_summary")
      .select("*")
      .eq("recommendation_id", data.recommendationId)
      .single()

    let outcome = "clicked"
    if (data.actionType === "suitable_yes") {
      outcome = "clicked_yes"
    } else if (data.actionType === "suitable_no") {
      outcome = "clicked_no"
    }

    await supabase
      .from("email_engagement_summary")
      .update({
        first_click_at: new Date().toISOString(),
        total_clicks: (summary.data?.total_clicks || 0) + 1,
        yes_clicked: data.actionType === "suitable_yes" || summary.data?.yes_clicked,
        no_clicked: data.actionType === "suitable_no" || summary.data?.no_clicked,
        yes_click_at:
          data.actionType === "suitable_yes"
            ? new Date().toISOString()
            : summary.data?.yes_click_at,
        no_click_at:
          data.actionType === "suitable_no"
            ? new Date().toISOString()
            : summary.data?.no_click_at,
        final_outcome: outcome,
        updated_at: new Date().toISOString(),
      })
      .eq("recommendation_id", data.recommendationId)
      .catch((err) =>
        console.warn("[Tracking] Failed to update engagement summary:", err)
      )

    // Update book_recommendations status and feedback
    if (data.actionType === "suitable_yes") {
      await supabase
        .from("book_recommendations")
        .update({
          status: "feedback_given",
          user_feedback: true,
          feedback_given_at: new Date().toISOString(),
        })
        .eq("id", data.recommendationId)
        .catch((err) => console.warn("[Tracking] Failed to update recommendation:", err))
    } else if (data.actionType === "suitable_no") {
      await supabase
        .from("book_recommendations")
        .update({
          status: "feedback_given",
          user_feedback: false,
          feedback_given_at: new Date().toISOString(),
        })
        .eq("id", data.recommendationId)
        .catch((err) => console.warn("[Tracking] Failed to update recommendation:", err))
    }

    return { success: true, outcome }
  } catch (error: any) {
    console.error("[Tracking] Error tracking email click:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update or create engagement summary record
 */
async function updateEngagementSummary(data: {
  recommendationId: string
  userId: string
  emailOpenedAt?: string
}) {
  try {
    const supabase = getSupabaseAdmin()

    // Check if summary exists
    const { data: existing } = await supabase
      .from("email_engagement_summary")
      .select("*")
      .eq("recommendation_id", data.recommendationId)
      .single()

    if (existing) {
      // Update existing
      await supabase
        .from("email_engagement_summary")
        .update({
          email_opened_at: data.emailOpenedAt,
          open_count: (existing.open_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("recommendation_id", data.recommendationId)
    } else {
      // Create new
      await supabase
        .from("email_engagement_summary")
        .insert({
          recommendation_id: data.recommendationId,
          user_id: data.userId,
          email_opened_at: data.emailOpenedAt,
          open_count: 1,
        })
    }
  } catch (error: any) {
    console.warn("[Tracking] Error updating engagement summary:", error)
  }
}

/**
 * Get engagement metrics for a recommendation
 */
export async function getEngagementMetrics(recommendationId: string) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: metrics, error } = await supabase
      .from("email_engagement_summary")
      .select("*")
      .eq("recommendation_id", recommendationId)
      .single()

    if (error) {
      console.warn("[Tracking] Error fetching metrics:", error)
      return null
    }

    return metrics
  } catch (error: any) {
    console.error("[Tracking] Error getting engagement metrics:", error)
    return null
  }
}

/**
 * Get daily analytics
 */
export async function getDailyAnalytics(date: string) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: analytics, error } = await supabase
      .from("email_analytics_daily")
      .select("*")
      .eq("date", date)
      .single()

    if (error && error.code !== "PGRST116") {
      console.warn("[Tracking] Error fetching daily analytics:", error)
    }

    return analytics || null
  } catch (error: any) {
    console.error("[Tracking] Error getting daily analytics:", error)
    return null
  }
}
