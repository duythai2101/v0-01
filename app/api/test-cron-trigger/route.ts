import { NextResponse } from "next/server"
import { processMorningEmails, processScheduledEmails } from "@/lib/email-scheduler"
import { getCurrentVietnamTime } from "@/lib/time-utils"
import { EmailTemplate } from "@/components/emails/email-template"
import React from "react"
import { getResendClient } from "@/lib/resend-client"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    // Lấy dữ liệu từ request
    const body = await request.json()
    const { mode = "test", testEmail, option, highlightId } = body

    // Lấy thời gian hiện tại theo múi giờ Việt Nam
    let vietnamTime: Date
    try {
      vietnamTime = getCurrentVietnamTime()
      // Kiểm tra xem vietnamTime có phải là Date hợp lệ không
      if (!(vietnamTime instanceof Date) || isNaN(vietnamTime.getTime())) {
        throw new Error("Không thể lấy thời gian hiện tại")
      }
    } catch (timeError) {
      console.error("[TEST CRON] Lỗi khi lấy thời gian Việt Nam:", timeError)
      // Sử dụng thời gian UTC làm giải pháp thay thế
      vietnamTime = new Date()
      console.log("[TEST CRON] Sử dụng thời gian UTC thay thế:", vietnamTime.toISOString())
    }

    console.log(`[TEST CRON] Kích hoạt thủ công cron job lúc ${vietnamTime.toISOString()}`)
    console.log(
      `[TEST CRON] Giờ Việt Nam: ${vietnamTime.getHours()}:${vietnamTime.getMinutes()}:${vietnamTime.getSeconds()}`,
    )
    console.log(`[TEST CRON] Chế độ: ${mode}, Tùy chọn: ${option || "all"}`)

    // Nếu là chế độ test và có email thử nghiệm
    if (mode === "test" && testEmail) {
      console.log(`[TEST CRON] Gửi email thử nghiệm đến ${testEmail}`)

      try {
        const supabase = getSupabaseAdmin()
        let highlight: any = null

        // Nếu có highlightId, lấy thông tin highlight cụ thể
        if (highlightId) {
          const { data, error } = await supabase
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

          if (error) {
            throw error
          }

          if (!data) {
            throw new Error("Không tìm thấy highlight")
          }

          highlight = data
        } else {
          // Nếu không có highlightId, lấy một highlight ngẫu nhiên
          const { data, error } = await supabase
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
            .order("created_at", { ascending: false })
            .limit(10)

          if (error) {
            throw error
          }

          if (!data || data.length === 0) {
            // Nếu không có highlight nào, sử dụng dữ liệu mẫu
            highlight = {
              id: "sample",
              content: "Đây là nội dung highlight mẫu cho email thử nghiệm từ Tomorrow App.",
              books: {
                title: "Tomorrow App",
                author: "Admin",
              },
            }
          } else {
            // Chọn một highlight ngẫu nhiên từ 10 highlight mới nhất
            highlight = data[Math.floor(Math.random() * data.length)]
          }
        }

        // Lấy thông tin sách
        const bookTitle = highlight.books?.title || "Unknown Book"
        const bookAuthor = highlight.books?.author || "Unknown Author"
        const content = highlight.content

        // Khởi tạo Resend client
        const resend = getResendClient()

        // Lấy site URL cho links
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tomorrow-app.vercel.app"

        // Tạo unsubscribe URL
        const unsubscribeUrl = `${siteUrl}/settings?unsubscribe=true`

        // Gửi email với template giống như Email Preview
        const { data: emailData, error: sendError } = await resend.emails.send({
          from: "Tomorrow <Tina@tomorrow.io.vn>", 
          to: testEmail,
          subject: `Your Daily Highlight from ${bookTitle}`,
          react: React.createElement(EmailTemplate, {
            title: bookTitle,
            author: bookAuthor,
            content: content,
            unsubscribeUrl,
          }),
          text: `Your highlight from ${bookTitle} by ${bookAuthor}: ${content}`,
        })

        if (sendError) {
          throw sendError
        }

        return NextResponse.json({
          success: true,
          message: `Đã gửi email thử nghiệm thành công đến ${testEmail}`,
          timestamp: vietnamTime.toISOString(),
          vietnamTime: vietnamTime.toLocaleString(),
          data: {
            id: emailData?.id,
            to: testEmail,
            highlight: {
              id: highlight.id,
              bookTitle,
              bookAuthor,
              content,
            },
          },
        })
      } catch (error: any) {
        console.error("[TEST CRON] Lỗi khi gửi email highlight:", error)
        return NextResponse.json(
          {
            success: false,
            error: `Lỗi khi gửi email highlight: ${error.message || "Lỗi không xác định"}`,
            timestamp: vietnamTime.toISOString(),
          },
          { status: 500 },
        )
      }
    }

    // Xử lý các tùy chọn khác nhau
    let result

    try {
      if (option === "morning") {
        // Chỉ gửi cho người dùng đặt 6:00 sáng
        result = await processScheduledEmails("06:00", false)
      } else if (option === "random") {
        // Chỉ gửi cho người dùng chọn highlight ngẫu nhiên
        result = await processScheduledEmails(undefined, false, { onlyRandom: true })
      } else if (option === "specific") {
        // Chỉ gửi cho người dùng chọn highlight cụ thể
        result = await processScheduledEmails(undefined, false, { onlySpecific: true })
      } else {
        // Mặc định: gửi cho tất cả người dùng đủ điều kiện
        result = await processMorningEmails()
      }
    } catch (processError: any) {
      console.error("[TEST CRON] Lỗi khi xử lý email:", processError)
      return NextResponse.json(
        {
          success: false,
          error: `Lỗi khi xử lý email: ${processError.message || "Lỗi không xác định"}`,
          timestamp: vietnamTime.toISOString(),
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt cron job thành công (${option || "all"})`,
      timestamp: vietnamTime.toISOString(),
      vietnamTime: vietnamTime.toLocaleString(),
      result,
    })
  } catch (error: any) {
    console.error("[TEST CRON] Lỗi khi kích hoạt cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Lỗi không xác định",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Hỗ trợ cả phương thức GET để tương thích với các yêu cầu trước đó
export async function GET(request: Request) {
  return POST(request)
}
