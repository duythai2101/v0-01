"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { useToast } from "@/hooks/use-toast"
import type { Book } from "@/types/database"

export default function EditHighlightPage() {
  const params = useParams()
  const highlightId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [books, setBooks] = useState<Book[]>([])
  const [content, setContent] = useState("")
  const [bookId, setBookId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !highlightId) return

      try {
        setIsLoading(true)
        setError(null)

        const [highlightResult, booksResult] = await Promise.all([
          supabase.from("highlights").select("*").eq("id", highlightId).single(),
          supabase.from("books").select("*").eq("user_id", user.id).order("title", { ascending: true }),
        ])

        if (highlightResult.error) throw highlightResult.error
        if (booksResult.error) throw booksResult.error

        setContent(highlightResult.data.content)
        setBookId(highlightResult.data.book_id)
        setBooks(booksResult.data || [])
      } catch (err: any) {
        console.error("Error loading highlight:", err)
        setError("Không tải được highlight này.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, highlightId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !highlightId) return

    if (!content.trim()) {
      setError("Nội dung highlight không được để trống.")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const { error: updateError } = await supabase
        .from("highlights")
        .update({ content: content.trim(), book_id: bookId })
        .eq("id", highlightId)

      if (updateError) throw updateError

      toast({ title: "Đã cập nhật highlight" })
      router.push("/highlights")
    } catch (err: any) {
      console.error("Error updating highlight:", err)
      setError(err.message || "Không lưu được thay đổi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-md bg-muted/60" />
  }

  return (
    <div className="space-y-8">
      <Link
        href="/highlights"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Highlight
      </Link>

      <PageHeader title="Sửa highlight" />

      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-5">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={isSubmitting}
          className="min-h-[160px] resize-none border-0 bg-transparent p-0 font-serif text-[15px] leading-[1.7] shadow-none focus-visible:ring-0"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Select value={bookId} onValueChange={setBookId} disabled={isSubmitting}>
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

          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/highlights")}>
              Huỷ
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
