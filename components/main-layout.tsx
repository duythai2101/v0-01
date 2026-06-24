import type { ReactNode } from "react"
import { TopNavbar } from "./top-navbar"
import { Sidebar } from "./sidebar"
import { SessionProvider } from "./session-provider"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <TopNavbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
        </div>
      </div>
    </SessionProvider>
  )
}
