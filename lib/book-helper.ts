import { getSupabaseAdmin } from "./supabase-admin"

/**
 * Get a random book from a specific user's library
 * @param userId The user ID to fetch books from
 * @returns A random book with details, or null if no books found
 */
export async function getRandomBookFromUser(userId: string) {
  try {
    console.log(`[BookHelper] Fetching random book from user: ${userId}`)

    const supabase = getSupabaseAdmin()

    // Get all books from the user
    const { data: books, error } = await supabase
      .from("books")
      .select("id, title, author, genre, rating, cover_url")
      .eq("user_id", userId)
      .limit(100)

    if (error || !books || books.length === 0) {
      console.warn(`[BookHelper] No books found for user ${userId}:`, error)
      return null
    }

    // Select a random book from the list
    const randomIndex = Math.floor(Math.random() * books.length)
    const randomBook = books[randomIndex]

    console.log(
      `[BookHelper] Selected random book: "${randomBook.title}" by ${randomBook.author} from ${books.length} books`
    )

    return {
      id: randomBook.id,
      title: randomBook.title,
      author: randomBook.author,
      genre: randomBook.genre,
      rating: randomBook.rating,
      coverUrl: randomBook.cover_url,
    }
  } catch (error: any) {
    console.error(`[BookHelper] Error fetching random book from user ${userId}:`, error)
    return null
  }
}

/**
 * Get a specific book by ID with full details including tags
 * @param bookId The book ID to fetch
 * @returns Book details with tags, or null if not found
 */
export async function getBookWithDetails(bookId: string) {
  try {
    const supabase = getSupabaseAdmin()

    // Get book details
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, title, author, genre, rating, cover_url")
      .eq("id", bookId)
      .single()

    if (bookError || !book) {
      console.warn(`[BookHelper] Book not found: ${bookId}`, bookError)
      return null
    }

    // Get book tags if they exist in a separate table
    const { data: tags, error: tagsError } = await supabase
      .from("book_tags")
      .select("tag")
      .eq("book_id", bookId)

    if (tagsError) {
      console.warn(`[BookHelper] Error fetching tags for book ${bookId}:`, tagsError)
    }

    const tagList = tags ? tags.map((t: any) => t.tag) : []

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      rating: book.rating,
      coverUrl: book.cover_url,
      tags: tagList,
    }
  } catch (error: any) {
    console.error(`[BookHelper] Error fetching book ${bookId}:`, error)
    return null
  }
}

/**
 * Get related books based on genre or author similarity
 * @param bookId The primary book ID
 * @param limit Number of related books to return
 * @returns Array of related books
 */
export interface BookForEmail {
  title: string
  author: string
  genre?: string
  rating?: number
  coverUrl?: string
  tags?: string[]
  reason: string
}

/**
 * Get a random book from a user for email recommendations
 * @param userId The user ID to fetch books from
 * @returns Book details formatted for email, or null if no books found
 */
export async function getRandomBookForEmailFromUser(userId: string): Promise<BookForEmail | null> {
  try {
    const relatedBook = await getRandomBookFromUser(userId)
    if (!relatedBook) return null

    const bookDetails = await getBookWithDetails(relatedBook.id)

    return {
      title: bookDetails?.title || relatedBook.title,
      author: bookDetails?.author || relatedBook.author,
      genre: bookDetails?.genre || relatedBook.genre,
      rating: bookDetails?.rating || relatedBook.rating,
      coverUrl: bookDetails?.coverUrl || relatedBook.coverUrl,
      tags: bookDetails?.tags || [],
      reason: "Sách được yêu thích của cộng đồng độc giả",
    }
  } catch (error: any) {
    console.error(`[BookHelper] Error getting random book for email from user ${userId}:`, error)
    return null
  }
}

export async function getRelatedBooks(bookId: string, limit: number = 5) {
  try {
    const supabase = getSupabaseAdmin()

    // Get the primary book details
    const { data: primaryBook, error: primaryError } = await supabase
      .from("books")
      .select("genre, author")
      .eq("id", bookId)
      .single()

    if (primaryError || !primaryBook) {
      console.warn(`[BookHelper] Primary book not found: ${bookId}`)
      return []
    }

    // Find similar books (same genre or author)
    const { data: relatedBooks, error: relatedError } = await supabase
      .from("books")
      .select("id, title, author, genre, rating, cover_url")
      .or(`genre.eq.${primaryBook.genre},author.eq.${primaryBook.author}`)
      .neq("id", bookId) // Exclude the primary book
      .limit(limit)

    if (relatedError) {
      console.warn(`[BookHelper] Error fetching related books:`, relatedError)
      return []
    }

    return (
      relatedBooks?.map((book: any) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        rating: book.rating,
        coverUrl: book.cover_url,
        relationshipReason:
          book.genre === primaryBook.genre && book.author === primaryBook.author
            ? "Same author and genre"
            : book.author === primaryBook.author
              ? "Same author"
              : "Similar genre",
      })) || []
    )
  } catch (error: any) {
    console.error(`[BookHelper] Error fetching related books for ${bookId}:`, error)
    return []
  }
}
