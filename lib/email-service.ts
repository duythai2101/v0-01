import { Resend } from "resend"
import React from "react"
import { EmailTemplate } from "@/components/emails/email-template"
import { RecommendationEmailTemplate } from "@/components/emails/recommendation-email-template"
import { fetchUserHighlights, logEmailActivity, getSupabaseAdmin } from "./supabase-admin"
import { validateEnvironmentVariables } from "./env-validation"
import { isValidEmail } from "./utils"

// Initialize Resend client with comprehensive error handling
export const getResendClient = () => {
  // Validate environment variables first
  const envValidation = validateEnvironmentVariables()
  if (!envValidation.isValid) {
    const missingVars = envValidation.missing.join(", ")
    console.error(`Missing required environment variables: ${missingVars}`)
    throw new Error(`Missing required environment variables: ${missingVars}`)
  }

  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable is not set")
    throw new Error("Missing RESEND_API_KEY environment variable")
  }

  return new Resend(resendApiKey)
}

/**
 * Send a test email to verify configuration
 * @param email Recipient email address
 * @param subject Optional custom subject line
 * @param content Optional custom content
 * @returns Result object with success status
 */
export async function sendTestEmail(email: string, subject?: string, content?: string) {
  try {
    // Validate email format
    if (!email || !isValidEmail(email)) {
      return { success: false, error: "Invalid email address" }
    }

    console.log(`[Email Service] Sending test email to ${email}`)

    // Initialize Resend client
    let resend
    try {
      resend = getResendClient()
    } catch (error: any) {
      console.error(`[Email Service] Failed to initialize Resend client: ${error.message}`)
      return { success: false, error: `Failed to initialize email client: ${error.message}` }
    }

    // Get site URL for links
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tomorrow-app.vercel.app"

    // Use custom subject and content if provided, otherwise use defaults
    const emailSubject = subject || "Test Email from Tomorrow App"
    const emailContent =
      content ||
      "This is a test email to verify that the email sending functionality is working correctly. If you received this email, your email configuration is working properly!"

    // Send the test email
    try {
      const { data, error } = await resend.emails.send({
        from: "Tomorrow App <Tina@tomorrow.io.vn>",
        to: email,
        subject: emailSubject,
        react: React.createElement(EmailTemplate, {
          title: "Test Email",
          author: "Tomorrow App",
          content: emailContent,
          unsubscribeUrl: `${siteUrl}/settings?unsubscribe=true`,
        }),
        text: emailContent,
      })

      if (error) {
        console.error(`[Email Service] Failed to send test email to ${email}:`, error)
        return { success: false, error: error.message }
      }

      console.log(`[Email Service] Successfully sent test email to ${email} (ID: ${data?.id})`)
      return {
        success: true,
        data: {
          id: data?.id,
          to: email,
        },
      }
    } catch (error: any) {
      console.error(`[Email Service] Exception sending test email to ${email}:`, error)
      return { success: false, error: `Exception sending email: ${error.message}` }
    }
  } catch (error: any) {
    console.error(`[Email Service] Unhandled error sending test email to ${email}:`, error)
    return {
      success: false,
      error: error.message || "Failed to send test email",
    }
  }
}

/**
 * Send an email to a user with their highlight
 * @param params Email parameters
 * @returns Result object with success status
 */
export async function sendEmailToUser({
  email,
  name,
  userId,
  highlightId,
  isRandom,
}: {
  email: string
  name?: string | null
  userId: string
  highlightId?: string | null
  isRandom: boolean
}) {
  try {
    // Validate email format
    if (!isValidEmail(email)) {
      const errorMessage = "Invalid email format"
      await logEmailActivity(userId, "error", { message: errorMessage })
      return { success: false, error: errorMessage }
    }

    console.log(`[Email Service] Preparing email for user ${userId} (${email})`)

    // 1. Fetch highlight data with better error handling
    const { data: highlights, error: highlightError } = await fetchUserHighlights(userId, isRandom ? null : highlightId)

    if (highlightError) {
      const errorMessage = `Error fetching highlights: ${highlightError}`
      await logEmailActivity(userId, "error", { message: errorMessage })
      return { success: false, error: errorMessage }
    }

    if (!highlights || highlights.length === 0) {
      const errorMessage = "No highlights found for user"
      await logEmailActivity(userId, "error", { message: errorMessage })
      return { success: false, error: errorMessage }
    }

    // 2. Select a highlight (random or specific)
    const highlight = isRandom ? highlights[Math.floor(Math.random() * highlights.length)] : highlights[0]

    if (!highlight) {
      const errorMessage = "Failed to select a highlight"
      await logEmailActivity(userId, "error", { message: errorMessage })
      return { success: false, error: errorMessage }
    }

    // 3. Extract book information with fallbacks
    const bookTitle = highlight.books?.title || "Unknown Book"
    const bookAuthor = highlight.books?.author || "Unknown Author"

    console.log(`[Email Service] Selected highlight from "${bookTitle}" for user ${userId}`)

    // 4. Initialize Resend client with try/catch
    let resend
    try {
      resend = getResendClient()
    } catch (error: any) {
      const errorMessage = `Failed to initialize Resend client: ${error.message}`
      await logEmailActivity(userId, "error", { message: errorMessage })
      return { success: false, error: errorMessage }
    }

    // Get site URL for links
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tomorrow-app.vercel.app"

    // Create unsubscribe URL
    const unsubscribeUrl = `${siteUrl}/settings?unsubscribe=true&userId=${userId}`

    // 5. Send the email with improved error handling
    try {
      const { data, error } = await resend.emails.send({
        from: "Tomorrow <Tina@tomorrow.io.vn>",
        to: email,
        subject: `Your Daily Highlight from ${bookTitle}`,
        react: React.createElement(EmailTemplate, {
          title: bookTitle,
          author: bookAuthor,
          content: highlight.content,
          unsubscribeUrl,
        }),
        // Add plain text fallback for better deliverability
        text: `Your highlight from ${bookTitle} by ${bookAuthor}: ${highlight.content}`,
      })

      // 6. Log the activity
      await logEmailActivity(userId, error ? "error" : "success", {
        highlightId: highlight.id,
        bookTitle,
        emailId: data?.id,
        error: error?.message,
      })

      if (error) {
        console.error(`[Email Service] Failed to send email to ${email}:`, error)
        return { success: false, error: error.message }
      }

      console.log(`[Email Service] Successfully sent email to ${email} (ID: ${data?.id})`)
      return {
        success: true,
        data: {
          emailId: data?.id,
          highlightId: highlight.id,
          bookTitle,
        },
      }
    } catch (error: any) {
      const errorMessage = `Exception sending email: ${error.message}`
      console.error(`[Email Service] ${errorMessage}`)
      await logEmailActivity(userId, "error", { message: errorMessage })
      return { success: false, error: errorMessage }
    }
  } catch (error: any) {
    console.error(`[Email Service] Unhandled error sending email to ${email}:`, error)
    try {
      await logEmailActivity(userId, "error", {
        message: "Unhandled exception in sendEmailToUser",
        error: error.message,
      })
    } catch (logError) {
      console.error("[Email Service] Failed to log email error:", logError)
    }
    return {
      success: false,
      error: error.message || "Failed to send email",
    }
  }
}

/**
 * Send a personalized book recommendation email to a user
 * @param params Recommendation email parameters
 * @returns Result object with success status
 */
export async function sendEmailToUserRecommendation({
  email,
  name,
  userId,
  recommendationId,
  bookTitle,
  bookAuthor,
  bookCover,
  bookGenre,
  bookRating,
  reason,
}: {
  email: string
  name?: string | null
  userId: string
  recommendationId: string
  bookTitle: string
  bookAuthor: string
  bookCover?: string
  bookGenre?: string
  bookRating?: number
  reason: string
}) {
  try {
    // Validate email
    if (!isValidEmail(email)) {
      return { success: false, error: "Invalid email address" }
    }

    console.log(`[Email Service] Sending recommendation email to ${email}`)

    // Initialize Resend client
    let resend
    try {
      resend = getResendClient()
    } catch (error: any) {
      console.error(`[Email Service] Failed to initialize Resend client: ${error.message}`)
      return { success: false, error: `Failed to initialize email client: ${error.message}` }
    }

    // Get site URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tomorrow-app.vercel.app"

    // Generate tracking token (base64 encoded)
    const trackingToken = Buffer.from(`${recommendationId}:${userId}:${Date.now()}`).toString(
      "base64"
    )

    // Create unsubscribe URL
    const unsubscribeUrl = `${siteUrl}/settings?unsubscribe=true&userId=${userId}`

    // Get book details for description (if available)
    const supabase = getSupabaseAdmin()
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, genre, rating")
      .eq("id", recommendationId)
      .single()

    if (bookError) {
      console.warn(`[Email Service] Could not fetch book details for ${recommendationId}:`, bookError)
    }

    const bookDescription = book ? `A ${book.genre} book rated ${book.rating || "highly"}/5` : ""

    // Send the recommendation email
    try {
      const { data, error } = await resend.emails.send({
        from: "Tomorrow <Tina@tomorrow.io.vn>",
        to: email,
        subject: `${bookTitle} by ${bookAuthor}`,
        react: React.createElement(RecommendationEmailTemplate, {
          userName: name || "Reader",
          bookTitle,
          bookAuthor,
          bookCover,
          bookGenre,
          bookRating,
          reason,
          trackingToken,
          siteUrl,
          unsubscribeUrl,
        }),
        text: `We recommend: ${bookTitle} by ${bookAuthor}. ${reason}`,
      })

      if (error) {
        console.error(`[Email Service] Failed to send recommendation email to ${email}:`, error)
        return { success: false, error: error.message }
      }

      // Update recommendation with email ID (non-blocking)
      if (data?.id) {
        supabase
          .from("recommendations")
          .update({ email_id: data.id, status: "sent" })
          .eq("id", recommendationId)
          .then(({ error }) => {
            if (error) console.warn("[Email Service] Failed to update email_id:", error)
          })
      }

      // Insert log row into recommendation_email_logs
      const { error: logError } = await supabase
        .from("recommendation_email_logs")
        .insert({
          user_id: userId,
          user_email: email,
          user_name: name ?? null,
          book_title: bookTitle,
          book_author: bookAuthor,
          book_cover: bookCover ?? null,
          book_genre: bookGenre ?? null,
          book_rating: bookRating ?? null,
          reason: reason,
          tracking_token: trackingToken,
          resend_email_id: data?.id ?? null,
          sent_at: new Date().toISOString(),
        })

      if (logError) {
        console.warn("[Email Service] Failed to insert recommendation_email_logs:", logError)
      }

      console.log(
        `[Email Service] Successfully sent recommendation email to ${email} (ID: ${data?.id})`
      )
      return {
        success: true,
        data: {
          id: data?.id,
          to: email,
          recommendationId,
          trackingToken,
        },
      }
    } catch (error: any) {
      console.error(`[Email Service] Exception sending recommendation email to ${email}:`, error)
      return { success: false, error: `Exception sending email: ${error.message}` }
    }
  } catch (error: any) {
    console.error(`[Email Service] Unhandled error sending recommendation email to ${email}:`, error)
    return {
      success: false,
      error: error.message || "Failed to send recommendation email",
    }
  }
}
