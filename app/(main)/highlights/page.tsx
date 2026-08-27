"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Plus, Search, Upload } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HighlightCard } from "@/components/highlight-card"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { cn } from "@/lib/utils"

interface HighlightItem {
  id: string
  content: string
  created_at: string
  favorite: boolean
  book_id: string
  bookTitle: string
  author?: string
  tagIds: string[]
}

interface TagOption {
  id: string
  name: string
  color: string
}

export default function HighlightsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [highlights, setHighlights] = useState<HighlightItem[]>([])
  const [tags, setTags] = useState<TagOption[]>([])
  const [query, setQuery] = useState("")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHighlights = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("highlights")
        .select("id, content, created_at, favorite, book_id, books:book_id(title, author)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Tags live on the book, so a highlight inherits its book's tags.
      const { data: bookTagData } = await supabase
        .from("book_tags")
        .select("book_id, tags:tag_id(id, name, color)")
        .eq("user_id", user.id)

      const tagsByBook = new Map<string, string[]>()
      const tagById = new Map<string, TagOption>()
      for (const row of (bookTagData || []) as any[]) {
        if (!row.tags) continue
        tagById.set(row.tags.id, row.tags)
        const list = tagsByBook.get(row.book_id) || []
        list.push(row.tags.id)
        tagsByBook.set(row.book_id, list)
      }

      setTags(Array.from(tagById.values()).sort((a, b) => a.name.localeCompare(b.name)))
      setHighlights(
        (data || []).map((row: any) => ({
          id: row.id,
          content: row.content,
          created_at: row.created_at,
          favorite: row.favorite || false,
          book_id: row.book_id,
          bookTitle: row.books?.title || "Sách không xác định",
          author: row.books?.author || undefined,
          tagIds: tagsByBook.get(row.book_id) || [],
        })),
      )
    } catch (err: any) {
      console.error("Error fetching highlights:", err)
      setError("Không tải được highlight. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchHighlights()
  }, [user])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return highlights.filter((highlight) => {
      if (favoritesOnly && !highlight.favorite) return false
      if (activeTagId && !highlight.tagIds.includes(activeTagId)) return false
      if (!needle) return true
      return (
        highlight.content.toLowerCase().includes(needle) ||
        highlight.bookTitle.toLowerCase().includes(needle) ||
        (highlight.author || "").toLowerCase().includes(needle)
      )
    })
  }, [highlights, query, favoritesOnly, activeTagId])

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      const { error: deleteError } = await supabase.from("highlights").delete().eq("id", id)
      if (deleteError) throw deleteError
      setHighlights((previous) => previous.filter((highlight) => highlight.id !== id))
    } catch (err: any) {
      console.error("Error deleting highlight:", err)
      setError(err.message || "Không xoá được highlight.")
    }
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    if (!user) return
    const { error: updateError } = await supabase
      .from("highlights")
      .update({ favorite: !currentFavorite })
      .eq("id", id)
    if (updateError) {
      console.error("Error toggling favorite:", updateError)
      throw updateError
    }
    setHighlights((previous) =>
      previous.map((highlight) =>
        highlight.id === id ? { ...highlight, favorite: !currentFavorite } : highlight,
      ),
    )
  }

  const favoriteCount = highlights.filter((highlight) => highlight.favorite).length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Highlight"
        description={
          isLoading
            ? undefined
            : `${highlights.length.toLocaleString()} highlight · ${favoriteCount} yêu thích`
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/highlights/upload">
                <Upload className="mr-1.5 h-4 w-4" />
                Tải lên
              </Link>
            </Button>
            <Button asChild>
              <Link href="/highlights/add">
                <Plus className="mr-1.5 h-4 w-4" />
                Thêm
              </Link>
            </Button>
          </>
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
            placeholder="Tìm trong nội dung highlight, tên sách, tác giả"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              favoritesOnly
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Chỉ yêu thích
          </button>
          {tags.map((tag) => (
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
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={highlights.length === 0 ? "Chưa có highlight nào" : "Không có kết quả"}
          description={
            highlights.length === 0
              ? "Lưu một đoạn bạn tâm đắc, hoặc tải lên một đoạn văn bản để tách thành nhiều highlight."
              : "Thử bỏ bớt bộ lọc hoặc đổi từ khoá."
          }
          action={
            highlights.length === 0 ? (
              <Button asChild>
                <Link href="/highlights/add">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Thêm highlight
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              id={highlight.id}
              content={highlight.content}
              bookTitle={highlight.bookTitle}
              author={highlight.author}
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
