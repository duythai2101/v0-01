import { createClient } from "./supabase/client"

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Get the Supabase client instance (creates it if it doesn't exist)
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient()
  }
  return supabaseInstance
}

// Export the supabase client for convenience
export const supabase = getSupabaseClient()
