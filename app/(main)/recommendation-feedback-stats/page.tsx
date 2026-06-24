'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, ThumbsUp, ThumbsDown, Mail, Clock } from 'lucide-react'

interface LogRow {
  id: string
  user_id: string
  user_email: string
  user_name: string | null
  book_title: string
  book_author: string | null
  book_genre: string | null
  book_rating: number | null
  reason: string | null
  sent_at: string
  vote: 'yes' | 'no' | null
  voted_at: string | null
  created_at: string
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function RecommendationFeedbackStatsPage() {
  const [rows, setRows] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/recommendation-email-logs')
      .then((r) => r.json())
      .then(({ data, error: err }) => {
        if (err) setError(err)
        else setRows(data ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalSent = rows.length
  const yesCount = rows.filter((r) => r.vote === 'yes').length
  const noCount = rows.filter((r) => r.vote === 'no').length
  const pendingCount = rows.filter((r) => r.vote === null).length
  const totalVoted = yesCount + noCount

  const summaryCards = [
    { label: 'Emails Sent', value: totalSent, icon: Mail, color: 'text-blue-600' },
    { label: 'Voted Yes', value: yesCount, icon: ThumbsUp, color: 'text-emerald-600' },
    { label: 'Voted No', value: noCount, icon: ThumbsDown, color: 'text-red-500' },
    { label: 'Awaiting Vote', value: pendingCount, icon: Clock, color: 'text-amber-500' },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recommendation Email Logs</h1>
          <p className="mt-1 text-muted-foreground">
            All recommendation emails sent to all users and their Yes / No feedback.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              {loading ? (
                <Skeleton className="mt-2 h-9 w-14" />
              ) : (
                <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
              )}
              {!loading && label === 'Voted Yes' && totalVoted > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round((yesCount / totalVoted) * 100)}% of votes
                </p>
              )}
              {!loading && label === 'Voted No' && totalVoted > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {Math.round((noCount / totalVoted) * 100)}% of votes
                </p>
              )}
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">All Records</h2>
            {!loading && (
              <span className="text-sm text-muted-foreground">{totalSent} total</span>
            )}
          </div>

          {error ? (
            <p className="p-8 text-center text-sm text-destructive">{error}</p>
          ) : loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No recommendation emails have been sent yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Book</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">Genre</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Sent At</th>
                    <th className="px-4 py-3">Vote</th>
                    <th className="px-4 py-3">Voted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground truncate max-w-[150px]">
                          {row.user_name ?? row.user_email}
                        </p>
                        {row.user_name && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {row.user_email}
                          </p>
                        )}
                      </td>

                      {/* Book */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground truncate max-w-[160px]">
                          {row.book_title}
                        </p>
                      </td>

                      {/* Author */}
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[120px]">
                        {row.book_author ?? '—'}
                      </td>

                      {/* Genre */}
                      <td className="px-4 py-3">
                        {row.book_genre ? (
                          <Badge variant="secondary" className="text-xs">
                            {row.book_genre}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.book_rating != null ? row.book_rating : '—'}
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3">
                        <p
                          className="text-xs text-muted-foreground truncate max-w-[180px]"
                          title={row.reason ?? ''}
                        >
                          {row.reason ?? '—'}
                        </p>
                      </td>

                      {/* Sent At */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(row.sent_at)}
                      </td>

                      {/* Vote */}
                      <td className="px-4 py-3">
                        {row.vote === 'yes' ? (
                          <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Yes</Badge>
                        ) : row.vote === 'no' ? (
                          <Badge className="bg-red-500 text-white hover:bg-red-500">No</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Pending
                          </Badge>
                        )}
                      </td>

                      {/* Voted At */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(row.voted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
