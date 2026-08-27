"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, LayoutGrid, Quote, Settings, X } from "lucide-react"
import { useSidebar } from "./sidebar-context"

const routes = [
  { name: "Tổng quan", path: "/dashboard", icon: LayoutGrid },
  { name: "Thư viện", path: "/library", icon: BookOpen },
  { name: "Highlight", path: "/highlights", icon: Quote },
  { name: "Cài đặt", path: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggleSidebar } = useSidebar()

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden",
          isOpen ? "block" : "hidden",
        )}
        onClick={toggleSidebar}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-transform duration-200 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-6">
          <Link href="/dashboard" className="font-serif text-xl tracking-tight text-foreground">
            Tomorrow
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Đóng menu</span>
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 py-4">
          {routes.map((route) => {
            const isActive = pathname === route.path || pathname.startsWith(`${route.path}/`)
            return (
              <Link
                key={route.path}
                href={route.path}
                onClick={() => isOpen && toggleSidebar()}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-secondary font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <route.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {route.name}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
