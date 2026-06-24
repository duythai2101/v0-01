"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"

interface AnimatedCTAButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

export function AnimatedCTAButton({ children, href, onClick, className = "" }: AnimatedCTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const buttonContent = (
    <motion.button
      className={`relative overflow-hidden text-white font-medium py-3 px-8 rounded-full text-lg ${className}`}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 0 25px rgba(236, 72, 153, 0.6)",
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      initial={{ boxShadow: "0 0 0px rgba(236, 72, 153, 0)" }}
      animate={{
        boxShadow: [
          "0 0 0px rgba(236, 72, 153, 0)",
          "0 0 15px rgba(236, 72, 153, 0.3)",
          "0 0 0px rgba(236, 72, 153, 0)",
        ],
      }}
      transition={{
        boxShadow: {
          repeat: Number.POSITIVE_INFINITY,
          duration: 2,
        },
      }}
    >
      {/* Gradient background matching the page background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500"></div>

      {/* Gradient overlay for animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-600 to-pink-500 opacity-100"
        animate={{
          x: isHovered ? ["0%", "100%"] : "0%",
        }}
        transition={{
          x: {
            repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
            duration: 1,
            ease: "linear",
          },
        }}
      />

      {/* Pulse effect */}
      <motion.div
        className="absolute inset-0 bg-pink-500 rounded-full"
        initial={{ scale: 1, opacity: 0 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}

        {/* Arrow animation */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{
            x: isHovered ? [0, 5, 0] : 0,
          }}
          transition={{
            x: {
              repeat: isHovered ? Number.POSITIVE_INFINITY : 0,
              duration: 1,
            },
          }}
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </motion.svg>
      </span>
    </motion.button>
  )

  if (href) {
    return <a href={href}>{buttonContent}</a>
  }

  return buttonContent
}
