import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

// Fixed user ID for book recommendations
const BOOK_RECOMMENDATION_USER_ID = "27b9cad7-7e48-4d6c-86e7-28942fb775ba"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()

    console.log("[API] Fetching books for user:", BOOK_RECOMMENDATION_USER_ID)

    // First, try to fetch all columns to see what's available
    const { data: allBooks, error: allError } = await supabase
      .from("books")
      .select("*")
      .eq("user_id", BOOK_RECOMMENDATION_USER_ID)
      .limit(1)

    if (allError) {
      console.error("[API] Error checking schema:", allError)
    } else if (allBooks && allBooks.length > 0) {
      console.log("[API] Sample book object keys:", Object.keys(allBooks[0]))
      console.log("[API] Sample book object:", allBooks[0])
    }

    // Fetch books from the specific user with all possible column names
    const { data: books, error } = await supabase
      .from("books")
      .select("id, title, author, cover_url")
      .eq("user_id", BOOK_RECOMMENDATION_USER_ID)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching books:", error)
      // Try alternative column name
      const { data: booksAlt, error: errorAlt } = await supabase
        .from("books")
        .select("id, title, author, coverUrl")
        .eq("user_id", BOOK_RECOMMENDATION_USER_ID)
        .order("created_at", { ascending: false })

      if (errorAlt) {
        console.error("[API] Error with alternative column name:", errorAlt)
        return NextResponse.json(
          { error: "Failed to fetch books", details: errorAlt.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        books: booksAlt || [],
        count: booksAlt?.length || 0,
      })
    }

    console.log("[API] Successfully fetched books:", books?.length || 0)

    return NextResponse.json({
      success: true,
      books: books || [],
      count: books?.length || 0,
    })
  } catch (error: any) {
    console.error("[API] Unexpected error fetching books:", error)
    return NextResponse.json(
      { error: "Unexpected error", details: error.message },
      { status: 500 }
    )
  }
}
