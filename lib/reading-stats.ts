/**
 * Reading report statistics.
 *
 * Pure functions only - no React, no Supabase. Everything here takes plain
 * arrays and returns plain objects so the numbers can be checked in isolation.
 */

export type ReportRange = "30d" | "90d" | "12m"

export interface StatsBook {
  id: string
  title: string
  author: string | null
  created_at: string
}

/**
 * A highlight reduced to what the report needs. `content` is collapsed into
 * `words` + `preview` up front so the raw text never has to be cached.
 */
export interface StatsHighlight {
  id: string
  book_id: string
  favorite: boolean
  created_at: string
  words: number
  preview: string
}

export interface StatsTag {
  id: string
  name: string
  color: string
}

export interface StatsBookTag {
  book_id: string
  tag_id: string
}

export interface ReadingReportInput {
  books: StatsBook[]
  highlights: StatsHighlight[]
  tags: StatsTag[]
  bookTags: StatsBookTag[]
}

export interface ActivityPoint {
  key: string
  label: string
  count: number
}

export interface TopBook {
  id: string
  title: string
  author: string | null
  count: number
}

export interface ReadingReport {
  hasData: boolean
  kpis: {
    totalBooks: number
    totalHighlights: number
    highlights30d: number
    /** Percent change vs the 30 days before that. null when there is no baseline. */
    highlights30dDelta: number | null
    currentStreak: number
    longestStreak: number
    avgHighlightsPerBook: number
    favoriteRate: number
  }
  activity: ActivityPoint[]
  topBooks: TopBook[]
  topAuthors: { author: string; count: number }[]
  weekdays: { label: string; fullLabel: string; count: number }[]
  coverage: {
    total: number
    withHighlights: number
    percent: number
    untouched: { id: string; title: string; author: string | null }[]
  }
  tagDistribution: { id: string; name: string; color: string; count: number; bookCount: number }[]
  lengths: {
    avgWords: number
    longest: { id: string; words: number; preview: string; bookTitle: string } | null
    shortest: { id: string; words: number; preview: string; bookTitle: string } | null
  }
  libraryGrowth: ActivityPoint[]
  insights: string[]
}

const UNKNOWN_AUTHOR = "Không rõ tác giả"

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
const WEEKDAY_FULL = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]

/** Local-time YYYY-MM-DD. Deliberately not toISOString, which shifts to UTC. */
function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

/** Monday = 0 ... Sunday = 6 */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

/** Collapse a raw highlight row into the shape the report works with. */
export function prepareHighlight(row: {
  id: string
  book_id: string
  favorite?: boolean | null
  created_at: string
  content?: string | null
}): StatsHighlight {
  const content = (row.content || "").trim()
  return {
    id: row.id,
    book_id: row.book_id,
    favorite: Boolean(row.favorite),
    created_at: row.created_at,
    words: content ? content.split(/\s+/).filter(Boolean).length : 0,
    preview: content.length > 180 ? `${content.slice(0, 180)}...` : content,
  }
}

function buildActivity(countsByDay: Map<string, number>, range: ReportRange, today: Date): ActivityPoint[] {
  if (range === "12m") {
    const countsByMonth = new Map<string, number>()
    countsByDay.forEach((count, key) => {
      const month = key.slice(0, 7)
      countsByMonth.set(month, (countsByMonth.get(month) || 0) + count)
    })

    const points: ActivityPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const date = addMonths(today, -i)
      const key = monthKey(date)
      points.push({
        key,
        label: `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}`,
        count: countsByMonth.get(key) || 0,
      })
    }
    return points
  }

  const days = range === "30d" ? 30 : 90
  const points: ActivityPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const key = dayKey(date)
    points.push({
      key,
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      count: countsByDay.get(key) || 0,
    })
  }
  return points
}

function sumRange(countsByDay: Map<string, number>, from: Date, to: Date): number {
  let total = 0
  for (let date = new Date(from); date <= to; date = addDays(date, 1)) {
    total += countsByDay.get(dayKey(date)) || 0
  }
  return total
}

function computeStreaks(countsByDay: Map<string, number>, today: Date): { current: number; longest: number } {
  const activeDays = Array.from(countsByDay.keys()).sort()
  if (activeDays.length === 0) return { current: 0, longest: 0 }

  // Current streak: walk back from today, or from yesterday if today is still empty.
  let cursor = countsByDay.has(dayKey(today)) ? today : addDays(today, -1)
  let current = 0
  while (countsByDay.has(dayKey(cursor))) {
    current++
    cursor = addDays(cursor, -1)
  }

  let longest = 1
  let run = 1
  for (let i = 1; i < activeDays.length; i++) {
    const previous = new Date(`${activeDays[i - 1]}T00:00:00`)
    const currentDay = new Date(`${activeDays[i]}T00:00:00`)
    const gapInDays = Math.round((currentDay.getTime() - previous.getTime()) / 86400000)
    run = gapInDays === 1 ? run + 1 : 1
    if (run > longest) longest = run
  }

  return { current, longest: Math.max(longest, current) }
}

function buildInsights(report: Omit<ReadingReport, "insights">): string[] {
  const insights: string[] = []
  const { kpis, topBooks, topAuthors, weekdays, coverage, lengths } = report

  if (kpis.currentStreak >= 2) {
    insights.push(`Bạn đang có chuỗi ${kpis.currentStreak} ngày liên tiếp ghi highlight — giữ nhịp nhé!`)
  } else if (kpis.longestStreak >= 3) {
    insights.push(
      `Chuỗi dài nhất của bạn là ${kpis.longestStreak} ngày. Ghi một highlight hôm nay để bắt đầu chuỗi mới.`,
    )
  }

  if (kpis.highlights30dDelta !== null && Math.abs(kpis.highlights30dDelta) >= 10) {
    const direction = kpis.highlights30dDelta > 0 ? "nhiều hơn" : "ít hơn"
    insights.push(
      `30 ngày qua bạn ghi ${Math.abs(kpis.highlights30dDelta)}% ${direction} so với 30 ngày trước đó (${kpis.highlights30d} highlight).`,
    )
  }

  if (topBooks[0]) {
    insights.push(`"${topBooks[0].title}" là cuốn bạn trích dẫn nhiều nhất với ${topBooks[0].count} highlight.`)
  }

  if (topAuthors[0] && topAuthors[0].author !== UNKNOWN_AUTHOR && topAuthors.length > 1) {
    insights.push(`${topAuthors[0].author} là tác giả bạn đọc kỹ nhất (${topAuthors[0].count} highlight).`)
  }

  // Needs a few data points before "you read most on X" says anything real.
  const busiestDay = [...weekdays].sort((a, b) => b.count - a.count)[0]
  if (busiestDay && busiestDay.count >= 3) {
    insights.push(`Bạn ghi chú nhiều nhất vào ${busiestDay.fullLabel} (${busiestDay.count} highlight).`)
  }

  if (coverage.untouched.length > 0) {
    insights.push(
      `${coverage.untouched.length} cuốn trong thư viện chưa có highlight nào — có thể bắt đầu từ "${coverage.untouched[0].title}".`,
    )
  }

  if (kpis.favoriteRate > 0) {
    insights.push(`${kpis.favoriteRate}% highlight của bạn được đánh dấu yêu thích.`)
  }

  if (lengths.avgWords > 0) {
    insights.push(`Mỗi highlight của bạn dài trung bình ${lengths.avgWords} từ.`)
  }

  return insights.slice(0, 6)
}

export function computeReadingReport(
  input: ReadingReportInput,
  options: { range?: ReportRange; now?: Date } = {},
): ReadingReport {
  const range = options.range || "30d"
  const today = startOfDay(options.now || new Date())

  const books = input.books || []
  const highlights = input.highlights || []
  const tags = input.tags || []
  const bookTags = input.bookTags || []

  const booksById = new Map(books.map((book) => [book.id, book]))

  const countsByDay = new Map<string, number>()
  const countsByBook = new Map<string, number>()
  const weekdayCounts = new Array(7).fill(0)
  let favoriteCount = 0
  let totalWords = 0

  for (const highlight of highlights) {
    const created = new Date(highlight.created_at)
    if (Number.isNaN(created.getTime())) continue

    const key = dayKey(created)
    countsByDay.set(key, (countsByDay.get(key) || 0) + 1)
    countsByBook.set(highlight.book_id, (countsByBook.get(highlight.book_id) || 0) + 1)
    weekdayCounts[weekdayIndex(created)]++
    if (highlight.favorite) favoriteCount++
    totalWords += highlight.words
  }

  const highlights30d = sumRange(countsByDay, addDays(today, -29), today)
  const previous30d = sumRange(countsByDay, addDays(today, -59), addDays(today, -30))
  const highlights30dDelta =
    previous30d > 0 ? Math.round(((highlights30d - previous30d) / previous30d) * 100) : null

  const streaks = computeStreaks(countsByDay, today)

  const topBooks: TopBook[] = Array.from(countsByBook.entries())
    .map(([bookId, count]) => {
      const book = booksById.get(bookId)
      if (!book) return null
      return { id: book.id, title: book.title, author: book.author, count }
    })
    .filter((entry): entry is TopBook => entry !== null)
    .sort((a, b) => b.count - a.count)

  const authorCounts = new Map<string, number>()
  countsByBook.forEach((count, bookId) => {
    const book = booksById.get(bookId)
    if (!book) return
    const author = (book.author || "").trim() || UNKNOWN_AUTHOR
    authorCounts.set(author, (authorCounts.get(author) || 0) + count)
  })
  const topAuthors = Array.from(authorCounts.entries())
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)

  const booksWithHighlights = books.filter((book) => (countsByBook.get(book.id) || 0) > 0).length
  const untouched = books
    .filter((book) => (countsByBook.get(book.id) || 0) === 0)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((book) => ({ id: book.id, title: book.title, author: book.author }))

  const tagBookIds = new Map<string, Set<string>>()
  for (const link of bookTags) {
    if (!booksById.has(link.book_id)) continue
    const bucket = tagBookIds.get(link.tag_id) || new Set<string>()
    bucket.add(link.book_id)
    tagBookIds.set(link.tag_id, bucket)
  }
  const tagDistribution = tags
    .map((tag) => {
      const bookIds = tagBookIds.get(tag.id) || new Set<string>()
      let count = 0
      bookIds.forEach((bookId) => {
        count += countsByBook.get(bookId) || 0
      })
      return { id: tag.id, name: tag.name, color: tag.color, count, bookCount: bookIds.size }
    })
    .filter((tag) => tag.bookCount > 0)
    .sort((a, b) => b.count - a.count)

  const sortedByLength = highlights.filter((h) => h.words > 0).sort((a, b) => b.words - a.words)
  const describe = (highlight: StatsHighlight | undefined) =>
    highlight
      ? {
          id: highlight.id,
          words: highlight.words,
          preview: highlight.preview,
          bookTitle: booksById.get(highlight.book_id)?.title || "Sách không xác định",
        }
      : null

  const growthCounts = new Map<string, number>()
  for (const book of books) {
    const created = new Date(book.created_at)
    if (Number.isNaN(created.getTime())) continue
    const key = monthKey(created)
    growthCounts.set(key, (growthCounts.get(key) || 0) + 1)
  }
  const libraryGrowth: ActivityPoint[] = []
  for (let i = 11; i >= 0; i--) {
    const date = addMonths(today, -i)
    const key = monthKey(date)
    libraryGrowth.push({
      key,
      label: `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}`,
      count: growthCounts.get(key) || 0,
    })
  }

  const base: Omit<ReadingReport, "insights"> = {
    hasData: books.length > 0 || highlights.length > 0,
    kpis: {
      totalBooks: books.length,
      totalHighlights: highlights.length,
      highlights30d,
      highlights30dDelta,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      avgHighlightsPerBook: books.length > 0 ? round1(highlights.length / books.length) : 0,
      favoriteRate: highlights.length > 0 ? Math.round((favoriteCount / highlights.length) * 100) : 0,
    },
    activity: buildActivity(countsByDay, range, today),
    topBooks,
    topAuthors,
    weekdays: WEEKDAY_SHORT.map((label, index) => ({
      label,
      fullLabel: WEEKDAY_FULL[index],
      count: weekdayCounts[index],
    })),
    coverage: {
      total: books.length,
      withHighlights: booksWithHighlights,
      percent: books.length > 0 ? Math.round((booksWithHighlights / books.length) * 100) : 0,
      untouched,
    },
    tagDistribution,
    lengths: {
      avgWords: highlights.length > 0 ? Math.round(totalWords / highlights.length) : 0,
      longest: describe(sortedByLength[0]),
      shortest: describe(sortedByLength[sortedByLength.length - 1]),
    },
    libraryGrowth,
  }

  return { ...base, insights: buildInsights(base) }
}
