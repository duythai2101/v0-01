import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Khởi tạo Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function extractBookInfo(text: string) {
  // Tách các đoạn highlight riêng biệt
  const highlights = text.split("==========").filter(block => block.trim())

  const books = highlights.map(block => {
    // Tìm tên sách và tác giả
    const titleMatch = block.match(/^(.*?)\s*\((.*?)\)/)
    const bookTitle = titleMatch ? titleMatch[1].trim() : ''
    const author = titleMatch ? titleMatch[2].trim() : ''

    // Tìm nội dung highlight
    const highlightMatch = block.match(/- Your Highlight.*?\n\n(.*?)(?=\n\n|$)/s)
    const highlight = highlightMatch ? highlightMatch[1].trim() : ''

    return {
      bookTitle,
      author,
      highlight
    }
  })

  // Gom nhóm theo sách
  const bookGroups = books.reduce((acc, book) => {
    const key = `${book.bookTitle}|${book.author}`
    if (!acc[key]) {
      acc[key] = {
        bookTitle: book.bookTitle,
        author: book.author,
        highlights: []
      }
    }
    if (book.highlight) {
      acc[key].highlights.push(book.highlight)
    }
    return acc
  }, {} as Record<string, { bookTitle: string; author: string; highlights: string[] }>)

  return Object.values(bookGroups)
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    let text = ""
    if (type === "text") {
      text = await file.text()
    } else {
      return NextResponse.json(
        { error: "Image processing not implemented yet" },
        { status: 400 }
      )
    }

    const books = extractBookInfo(text)

    // Lấy user hiện tại
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Lưu từng cuốn sách và highlight vào Supabase
    const savedBooks = []
    for (const book of books) {
      // Kiểm tra xem sách đã tồn tại chưa
      const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .eq('title', book.bookTitle)
        .eq('author', book.author)
        .eq('user_id', user.id)
        .single()

      let bookId
      if (existingBook) {
        bookId = existingBook.id
      } else {
        // Tạo sách mới
        const { data: newBook, error: bookError } = await supabase
          .from('books')
          .insert({
            title: book.bookTitle,
            author: book.author,
            user_id: user.id
          })
          .select()
          .single()

        if (bookError) throw bookError
        bookId = newBook.id
      }

      // Lưu các highlight
      for (const highlight of book.highlights) {
        const { error: highlightError } = await supabase
          .from('highlights')
          .insert({
            content: highlight,
            book_id: bookId,
            user_id: user.id
          })

        if (highlightError) throw highlightError
      }

      // Lấy lại thông tin sách và highlight đã lưu
      const { data: savedBook } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          highlights (
            id,
            content
          )
        `)
        .eq('id', bookId)
        .single()

      savedBooks.push(savedBook)
    }

    return NextResponse.json(savedBooks)
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    )
  }
}
