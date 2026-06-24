// app/api/send-recommendation-email/route.ts

import { NextResponse } from 'next/server'
import { sendEmailToUserRecommendation } from '@/lib/email-service'

interface RequestBody {
  userId: string
  email: string
  userName: string
  bookTitle: string
  bookAuthor: string
  bookCover?: string
  bookGenre?: string
  bookRating?: number
  reason: string
  recommendationId: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody

    const {
      userId,
      email,
      userName,
      bookTitle,
      bookAuthor,
      bookCover,
      bookGenre,
      bookRating,
      reason,
      recommendationId,
    } = body

    if (!userId || !email || !bookTitle || !bookAuthor || !recommendationId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: userId, email, bookTitle, bookAuthor, recommendationId',
        },
        { status: 400 },
      )
    }

    console.log(
      `[API] Sending recommendation email to ${email} with recommendationId=${recommendationId}`,
    )

    const result = await sendEmailToUserRecommendation({
      userId,
      email,
      userName,
      bookTitle,
      bookAuthor,
      bookCover,
      bookGenre,
      bookRating,
      reason,
      recommendationId,
    })

    if (!result.success) {
      console.error(
        `[API] Failed to send recommendation email:`,
        result.error,
      )
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send email',
        },
        { status: 500 },
      )
    }

    console.log(
      `[API] Successfully sent recommendation email to ${email}`,
    )

    return NextResponse.json({
      success: true,
      message: `Recommendation email sent successfully to ${email}`,
      data: {
        id: result.data?.id,
        to: email,
        recommendationId,
        bookTitle,
      },
    })
  } catch (error: any) {
    console.error('[API] Error sending recommendation email:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
      },
      { status: 500 },
    )
  }
}
