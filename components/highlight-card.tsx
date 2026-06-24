"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Pencil, Trash2, Heart } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)

  const displayContent = isExpanded ? content : content.length > 150 ? `${content.substring(0, 150)}...` : content

  const handleDelete = async () => {
    if (!onDelete) {
      console.warn("onDelete function is not provided.")
      return
    }

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

    setIsTogglingFavorite(true)
    const previousState = isFavorite
    setIsFavorite(!isFavorite)

    try {
      await onToggleFavorite(id, isFavorite)
    } catch (error) {
      console.error("Error toggling favorite:", error)
      setIsFavorite(previousState)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  return (
    <Card className="group mb-4 overflow-hidden hover:bg-accent/50 transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-medium font-charter">{bookTitle}</CardTitle>
            {author && <p className="text-sm text-gray-600">{author}</p>}
          </div>
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1"
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite}
            >
              <Heart
                className={`h-5 w-5 transition-all ${
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
                }`}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm leading-relaxed">{displayContent}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <span className="text-xs text-gray-400">{format(new Date(createdAt), "MMM d, yyyy")}</span>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(id)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận xóa Highlight</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn xóa highlight này không? Hành động này không thể hoàn tác.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Đang xóa..." : "Xóa"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
