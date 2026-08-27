"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Book } from "@/types/database"

interface NewHighlightFormProps {
  books: Book[]
  onSubmit: (values: { content: string; bookId: string }) => Promise<void> | void
  /** Preselects a book, e.g. when adding from a book's own page. */
  defaultBookId?: string
  autoFocus?: boolean
}

export function NewHighlightForm({ books, onSubmit, defaultBookId, autoFocus }: NewHighlightFormProps) {
  const [content, setContent] = useState("")
  const [bookId, setBookId] = useState(defaultBookId || "")
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!content.trim()) {
      setFormError("Chưa có nội dung highlight.")
      return
    }
    if (!bookId) {
      setFormError("Chọn cuốn sách chứa đoạn này.")
      return
    }

    try {
      setIsSubmitting(true)
      setFormError("")
      await onSubmit({ content, bookId })
      setContent("")
      setBookId(defaultBookId || "")
    } catch (error) {
      console.error("Error submitting highlight:", error)
      setFormError("Không lưu được. Thử lại nhé.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (books.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">Cần có ít nhất một cuốn sách trước khi ghi highlight.</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/books/add">Thêm sách</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-5">
      <Textarea
        autoFocus={autoFocus}
        placeholder="Chép lại đoạn bạn tâm đắc…"
        className="min-h-[120px] resize-none border-0 bg-transparent p-0 font-serif text-[15px] leading-[1.7] shadow-none focus-visible:ring-0"
        value={content}
        onChange={(event) => {
          setContent(event.target.value)
          if (formError) setFormError("")
        }}
        disabled={isSubmitting}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Select
          value={bookId}
          onValueChange={(value) => {
            setBookId(value)
            if (formError) setFormError("")
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger className="h-9 w-full sm:w-[240px]">
            <SelectValue placeholder="Chọn sách" />
          </SelectTrigger>
          <SelectContent>
            {books.map((book) => (
              <SelectItem key={book.id} value={book.id}>
                {book.title}
                {book.author ? ` — ${book.author}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit" size="sm" className="ml-auto" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {isSubmitting ? "Đang lưu…" : "Lưu highlight"}
        </Button>
      </div>

      {formError && <p className="mt-3 text-sm text-destructive">{formError}</p>}
    </form>
  )
}
