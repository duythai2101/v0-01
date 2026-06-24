"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"

interface BookHighlight {
  title: string
  author: string
  highlights: string[]
}

export function BookAnalyzer() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [books, setBooks] = useState<BookHighlight[]>([])

  const extractBookHighlights = (text: string): BookHighlight[] => {
    // Chuẩn hóa text
    const normalizedText = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    // Tách các phần highlight
    const sections = normalizedText.split(/={10,}/).filter((section) => section.trim().length > 0)
    const bookMap = new Map<string, BookHighlight>()

    for (const section of sections) {
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      // Lấy thông tin sách
      const titleAuthorMatch = lines[0].match(/^(.+?)\s*$$([^)]+)$$/)
      if (!titleAuthorMatch) continue

      const title = titleAuthorMatch[1].trim()
      const author = titleAuthorMatch[2].trim()
      const key = `${title}-${author}`

      // Tìm nội dung highlight
      let highlightContent = ""
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (
          line.includes("Highlight") ||
          line.includes("page") ||
          line.includes("Location") ||
          line.includes("Added on") ||
          line.match(/^-/) ||
          line.match(/^\d+/) ||
          line.includes("|")
        ) {
          continue
        }
        if (line.length > 0) {
          highlightContent = line
          break
        }
      }

      if (highlightContent) {
        if (!bookMap.has(key)) {
          bookMap.set(key, { title, author, highlights: [] })
        }
        bookMap.get(key)?.highlights.push(highlightContent)
      }
    }

    return Array.from(bookMap.values())
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!user) {
      setMessage({ type: "error", text: "Bạn cần đăng nhập để thêm highlight" })
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)

      const text = await file.text()
      const extractedBooks = extractBookHighlights(text)

      if (extractedBooks.length === 0) {
        throw new Error("Không tìm thấy highlight nào trong file")
      }

      setBooks(extractedBooks)
    } catch (error: any) {
      console.error("Error analyzing file:", error)
      setMessage({
        type: "error",
        text: error.message || "Có lỗi xảy ra khi phân tích file. Vui lòng thử lại.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!books.length || !user) return

    try {
      setIsLoading(true)
      setMessage(null)

      for (const book of books) {
        // Kiểm tra sách đã tồn tại
        const { data: existingBook } = await supabase
          .from("books")
          .select("id")
          .eq("title", book.title)
          .eq("user_id", user.id)
          .single()

        let bookId: string
        if (existingBook) {
          bookId = existingBook.id
        } else {
          // Thêm sách mới
          const { data: newBook, error: bookError } = await supabase
            .from("books")
            .insert({
              title: book.title,
              author: book.author,
              user_id: user.id,
            })
            .select()
            .single()

          if (bookError) throw bookError
          bookId = newBook.id
        }

        // Thêm highlights
        const { error: highlightsError } = await supabase.from("highlights").insert(
          book.highlights.map((content) => ({
            content,
            book_id: bookId,
            user_id: user.id,
          })),
        )

        if (highlightsError) throw highlightsError
      }

      setMessage({ type: "success", text: "Đã thêm highlight thành công!" })

      // Chuyển hướng sau khi lưu
      setTimeout(() => {
        router.push("/favorites")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error saving highlights:", error)
      setMessage({
        type: "error",
        text: error.message || "Có lỗi xảy ra khi lưu highlight. Vui lòng thử lại.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Chọn file text chứa highlight của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
            >
              <Upload className="h-4 w-4" />
              Chọn file
            </label>
          </div>
        </CardContent>
      </Card>

      {books.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sách</CardTitle>
            <CardDescription>Kiểm tra thông tin trước khi lưu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {books.map((book, bookIndex) => (
              <div key={bookIndex} className="space-y-4">
                <div>
                  <h3 className="font-medium">Tiêu đề:</h3>
                  <p className="text-muted-foreground">{book.title}</p>
                </div>
                {book.author && (
                  <div>
                    <h3 className="font-medium">Tác giả:</h3>
                    <p className="text-muted-foreground">{book.author}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium">Số lượng highlight:</h3>
                  <p className="text-muted-foreground">{book.highlights.length}</p>
                </div>
                <div>
                  <h3 className="font-medium">Danh sách highlight:</h3>
                  <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                    {book.highlights.map((highlight, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {bookIndex < books.length - 1 && <hr className="my-4" />}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu Highlight"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {message && (
        <Alert
          className={`border ${
            message.type === "success"
              ? "border-green-500/20 bg-green-500/10"
              : "border-destructive/20 bg-destructive/10"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
