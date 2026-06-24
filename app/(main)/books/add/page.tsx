"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import type { NewBook, Tag } from "@/types/database"
import { TagSelector } from "@/components/tag-selector"
import { useToast } from "@/hooks/use-toast"
import { SuccessNotification } from "@/components/success-notification"

const supabase = createClient()

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
    <div className="min-h-screen bg-background flex flex-col">
      <SuccessNotification
        title="Thành công"
        description="Sách được thêm thành công!"
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        autoCloseDuration={2000}
      />

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Book</h1>
          <p className="text-muted-foreground mt-2">Add a new book to your library</p>
        </div>

        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
              <CardDescription>Enter the details of the book you want to add</CardDescription>
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
                  <p className="text-sm text-muted-foreground">Click to upload a cover image</p>
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
                    Adding Book...
                  </>
                ) : (
                  "Add Book"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
