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
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-4 text-white min-w-[320px] max-w-[400px]">
        <div className="flex gap-3">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-green-50 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
