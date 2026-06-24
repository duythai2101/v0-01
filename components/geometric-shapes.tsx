"use client"

import { motion } from "framer-motion"

export function GeometricShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
      {/* Pyramid/Triangle */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 opacity-60"
        style={{
          background: "linear-gradient(to top, rgba(139, 92, 246, 0.5), rgba(244, 114, 182, 0.5))",
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        }}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 8,
          ease: "easeInOut",
        }}
      />

      {/* Circle 1 */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full opacity-40"
        style={{
          background: "linear-gradient(45deg, rgba(249, 115, 22, 0.4), rgba(244, 114, 182, 0.4))",
        }}
        animate={{
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 12,
          ease: "easeInOut",
        }}
      />

      {/* Circle 2 */}
      <motion.div
        className="absolute bottom-1/3 left-1/5 w-24 h-24 rounded-full opacity-30"
        style={{
          background: "linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))",
        }}
        animate={{
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 10,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Rectangle */}
      <motion.div
        className="absolute top-1/3 left-1/4 w-40 h-20 opacity-20"
        style={{
          background: "linear-gradient(45deg, rgba(249, 115, 22, 0.2), rgba(139, 92, 246, 0.2))",
          borderRadius: "10px",
        }}
        animate={{
          rotate: [0, 10, 0],
          x: [0, 10, 0],
        }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 15,
          ease: "easeInOut",
        }}
      />

      {/* Small particles */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-white opacity-30"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 20}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4 + i,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  )
}
