"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"

interface SuccessNotificationProps {
  title: string
  description: string
  isOpen: boolean
  onClose?: () => void
  autoCloseDuration?: number
}

export function SuccessNotification({
  title,
  description,
  isOpen,
  onClose,
  autoCloseDuration = 3000,
}: SuccessNotificationProps) {
  const [show, setShow] = useState(isOpen)

  useEffect(() => {
    setShow(isOpen)
    if (isOpen && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        setShow(false)
        onClose?.()
      }, autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoCloseDuration, onClose])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="min-w-[280px] max-w-[400px] rounded-md border border-border bg-card p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" strokeWidth={1.75} />
          <div className="flex-1">
            <h3 className="text-sm text-foreground">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
