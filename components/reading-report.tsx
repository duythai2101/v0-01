"use client"

import Link from "next/link"
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertCircle, ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useReadingReport } from "@/hooks/use-reading-report"
import type { ReadingReport as ReadingReportData, ReportRange } from "@/lib/reading-stats"
import { cn } from "@/lib/utils"

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]

const RANGE_LABELS: { value: ReportRange; label: string }[] = [
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
  { value: "12m", label: "12 tháng" },
]

const CARD = "rounded-2xl border border-border bg-card p-6 shadow-sm"

/** Inline styles resolve CSS variables; SVG presentation attributes do not. */
const TOOLTIP_STYLE = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  color: "hsl(var(--card-foreground))",
  fontSize: "12px",
}

const AXIS_TICK = { fontSize: 11, className: "fill-muted-foreground" }

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <h3 className="font-bold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  )
}

function StatTile({
  value,
  label,
  hint,
  delta,
}: {
  value: string
  label: string
  hint?: string
  delta?: number | null
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {typeof delta === "number" && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              delta >= 0 ? "text-emerald-500" : "text-rose-500",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
      {hint && <div className="text-xs text-muted-foreground/70 mt-0.5">{hint}</div>}
    </div>
  )
}

function RangePicker({
  range,
  onChange,
}: {
  range: ReportRange
  onChange: (range: ReportRange) => void
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-muted p-1">
      {RANGE_LABELS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition",
            range === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** A labelled bar - used where a full chart would be heavier than the data warrants. */
function MeterRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 gap-3">
        <span className="text-foreground/80 truncate">{label}</span>
        <span className="text-muted-foreground font-medium shrink-0">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }}
        />
      </div>
    </div>
  )
}

function ReportBody({
  report,
  range,
  onRangeChange,
}: {
  report: ReadingReportData
  range: ReportRange
  onRangeChange: (range: ReportRange) => void
}) {
  const { kpis, activity, topBooks, topAuthors, weekdays, coverage, tagDistribution, lengths, libraryGrowth } =
    report

  // Keep the x-axis readable when the range widens to 90 days.
  const tickInterval = Math.max(0, Math.ceil(activity.length / 10) - 1)
  const growthHasData = libraryGrowth.some((point) => point.count > 0)
  const weekdayHasData = weekdays.some((day) => day.count > 0)

  return (
    <div className="space-y-6">
      {report.insights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-lg mb-3">💡 Nhận định về thói quen đọc</h2>
          <ul className="space-y-2">
            {report.insights.map((insight, i) => (
              <li key={i} className="flex gap-2 text-white/90 text-sm">
                <span className="shrink-0">→</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          value={kpis.highlights30d.toLocaleString()}
          label="Highlight 30 ngày qua"
          delta={kpis.highlights30dDelta}
          hint={kpis.highlights30dDelta === null ? "Chưa đủ dữ liệu để so sánh" : "So với 30 ngày trước đó"}
        />
        <StatTile
          value={`${kpis.currentStreak} ngày`}
          label="Chuỗi ngày hiện tại"
          hint={`Dài nhất: ${kpis.longestStreak} ngày`}
        />
        <StatTile
          value={kpis.avgHighlightsPerBook.toString()}
          label="Highlight / cuốn sách"
          hint={`${kpis.totalHighlights.toLocaleString()} highlight · ${kpis.totalBooks.toLocaleString()} sách`}
        />
        <StatTile
          value={`${kpis.favoriteRate}%`}
          label="Được đánh dấu ⭐"
          hint={`Trung bình ${lengths.avgWords} từ / highlight`}
        />
      </div>

      <div className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-bold text-foreground">📈 Nhịp ghi highlight</h3>
          <RangePicker range={range} onChange={onRangeChange} />
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={activity}>
            <XAxis dataKey="label" tick={AXIS_TICK} interval={tickInterval} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "hsl(var(--muted))" }}
              formatter={(value: any) => [value, "Highlight"]}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topBooks.length > 0 && (
          <ChartCard title="📚 Sách bạn trích dẫn nhiều nhất">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topBooks.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis dataKey="title" type="category" tick={AXIS_TICK} width={110} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(value: any) => [value, "Highlight"]}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-2">
              {topBooks.slice(0, 3).map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition"
                >
                  {book.title} →
                </Link>
              ))}
            </div>
          </ChartCard>
        )}

        {topAuthors.length > 0 && (
          <ChartCard title="✍️ Tác giả bạn đọc kỹ nhất">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topAuthors.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={AXIS_TICK} allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="author"
                  type="category"
                  tick={AXIS_TICK}
                  width={110}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(value: any) => [value, "Highlight"]}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {weekdayHasData && (
          <ChartCard title="🗓️ Bạn ghi chú vào thứ mấy">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekdays}>
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: "hsl(var(--muted))" }}
                  formatter={(value: any, _name: any, item: any) => [value, item?.payload?.fullLabel || "Highlight"]}
                />
                <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {tagDistribution.length > 0 && (
          <ChartCard title="🏷️ Chủ đề bạn đọc nhiều">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={tagDistribution.slice(0, 6)}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {tagDistribution.slice(0, 6).map((tag, i) => (
                    <Cell key={tag.id} fill={tag.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: any, name: any) => [value, name]} />
                <Legend formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {coverage.total > 0 && (
          <ChartCard title="🎯 Độ phủ thư viện">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-bold text-foreground">{coverage.percent}%</span>
              <span className="text-sm text-muted-foreground">
                {coverage.withHighlights}/{coverage.total} cuốn đã có highlight
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-5">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${coverage.percent}%` }} />
            </div>
            {coverage.untouched.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-2.5">
                  {coverage.untouched.length} cuốn chưa có highlight nào:
                </p>
                <div className="space-y-2">
                  {coverage.untouched.slice(0, 5).map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.id}`}
                      className="flex justify-between gap-3 text-sm py-1.5 px-2.5 rounded-lg hover:bg-muted transition"
                    >
                      <span className="text-foreground/80 truncate">{book.title}</span>
                      <span className="text-muted-foreground shrink-0 truncate max-w-[40%]">
                        {book.author || "—"}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Mọi cuốn sách trong thư viện đều đã có highlight. 🎉</p>
            )}
          </ChartCard>
        )}

        {lengths.longest && (
          <ChartCard title="📝 Độ dài highlight">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <div className="text-2xl font-bold text-foreground">{lengths.avgWords}</div>
                <div className="text-xs text-muted-foreground mt-0.5">từ / highlight (trung bình)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{lengths.longest.words}</div>
                <div className="text-xs text-muted-foreground mt-0.5">từ ở highlight dài nhất</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground mb-1">Dài nhất · {lengths.longest.bookTitle}</div>
                <p className="text-sm text-foreground/80 line-clamp-3">{lengths.longest.preview}</p>
              </div>
              {lengths.shortest && lengths.shortest.id !== lengths.longest.id && (
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Ngắn nhất · {lengths.shortest.bookTitle}</div>
                  <p className="text-sm text-foreground/80 line-clamp-3">{lengths.shortest.preview}</p>
                </div>
              )}
            </div>
          </ChartCard>
        )}

        {growthHasData && (
          <ChartCard title="📈 Tốc độ xây thư viện">
            <div className="space-y-2.5">
              {libraryGrowth
                .filter((point) => point.count > 0)
                .slice(-6)
                .map((point, i) => (
                  <MeterRow
                    key={point.key}
                    label={point.label}
                    value={point.count}
                    max={Math.max(...libraryGrowth.map((p) => p.count))}
                    color={COLORS[i % COLORS.length]}
                  />
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">Số sách thêm mới theo tháng</p>
          </ChartCard>
        )}
      </div>
    </div>
  )
}

export function ReadingReport() {
  const { isLoading, isRefreshing, error, report, range, setRange, refresh } = useReadingReport()

  return (
    <section className="space-y-6" data-tour="reading-report">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Báo cáo đọc sách</h2>
          <p className="text-muted-foreground mt-1 text-sm">Thói quen đọc và ghi chú của bạn theo thời gian</p>
        </div>
        <button
          onClick={refresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm transition"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Đang tính lại..." : "Làm mới"}
        </button>
      </div>

      {error && (
        <Alert className="border border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : !report || !report.hasData ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="font-semibold text-foreground text-lg mb-2">Chưa có dữ liệu để báo cáo</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Thêm sách và lưu vài highlight, báo cáo sẽ tự dựng lên từ đó.
          </p>
          <Link
            href="/books/add"
            className="inline-block bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition"
          >
            Thêm sách đầu tiên
          </Link>
        </div>
      ) : (
        <ReportBody report={report} range={range} onRangeChange={setRange} />
      )}
    </section>
  )
}
