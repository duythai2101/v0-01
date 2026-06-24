import React from "react"
import { EmailTemplate } from "@/components/emails/email-template"
import { validateEnvironmentVariables } from "./env-validation"
import { logEmailActivity } from "./supabase-admin"
import { getResendClient } from "./resend-client"

/**
 * Send a test email from the cron job
 * @param email Recipient email address
 * @param timestamp Current timestamp
 * @param userId User ID for logging
 * @returns Result object with success status
 */
export async function sendTestCronEmail(email: string, timestamp: Date, userId?: string) {
  try {
    // Validate environment variables
    const envValidation = validateEnvironmentVariables()
    if (!envValidation.isValid) {
      const missingVars = envValidation.missing.join(", ")
      console.error(`[TEST CRON] Missing required environment variables: ${missingVars}`)
      return { success: false, error: `Missing required environment variables: ${missingVars}` }
    }

    console.log(`[TEST CRON] Sending test cron email to ${email}`)

    // Initialize Resend client
    let resend
    try {
      resend = getResendClient()
    } catch (error: any) {
      console.error(`[TEST CRON] Failed to initialize Resend client: ${error.message}`)
      return { success: false, error: `Failed to initialize email client: ${error.message}` }
    }

    // Create a custom subject and content for the test cron email
    const subject = `Test Cron Email - ${timestamp.toLocaleString()}`
    const content = `
      This is an automated test email sent by the cron job.
      
      Timestamp: ${timestamp.toISOString()}
      Local Time: ${timestamp.toLocaleString()}
      
      This email confirms that your cron job is working correctly and can send emails as scheduled.
    `

    // Send the email
    try {
      const { data, error } = await resend.emails.send({
        from: "Tomorrow App <onboarding@resend.dev>",
        to: email,
        subject: subject,
        react: React.createElement(EmailTemplate, {
          title: "Test Cron Email",
          author: "Tomorrow App",
          content: content,
        }),
        text: content,
      })

      // Log the activity if userId is provided
      if (userId) {
        await logEmailActivity(userId, error ? "error" : "success", {
          message: "[TEST CRON] Email sent",
          subject: subject,
          timestamp: timestamp.toISOString(),
          emailId: data?.id,
          error: error?.message,
        })
      }

      if (error) {
        console.error(`[TEST CRON] Failed to send test cron email to ${email}:`, error)
        return { success: false, error: error.message }
      }

      console.log(`[TEST CRON] Successfully sent test cron email to ${email} (ID: ${data?.id})`)
      return {
        success: true,
        data: {
          id: data?.id,
          to: email,
          sentAt: timestamp.toISOString(),
        },
      }
    } catch (error: any) {
      console.error(`[TEST CRON] Exception sending test cron email to ${email}:`, error)
      return { success: false, error: `Exception sending email: ${error.message}` }
    }
  } catch (error: any) {
    console.error(`[TEST CRON] Unhandled error sending test cron email to ${email}:`, error)
    return {
      success: false,
      error: error.message || "Failed to send test cron email",
    }
  }
}
