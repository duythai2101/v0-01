"use client"

import type React from "react"
import { Book, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
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
import type { Tag } from "@/types/database"

interface BookCardProps {
  id: string
  title: string
  author?: string
  highlightCount: number
  coverUrl?: string | null
  tags?: Tag[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function BookCard({ id, title, author, highlightCount, coverUrl, tags, onEdit, onDelete }: BookCardProps) {
  console.log("[v0] BookCard rendered:", { id, title, hasOnDelete: !!onDelete })

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("[v0] Edit clicked for book:", id)
    if (onEdit) onEdit(id)
  }

  const handleDeleteConfirm = () => {
    console.log("[v0] Delete confirmed for book:", id)
    if (onDelete) {
      console.log("[v0] Calling onDelete with id:", id)
      onDelete(id)
    } else {
      console.error("[v0] onDelete function not provided!")
    }
  }

  return (
    <Card className="group overflow-hidden hover:bg-accent/50 transition-all duration-200 border-2 hover:border-primary/20 relative">
      <Link href={`/books/${id}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {coverUrl ? (
              <div className="relative w-20 h-28 flex-shrink-0">
                <Image
                  src={coverUrl || "/placeholder.svg"}
                  alt={`${title} cover`}
                  fill
                  className="object-cover rounded-md shadow-md group-hover:shadow-lg transition-shadow duration-200"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    console.error("Error loading image:", coverUrl)
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-28 bg-muted rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
                <Book className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
              {author && <p className="text-sm text-muted-foreground line-clamp-1">{author}</p>}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge key={tag.id} style={{ backgroundColor: tag.color }} className="text-white text-xs h-5">
                      {tag.name}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs h-5">
                      +{tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-muted-foreground group-hover:text-primary/80 transition-colors">
            <Book className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              {highlightCount} {highlightCount === 1 ? "highlight" : "highlights"}
            </span>
          </div>
        </CardContent>
      </Link>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                console.log("[v0] Delete button clicked, opening dialog")
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa sách</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa sách "{title}"? Hành động này không thể hoàn tác và sẽ xóa tất cả highlights
                liên quan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => console.log("[v0] Delete cancelled")}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
}
