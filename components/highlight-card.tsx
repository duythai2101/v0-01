"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Heart, Pencil, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface HighlightCardProps {
  id: string
  content: string
  bookTitle: string
  author?: string
  createdAt: Date
  favorite?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onToggleFavorite?: (id: string, currentFavorite: boolean) => void
}

const COLLAPSE_AT = 280

export function HighlightCard({
  id,
  content,
  bookTitle,
  author,
  createdAt,
  favorite = false,
  onEdit,
  onDelete,
  onToggleFavorite,
}: HighlightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isFavorite, setIsFavorite] = useState(favorite)
  const [isToggling, setIsToggling] = useState(false)

  const isLong = content.length > COLLAPSE_AT
  const shown = isExpanded || !isLong ? content : `${content.slice(0, COLLAPSE_AT).trimEnd()}…`

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(id)
    } catch (error) {
      console.error("Error deleting highlight:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!onToggleFavorite) return
    setIsToggling(true)
    const previous = isFavorite
    setIsFavorite(!previous)
    try {
      await onToggleFavorite(id, previous)
    } catch (error) {
      console.error("Error toggling favorite:", error)
      setIsFavorite(previous)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <article className="group relative rounded-md border border-border bg-card px-5 py-4 transition-colors hover:border-foreground/20">
      {/* The quote is the point of the card, so it gets the serif and the size. */}
      <blockquote className="font-serif text-[15px] leading-[1.7] text-foreground/90">{shown}</blockquote>

      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {isExpanded ? "Thu gọn" : "Đọc tiếp"}
        </button>
      )}

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{bookTitle}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {author ? `${author} · ` : ""}
            {format(new Date(createdAt), "d MMM yyyy")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isToggling}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
              title={isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
            >
              <Heart
                className={cn("h-4 w-4 transition-colors", isFavorite && "fill-primary text-primary")}
                strokeWidth={1.75}
              />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(id)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
              title="Sửa"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}

          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                  title="Xoá"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xoá highlight này?</AlertDialogTitle>
                  <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Đang xoá…" : "Xoá"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </article>
  )
}
