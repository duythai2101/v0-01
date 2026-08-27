"use client"

import Link from "next/link"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"
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

interface BookRowProps {
  id: string
  title: string
  author?: string
  highlightCount: number
  coverUrl?: string | null
  tags?: Tag[]
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function BookRow({ id, title, author, highlightCount, coverUrl, tags, onEdit, onDelete }: BookRowProps) {
  return (
    <div className="group flex items-center gap-4 border-b border-border py-4 last:border-b-0">
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt=""
          width={36}
          height={52}
          className="h-[52px] w-9 shrink-0 rounded-sm border border-border object-cover"
        />
      ) : (
        <div className="h-[52px] w-9 shrink-0 rounded-sm border border-border bg-muted" aria-hidden />
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={`/books/${id}`}
          className="font-serif text-base leading-snug text-foreground underline-offset-4 hover:underline"
        >
          {title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{author || "Không rõ tác giả"}</p>
        {tags && tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: tag.color || "hsl(var(--muted-foreground))" }}
                />
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="tabular shrink-0 text-sm text-muted-foreground">
        {highlightCount}
        <span className="ml-1 hidden text-xs sm:inline">highlight</span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(id)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
            title="Sửa sách"
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
                title="Xoá sách"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xoá "{title}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toàn bộ {highlightCount} highlight thuộc cuốn này cũng sẽ bị xoá. Không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    onDelete(id)
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Xoá
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
