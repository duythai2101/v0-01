import type { ReactNode } from "react"
import { TopNavbar } from "./top-navbar"
import { Sidebar } from "./sidebar"
import { SessionProvider } from "./session-provider"

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Sidebar />
        <div className="md:pl-64">
          <TopNavbar />
          {/* Capped width keeps line length readable - this app is mostly prose. */}
          <main className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
