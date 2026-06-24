import { fetchUsersWithEmailPreferences } from "./supabase-admin"
import { sendEmailToUser } from "./email-service"
import { getCurrentVietnamTime, getTimeString, isTimeMatch } from "./time-utils"
import { validateEnvironmentVariables } from "./env-validation"

/**
 * Process emails scheduled for a specific time
 * @param targetTime Optional time string in HH:MM format
 * @param forceAll If true, send to all users regardless of their scheduled time
 * @param options Additional options for filtering users
 * @returns Result object with success status and details
 */
export async function processScheduledEmails(
  targetTime?: string,
  forceAll = false,
  options?: {
    onlyRandom?: boolean
    onlySpecific?: boolean
  },
) {
  try {
    // Validate environment variables first
    const envValidation = validateEnvironmentVariables()
    if (!envValidation.isValid) {
      throw new Error(`Missing required environment variables: ${envValidation.missing.join(", ")}`)
    }

    // Get current time in Vietnam timezone
    const vietnamTime = getCurrentVietnamTime()
    const currentTimeString = getTimeString(vietnamTime)

    // Use provided target time or current time
    const timeToProcess = targetTime || currentTimeString

    console.log(`[Email Scheduler] Processing emails for time: ${timeToProcess}`)
    console.log(`[Email Scheduler] Current time in Vietnam: ${currentTimeString}`)
    console.log(`[Email Scheduler] Force all: ${forceAll}`)

    if (options) {
      console.log(`[Email Scheduler] Options:`, options)
    }

    // Fetch all users with their email preferences
    const { data: users, error: userError } = await fetchUsersWithEmailPreferences()

    if (userError) {
      throw new Error(`Failed to fetch users: ${userError}`)
    }

    if (!users || users.length === 0) {
      console.log("[Email Scheduler] No users found with email preferences")
      return {
        success: true,
        timestamp: new Date().toISOString(),
        results: {
          total: 0,
          processed: 0,
          sent: 0,
          skipped: 0,
          failed: 0,
          errors: [],
        },
      }
    }

    console.log(`[Email Scheduler] Found ${users.length} users with email preferences`)

    // Track results
    const results = {
      total: users.length,
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      userDetails: [] as any[],
    }

    // Process each user
    for (const user of users) {
      results.processed++
      const userResult = {
        userId: user.id,
        email: user.email,
        status: "skipped" as "skipped" | "sent" | "failed",
        reason: "",
      }

      try {
        // Skip users without email preferences or email
        if (!user.email_preferences || user.email_preferences.length === 0 || !user.email) {
          results.skipped++
          userResult.reason = "No email preferences or email"
          console.log(`[Email Scheduler] Skipping user ${user.id}: No email preferences or email`)
          results.userDetails.push(userResult)
          continue
        }

        const preferences = user.email_preferences[0] // Get the first preference

        // Apply additional filtering based on options
        if (options) {
          if (options.onlyRandom && !preferences.is_random) {
            results.skipped++
            userResult.reason = "User does not use random highlights"
            console.log(`[Email Scheduler] Skipping user ${user.id}: Not using random highlights`)
            results.userDetails.push(userResult)
            continue
          }

          if (options.onlySpecific && preferences.is_random) {
            results.skipped++
            userResult.reason = "User does not use specific highlights"
            console.log(`[Email Scheduler] Skipping user ${user.id}: Not using specific highlights`)
            results.userDetails.push(userResult)
            continue
          }
        }

        // Skip if not the right time to send, unless forceAll is true
        if (!forceAll && !targetTime && preferences.send_time !== timeToProcess) {
          // Check if within tolerance window
          if (!isTimeMatch(preferences.send_time, 5)) {
            results.skipped++
            userResult.reason = `Time mismatch (${preferences.send_time} vs ${timeToProcess})`
            console.log(
              `[Email Scheduler] Skipping user ${user.id}: Time mismatch (${preferences.send_time} vs ${timeToProcess})`,
            )
            results.userDetails.push(userResult)
            continue
          }
        }

        console.log(`[Email Scheduler] Sending email to user ${user.id} at ${timeToProcess}`)

        // Send the email
        const { success, error, data } = await sendEmailToUser({
          email: user.email,
          name: user.name,
          userId: user.id,
          highlightId: preferences.highlight_id,
          isRandom: preferences.is_random,
        })

        if (success) {
          results.sent++
          userResult.status = "sent"
          userResult.reason = `Email sent successfully (ID: ${data?.emailId})`
          console.log(`[Email Scheduler] Successfully sent email to user ${user.id}`)
        } else {
          results.failed++
          userResult.status = "failed"
          userResult.reason = error || "Unknown error"
          results.errors.push(`Error for user ${user.id}: ${error}`)
          console.error(`[Email Scheduler] Failed to send email to user ${user.id}: ${error}`)
        }
      } catch (error: any) {
        results.failed++
        userResult.status = "failed"
        userResult.reason = error.message || "Unknown error"
        results.errors.push(`Exception for user ${user.id}: ${error.message}`)
        console.error(`[Email Scheduler] Error processing user ${user.id}:`, error)
      }

      results.userDetails.push(userResult)
    }

    console.log(
      `[Email Scheduler] Completed: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`,
    )

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    }
  } catch (error: any) {
    console.error("[Email Scheduler] Fatal error:", error)
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      results: null,
    }
  }
}

/**
 * Process emails for 6 AM specifically
 * This is the main function called by the daily cron job
 */
export async function processMorningEmails() {
  try {
    console.log("[Email Scheduler] Processing morning emails (6:00 AM)")

    // Process emails for 6:00 AM
    const result = await processScheduledEmails("06:00")

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results: result,
    }
  } catch (error: any) {
    console.error("[Email Scheduler] Fatal error processing morning emails:", error)
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
    }
  }
}
