"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/context/auth-context"
import type { NewBook, Tag } from "@/types/database"
import { TagSelector } from "@/components/tag-selector"
import { useToast } from "@/hooks/use-toast"
import { SuccessNotification } from "@/components/success-notification"

const supabase = createClient()

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

export default function AddBookPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<NewBook & { coverFile?: File }>({
    title: "",
    author: "",
  })
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

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
      toast({
        title: "Lỗi",
        description: "Tiêu đề sách là bắt buộc",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      toast({
        title: "Lỗi",
        description: "Bạn phải đăng nhập để thêm sách",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      let coverUrl = null

      // Upload cover image if exists
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
      }

      const { data, error } = await supabase
        .from("books")
        .insert({
          title: formData.title.trim(),
          author: formData.author?.trim() || null,
          user_id: user.id,
          cover_url: coverUrl,
        })
        .select()
        .single()

      if (error) throw error

      if (selectedTags.length > 0 && data) {
        const bookTagsInserts = selectedTags.map((tag) => ({
          book_id: data.id,
          tag_id: tag.id,
          user_id: user.id,
        }))

        const { error: tagsError } = await supabase.from("book_tags").insert(bookTagsInserts)

        if (tagsError) {
          console.error("Error adding tags:", tagsError)
        }
      }

      setShowSuccess(true)

      // Reset form
      setFormData({ title: "", author: "" })
      setCoverPreview(null)
      setSelectedTags([])
    } catch (error: any) {
      console.error("Error adding book:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm sách. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <SuccessNotification
        title="Đã lưu"
        description="Sách đã được thêm vào thư viện."
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        autoCloseDuration={2000}
      />

      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Thư viện
      </Link>

      <PageHeader title="Thêm sách" description="Sách là nơi các highlight của bạn được gắn vào." />

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

        <Field label="Ảnh bìa" hint="Không bắt buộc">
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
            {isSubmitting ? "Đang lưu…" : "Thêm sách"}
          </Button>
        </div>
      </form>
    </div>
  )
}
