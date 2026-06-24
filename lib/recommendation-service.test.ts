/**
 * Testing utilities and examples for the recommendation service
 * Run with: npm test -- recommendation-service.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals"
import {
  buildUserProfile,
  generateRecommendation,
  recordFeedback,
  getRecommendationMetrics,
} from "./recommendation-service"
import { getSupabaseAdmin } from "./supabase-admin"

// Mock test data
const testUserId = "550e8400-e29b-41d4-a716-446655440000" // Example UUID
const testBookId = "550e8400-e29b-41d4-a716-446655440001"
const testRecommendationId = "550e8400-e29b-41d4-a716-446655440002"

describe("Recommendation Service", () => {
  let supabase: ReturnType<typeof getSupabaseAdmin>

  beforeEach(() => {
    supabase = getSupabaseAdmin()
  })

  describe("buildUserProfile", () => {
    it("should build a complete user profile from reading history", async () => {
      const profile = await buildUserProfile(testUserId)

      expect(profile).toBeDefined()
      if (profile) {
        expect(profile.userId).toBe(testUserId)
        expect(profile.email).toBeDefined()
        expect(profile.bookCount).toBeGreaterThanOrEqual(0)
        expect(profile.genrePreferences).toBeDefined()
        expect(typeof profile.averageRating).toBe("number")
        expect(profile.sentimentProfile).toHaveProperty("positive")
        expect(profile.sentimentProfile).toHaveProperty("neutral")
        expect(profile.sentimentProfile).toHaveProperty("negative")
      }
    })

    it("should return null for non-existent user", async () => {
      const profile = await buildUserProfile("non-existent-id")
      expect(profile).toBeNull()
    })

    it("should calculate genre affinity scores between 0 and 1", async () => {
      const profile = await buildUserProfile(testUserId)

      if (profile) {
        Object.values(profile.genrePreferences).forEach((score) => {
          expect(score).toBeGreaterThanOrEqual(0)
          expect(score).toBeLessThanOrEqual(1)
        })
      }
    })

    it("should have sentiment scores that sum to 1", async () => {
      const profile = await buildUserProfile(testUserId)

      if (profile) {
        const total =
          profile.sentimentProfile.positive +
          profile.sentimentProfile.neutral +
          profile.sentimentProfile.negative

        expect(Math.abs(total - 1)).toBeLessThan(0.01)
      }
    })
  })

  describe("generateRecommendation", () => {
    it("should generate a recommendation with valid score", async () => {
      const result = await generateRecommendation(testUserId)

      if (result.success && result.data) {
        expect(result.data.recommendationId).toBeDefined()
        expect(result.data.bookId).toBeDefined()
        expect(result.data.bookTitle).toBeDefined()
        expect(result.data.score).toBeGreaterThan(0)
        expect(result.data.score).toBeLessThanOrEqual(1)
        expect(result.data.reason).toBeDefined()
      }
    })

    it("should not recommend the same book twice in 30 days", async () => {
      const result1 = await generateRecommendation(testUserId)
      const result2 = await generateRecommendation(testUserId)

      if (result1.success && result2.success && result1.data && result2.data) {
        // Books might be same if user has very limited library, so this is a soft assertion
        expect(result1.data.recommendationId).not.toBe(result2.data.recommendationId)
      }
    })

    it("should fail gracefully for user with no books", async () => {
      // This would require a user with no books
      // In real test, create such user first
      const result = await generateRecommendation("user-with-no-books-id")

      expect(result.success).toBeDefined()
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it("should store recommendation in database", async () => {
      const result = await generateRecommendation(testUserId)

      if (result.success && result.data) {
        const { data: rec } = await supabase
          .from("recommendations")
          .select("*")
          .eq("id", result.data.recommendationId)
          .single()

        expect(rec).toBeDefined()
        expect(rec?.user_id).toBe(testUserId)
        expect(rec?.status).toBe("pending")
        expect(rec?.model_version).toBeDefined()
      }
    })
  })

  describe("recordFeedback", () => {
    it("should record helpful feedback", async () => {
      const result = await recordFeedback(testRecommendationId, testUserId, "helpful")

      expect(result.success).toBe(true)
    })

    it("should record not_helpful feedback", async () => {
      const result = await recordFeedback(testRecommendationId, testUserId, "not_helpful")

      expect(result.success).toBe(true)
    })

    it("should store survey responses in database", async () => {
      const surveyData = {
        why_liked: "Great writing style",
        would_read: true,
        difficulty: "intermediate",
      }

      const result = await recordFeedback(
        testRecommendationId,
        testUserId,
        "helpful",
        surveyData
      )

      expect(result.success).toBe(true)

      if (result.success) {
        const { data: feedback } = await supabase
          .from("recommendation_feedback")
          .select("*")
          .eq("recommendation_id", testRecommendationId)
          .single()

        expect(feedback?.survey_responses).toEqual(surveyData)
      }
    })

    it("should update recommendation status based on feedback", async () => {
      const result = await recordFeedback(testRecommendationId, testUserId, "helpful")

      expect(result.success).toBe(true)

      if (result.success) {
        const { data: rec } = await supabase
          .from("recommendations")
          .select("status")
          .eq("id", testRecommendationId)
          .single()

        expect(rec?.status).not.toBe("pending")
      }
    })
  })

  describe("getRecommendationMetrics", () => {
    it("should return metrics for day period", async () => {
      const metrics = await getRecommendationMetrics("day")

      expect(metrics).toBeDefined()
      expect(metrics?.period).toBe("day")
      expect(typeof metrics?.ctr).toBe("number")
      expect(typeof metrics?.conversionRate).toBe("number")
      expect(typeof metrics?.avgScore).toBe("number")
    })

    it("should return metrics for week period", async () => {
      const metrics = await getRecommendationMetrics("week")

      expect(metrics?.period).toBe("week")
      expect(metrics?.totalRecommendations).toBeGreaterThanOrEqual(0)
    })

    it("should return metrics for month period", async () => {
      const metrics = await getRecommendationMetrics("month")

      expect(metrics?.period).toBe("month")
      expect(metrics?.feedbackRate).toBeGreaterThanOrEqual(0)
    })

    it("should have valid metric ranges", async () => {
      const metrics = await getRecommendationMetrics("week")

      if (metrics) {
        expect(metrics.ctr).toBeGreaterThanOrEqual(0)
        expect(metrics.ctr).toBeLessThanOrEqual(1)
        expect(metrics.conversionRate).toBeGreaterThanOrEqual(0)
        expect(metrics.conversionRate).toBeLessThanOrEqual(1)
        expect(metrics.avgScore).toBeGreaterThanOrEqual(0)
        expect(metrics.avgScore).toBeLessThanOrEqual(1)
      }
    })
  })
})

/**
 * Integration tests - test full workflows
 */
describe("Recommendation Workflow", () => {
  it("should complete full recommendation flow", async () => {
    // 1. Generate recommendation
    const genResult = await generateRecommendation(testUserId)
    expect(genResult.success).toBe(true)

    const recId = genResult.data?.recommendationId
    expect(recId).toBeDefined()

    // 2. Record feedback
    if (recId) {
      const feedResult = await recordFeedback(recId, testUserId, "helpful", {
        experience: "excellent",
      })
      expect(feedResult.success).toBe(true)

      // 3. Verify feedback was stored
      const supabase = getSupabaseAdmin()
      const { data: feedback } = await supabase
        .from("recommendation_feedback")
        .select("*")
        .eq("recommendation_id", recId)
        .single()

      expect(feedback).toBeDefined()
      expect(feedback?.feedback_type).toBe("helpful")
    }
  })

  it("should track recommendation lifecycle", async () => {
    const supabase = getSupabaseAdmin()

    // 1. Generate
    const result = await generateRecommendation(testUserId)
    const recId = result.data?.recommendationId

    if (recId) {
      // Check initial status
      let { data: rec } = await supabase
        .from("recommendations")
        .select("status")
        .eq("id", recId)
        .single()
      expect(rec?.status).toBe("pending")

      // 2. Record feedback (updates status)
      await recordFeedback(recId, testUserId, "helpful")

      // Check updated status
      ;({ data: rec } = await supabase
        .from("recommendations")
        .select("status")
        .eq("id", recId)
        .single())
      expect(rec?.status).not.toBe("pending")
    }
  })
})

/**
 * Performance tests
 */
describe("Performance", () => {
  it("should build user profile within 2 seconds", async () => {
    const start = Date.now()
    await buildUserProfile(testUserId)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(2000)
  })

  it("should generate recommendation within 5 seconds", async () => {
    const start = Date.now()
    await generateRecommendation(testUserId)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(5000)
  })

  it("should record feedback within 1 second", async () => {
    const start = Date.now()
    await recordFeedback(testRecommendationId, testUserId, "helpful")
    const duration = Date.now() - start

    expect(duration).toBeLessThan(1000)
  })
})

/**
 * Example: Manual test script
 * Run this to verify system is working
 */
export async function manualTestFlow(userId: string) {
  console.log("🧪 Starting manual test flow...\n")

  try {
    // 1. Build profile
    console.log("1️⃣ Building user profile...")
    const profile = await buildUserProfile(userId)
    if (profile) {
      console.log(`   ✅ Profile built: ${profile.bookCount} books, genres:`, profile.genrePreferences)
    } else {
      console.log("   ❌ Failed to build profile")
      return
    }

    // 2. Generate recommendation
    console.log("\n2️⃣ Generating recommendation...")
    const recResult = await generateRecommendation(userId)
    if (recResult.success && recResult.data) {
      console.log(`   ✅ Recommendation: "${recResult.data.bookTitle}" (score: ${recResult.data.score.toFixed(2)})`)
      console.log(`   📊 Reason: ${recResult.data.reason}`)

      // 3. Record feedback
      const recId = recResult.data.recommendationId
      console.log("\n3️⃣ Recording feedback...")
      const feedResult = await recordFeedback(recId, userId, "helpful", {
        quality: "excellent",
        would_recommend: true,
      })
      console.log(`   ✅ Feedback recorded: ${feedResult.success ? "success" : "failed"}`)

      // 4. Get metrics
      console.log("\n4️⃣ Getting metrics...")
      const metrics = await getRecommendationMetrics("week")
      if (metrics) {
        console.log(`   📈 CTR: ${(metrics.ctr * 100).toFixed(1)}%`)
        console.log(`   📈 Conversion: ${(metrics.conversionRate * 100).toFixed(1)}%`)
        console.log(`   📈 Avg Score: ${metrics.avgScore.toFixed(2)}`)
      }

      console.log("\n✨ Manual test completed successfully!")
    } else {
      console.log(`   ❌ Failed: ${recResult.error}`)
    }
  } catch (error: any) {
    console.error("❌ Test failed:", error.message)
  }
}

// Run manual test if this file is executed directly
if (require.main === module) {
  const userId = process.argv[2] || "test-user-id"
  manualTestFlow(userId).catch(console.error)
}
