import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    try {
      const supabase = await createClient()

      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code)

      // Redirect to the home page
      return NextResponse.redirect(new URL("/", request.url))
    } catch (error) {
      console.error("Error in auth callback:", error)
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL("/auth/login", request.url))
}
