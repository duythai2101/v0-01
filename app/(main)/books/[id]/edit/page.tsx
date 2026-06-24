"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Tag } from "@/types/database"
import { TagSelector } from "@/components/tag-selector"

export default function EditBookPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    author: string
    coverFile?: File
  }>({
    title: "",
    author: "",
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  useEffect(() => {
    const fetchBook = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setMessage(null)

        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single()

        if (error) throw error

        if (!data) {
          setMessage({ type: "error", text: "Book not found" })
          return
        }

        setFormData({
          title: data.title,
          author: data.author || "",
        })
        setCurrentCoverUrl(data.cover_url)
        setCoverPreview(data.cover_url)

        const { data: bookTagsData, error: tagsError } = await supabase
          .from("book_tags")
          .select(`
            tags:tag_id (
              id, name, color, user_id, created_at
            )
          `)
          .eq("book_id", params.id)

        if (tagsError) {
          console.error("Error fetching book tags:", tagsError)
        } else {
          const tags = bookTagsData?.map((bt: any) => bt.tags).filter(Boolean) as Tag[]
          setSelectedTags(tags || [])
        }
      } catch (error: any) {
        console.error("Error fetching book:", error)
        setMessage({
          type: "error",
          text: error.message || "Failed to load book. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBook()
  }, [user, params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, coverFile: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "Book title is required" })
      return
    }

    if (!user) {
      setMessage({ type: "error", text: "You must be logged in to edit a book" })
      return
    }

    try {
      setIsSubmitting(true)
      setMessage(null)

      let coverUrl = currentCoverUrl

      // Upload new cover image if exists
      if (formData.coverFile) {
        const fileExt = formData.coverFile.name.split(".").pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage.from("book-covers").upload(filePath, formData.coverFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("book-covers").getPublicUrl(filePath)

        coverUrl = publicUrl

        // Delete old cover if exists
        if (currentCoverUrl) {
          const oldFilePath = currentCoverUrl.split("/").pop()
          if (oldFilePath) {
            await supabase.storage.from("book-covers").remove([`${user.id}/${oldFilePath}`])
          }
        }
      }

      const { error } = await supabase
        .from("books")
        .update({
          title: formData.title.trim(),
          author: formData.author?.trim() || null,
          cover_url: coverUrl,
        })
        .eq("id", params.id)
        .eq("user_id", user.id)

      if (error) throw error

      // First, delete all existing book_tags for this book
      const { error: deleteError } = await supabase.from("book_tags").delete().eq("book_id", params.id)

      if (deleteError) throw deleteError

      // Then, insert new book_tags
      if (selectedTags.length > 0) {
        const bookTagsInserts = selectedTags.map((tag) => ({
          book_id: params.id,
          tag_id: tag.id,
          user_id: user.id,
        }))

        const { error: tagsError } = await supabase.from("book_tags").insert(bookTagsInserts)

        if (tagsError) throw tagsError
      }

      setMessage({ type: "success", text: "Book updated successfully!" })

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/library")
        router.refresh()
      }, 1500)
    } catch (error: any) {
      console.error("Error updating book:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to update book. Please try again.",
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
        <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>
        <p className="text-muted-foreground mt-2">Edit book details</p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>Update the details of your book</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium leading-none">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter book title"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="author" className="text-sm font-medium leading-none">
                Author (optional)
              </label>
              <Input
                id="author"
                name="author"
                value={formData.author || ""}
                onChange={handleChange}
                placeholder="Enter author name"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="cover" className="text-sm font-medium leading-none">
                Cover Image (optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                  <label
                    htmlFor="cover"
                    className="flex items-center justify-center w-24 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-accent/50"
                  >
                    {coverPreview ? (
                      <img
                        src={coverPreview || "/placeholder.svg"}
                        alt="Cover preview"
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">Click to upload a new cover image</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Tags (optional)</label>
              <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} disabled={isSubmitting} />
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
                  Updating Book...
                </>
              ) : (
                "Update Book"
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
