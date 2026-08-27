"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { BookAnalyzer } from "@/components/book-analyzer"
import { PageHeader } from "@/components/page-header"

export default function UploadHighlightPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/highlights"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Highlight
      </Link>

      <PageHeader
        title="Tải lên văn bản"
        description="Dán hoặc tải lên một đoạn văn bản, hệ thống sẽ tách thành các highlight riêng."
      />

      <BookAnalyzer />
    </div>
  )
}
