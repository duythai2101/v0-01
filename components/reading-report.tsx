"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { AlertCircle, ArrowDownRight, ArrowUpRight, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useReadingReport } from "@/hooks/use-reading-report"
import type { ReadingReport as ReadingReportData, ReportRange } from "@/lib/reading-stats"
import { cn } from "@/lib/utils"

/**
 * Recharts writes colours as SVG presentation attributes, where CSS variables
 * do not resolve. So the palette is resolved here per theme instead.
 */
const PALETTE = {
  light: {
    accent: "#A65A3A",
    neutrals: ["#47423C", "#6B655C", "#9A9187", "#C4BBB0", "#DAD3C9"],
    track: "#E8E3DB",
    axis: "#8A8177",
    surface: "#FDFCFA",
    border: "#E4DFD6",
    text: "#211F1C",
  },
  dark: {
    accent: "#C97F5A",
    neutrals: ["#D6D0C6", "#A39B8F", "#7A7268", "#56504A", "#3D3833"],
    track: "#2E2A26",
    axis: "#8F877C",
    surface: "#1A1917",
    border: "#2E2A26",
    text: "#EDEAE4",
  },
}

const RANGES: { value: ReportRange; label: string }[] = [
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "90 ngày" },
  { value: "12m", label: "12 tháng" },
]

const PANEL = "rounded-md border border-border bg-card p-5"

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={PANEL}>
      <h3 className="mb-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function Stat({
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
    <div className="border-l border-border pl-4 first:border-l-0 first:pl-0 sm:border-l sm:pl-5">
      <div className="flex items-baseline gap-1.5">
        <span className="tabular font-serif text-[26px] leading-none text-foreground">{value}</span>
        {typeof delta === "number" && (
          <span
            className={cn(
              "tabular inline-flex items-center text-[11px]",
              delta >= 0 ? "text-primary" : "text-muted-foreground",
            )}
          >
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground/70">{hint}</div>}
    </div>
  )
}

function Meter({ label, value, max, color, track }: { label: string; value: number; max: number; color: string; track: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-sm">
        <span className="truncate text-foreground/80">{label}</span>
        <span className="tabular shrink-0 text-muted-foreground">{value}</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full" style={{ background: track }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }}
        />
      </div>
    </div>
  )
}

function RangePicker({ range, onChange }: { range: ReportRange; onChange: (r: ReportRange) => void }) {
  return (
    <div className="flex items-center gap-4">
      {RANGES.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "text-xs underline-offset-4 transition-colors",
            range === option.value
              ? "font-medium text-foreground underline"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function ReportBody({
  report,
  range,
  onRangeChange,
  palette,
}: {
  report: ReadingReportData
  range: ReportRange
  onRangeChange: (r: ReportRange) => void
  palette: typeof PALETTE.light
}) {
  const { kpis, activity, topBooks, topAuthors, weekdays, coverage, tagDistribution, lengths, libraryGrowth } =
    report

  const tooltipStyle = {
    background: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: "6px",
    color: palette.text,
    fontSize: "12px",
    padding: "6px 10px",
  }
  const axisTick = { fontSize: 11, fill: palette.axis }
  const tickInterval = Math.max(0, Math.ceil(activity.length / 10) - 1)
  const growthMonths = libraryGrowth.filter((point) => point.count > 0).slice(-6)
  const weekdayMax = Math.max(...weekdays.map((day) => day.count))

  return (
    <div className="space-y-6">
      {report.insights.length > 0 && (
        <div className="border-l-2 border-primary/50 py-1 pl-5">
          <ul className="space-y-2">
            {report.insights.map((insight, i) => (
              <li key={i} className="font-serif text-[15px] leading-relaxed text-foreground/85">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-y-6 border-y border-border py-6 sm:grid-cols-4 sm:gap-y-0">
        <Stat
          value={kpis.highlights30d.toLocaleString()}
          label="30 ngày qua"
          delta={kpis.highlights30dDelta}
          hint={kpis.highlights30dDelta === null ? "Chưa có nền so sánh" : "so với kỳ trước"}
        />
        <Stat
          value={String(kpis.currentStreak)}
          label="Ngày liên tiếp"
          hint={`Dài nhất ${kpis.longestStreak} ngày`}
        />
        <Stat
          value={String(kpis.avgHighlightsPerBook)}
          label="Highlight mỗi cuốn"
          hint={`${kpis.totalHighlights.toLocaleString()} trên ${kpis.totalBooks.toLocaleString()} cuốn`}
        />
        <Stat
          value={`${kpis.favoriteRate}%`}
          label="Đánh dấu yêu thích"
          hint={`${lengths.avgWords} từ mỗi highlight`}
        />
      </div>

      <div className={PANEL}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nhịp ghi highlight</h3>
          <RangePicker range={range} onChange={onRangeChange} />
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={activity} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tick={axisTick} interval={tickInterval} tickLine={false} axisLine={false} />
            <YAxis tick={axisTick} allowDecimals={false} tickLine={false} axisLine={false} width={26} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: palette.track, opacity: 0.4 }}
              formatter={(value: any) => [value, "Highlight"]}
            />
            <Bar dataKey="count" fill={palette.accent} radius={[2, 2, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {topBooks.length > 0 && (
          <Panel title="Sách được trích dẫn nhiều nhất">
            <div className="space-y-4">
              {topBooks.slice(0, 6).map((book, i) => (
                <Meter
                  key={book.id}
                  label={book.title}
                  value={book.count}
                  max={topBooks[0].count}
                  color={i === 0 ? palette.accent : palette.neutrals[Math.min(i, 4)]}
                  track={palette.track}
                />
              ))}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <Link
                href="/library"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Xem toàn bộ thư viện
              </Link>
            </div>
          </Panel>
        )}

        {topAuthors.length > 0 && (
          <Panel title="Tác giả đọc kỹ nhất">
            <div className="space-y-4">
              {topAuthors.slice(0, 6).map((author, i) => (
                <Meter
                  key={author.author}
                  label={author.author}
                  value={author.count}
                  max={topAuthors[0].count}
                  color={i === 0 ? palette.accent : palette.neutrals[Math.min(i, 4)]}
                  track={palette.track}
                />
              ))}
            </div>
          </Panel>
        )}

        {weekdayMax > 0 && (
          <Panel title="Ghi chú theo thứ trong tuần">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={weekdays} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} allowDecimals={false} tickLine={false} axisLine={false} width={26} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: palette.track, opacity: 0.4 }}
                  formatter={(value: any, _name: any, item: any) => [value, item?.payload?.fullLabel || ""]}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={28}>
                  {weekdays.map((day) => (
                    <Cell
                      key={day.label}
                      fill={day.count === weekdayMax ? palette.accent : palette.neutrals[3]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        )}

        {tagDistribution.length > 0 && (
          <Panel title="Chủ đề">
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="45%" height={150}>
                <PieChart>
                  <Pie
                    data={tagDistribution.slice(0, 6)}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {tagDistribution.slice(0, 6).map((tag, i) => (
                      <Cell key={tag.id} fill={i === 0 ? palette.accent : palette.neutrals[Math.min(i, 4)]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name: any) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-2">
                {tagDistribution.slice(0, 6).map((tag, i) => (
                  <li key={tag.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: i === 0 ? palette.accent : palette.neutrals[Math.min(i, 4)] }}
                      />
                      <span className="truncate text-foreground/80">{tag.name}</span>
                    </span>
                    <span className="tabular shrink-0 text-muted-foreground">{tag.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        )}

        {coverage.total > 0 && (
          <Panel title="Độ phủ thư viện">
            <div className="flex items-baseline gap-2">
              <span className="tabular font-serif text-[26px] leading-none text-foreground">
                {coverage.percent}%
              </span>
              <span className="text-sm text-muted-foreground">
                {coverage.withHighlights}/{coverage.total} cuốn đã có highlight
              </span>
            </div>
            <div className="mt-4 h-[3px] overflow-hidden rounded-full" style={{ background: palette.track }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${coverage.percent}%`, background: palette.accent }}
              />
            </div>
            {coverage.untouched.length > 0 ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="mb-3 text-xs text-muted-foreground">
                  {coverage.untouched.length} cuốn chưa có highlight nào
                </p>
                <ul className="space-y-1.5">
                  {coverage.untouched.slice(0, 5).map((book) => (
                    <li key={book.id}>
                      <Link
                        href={`/books/${book.id}`}
                        className="flex justify-between gap-3 text-sm text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
                      >
                        <span className="truncate">{book.title}</span>
                        <span className="shrink-0 truncate text-xs text-muted-foreground">
                          {book.author || "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                Mọi cuốn trong thư viện đều đã có highlight.
              </p>
            )}
          </Panel>
        )}

        {lengths.longest && (
          <Panel title="Độ dài highlight">
            <div className="flex gap-8">
              <div>
                <div className="tabular font-serif text-[26px] leading-none text-foreground">
                  {lengths.avgWords}
                </div>
                <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Từ trung bình</div>
              </div>
              <div>
                <div className="tabular font-serif text-[26px] leading-none text-foreground">
                  {lengths.longest.words}
                </div>
                <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Dài nhất</div>
              </div>
            </div>
            <blockquote className="mt-5 border-t border-border pt-4 font-serif text-sm leading-relaxed text-foreground/75">
              {lengths.longest.preview}
              <footer className="mt-2 font-sans text-xs not-italic text-muted-foreground">
                {lengths.longest.bookTitle}
              </footer>
            </blockquote>
          </Panel>
        )}

        {growthMonths.length > 0 && (
          <Panel title="Sách thêm mới theo tháng">
            <div className="space-y-4">
              {growthMonths.map((point) => (
                <Meter
                  key={point.key}
                  label={point.label}
                  value={point.count}
                  max={Math.max(...libraryGrowth.map((p) => p.count))}
                  color={palette.neutrals[1]}
                  track={palette.track}
                />
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  )
}

export function ReadingReport() {
  const { isLoading, isRefreshing, error, report, range, setRange, refresh } = useReadingReport()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const palette = mounted && resolvedTheme === "dark" ? PALETTE.dark : PALETTE.light

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-lg text-foreground">Báo cáo đọc sách</h2>
        <button
          type="button"
          onClick={refresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50 disabled:no-underline"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Đang tính lại…" : "Làm mới"}
        </button>
      </div>

      {error && (
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 animate-pulse rounded-md bg-muted/60" />
          <div className="h-52 animate-pulse rounded-md bg-muted/60" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-56 animate-pulse rounded-md bg-muted/60" />
            <div className="h-56 animate-pulse rounded-md bg-muted/60" />
          </div>
        </div>
      ) : !report || !report.hasData ? (
        <div className="rounded-md border border-dashed border-border px-6 py-14 text-center">
          <h3 className="font-serif text-lg text-foreground">Chưa đủ dữ liệu để dựng báo cáo</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Thêm sách và lưu vài highlight, các con số sẽ tự xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <ReportBody report={report} range={range} onRangeChange={setRange} palette={palette} />
      )}
    </section>
  )
}
