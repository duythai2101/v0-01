"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NewBookFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: { title: string; author?: string }) => void
}

export function NewBookForm({ open, onOpenChange, onSubmit }: NewBookFormProps) {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [titleError, setTitleError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simple validation
    if (!title.trim()) {
      setTitleError("Title is required")
      return
    }

    onSubmit({
      title,
      author: author.trim() ? author : undefined,
    })

    // Reset form
    setTitle("")
    setAuthor("")
    setTitleError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
          <DialogDescription>Enter the details of the book you want to add to your library.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Title
            </label>
            <Input
              placeholder="Enter book title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (e.target.value.trim()) setTitleError("")
              }}
            />
            {titleError && <p className="text-sm text-destructive">{titleError}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Author (optional)
            </label>
            <Input placeholder="Enter author name" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit">Add Book</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
