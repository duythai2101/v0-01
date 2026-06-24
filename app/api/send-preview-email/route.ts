import { NextResponse } from "next/server"
import { getResendClient } from "@/lib/resend-client"
import { EmailTemplate } from "@/components/emails/email-template"
import { createClient } from "@/lib/supabase/server"
import React from "react"

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json()
    const { email, highlightId } = body

    if (!email || !highlightId) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and highlightId are required",
        },
        { status: 400 },
      )
    }

    console.log(`[API] Sending preview email to ${email} for highlight ${highlightId}`)

    // Initialize Supabase client
    const supabase = await createClient()

    // Fetch the highlight with book information
    const { data: highlight, error: highlightError } = await supabase
      .from("highlights")
      .select(`
        id, 
        content, 
        book_id, 
        books:book_id (
          title, 
          author
        )
      `)
      .eq("id", highlightId)
      .single()

    if (highlightError || !highlight) {
      console.error(`[API] Error fetching highlight:`, highlightError)
      return NextResponse.json(
        {
          success: false,
          error: highlightError?.message || "Highlight not found",
        },
        { status: 404 },
      )
    }

    // Extract book information
    const bookTitle = highlight.books?.title || "Unknown Book"
    const bookAuthor = highlight.books?.author || "Unknown Author"

    // Get site URL for links
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tomorrow-app.vercel.app"

    // Initialize Resend client
    const resend = getResendClient()

    // Send the email
    const { data, error } = await resend.emails.send({
      from: "Tomorrow App <Tina@tomorrow.io.vn>",
      to: email,
      subject: `Your Daily Highlight from ${bookTitle}`,
      react: React.createElement(EmailTemplate, {
        title: bookTitle,
        author: bookAuthor,
        content: highlight.content,
        unsubscribeUrl: `${siteUrl}/settings?unsubscribe=true`,
      }),
      text: `Your highlight from ${bookTitle} by ${bookAuthor}: ${highlight.content}`,
    })

    if (error) {
      console.error(`[API] Error sending preview email:`, error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    console.log(`[API] Successfully sent preview email to ${email} (ID: ${data?.id})`)
    return NextResponse.json({
      success: true,
      message: `Preview email sent successfully to ${email}`,
      data: {
        id: data?.id,
        to: email,
        highlightId: highlight.id,
        bookTitle,
      },
    })
  } catch (error: any) {
    console.error("[API] Unhandled error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Internal Server Error: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
