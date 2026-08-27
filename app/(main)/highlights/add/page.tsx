"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { NewHighlightForm } from "@/components/new-highlight-form"
import { PageHeader } from "@/components/page-header"
import { useToast } from "@/hooks/use-toast"
import type { Book } from "@/types/database"

export default function AddHighlightPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [books, setBooks] = useState<Book[]>([])
  const bookId = searchParams.get("bookId") || undefined

  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("title", { ascending: true })
      if (error) {
        console.error("Error fetching books:", error)
        return
      }
      setBooks(data || [])
    }
    fetchBooks()
  }, [user])

  const handleSubmit = async (values: { content: string; bookId: string }) => {
    if (!user) return

    const { error } = await supabase.from("highlights").insert({
      content: values.content.trim(),
      book_id: values.bookId,
      user_id: user.id,
    })

    if (error) throw error

    toast({ title: "Đã lưu highlight" })
    router.push(bookId ? `/books/${bookId}` : "/highlights")
  }

  return (
    <div className="space-y-8">
      <Link
        href={bookId ? `/books/${bookId}` : "/highlights"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      <PageHeader title="Thêm highlight" description="Chép lại một đoạn và gắn nó với cuốn sách tương ứng." />

      <NewHighlightForm books={books} onSubmit={handleSubmit} defaultBookId={bookId} autoFocus />
    </div>
  )
}
