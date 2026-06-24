'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle, XCircle } from 'lucide-react'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const feedback = searchParams.get('feedback')
  const isFeedbackYes = feedback === 'yes'

  return (
    <div className="p-8 text-center">
      <div className="mb-6 flex justify-center">
        {isFeedbackYes ? (
          <CheckCircle className="h-16 w-16 text-emerald-500" />
        ) : (
          <XCircle className="h-16 w-16 text-amber-500" />
        )}
      </div>

      <h1 className="mb-3 text-2xl font-bold text-foreground">
        {isFeedbackYes ? 'Thank You!' : 'Got It!'}
      </h1>

      <p className="mb-6 text-base text-muted-foreground leading-relaxed">
        {isFeedbackYes
          ? "We're so glad you liked this book recommendation! Your positive feedback helps us suggest even better books in the future."
          : "Thank you for letting us know. We'll take your feedback into account to provide better recommendations next time."}
      </p>

      <div className="mb-8 rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          {isFeedbackYes
            ? "We'll remember this for future recommendations."
            : "We'll adjust our suggestions based on your preferences."}
        </p>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Your feedback is valuable and helps us improve your reading experience.
      </p>
    </div>
  )
}

export default function RecommendationFeedbackThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <Suspense
          fallback={
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          }
        >
          <ThankYouContent />
        </Suspense>
      </Card>
    </div>
  )
}
