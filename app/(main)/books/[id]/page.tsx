"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { AlertCircle, ArrowLeft, Pencil, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { HighlightCard } from "@/components/highlight-card"
import { EmptyState } from "@/components/empty-state"
import type { Book, Tag } from "@/types/database"

interface BookHighlight {
  id: string
  content: string
  created_at: string
  favorite: boolean
}

export default function BookPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [highlights, setHighlights] = useState<BookHighlight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBook = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const [bookResult, highlightsResult, tagResult] = await Promise.all([
        supabase.from("books").select("*").eq("id", params.id).single(),
        supabase
          .from("highlights")
          .select("id, content, created_at, favorite")
          .eq("book_id", params.id)
          .order("created_at", { ascending: false }),
        supabase.from("book_tags").select("tags:tag_id(id, name, color, user_id, created_at)").eq("book_id", params.id),
      ])

      if (bookResult.error) throw bookResult.error
      if (highlightsResult.error) throw highlightsResult.error

      setBook(bookResult.data)
      setHighlights(highlightsResult.data || [])
      setTags(((tagResult.data || []) as any[]).map((row) => row.tags).filter(Boolean))
    } catch (err: any) {
      console.error("Error fetching book data:", err)
      setError("Không tải được dữ liệu sách.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchBook()
  }, [user, params.id])

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from("highlights").delete().eq("id", id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setHighlights((previous) => previous.filter((highlight) => highlight.id !== id))
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error: updateError } = await supabase
      .from("highlights")
      .update({ favorite: !currentFavorite })
      .eq("id", id)
    if (updateError) throw updateError
    setHighlights((previous) =>
      previous.map((highlight) =>
        highlight.id === id ? { ...highlight, favorite: !currentFavorite } : highlight,
      ),
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-24 animate-pulse rounded bg-muted/60" />
        <div className="h-24 animate-pulse rounded-md bg-muted/60" />
        <div className="h-32 animate-pulse rounded-md bg-muted/60" />
      </div>
    )
  }

  if (!book) {
    return (
      <EmptyState
        title="Không tìm thấy cuốn sách này"
        description="Sách có thể đã bị xoá."
        action={
          <Button asChild variant="outline">
            <Link href="/library">Về thư viện</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-10">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Thư viện
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 gap-5">
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt=""
              width={72}
              height={104}
              className="h-[104px] w-[72px] shrink-0 rounded-sm border border-border object-cover"
            />
          ) : (
            <div className="h-[104px] w-[72px] shrink-0 rounded-sm border border-border bg-muted" aria-hidden />
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-[28px] leading-tight tracking-tight text-foreground">{book.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{book.author || "Không rõ tác giả"}</p>
            <p className="tabular mt-3 text-sm text-muted-foreground">
              {highlights.length} highlight
            </p>
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: tag.color || "hsl(var(--muted-foreground))" }}
                    />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/books/${params.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Sửa
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/highlights/add?bookId=${params.id}`}>
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm highlight
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {highlights.length === 0 ? (
        <EmptyState
          title="Chưa có highlight nào cho cuốn này"
          description="Ghi lại đoạn đầu tiên bạn tâm đắc."
          action={
            <Button asChild>
              <Link href={`/highlights/add?bookId=${params.id}`}>
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm highlight
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {highlights.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              id={highlight.id}
              content={highlight.content}
              bookTitle={book.title}
              author={book.author || undefined}
              createdAt={new Date(highlight.created_at)}
              favorite={highlight.favorite}
              onEdit={(id) => router.push(`/highlights/${id}/edit`)}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
