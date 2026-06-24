import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Initialize Supabase Admin client (server-side only)
export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}

// Function to fetch users with their email preferences
export async function fetchUsersWithEmailPreferences() {
  try {
    const supabase = getSupabaseAdmin()

    // Sử dụng cú pháp join thay vì nested select
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name")
      .not("email", "is", null)

    if (usersError) {
      throw usersError
    }

    // Nếu không có users, trả về mảng rỗng
    if (!users || users.length === 0) {
      return {
        data: [],
        error: null,
      }
    }

    // Lấy email preferences cho mỗi user
    const usersWithPreferences = await Promise.all(
      users.map(async (user) => {
        const { data: preferences, error: preferencesError } = await supabase
          .from("email_preferences")
          .select("id, highlight_id, is_random, send_time")
          .eq("user_id", user.id)

        if (preferencesError) {
          console.error(`Error fetching preferences for user ${user.id}:`, preferencesError)
          return {
            ...user,
            email_preferences: [],
          }
        }

        return {
          ...user,
          email_preferences: preferences || [],
        }
      }),
    )

    return {
      data: usersWithPreferences,
      error: null,
    }
  } catch (error: any) {
    console.error("Error fetching users with email preferences:", error)
    return {
      data: [],
      error: error.message || "Failed to fetch users",
    }
  }
}

// Function to fetch highlights for a user
export async function fetchUserHighlights(userId: string, highlightId?: string | null) {
  try {
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from("highlights")
      .select(`
        id,
        content,
        book_id,
        books:book_id(
          title,
          author
        )
      `)
      .eq("user_id", userId)

    // If a specific highlight is requested, filter by it
    if (highlightId) {
      query = query.eq("id", highlightId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return {
      data: data || [],
      error: null,
    }
  } catch (error: any) {
    console.error("Error fetching user highlights:", error)
    return {
      data: [],
      error: error.message || "Failed to fetch highlights",
    }
  }
}

// Function to fetch user profile
export async function fetchUserProfile(userId: string) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.from("users").select("id, email, name").eq("id", userId).single()

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

// Function to log email activity
export async function logEmailActivity(userId: string, status: string, details: any) {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.from("email_logs").insert({
      user_id: userId,
      status,
      details,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error logging email activity:", error)
    }

    return { success: !error }
  } catch (error) {
    console.error("Error in logEmailActivity:", error)
    return { success: false }
  }
}
