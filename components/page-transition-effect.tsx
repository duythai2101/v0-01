"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function PageTransitionEffect() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const [firstMount, setFirstMount] = useState(true)

  useEffect(() => {
    // Don't show animation on first mount
    if (firstMount) {
      setFirstMount(false)
      return
    }

    setIsNavigating(true)
    const timer = setTimeout(() => {
      setIsNavigating(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [pathname, firstMount])

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-600 to-pink-500"
          initial={{ clipPath: "circle(0% at center)" }}
          animate={{ clipPath: "circle(75% at center)" }}
          exit={{ clipPath: "circle(0% at center)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="text-white text-3xl font-bold"
          >
            Tomorrow
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
