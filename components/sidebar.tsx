"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookMarked, Library, Settings, X, Mail, Upload, Tag } from "lucide-react"
import { useSidebar } from "./sidebar-context"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggleSidebar } = useSidebar()

  // Cập nhật routes để thêm trang kích hoạt cron job và trang Favorites
  const routes = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Favorites",
      path: "/favorites",
      icon: BookMarked,
    },
    {
      name: "Library",
      path: "/library",
      icon: Library,
    },
    {
      name: "Book Tags",
      path: "/tags",
      icon: Tag,
    },
    {
      name: "Email Preview",
      path: "/email-preview",
      icon: Mail,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
    },
    {
      name: "Upload Highlight",
      path: "/favorites/add/upload",
      icon: Upload,
    },
  ]

  return (
    <>
      <div
        className={cn("fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden", isOpen ? "block" : "hidden")}
        onClick={toggleSidebar}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card transition-transform md:translate-x-0 md:static md:z-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 md:hidden">
          <span className="text-xl font-semibold tracking-tight">Tomorrow</span>
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {routes.map((route) => (
            <Link key={route.path} href={route.path} onClick={() => isOpen && toggleSidebar()}>
              <Button
                variant={pathname === route.path ? "secondary" : "ghost"}
                className={cn("w-full justify-start", pathname === route.path && "bg-secondary")}
              >
                <route.icon className="mr-2 h-5 w-5" />
                {route.name}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
