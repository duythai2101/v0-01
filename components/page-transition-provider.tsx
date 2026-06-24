"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"

type PageTransitionContextType = {
  isNavigating: boolean
  previousPath: string | null
  currentPath: string | null
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isNavigating: false,
  previousPath: null,
  currentPath: null,
})

export const usePageTransition = () => useContext(PageTransitionContext)

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [previousPath, setPreviousPath] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isFirstMount, setIsFirstMount] = useState(true)

  useEffect(() => {
    // Skip transition on first mount
    if (isFirstMount) {
      setCurrentPath(pathname)
      setIsFirstMount(false)
      return
    }

    if (pathname) {
      setIsNavigating(true)
      setPreviousPath(currentPath)
      setCurrentPath(pathname)

      const timer = setTimeout(() => {
        setIsNavigating(false)
      }, 600) // Slightly longer than animation duration

      return () => clearTimeout(timer)
    }
  }, [pathname, currentPath, isFirstMount])

  return (
    <PageTransitionContext.Provider value={{ isNavigating, previousPath, currentPath }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={isFirstMount ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PageTransitionContext.Provider>
  )
}
