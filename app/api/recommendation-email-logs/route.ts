import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("recommendation_email_logs")
      .select(
        "id, user_id, user_email, user_name, book_title, book_author, book_genre, book_rating, reason, sent_at, vote, voted_at, created_at"
      )
      .order("sent_at", { ascending: false })

    if (error) {
      console.error("[API] Failed to fetch recommendation_email_logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    console.error("[API] Unexpected error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
