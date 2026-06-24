"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/context/auth-context"
import type { Tag } from "@/types/database"
import { useToast } from "@/hooks/use-toast"

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  disabled?: boolean
}

const TAG_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
]

export function TagSelector({ selectedTags, onTagsChange, disabled }: TagSelectorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTagName, setNewTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchTags()
  }, [user])

  const fetchTags = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.from("tags").select("*").order("name", { ascending: true })

      if (error) throw error
      setAllTags(data || [])
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id)

    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId))
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên tag",
        variant: "destructive",
      })
      return
    }

    if (!user) return

    setIsCreating(true)

    try {
      const { data, error } = await supabase
        .from("tags")
        .insert({
          name: newTagName.trim(),
          color: selectedColor,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Thêm tag mới vào danh sách
      setAllTags([...allTags, data])

      // Tự động chọn tag mới tạo
      onTagsChange([...selectedTags, data])

      toast({
        title: "Thành công",
        description: "Đã tạo tag mới",
      })

      // Reset form
      setNewTagName("")
      setSelectedColor(TAG_COLORS[0])
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating tag:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tạo tag. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white pr-1">
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                disabled={disabled}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={disabled} className="h-6 bg-transparent">
                <Plus className="h-3 w-3 mr-1" />
                Thêm tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setIsOpen(false)
                    setIsCreateDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo tag mới
                </Button>

                <div className="border-t pt-2">
                  {allTags.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Chưa có tag nào. Hãy tạo tag mới.</p>
                  ) : (
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {allTags.map((tag) => {
                        const isSelected = selectedTags.some((t) => t.id === tag.id)
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-sm ${
                              isSelected ? "bg-accent" : ""
                            }`}
                          >
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="flex-1 text-left">{tag.name}</span>
                            {isSelected && <X className="h-4 w-4" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo tag mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tên tag</Label>
              <Input
                id="tag-name"
                placeholder="Ví dụ: Khoa học, Tiểu thuyết, Kinh tế..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreateTag()
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              Hủy
            </Button>
            <Button type="button" onClick={handleCreateTag} disabled={isCreating || !newTagName.trim()}>
              {isCreating ? "Đang tạo..." : "Tạo tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
