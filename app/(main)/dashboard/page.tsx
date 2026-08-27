"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HighlightCard } from "@/components/highlight-card"
import { NewHighlightForm } from "@/components/new-highlight-form"
import { ReadingReport } from "@/components/reading-report"
import { PageHeader } from "@/components/page-header"
import type { Book } from "@/types/database"

interface RecentHighlight {
  id: string
  content: string
  bookTitle: string
  author?: string
  createdAt: Date
  favorite: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [recent, setRecent] = useState<RecentHighlight[]>([])
  const [userName, setUserName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!user) return

    try {
      setError(null)

      const [booksResult, highlightsResult] = await Promise.all([
        supabase.from("books").select("*").eq("user_id", user.id).order("title", { ascending: true }),
        supabase
          .from("highlights")
          .select("id, content, created_at, favorite, books:book_id(title, author)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3),
      ])

      if (booksResult.error) throw booksResult.error
      if (highlightsResult.error) throw highlightsResult.error

      setBooks(booksResult.data || [])
      setRecent(
        (highlightsResult.data || []).map((row: any) => ({
          id: row.id,
          content: row.content,
          bookTitle: row.books?.title || "Sách không xác định",
          author: row.books?.author || undefined,
          createdAt: new Date(row.created_at),
          favorite: row.favorite || false,
        })),
      )
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err)
      setError("Không tải được dữ liệu. Vui lòng thử lại.")
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  useEffect(() => {
    const loadUserName = async () => {
      if (!user) return
      const { data } = await supabase.from("users").select("name").eq("id", user.id).single()
      setUserName(data?.name || null)
    }
    loadUserName()
  }, [user])

  const handleAddHighlight = async (values: { content: string; bookId: string }) => {
    if (!user) return
    const { error: insertError } = await supabase.from("highlights").insert({
      content: values.content.trim(),
      book_id: values.bookId,
      user_id: user.id,
    })
    if (insertError) throw insertError
    await fetchData()
  }

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from("highlights").delete().eq("id", id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await fetchData()
  }

  const handleToggleFavorite = async (id: string, currentFavorite: boolean) => {
    const { error: updateError } = await supabase
      .from("highlights")
      .update({ favorite: !currentFavorite })
      .eq("id", id)
    if (updateError) throw updateError
    setRecent((previous) =>
      previous.map((item) => (item.id === id ? { ...item, favorite: !currentFavorite } : item)),
    )
  }

  const greeting = userName || user?.email?.split("@")[0] || ""

  return (
    <div className="space-y-12">
      <PageHeader
        title={greeting ? `Chào ${greeting}` : "Tổng quan"}
        description="Nhịp đọc và những gì bạn đã ghi lại."
      />

      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ReadingReport />

      <section className="space-y-4">
        <h2 className="font-serif text-lg text-foreground">Ghi nhanh</h2>
        <NewHighlightForm books={books} onSubmit={handleAddHighlight} />
      </section>

      {recent.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg text-foreground">Gần đây</h2>
            <Link
              href="/highlights"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Xem tất cả
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recent.map((highlight) => (
              <HighlightCard
                key={highlight.id}
                id={highlight.id}
                content={highlight.content}
                bookTitle={highlight.bookTitle}
                author={highlight.author}
                createdAt={highlight.createdAt}
                favorite={highlight.favorite}
                onEdit={(id) => router.push(`/highlights/${id}/edit`)}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
