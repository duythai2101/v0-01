"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, HelpCircle } from "lucide-react"
import { useSidebar } from "./sidebar-context"
import { useAuth } from "@/context/auth-context"
import { ThemeToggle } from "./theme-toggle"
import { IntroPopup } from "./intro-popup"
import { useState } from "react"
import { AnimatedCats } from "./animated-cats"

export function TopNavbar() {
  const { toggleSidebar } = useSidebar()
  const { user, signOut } = useAuth()

  // Get user initials for avatar fallback
  const userInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : "JD"
  const [showIntro, setShowIntro] = useState(false)
  const [showCats, setShowCats] = useState(true)

  return (
    <header className="border-b bg-card relative">
      {showCats && <AnimatedCats />}
      <div className="flex h-16 items-center px-4 md:px-6 relative z-10">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">Tomorrow</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle onCatsToggle={setShowCats} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowIntro(true)}
            className="rounded-full bg-black hover:bg-gray-800 dark:bg-black dark:hover:bg-gray-800"
            title="Show intro guide"
          >
            <HelpCircle className="h-5 w-5 text-white" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt={user?.email || "User"} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              {user?.email && (
                <DropdownMenuItem className="text-xs text-muted-foreground">{user.email}</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="font-['Charter_BT_Pro'] font-bold">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Intro popup */}
      <IntroPopup open={showIntro} onOpenChange={setShowIntro} />
    </header>
  )
}
