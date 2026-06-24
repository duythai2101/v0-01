import { getSupabaseAdmin } from "./supabase-admin"
import type { Database } from "@/types/supabase"
import { getRelatedBooks, getRandomBookForEmailFromUser, getBookWithDetails } from "./book-helper"

interface UserProfile {
  userId: string
  email: string
  bookCount: number
  genrePreferences: Record<string, number>
  averageRating: number
  sentimentProfile: {
    positive: number
    neutral: number
    negative: number
  }
  readingLevel: string
  preferredGenres: string[]
}

interface BookCandidate {
  id: string
  title: string
  author: string
  genre: string
  rating: number
  score: number
  reason: string
}

interface RecommendationResult {
  success: boolean
  data?: {
    recommendationId: string
    bookId: string
    bookTitle: string
    score: number
    reason: string
  }
  error?: string
}

/**
 * Build comprehensive user profile from reading history and highlights
 */
export async function buildUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseAdmin()

    // Fetch user basic info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error(`[Recommendation] Failed to fetch user ${userId}:`, userError)
      return null
    }

    // Fetch user preferences
    const { data: preferences } = await supabase
      .from("user_recommendation_preferences")
      .select("*")
      .eq("user_id", userId)
      .single()

    // Fetch user's books with genre and ratings
    const { data: books, error: booksError } = await supabase
      .from("books")
      .select("id, title, genre, rating")
      .eq("user_id", userId)

    if (booksError) {
      console.error(`[Recommendation] Failed to fetch books for user ${userId}:`, booksError)
      return null
    }

    // Fetch user's highlights with sentiment
    const { data: highlights, error: highlightsError } = await supabase
      .from("highlights")
      .select("id, content, highlight_type, books(genre, title)")
      .eq("user_id", userId)

    if (highlightsError) {
      console.error(`[Recommendation] Failed to fetch highlights:`, highlightsError)
      return null
    }

    // Calculate genre preferences
    const genreCount: Record<string, number> = {}
    const genreRatings: Record<string, number[]> = {}

    books?.forEach((book: any) => {
      const genre = book.genre || "unknown"
      genreCount[genre] = (genreCount[genre] || 0) + 1
      if (!genreRatings[genre]) genreRatings[genre] = []
      if (book.rating) genreRatings[genre].push(book.rating)
    })

    // Normalize genre preferences (0-1)
    const totalBooks = books?.length || 1
    const genrePreferences: Record<string, number> = {}
    Object.entries(genreCount).forEach(([genre, count]) => {
      const baseScore = (count as number) / totalBooks
      const avgRating = genreRatings[genre]?.length
        ? genreRatings[genre].reduce((a, b) => a + b, 0) / genreRatings[genre].length / 5
        : 0.5
      genrePreferences[genre] = baseScore * 0.7 + avgRating * 0.3
    })

    // Calculate average rating
    const avgRating = books?.length
      ? books.reduce((sum: number, b: any) => sum + (b.rating || 0), 0) / books.length
      : 3

    // Analyze sentiment from highlights
    const sentimentProfile = await analyzeSentiment(highlights || [])

    return {
      userId,
      email: user.email,
      bookCount: books?.length || 0,
      genrePreferences,
      averageRating: avgRating,
      sentimentProfile,
      readingLevel: preferences?.reading_level || "intermediate",
      preferredGenres: preferences?.preferred_genres || [],
    }
  } catch (error: any) {
    console.error(`[Recommendation] Error building user profile:`, error)
    return null
  }
}

/**
 * Analyze sentiment distribution from user's highlights
 */
async function analyzeSentiment(
  highlights: any[]
): Promise<{ positive: number; neutral: number; negative: number }> {
  // Simplified sentiment analysis - in production, use ML model
  const sentiments = {
    positive: 0,
    neutral: 0,
    negative: 0,
  }

  const positiveKeywords = ["love", "amazing", "beautiful", "excellent", "brilliant", "wonderful"]
  const negativeKeywords = ["hate", "terrible", "awful", "disappointing", "bad", "poor"]

  highlights.forEach((h: any) => {
    const content = (h.content || "").toLowerCase()
    const hasPositive = positiveKeywords.some((w) => content.includes(w))
    const hasNegative = negativeKeywords.some((w) => content.includes(w))

    if (hasPositive) sentiments.positive++
    else if (hasNegative) sentiments.negative++
    else sentiments.neutral++
  })

  const total = highlights.length || 1
  return {
    positive: sentiments.positive / total,
    neutral: sentiments.neutral / total,
    negative: sentiments.negative / total,
  }
}

/**
 * Generate personalized book recommendation for a user
 */
export async function generateRecommendation(userId: string): Promise<RecommendationResult> {
  try {
    console.log(`[Recommendation] Starting recommendation generation for user ${userId}`)

    // Build user profile
    const userProfile = await buildUserProfile(userId)
    if (!userProfile) {
      return { success: false, error: "Failed to build user profile" }
    }

    // Get candidate books
    const candidates = await getCandidateBooks(userProfile)
    if (!candidates || candidates.length === 0) {
      return { success: false, error: "No suitable book candidates found" }
    }

    // Score and rank candidates
    const rankedBooks = scoreBooks(candidates, userProfile)
    const topBook = rankedBooks[0]

    if (!topBook) {
      return { success: false, error: "Failed to rank book candidates" }
    }

    // Store recommendation
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().split("T")[0]

    const { data: recommendation, error: recError } = await supabase
      .from("recommendations")
      .upsert(
        {
          user_id: userId,
          book_id: topBook.id,
          recommendation_date: today,
          score: topBook.score,
          reason: topBook.reason,
          model_version: "v1.0", // TODO: use environment variable
          status: "pending",
        },
        { onConflict: "user_id,recommendation_date" }
      )
      .select()
      .single()

    if (recError) {
      console.error(`[Recommendation] Failed to store recommendation:`, recError)
      return { success: false, error: recError.message }
    }

    console.log(`[Recommendation] Generated recommendation ${recommendation.id} for user ${userId}`)

    return {
      success: true,
      data: {
        recommendationId: recommendation.id,
        bookId: topBook.id,
        bookTitle: topBook.title,
        score: topBook.score,
        reason: topBook.reason,
      },
    }
  } catch (error: any) {
    console.error(`[Recommendation] Error generating recommendation:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Get candidate books for recommendation
 */
async function getCandidateBooks(userProfile: UserProfile): Promise<BookCandidate[] | null> {
  try {
    const supabase = getSupabaseAdmin()

    // Query logic:
    // 1. Books in user's preferred genres
    // 2. Not in user's library
    // 3. Not recommended in last 30 days
    // 4. Reasonable rating (> 3.0)

    const preferredGenres = userProfile.preferredGenres.length
      ? userProfile.preferredGenres
      : Object.entries(userProfile.genrePreferences)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([genre]) => genre)

    console.log(`[Recommendation] Finding candidates in genres:`, preferredGenres)

    // Get all books (not in user's library)
    const { data: allBooks, error: booksError } = await supabase
      .from("books")
      .select("id, title, author, genre, rating")
      .not("user_id", "eq", userProfile.userId)
      .gte("rating", 3.5)

    if (booksError) {
      console.error(`[Recommendation] Failed to fetch candidate books:`, booksError)
      return null
    }

    if (!allBooks || allBooks.length === 0) {
      console.warn(`[Recommendation] No candidate books found`)
      return []
    }

    // Filter by genre and exclude recently recommended
    const { data: recentRecs } = await supabase
      .from("recommendations")
      .select("book_id")
      .eq("user_id", userProfile.userId)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const recentBookIds = new Set(recentRecs?.map((r: any) => r.book_id) || [])

    // Format candidates
    const candidates: BookCandidate[] = (allBooks as any[])
      .filter((book: any) => !recentBookIds.has(book.id))
      .filter((book: any) => preferredGenres.includes(book.genre))
      .map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        rating: book.rating,
        score: 0, // Will be calculated
        reason: "", // Will be calculated
      }))
      .slice(0, 100) // Limit to top 100 candidates

    console.log(`[Recommendation] Found ${candidates.length} candidate books`)
    return candidates
  } catch (error: any) {
    console.error(`[Recommendation] Error getting candidate books:`, error)
    return null
  }
}

/**
 * Score and rank books using hybrid recommendation algorithm
 */
function scoreBooks(candidates: BookCandidate[], userProfile: UserProfile): BookCandidate[] {
  // Scoring formula: Hybrid of content-based and collaborative
  const scored = candidates.map((book) => {
    // Component 1: Genre affinity (0-1)
    const genreScore =
      userProfile.genrePreferences[book.genre] ||
      Math.max(...Object.values(userProfile.genrePreferences), 0.5)

    // Component 2: Rating alignment (0-1)
    const ratingDiff = Math.abs(book.rating - userProfile.averageRating)
    const ratingScore = Math.max(0, 1 - ratingDiff / 5)

    // Component 3: Popularity/Quality (0-1)
    const qualityScore = book.rating / 5

    // Component 4: Sentiment alignment (0-1)
    const positiveBookBoost = 0.2 // Assume books with higher ratings are positive
    const sentimentScore = userProfile.sentimentProfile.positive * 0.7 + positiveBookBoost * 0.3

    // Combine components with weights
    const finalScore =
      genreScore * 0.35 + // Genre preference is most important
      ratingScore * 0.30 + // Rating alignment matters
      qualityScore * 0.20 + // Overall quality/popularity
      sentimentScore * 0.15 // Sentiment alignment

    return {
      ...book,
      score: Math.min(1, Math.max(0, finalScore)), // Clamp to 0-1
      reason:
        `Matches your interest in ${book.genre} books with ` +
        `${book.rating.toFixed(1)} rating and ${book.author}`,
    }
  })

  // Sort by score descending and add diversity (don't recommend same author twice)
  const ranked: BookCandidate[] = []
  const authorSet = new Set<string>()

  scored.sort((a, b) => b.score - a.score)

  for (const book of scored) {
    // Slightly penalize if author is already recommended (but still allow)
    const diversityPenalty = authorSet.has(book.author) ? 0.1 : 0
    const adjustedScore = book.score - diversityPenalty

    if (ranked.length < 5 || adjustedScore > 0.4) {
      ranked.push({ ...book, score: adjustedScore })
      authorSet.add(book.author)
    }

    if (ranked.length >= 10) break
  }

  return ranked
}

/**
 * Record user feedback on a recommendation
 */
export async function recordFeedback(
  recommendationId: string,
  userId: string,
  feedbackType: string,
  surveyResponses?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin()

    // Update recommendation status
    const feedbackMap: Record<string, string> = {
      helpful: "clicked",
      not_helpful: "dismissed",
      already_read: "viewed",
      not_interested: "dismissed",
    }

    const newStatus = feedbackMap[feedbackType] || "clicked"

    await supabase
      .from("recommendations")
      .update({ status: newStatus })
      .eq("id", recommendationId)

    // Record feedback
    const { error: feedbackError } = await supabase
      .from("recommendation_feedback")
      .insert({
        user_id: userId,
        recommendation_id: recommendationId,
        feedback_type: feedbackType,
        survey_responses: surveyResponses || {},
        survey_completed_at: new Date().toISOString(),
      })

    if (feedbackError) {
      console.error(`[Recommendation] Failed to record feedback:`, feedbackError)
      return { success: false, error: feedbackError.message }
    }

    console.log(`[Recommendation] Recorded ${feedbackType} feedback for recommendation ${recommendationId}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Recommendation] Error recording feedback:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Get recommendation metrics for dashboard
 */
export async function getRecommendationMetrics(
  period: "day" | "week" | "month" = "week"
): Promise<any> {
  try {
    const supabase = getSupabaseAdmin()

    const daysBack = period === "day" ? 1 : period === "week" ? 7 : 30
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

    // Get recommendations in period
    const { data: recommendations } = await supabase
      .from("recommendations")
      .select("id, status, score")
      .gte("created_at", startDate)

    // Get feedback in period
    const { data: feedback } = await supabase
      .from("recommendation_feedback")
      .select("feedback_type")
      .gte("created_at", startDate)

    const totalRecs = recommendations?.length || 0
    const clicked = recommendations?.filter((r: any) => r.status === "clicked").length || 0
    const addedToLibrary = recommendations?.filter((r: any) => r.status === "added_to_library").length || 0

    const feedbackCounts = feedback?.reduce(
      (acc: any, f: any) => {
        acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1
        return acc
      },
      {}
    ) || {}

    return {
      period,
      totalRecommendations: totalRecs,
      ctr: totalRecs > 0 ? clicked / totalRecs : 0,
      conversionRate: totalRecs > 0 ? addedToLibrary / totalRecs : 0,
      avgScore: recommendations?.length
        ? recommendations.reduce((sum: number, r: any) => sum + r.score, 0) / recommendations.length
        : 0,
      feedbackCounts,
      feedbackRate: totalRecs > 0 ? (feedback?.length || 0) / totalRecs : 0,
    }
  } catch (error: any) {
    console.error(`[Recommendation] Error getting metrics:`, error)
    return null
  }
}

/**
 * Get a book recommendation for email from a specific user
 * @param userId The user ID to fetch books from
 * @returns Book formatted for email display
 */
export async function getRelatedBookForEmail(userId: string) {
  try {
    console.log(`[Recommendation] Fetching book recommendation from user: ${userId}`)
    const relatedBook = await getRandomBookForEmailFromUser(userId)

    if (!relatedBook) {
      console.error(`[Recommendation] No related book found for user ${userId}`)
      return null
    }

    // Get more details including tags if available
    const bookDetails = await getBookWithDetails(relatedBook.id)

    return {
      title: bookDetails?.title || relatedBook.title,
      author: bookDetails?.author || relatedBook.author,
      genre: bookDetails?.genre || relatedBook.genre,
      rating: bookDetails?.rating || relatedBook.rating,
      coverUrl: bookDetails?.coverUrl || relatedBook.coverUrl,
      tags: bookDetails?.tags || [],
      reason: "Trích dẫn từ thư viện của các độc giả khác",
    }
  } catch (error: any) {
    console.error(`[Recommendation] Error fetching related book:`, error)
    return null
  }
}
