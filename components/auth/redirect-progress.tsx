"use client"

import { useEffect, useState } from "react"

interface RedirectProgressProps {
  duration: number
}

export function RedirectProgress({ duration }: RedirectProgressProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = 10 // Update every 10ms
    const steps = duration / interval
    const increment = 100 / steps

    let currentProgress = 0
    const timer = setInterval(() => {
      currentProgress += increment
      setProgress(Math.min(currentProgress, 100))

      if (currentProgress >= 100) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [duration])

  return (
    <div className="mt-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        className="h-2 rounded-full bg-primary transition-all duration-100 ease-in-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
