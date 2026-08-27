"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import {
  computeReadingReport,
  prepareHighlight,
  type ReadingReport,
  type ReadingReportInput,
  type ReportRange,
} from "@/lib/reading-stats"

const CACHE_PREFIX = "reading_report_cache_v1"
const CACHE_EXPIRATION = 5 * 60 * 1000 // 5 minutes, same window as the dashboard cache
const PAGE_SIZE = 1000 // Supabase caps a single select at 1000 rows

interface CachedPayload {
  timestamp: number
  data: ReadingReportInput
}

/**
 * Supabase returns at most 1000 rows per select, so walk pages until a short
 * one comes back. Without this a heavy library would silently report low.
 */
async function fetchAllRows<T>(
  table: string,
  columns: string,
  apply: (query: any) => any,
): Promise<T[]> {
  const rows: T[] = []

  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE
    const { data, error } = await apply(
      supabase.from(table).select(columns).range(from, from + PAGE_SIZE - 1),
    )

    if (error) throw error
    const batch = (data || []) as T[]
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }

  return rows
}

export interface UseReadingReport {
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  report: ReadingReport | null
  range: ReportRange
  setRange: (range: ReportRange) => void
  refresh: () => Promise<void>
}

export function useReadingReport(): UseReadingReport {
  const { user } = useAuth()
  const [raw, setRaw] = useState<ReadingReportInput | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<ReportRange>("30d")

  const cacheKey = user ? `${CACHE_PREFIX}:${user.id}` : null

  const readCache = useCallback((): ReadingReportInput | null => {
    if (!cacheKey) return null
    try {
      const item = localStorage.getItem(cacheKey)
      if (!item) return null
      const cached: CachedPayload = JSON.parse(item)
      if (Date.now() - cached.timestamp >= CACHE_EXPIRATION) {
        localStorage.removeItem(cacheKey)
        return null
      }
      return cached.data
    } catch {
      return null
    }
  }, [cacheKey])

  const writeCache = useCallback(
    (data: ReadingReportInput) => {
      if (!cacheKey) return
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }))
      } catch {
        // Quota exceeded or storage disabled - the report still works uncached.
      }
    },
    [cacheKey],
  )

  const load = useCallback(
    async (options: { useCache: boolean }) => {
      if (!user) return

      if (options.useCache) {
        const cached = readCache()
        if (cached) {
          setRaw(cached)
          setIsLoading(false)
          return
        }
      }

      try {
        setError(null)
        if (options.useCache) setIsLoading(true)
        else setIsRefreshing(true)

        const [books, highlightRows] = await Promise.all([
          fetchAllRows<{ id: string; title: string; author: string | null; created_at: string }>(
            "books",
            "id, title, author, created_at",
            (query) => query.eq("user_id", user.id),
          ),
          fetchAllRows<{
            id: string
            book_id: string
            favorite: boolean | null
            created_at: string
            content: string | null
          }>("highlights", "id, book_id, favorite, created_at, content", (query) =>
            query.eq("user_id", user.id),
          ),
        ])

        // Tags are optional: the tag tables are created by a migration script that
        // may not have run, and a missing tag breakdown should not sink the report.
        let tags: { id: string; name: string; color: string }[] = []
        let bookTags: { book_id: string; tag_id: string }[] = []
        try {
          const [tagRows, bookTagRows] = await Promise.all([
            fetchAllRows<{ id: string; name: string; color: string }>("tags", "id, name, color", (q) => q),
            fetchAllRows<{ book_id: string; tag_id: string }>("book_tags", "book_id, tag_id", (query) =>
              query.eq("user_id", user.id),
            ),
          ])
          tags = tagRows
          bookTags = bookTagRows
        } catch (tagError) {
          console.warn("Reading report: tag data unavailable, skipping tag breakdown", tagError)
        }

        const data: ReadingReportInput = {
          books,
          highlights: highlightRows.map(prepareHighlight),
          tags,
          bookTags,
        }

        setRaw(data)
        writeCache(data)
      } catch (err: any) {
        console.error("Error building reading report:", err)
        setError("Không tải được báo cáo đọc sách. Vui lòng thử lại.")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [user, readCache, writeCache],
  )

  useEffect(() => {
    if (user) load({ useCache: true })
  }, [user, load])

  const refresh = useCallback(async () => {
    if (cacheKey) {
      try {
        localStorage.removeItem(cacheKey)
      } catch {
        // ignore
      }
    }
    await load({ useCache: false })
  }, [cacheKey, load])

  // Range switching recomputes from the cached rows - no extra round trip.
  const report = useMemo(() => (raw ? computeReadingReport(raw, { range }) : null), [raw, range])

  return { isLoading, isRefreshing, error, report, range, setRange, refresh }
}
