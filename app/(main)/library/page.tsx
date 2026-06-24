"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookCard } from "@/components/book-card"
import { PlusCircle, Loader2, AlertCircle, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import type { Book, Tag } from "@/types/database"
import debounce from "lodash/debounce"

interface BookWithHighlightCount extends Book {
  highlightCount: number
  tags?: Tag[]
}

export default function LibraryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [books, setBooks] = useState<BookWithHighlightCount[]>([])
  const [filteredBooks, setFilteredBooks] = useState<BookWithHighlightCount[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setFilteredBooks(books)
        return
      }

      const searchQuery = query.toLowerCase().trim()
      const filtered = books.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery) ||
          (book.author && book.author.toLowerCase().includes(searchQuery)),
      )
      setFilteredBooks(filtered)
    }, 300),
    [books],
  )

  // Update search results when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select(`
            *,
            book_tags (
              tags:tag_id (
                id, name, color, user_id, created_at
              )
            )
          `)
          .order("title", { ascending: true })

        if (booksError) {
          throw booksError
        }

        if (!booksData || booksData.length === 0) {
          setBooks([])
          setFilteredBooks([])
          setIsLoading(false)
          return
        }

        // Process books in batches to avoid rate limiting
        const batchSize = 5
        const booksWithCounts: BookWithHighlightCount[] = []

        for (let i = 0; i < booksData.length; i += batchSize) {
          const batch = booksData.slice(i, i + batchSize)

          // Process each book in the batch in parallel
          const batchResults = await Promise.all(
            batch.map(async (book: any) => {
              try {
                // Add a small delay between requests to avoid rate limiting
                await new Promise((resolve) => setTimeout(resolve, 100))

                const { count, error: countError } = await supabase
                  .from("highlights")
                  .select("id", { count: "exact", head: true })
                  .eq("book_id", book.id)

                if (countError) {
                  console.warn(`Error fetching highlight count for book ${book.id}:`, countError)
                  return {
                    ...book,
                    highlightCount: 0,
                    tags: book.book_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
                  }
                }

                return {
                  ...book,
                  highlightCount: count || 0,
                  tags: book.book_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
                }
              } catch (err) {
                console.warn(`Error processing book ${book.id}:`, err)
                return {
                  ...book,
                  highlightCount: 0,
                  tags: [],
                }
              }
            }),
          )

          booksWithCounts.push(...batchResults)
        }

        setBooks(booksWithCounts)
        setFilteredBooks(booksWithCounts)
      } catch (error: any) {
        console.error("Error fetching books:", error)

        // Check if it's a rate limiting error
        if (error.message && error.message.includes("Too Many")) {
          if (retryCount < 3) {
            // Retry with exponential backoff
            const delay = Math.pow(2, retryCount) * 1000
            console.log(`Rate limited. Retrying in ${delay}ms...`)
            setError(`Rate limited by Supabase. Retrying in ${delay / 1000} seconds...`)

            setTimeout(() => {
              setRetryCount(retryCount + 1)
            }, delay)

            return
          } else {
            setError("Too many requests. Please try again later.")
          }
        } else {
          setError("Failed to load books. Please try again.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [user, retryCount])

  const handleAddBook = () => {
    router.push("/books/add")
  }

  const handleEditBook = (id: string) => {
    router.push(`/books/${id}/edit`)
  }

  const handleDeleteBook = async (id: string) => {
    if (!user) return

    try {
      setIsDeleting(true)
      setError(null)

      // Delete book from database (book_tags will be cascade deleted)
      const { error: deleteError } = await supabase.from("books").delete().eq("id", id).eq("user_id", user.id)

      if (deleteError) throw deleteError

      // Update local state
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== id))
      setFilteredBooks((prevBooks) => prevBooks.filter((book) => book.id !== id))
    } catch (error: any) {
      console.error("Error deleting book:", error)
      setError(error.message || "Failed to delete book. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library</h1>
          <p className="text-muted-foreground mt-2">Manage your collection of books and texts.</p>
        </div>
        <Button onClick={handleAddBook}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </div>

      {error && (
        <Alert className="border border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên sách hoặc tác giả..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredBooks.length === 0 && !isLoading && !error ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">
            {books.length === 0 ? "Your library is empty" : "No books found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {books.length === 0 ? "Add your first book to get started" : "Try adjusting your search query"}
          </p>
          {books.length === 0 && (
            <Button onClick={handleAddBook}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Book
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author || undefined}
              highlightCount={book.highlightCount}
              coverUrl={book.cover_url}
              tags={book.tags}
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
            />
          ))}
        </div>
      )}
    </div>
  )
}
