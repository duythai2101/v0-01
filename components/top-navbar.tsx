"use client"

import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, Settings } from "lucide-react"
import { useSidebar } from "./sidebar-context"
import { useAuth } from "@/context/auth-context"
import { ThemeToggle } from "./theme-toggle"

export function TopNavbar() {
  const { toggleSidebar } = useSidebar()
  const { user, signOut } = useAuth()

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??"

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-6 md:px-10">
        <button
          type="button"
          onClick={toggleSidebar}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Mở menu</span>
        </button>

        <Link href="/dashboard" className="font-serif text-lg tracking-tight md:hidden">
          Tomorrow
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Tài khoản</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground">Đang đăng nhập</p>
                <p className="truncate text-sm font-medium">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
