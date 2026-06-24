import type { PostgrestError } from "@supabase/supabase-js"

// Type for the result of a safe Supabase query
export interface SafeQueryResult<T> {
  data: T | null
  error: PostgrestError | Error | null
  isRateLimited: boolean
}

/**
 * Safely execute a Supabase query with rate limiting protection
 * @param queryFn Function that returns a Supabase query promise
 * @returns SafeQueryResult with data, error, and rate limiting status
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
): Promise<SafeQueryResult<T>> {
  try {
    const result = await queryFn()
    return {
      data: result.data,
      error: result.error,
      isRateLimited: false,
    }
  } catch (err: any) {
    console.error("Error in Supabase query:", err)

    // Check if it's a rate limiting error
    const isRateLimited =
      err.message &&
      typeof err.message === "string" &&
      (err.message.includes("Too Many") || err.message.includes("429"))

    return {
      data: null,
      error: err,
      isRateLimited,
    }
  }
}

/**
 * Sleep for a specified duration
 * @param ms Milliseconds to sleep
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Calculate exponential backoff delay
 * @param attempt Current attempt number (0-based)
 * @param baseDelay Base delay in milliseconds
 * @param maxDelay Maximum delay in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateBackoff(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
  const delay = Math.min(Math.pow(2, attempt) * baseDelay, maxDelay)
  // Add some jitter to prevent all clients retrying at the same time
  return delay + Math.random() * 1000
}
