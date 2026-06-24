"use client"

import { BookAnalyzer } from "@/components/book-analyzer"

export default function UploadHighlightPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload File Highlight</h1>
        <p className="text-muted-foreground mt-2">Upload file text để thêm highlight</p>
      </div>

      <BookAnalyzer />
    </div>
  )
}
