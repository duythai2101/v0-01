/**
 * Utility functions for logging email activities
 */
import { getSupabaseAdmin } from "./supabase-admin"

/**
 * Log detailed information about email sending attempts
 * @param userId User ID
 * @param status Success or error status
 * @param details Additional details about the email
 * @returns Success status of logging operation
 */
export async function logEmailSendingActivity(userId: string, status: "success" | "error", details: any) {
  try {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase.from("email_logs").insert({
      user_id: userId,
      status,
      details,
      created_at: new Date().toISOString(),
      type: "scheduled_email",
    })

    if (error) {
      console.error("[Email Logging] Failed to log email activity:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("[Email Logging] Exception logging email activity:", error)
    return false
  }
}

/**
 * Get recent email logs for a user
 * @param userId User ID
 * @param limit Maximum number of logs to return
 * @returns Array of email logs
 */
export async function getRecentEmailLogs(userId: string, limit = 10) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("email_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("type", "scheduled_email")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[Email Logging] Failed to get email logs:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[Email Logging] Exception getting email logs:", error)
    return []
  }
}
