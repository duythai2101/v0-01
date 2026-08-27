"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Plus, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookRow } from "@/components/book-row"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"
import type { Tag } from "@/types/database"

interface BookWithMeta {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  highlightCount: number
  tags: Tag[]
}

export default function LibraryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [books, setBooks] = useState<BookWithMeta[]>([])
  const [query, setQuery] = useState("")
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        // Two queries total. The previous version counted highlights one book
        // at a time with a 100ms sleep between each, which scaled terribly.
        const [booksResult, highlightsResult] = await Promise.all([
          supabase
            .from("books")
            .select("id, title, author, cover_url, book_tags(tags:tag_id(id, name, color, user_id, created_at))")
            .eq("user_id", user.id)
            .order("title", { ascending: true }),
          supabase.from("highlights").select("book_id").eq("user_id", user.id),
        ])

        if (booksResult.error) throw booksResult.error
        if (highlightsResult.error) throw highlightsResult.error

        const counts = new Map<string, number>()
        for (const row of highlightsResult.data || []) {
          counts.set(row.book_id, (counts.get(row.book_id) || 0) + 1)
        }

        setBooks(
          (booksResult.data || []).map((book: any) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
            highlightCount: counts.get(book.id) || 0,
            tags: (book.book_tags || []).map((bt: any) => bt.tags).filter(Boolean),
          })),
        )
      } catch (err: any) {
        console.error("Error fetching books:", err)
        setError("Không tải được thư viện. Vui lòng thử lại.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [user])

  // Tag filter replaces the separate Book Tags page.
  const allTags = useMemo(() => {
    const byId = new Map<string, Tag>()
    books.forEach((book) => book.tags.forEach((tag) => byId.set(tag.id, tag)))
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [books])

  const visibleBooks = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return books.filter((book) => {
      const matchesTag = !activeTagId || book.tags.some((tag) => tag.id === activeTagId)
      const matchesQuery =
        !needle ||
        book.title.toLowerCase().includes(needle) ||
        (book.author || "").toLowerCase().includes(needle)
      return matchesTag && matchesQuery
    })
  }, [books, query, activeTagId])

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      const { error: deleteError } = await supabase.from("books").delete().eq("id", id).eq("user_id", user.id)
      if (deleteError) throw deleteError
      setBooks((previous) => previous.filter((book) => book.id !== id))
    } catch (err: any) {
      console.error("Error deleting book:", err)
      setError(err.message || "Không xoá được sách.")
    }
  }

  const totalHighlights = books.reduce((sum, book) => sum + book.highlightCount, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Thư viện"
        description={
          isLoading
            ? undefined
            : `${books.length} cuốn · ${totalHighlights.toLocaleString()} highlight`
        }
        actions={
          <Button asChild>
            <Link href="/books/add">
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm sách
            </Link>
          </Button>
        }
      />

      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sách hoặc tác giả"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTagId(null)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                activeTagId === null
                  ? "border-foreground/25 bg-secondary text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              Tất cả
            </button>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                  activeTagId === tag.id
                    ? "border-foreground/25 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tag.color || "hsl(var(--muted-foreground))" }}
                />
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      ) : visibleBooks.length === 0 ? (
        <EmptyState
          title={books.length === 0 ? "Thư viện còn trống" : "Không tìm thấy cuốn nào"}
          description={
            books.length === 0
              ? "Thêm cuốn sách đầu tiên để bắt đầu lưu highlight."
              : "Thử đổi từ khoá hoặc bỏ bộ lọc chủ đề."
          }
          action={
            books.length === 0 ? (
              <Button asChild>
                <Link href="/books/add">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Thêm sách
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="border-t border-border">
          {visibleBooks.map((book) => (
            <BookRow
              key={book.id}
              id={book.id}
              title={book.title}
              author={book.author || undefined}
              highlightCount={book.highlightCount}
              coverUrl={book.cover_url}
              tags={book.tags}
              onEdit={(id) => router.push(`/books/${id}/edit`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
