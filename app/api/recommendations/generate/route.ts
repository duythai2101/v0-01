import { NextRequest, NextResponse } from "next/server"
import { getRelatedBookForEmail } from "@/lib/recommendation-service"
import { sendEmailToUserRecommendation } from "@/lib/email-service"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { generateRecommendation } from "@/lib/recommendation-service" // Import generateRecommendation

// Hardcoded user ID for book recommendations
const BOOK_SUGGESTION_USER_ID = "27b9cad7-7e48-4d6c-86e7-28942fb775ba"
const RELATED_BOOK_USER_ID = "27b9cad7-7e48-4d6c-86e7-28942fb775ba" // Declare RELATED_BOOK_USER_ID

/**
 * Generate recommendations for a specific user or all users
 * POST /api/recommendations/generate
 *
 * Query params:
 * - userId: Generate for specific user
 * - sendEmail: Whether to send email (default: true)
 *
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access (you should implement proper auth)
    const authHeader = request.headers.get("authorization")
    const adminKey = process.env.ADMIN_API_KEY

    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, sendEmail = true } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    console.log(`[API] Generating recommendation for user ${userId}`)

    // Generate recommendation
    const result = await generateRecommendation(userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate recommendation" },
        { status: 500 }
      )
    }

    // Optionally send email
    if (sendEmail && result.data) {
      console.log(`[API] Sending recommendation email for user ${userId}`)

      const supabase = getSupabaseAdmin()
      const { data: user } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", userId)
        .single()

      if (user?.email) {
        // Get book from the specified user
        const book = await getRelatedBookForEmail(BOOK_SUGGESTION_USER_ID)

        if (book) {
          const emailResult = await sendEmailToUserRecommendation({
            email: user.email,
            name: user.name,
            userId,
            recommendationId: result.data.recommendationId,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookCover: book.coverUrl,
            bookGenre: book.genre,
            bookRating: book.rating,
            reason: book.reason,
          })

          if (!emailResult.success) {
            console.error(`[API] Failed to send email: ${emailResult.error}`)
          } else {
            console.log(`[API] Email sent successfully for recommendation with book: ${book.title}`)
          }
        } else {
          console.warn(`[API] No book found from user ${BOOK_SUGGESTION_USER_ID}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error: any) {
    console.error("[API] Error generating recommendation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Generate recommendations for all eligible users
 * GET /api/recommendations/generate?action=generate-all
 *
 * Admin-only endpoint for cron jobs
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = request.headers.get("x-vercel-cron-secret")
    const adminKey = process.env.ADMIN_API_KEY

    // Allow either bearer token or Vercel cron secret
    if (
      (!adminKey || authHeader !== `Bearer ${adminKey}`) &&
      (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const action = request.nextUrl.searchParams.get("action")

    if (action !== "generate-all") {
      return NextResponse.json(
        { error: 'Invalid action. Use action=generate-all' },
        { status: 400 }
      )
    }

    console.log("[API] Starting daily recommendation generation for all users")

    const supabase = getSupabaseAdmin()

    // Get all users with email preferences enabled
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name")
      .not("email", "is", null)

    if (usersError || !users) {
      console.error("[API] Failed to fetch users:", usersError)
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      )
    }

    console.log(`[API] Found ${users.length} users to generate recommendations for`)

    const results = {
      total: users.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Generate recommendations for each user
    for (const user of users) {
      try {
        const result = await generateRecommendation(user.id)

        if (result.success) {
          results.succeeded++

          // Send email if successful
          if (result.data && user.email) {
            // Get related book from the specified user
            const relatedBook = await getRelatedBookForEmail(RELATED_BOOK_USER_ID)

            await sendEmailToUserRecommendation({
              email: user.email,
              name: user.name,
              userId: user.id,
              recommendationId: result.data.recommendationId,
              bookTitle: result.data.bookTitle,
              bookAuthor: "", // TODO: fetch from book data
              reason: result.data.reason,
              relatedBookTitle: relatedBook?.title,
              relatedBookAuthor: relatedBook?.author,
              relatedBookCover: relatedBook?.coverUrl,
              relatedBookGenre: relatedBook?.genre,
              relatedBookReason: relatedBook?.reason,
            })
          }
        } else {
          results.failed++
          results.errors.push(`${user.id}: ${result.error}`)
        }
      } catch (error: any) {
        results.failed++
        results.errors.push(`${user.id}: ${error.message}`)
      }
    }

    console.log(`[API] Recommendation generation complete: ${results.succeeded} succeeded, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error: any) {
    console.error("[API] Error in bulk recommendation generation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
