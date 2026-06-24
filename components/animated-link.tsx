"use client"

import type React from "react"

import { forwardRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AnimatedLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  activeClassName?: string
  exact?: boolean
}

export const AnimatedLink = forwardRef<HTMLAnchorElement, AnimatedLinkProps>(
  ({ href, onClick, className, activeClassName, exact, children, ...props }, ref) => {
    const router = useRouter()

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()

      // Add a small delay to allow animations to start
      setTimeout(() => {
        if (onClick) {
          onClick(e)
        }
        router.push(href.toString())
      }, 100)
    }

    return (
      <Link href={href} onClick={handleClick} className={cn(className)} ref={ref} {...props}>
        {children}
      </Link>
    )
  },
)

AnimatedLink.displayName = "AnimatedLink"
