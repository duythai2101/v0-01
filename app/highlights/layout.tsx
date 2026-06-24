import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { TopNavbar } from "@/components/top-navbar"

export default function HighlightsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <TopNavbar />
        <main className="container p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
