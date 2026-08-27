"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Upload } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import type { Tag } from "@/types/database"
import { TagSelector } from "@/components/tag-selector"

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-start sm:gap-6">
      <div className="pt-2">
        <span className="text-sm text-foreground">
          {label}
          {required && <span className="text-primary"> *</span>}
        </span>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

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
      <Link
        href={`/books/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại sách
      </Link>

      <PageHeader title="Sửa sách" />

      {message && (
        <Alert
          className={
            message.type === "error"
              ? "border-destructive/20 bg-destructive/10"
              : "border-primary/20 bg-primary/10"
          }
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-7 border-t border-border pt-7">
        <Field label="Tên sách" required>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ví dụ: Sapiens"
            disabled={isSubmitting}
            required
          />
        </Field>

        <Field label="Tác giả">
          <Input
            id="author"
            name="author"
            value={formData.author || ""}
            onChange={handleChange}
            placeholder="Ví dụ: Yuval Noah Harari"
            disabled={isSubmitting}
          />
        </Field>

        <Field label="Ảnh bìa" hint="Chọn ảnh mới để thay">
          <div className="flex items-center gap-4">
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
              className="flex h-[104px] w-[72px] cursor-pointer items-center justify-center overflow-hidden rounded-sm border border-dashed border-border transition-colors hover:border-foreground/30"
            >
              {coverPreview ? (
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
              )}
            </label>
            <p className="text-xs text-muted-foreground">Bấm để chọn ảnh</p>
          </div>
        </Field>

        <Field label="Chủ đề" hint="Dùng để lọc trong thư viện">
          <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} disabled={isSubmitting} />
        </Field>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-6">
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
            Huỷ
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  )
}
