"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, PlusCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Book, NewHighlight } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { SuccessNotification } from "@/components/success-notification"

export default function AddHighlightPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [isLoadingBooks, setIsLoadingBooks] = useState(true)
  const [formData, setFormData] = useState<NewHighlight & { page_number?: string }>({
    content: "",
    book_id: "",
    page_number: "",
  })
  const [showSuccess, setShowSuccess] = useState(false)

  // Fetch user's books
  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return

      try {
        setIsLoadingBooks(true)
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("user_id", user.id)
          .order("title", { ascending: true })

        if (error) {
          throw error
        }

        setBooks(data || [])
      } catch (error) {
        console.error("Error fetching books:", error)
      } finally {
        setIsLoadingBooks(false)
      }
    }

    fetchBooks()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      toast({
        title: "Lỗi",
        description: "Nội dung highlight là bắt buộc",
        variant: "destructive",
      })
      return
    }

    if (!formData.book_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một cuốn sách",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Lỗi",
        description: "Bạn phải đăng nhập để thêm highlight",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await supabase
        .from("highlights")
        .insert({
          content: formData.content.trim(),
          book_id: formData.book_id,
          user_id: user.id,
        })
        .select()

      if (error) {
        throw error
      }

      setShowSuccess(true)

      // Reset form
      setFormData({ content: "", book_id: "", page_number: "" })
    } catch (error: any) {
      console.error("Error adding highlight:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm highlight. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SuccessNotification
        title="Thành công"
        description="Highlight được thêm thành công!"
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        autoCloseDuration={2000}
      />

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thêm Highlight Mới</h1>
          <p className="text-muted-foreground mt-2">Thêm một highlight mới từ một cuốn sách trong thư viện của bạn</p>
        </div>

        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Chi Tiết Highlight</CardTitle>
              <CardDescription>Nhập thông tin của highlight mà bạn muốn thêm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="book_id" className="text-sm font-medium leading-none">
                  Cuốn Sách <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <Select
                    value={formData.book_id}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, book_id: value }))}
                    disabled={isLoadingBooks || isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn một cuốn sách..." />
                    </SelectTrigger>
                    <SelectContent>
                      {books.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Không có cuốn sách nào. Vui lòng thêm sách trước.
                        </div>
                      ) : (
                        books.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.title} {book.author ? `by ${book.author}` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => router.push("/books/add")}
                    disabled={isSubmitting}
                    title="Thêm sách mới"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Thêm sách mới</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium leading-none">
                  Nội Dung Highlight <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Nhập nội dung highlight ở đây..."
                  className="min-h-[120px]"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Quay Lại
              </Button>
              <Button type="submit" disabled={isSubmitting || books.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang Thêm Highlight...
                  </>
                ) : (
                  "Thêm Highlight"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
