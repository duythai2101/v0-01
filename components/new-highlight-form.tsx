"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Book } from "@/types/database"

interface NewHighlightFormProps {
  books: Book[]
  onSubmit: (values: { content: string; bookId: string }) => void
  onAddBook: (book: { title: string; author?: string }) => void
}

export function NewHighlightForm({ books, onSubmit, onAddBook }: NewHighlightFormProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [bookId, setBookId] = useState("")
  const [contentError, setContentError] = useState("")
  const [bookIdError, setBookIdError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    let hasError = false

    if (!content.trim()) {
      setContentError("Highlight content is required")
      hasError = true
    }

    if (!bookId) {
      setBookIdError("Please select a book")
      hasError = true
    }

    if (hasError) return

    try {
      setIsSubmitting(true)
      await onSubmit({ content, bookId })

      // Reset form
      setContent("")
      setBookId("")
    } catch (error) {
      console.error("Error submitting highlight:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Highlight</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Highlight
            </label>
            <Textarea
              placeholder="Enter your highlight here..."
              className="min-h-[120px]"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                if (e.target.value.trim()) setContentError("")
              }}
              disabled={isSubmitting}
            />
            {contentError && <p className="text-sm text-destructive">{contentError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Book
            </label>
            <div className="flex gap-2">
              <Select
                value={bookId}
                onValueChange={(value) => {
                  setBookId(value)
                  setBookIdError("")
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {book.title} {book.author ? `by ${book.author}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => router.push("/books/add")}
                disabled={isSubmitting}
              >
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">Add new book</span>
              </Button>
            </div>
            {bookIdError && <p className="text-sm text-destructive">{bookIdError}</p>}
            {books.length === 0 && (
              <p className="text-sm text-muted-foreground">No books found. Please add a book first.</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || books.length === 0} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Highlight"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
