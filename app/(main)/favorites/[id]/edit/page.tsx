"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Book } from "@/types/database"

export default function EditHighlightPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [formData, setFormData] = useState({
    content: "",
    book_id: "",
  })

  // Fetch highlight and books data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !params.id) return

      try {
        setIsLoading(true)
        setMessage(null)

        // Fetch highlight
        const { data: highlight, error: highlightError } = await supabase
          .from("highlights")
          .select("*")
          .eq("id", params.id)
          .single()

        if (highlightError) throw highlightError

        // Fetch books
        const { data: booksData, error: booksError } = await supabase
          .from("books")
          .select("*")
          .order("title", { ascending: true })

        if (booksError) throw booksError

        setBooks(booksData || [])
        setFormData({
          content: highlight.content,
          book_id: highlight.book_id,
        })
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setMessage({
          type: "error",
          text: error.message || "Failed to load highlight data",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, params.id])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, book_id: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.content.trim()) {
      setMessage({ type: "error", text: "Highlight content is required" })
      return
    }

    if (!formData.book_id) {
      setMessage({ type: "error", text: "Please select a book" })
      return
    }

    if (!user || !params.id) {
      setMessage({ type: "error", text: "You must be logged in to edit a highlight" })
      return
    }

    try {
      setIsSubmitting(true)
      setMessage(null)

      const { error } = await supabase
        .from("highlights")
        .update({
          content: formData.content.trim(),
          book_id: formData.book_id,
        })
        .eq("id", params.id)

      if (error) throw error

      setMessage({ type: "success", text: "Highlight updated successfully!" })

      setTimeout(() => {
        router.push("/library")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error updating highlight:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to update highlight. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Highlight</h1>
        <p className="text-muted-foreground mt-2">Edit your highlight details</p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Highlight Details</CardTitle>
            <CardDescription>Update the details of your highlight</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="book_id" className="text-sm font-medium leading-none">
                Book <span className="text-destructive">*</span>
              </label>
              <Select value={formData.book_id} onValueChange={handleSelectChange} disabled={isSubmitting}>
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium leading-none">
                Highlight Content <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter the highlight text"
                className="min-h-[120px]"
                disabled={isSubmitting}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Highlight...
                </>
              ) : (
                "Update Highlight"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

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
