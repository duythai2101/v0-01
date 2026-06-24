"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HighlightCard } from "@/components/highlight-card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Book, Tag } from "@/types/database"

export default function BookPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [highlights, setHighlights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("tags").select("*").order("name", { ascending: true })

        if (error) throw error
        setTags(data || [])
      } catch (error) {
        console.error("Error fetching tags:", error)
      }
    }

    fetchTags()
  }, [user])

  const fetchBookAndHighlights = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // Fetch book details
      const { data: bookData, error: bookError } = await supabase.from("books").select("*").eq("id", params.id).single()

      if (bookError) throw bookError
      setBook(bookData)

      // Fetch highlights (xoá join với highlight_tags)
      const { data: highlightsData, error: highlightsError } = await supabase
        .from("highlights")
        .select(`
          id,
          content,
          created_at,
          book_id,
          favorite,
          books:book_id (
            title,
            author,
            cover_url
          )
        `)
        .eq("book_id", params.id)
        .order("created_at", { ascending: false })

      if (highlightsError) throw highlightsError

      // Format highlights data
      const formattedHighlights: any[] = (highlightsData || []).map((h: any) => ({
        id: h.id,
        content: h.content,
        created_at: new Date(h.created_at),
        favorite: h.favorite || false,
        book: {
          title: h.books?.title || "Unknown Book",
          author: h.books?.author,
          cover_url: h.books?.cover_url,
        },
      }))

      setHighlights(formattedHighlights)
    } catch (error: any) {
      console.error("Error fetching book data:", error)
      setError(error.message || "Failed to load book data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBookAndHighlights()
    }
  }, [user, params.id])

  const handleAddHighlight = () => {
    router.push(`/favorites/add?bookId=${params.id}`)
  }

  const handleEditHighlight = (id: string) => {
    router.push(`/favorites/${id}/edit`)
  }

  const handleDeleteHighlight = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("highlights").delete().eq("id", id)

      if (error) throw error

      // Refresh highlights
      fetchBookAndHighlights()
    } catch (error: any) {
      console.error("Error deleting highlight:", error)
      setError(error.message || "Failed to delete highlight")
    }
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase.from("highlights").update({ favorite: !currentFavorite }).eq("id", id)

      if (error) throw error

      // Update local state
      setHighlights(highlights.map((h) => (h.id === id ? { ...h, favorite: !currentFavorite } : h)))
    } catch (error: any) {
      console.error("Error toggling favorite:", error)
      setError(error.message || "Failed to update favorite")
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Book not found</h3>
        <p className="text-muted-foreground mb-6">The book you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => router.push("/books")}>Back to Books</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background space-y-8">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push("/library")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-[-1rem]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            {book.author && <p className="text-muted-foreground mt-2">by {book.author}</p>}
          </div>
          <Button onClick={handleAddHighlight}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Highlight
          </Button>
        </div>

        {error && (
          <Alert className="border border-destructive/20 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {highlights.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No highlights yet</h3>
            <p className="text-muted-foreground mb-6">Add your first highlight for this book</p>
            <Button onClick={handleAddHighlight}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Highlight
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {highlights.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                id={highlight.id}
                content={highlight.content}
                bookTitle={highlight.book.title}
                author={highlight.book.author || undefined}
                createdAt={highlight.created_at}
                favorite={highlight.favorite}
                onEdit={handleEditHighlight}
                onDelete={handleDeleteHighlight}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
