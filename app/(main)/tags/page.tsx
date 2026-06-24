"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookCard } from "@/components/book-card"
import { Loader2, AlertCircle, TagIcon, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Book, Tag } from "@/types/database"

interface BookWithHighlightCount extends Book {
  highlightCount: number
  tags?: Tag[]
}

interface TagWithBooks extends Tag {
  books: BookWithHighlightCount[]
}

export default function TagsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tags, setTags] = useState<TagWithBooks[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null)

  useEffect(() => {
    const fetchTagsWithBooks = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        const { data: tagsData, error: tagsError } = await supabase
          .from("tags")
          .select("*")
          .order("name", { ascending: true })

        if (tagsError) throw tagsError

        if (!tagsData || tagsData.length === 0) {
          setTags([])
          setIsLoading(false)
          return
        }

        const tagsWithBooks = await Promise.all(
          tagsData.map(async (tag) => {
            const { data: bookTagsData, error: bookTagsError } = await supabase
              .from("book_tags")
              .select("book_id")
              .eq("tag_id", tag.id)

            if (bookTagsError) {
              console.error(`Error fetching books for tag ${tag.id}:`, bookTagsError)
              return { ...tag, books: [] }
            }

            if (!bookTagsData || bookTagsData.length === 0) {
              return { ...tag, books: [] }
            }

            const bookIds = bookTagsData.map((bt) => bt.book_id)

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
              .in("id", bookIds)

            if (booksError) {
              console.error(`Error fetching book details for tag ${tag.id}:`, booksError)
              return { ...tag, books: [] }
            }

            const booksWithCounts = await Promise.all(
              (booksData || []).map(async (book: any) => {
                const { count, error: countError } = await supabase
                  .from("highlights")
                  .select("id", { count: "exact", head: true })
                  .eq("book_id", book.id)

                return {
                  ...book,
                  highlightCount: count || 0,
                  tags: book.book_tags?.map((bt: any) => bt.tags).filter(Boolean) || [],
                }
              }),
            )

            return { ...tag, books: booksWithCounts }
          }),
        )

        const tagsWithBooksFiltered = tagsWithBooks.filter((tag) => tag.books.length > 0)
        setTags(tagsWithBooksFiltered)
      } catch (error: any) {
        console.error("Error fetching tags with books:", error)
        setError("Failed to load tags. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTagsWithBooks()
  }, [user])

  const handleEditBook = (id: string) => {
    router.push(`/books/${id}/edit`)
  }

  const handleDeleteBook = async (id: string) => {
    if (!user) return

    try {
      setIsDeleting(true)
      setError(null)

      const { error: deleteError } = await supabase.from("books").delete().eq("id", id).eq("user_id", user.id)

      if (deleteError) throw deleteError

      setTags((prevTags) =>
        prevTags
          .map((tag) => ({
            ...tag,
            books: tag.books.filter((book) => book.id !== id),
          }))
          .filter((tag) => tag.books.length > 0),
      )
    } catch (error: any) {
      console.error("Error deleting book:", error)
      setError(error.message || "Failed to delete book. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!user) return

    try {
      setDeletingTagId(tagId)
      setError(null)

      const { error: deleteError } = await supabase.from("tags").delete().eq("id", tagId).eq("user_id", user.id)

      if (deleteError) throw deleteError

      setTags((prevTags) => prevTags.filter((tag) => tag.id !== tagId))

      toast({
        title: "Tag deleted",
        description: `Tag "${tagName}" has been deleted successfully.`,
      })
    } catch (error: any) {
      console.error("Error deleting tag:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete tag. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingTagId(null)
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
          <h1 className="text-3xl font-bold tracking-tight">Book Tags</h1>
          <p className="text-muted-foreground mt-2">Browse your books organized by tags.</p>
        </div>
      </div>

      {error && (
        <Alert className="border border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {tags.length === 0 && !isLoading && !error ? (
        <div className="text-center py-12">
          <TagIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No tags found</h3>
          <p className="text-muted-foreground">Add tags to your books to organize them better.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {tags.map((tag) => (
            <div key={tag.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  className="text-base px-4 py-1.5"
                  style={{
                    backgroundColor: tag.color,
                    color: "#fff",
                  }}
                >
                  <TagIcon className="h-4 w-4 mr-2" />
                  {tag.name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {tag.books.length} {tag.books.length === 1 ? "book" : "books"}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive ml-auto"
                      disabled={deletingTagId === tag.id}
                    >
                      {deletingTagId === tag.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the tag "{tag.name}"? This will remove the tag from all{" "}
                        {tag.books.length} book{tag.books.length === 1 ? "" : "s"}, but the books themselves will not be
                        deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTag(tag.id, tag.name)
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Tag
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pl-4 border-l-2"
                style={{ borderColor: tag.color }}
              >
                {tag.books.map((book) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
