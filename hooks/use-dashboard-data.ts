"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Book } from "@/types/database"

interface Highlight {
  id: string
  content: string
  bookTitle: string
  author?: string
  createdAt: Date
}

interface DashboardData {
  isLoading: boolean
  error: string | null
  books: Book[]
  recentHighlights: Highlight[]
  totalBooks: number
  totalHighlights: number
  refetch: () => Promise<void>
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

export function useDashboardData(): DashboardData {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [recentHighlights, setRecentHighlights] = useState<Highlight[]>([])
  const [totalBooks, setTotalBooks] = useState(0)
  const [totalHighlights, setTotalHighlights] = useState(0)

  // Use localStorage to cache dashboard data
  const [cachedData, setCachedData] = useLocalStorage<{
    timestamp: number
    totalBooks: number
    totalHighlights: number
    books: Book[]
    recentHighlights: Highlight[]
  } | null>("dashboard_cache", null)

  // Function to fetch all dashboard data in a single request
  const fetchDashboardData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      setError(null)

      // Check if we have valid cached data
      const now = Date.now()
      if (cachedData && cachedData.timestamp && now - cachedData.timestamp < CACHE_EXPIRATION) {
        // Use cached data
        setTotalBooks(cachedData.totalBooks)
        setTotalHighlights(cachedData.totalHighlights)
        setBooks(cachedData.books)
        setRecentHighlights(cachedData.recentHighlights)
        setIsLoading(false)
        return
      }

      // Fetch counts and data in a single request using RPC (stored procedure)
      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        user_id_param: user.id,
      })

      if (error) {
        console.error("Error fetching dashboard stats:", error)
        setError("Failed to load dashboard data. Please try again.")
        return
      }

      if (data) {
        setTotalBooks(data.total_books || 0)
        setTotalHighlights(data.total_highlights || 0)

        // Set books data
        setBooks(data.books || [])

        // Format highlights with book information
        const formattedHighlights = (data.recent_highlights || []).map((highlight: any) => ({
          id: highlight.id,
          content: highlight.content,
          bookTitle: highlight.book_title || "Unknown Book",
          author: highlight.book_author || undefined,
          createdAt: new Date(highlight.created_at),
        }))

        setRecentHighlights(formattedHighlights)

        // Cache the data
        setCachedData({
          timestamp: now,
          totalBooks: data.total_books || 0,
          totalHighlights: data.total_highlights || 0,
          books: data.books || [],
          recentHighlights: formattedHighlights,
        })
      }
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  return {
    isLoading,
    error,
    books,
    recentHighlights,
    totalBooks,
    totalHighlights,
    refetch: fetchDashboardData,
  }
}
