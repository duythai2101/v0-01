"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"

export default function CronTriggerPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"test" | "real">("test")
  const [testEmail, setTestEmail] = useState("")
  const [option, setOption] = useState<"all" | "morning" | "random" | "specific">("all")
  const [showDetails, setShowDetails] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [highlights, setHighlights] = useState<any[]>([])
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false)

  // Lấy email của người dùng hiện tại
  useEffect(() => {
    if (user?.email) {
      setTestEmail(user.email)
    }
  }, [user])

  // Cập nhật thời gian hiện tại
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Hàm cập nhật thời gian hiện tại
  const updateCurrentTime = () => {
    setCurrentTime(new Date())
  }

  // Hàm định dạng thời gian
  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "00:00:00"
    }

    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const seconds = date.getSeconds().toString().padStart(2, "0")

    return `${hours}:${minutes}:${seconds}`
  }

  // Lấy danh sách highlights khi chọn mode test và option specific
  useEffect(() => {
    if (mode === "test" && option === "specific") {
      fetchHighlights()
    }
  }, [mode, option])

  // Hàm lấy danh sách highlights
  const fetchHighlights = async () => {
    if (!user) return

    try {
      setIsLoadingHighlights(true)
      setError(null)

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
        .limit(50)

      if (error) {
        throw error
      }

      setHighlights(data || [])

      // Nếu có highlights, chọn highlight đầu tiên
      if (data && data.length > 0) {
        setSelectedHighlightId(data[0].id)
      }
    } catch (err: any) {
      console.error("Error fetching highlights:", err)
      setError(err.message || "Failed to load highlights")
    } finally {
      setIsLoadingHighlights(false)
    }
  }

  // Hàm kích hoạt cron job
  const triggerCronJob = async () => {
    try {
      setIsLoading(true)
      setResult(null)
      setError(null)

      // Chuẩn bị dữ liệu gửi đi
      const payload: any = {
        mode,
        option,
      }

      // Nếu là chế độ test, thêm email thử nghiệm
      if (mode === "test") {
        if (!testEmail) {
          throw new Error("Vui lòng nhập email thử nghiệm")
        }
        payload.testEmail = testEmail

        // Nếu chọn highlight cụ thể, thêm highlightId
        if (option === "specific" && selectedHighlightId) {
          payload.highlightId = selectedHighlightId
        }
      }

      // Gọi API kích hoạt cron job
      const response = await fetch("/api/test-cron-trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi kích hoạt cron job")
      }

      setResult(data)
    } catch (err: any) {
      console.error("Error triggering cron job:", err)
      setError(err.message || "Lỗi không xác định")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kích hoạt Cron Job</h1>
        <p className="text-muted-foreground mt-2">
          Trang này cho phép bạn kích hoạt thủ công cron job để gửi email cho người dùng
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin hệ thống</CardTitle>
            <CardDescription>Thông tin về thời gian và cấu hình hiện tại</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Thời gian hiện tại (Việt Nam):</span>
              <div className="flex items-center">
                <span className="text-sm mr-2">{formatTime(currentTime)}</span>
                <Button variant="outline" size="icon" onClick={updateCurrentTime} className="h-8 w-8">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Thời gian gửi email mặc định:</span>
              <span className="text-sm">06:00 (Giờ Việt Nam)</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Trạng thái cron job:</span>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">Đang hoạt động</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt kích hoạt</CardTitle>
            <CardDescription>Cấu hình cách thức kích hoạt cron job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Chế độ</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as "test" | "real")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="test" id="mode-test" />
                  <Label htmlFor="mode-test">Thử nghiệm</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="real" id="mode-real" />
                  <Label htmlFor="mode-real">Thật</Label>
                </div>
              </RadioGroup>
            </div>

            {mode === "test" && (
              <div className="space-y-2">
                <Label htmlFor="test-email">Email thử nghiệm</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Tùy chọn</Label>
              <Select value={option} onValueChange={(value) => setOption(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tùy chọn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả người dùng đủ điều kiện</SelectItem>
                  <SelectItem value="morning">Chỉ người dùng đặt 6:00 sáng</SelectItem>
                  <SelectItem value="random">Chỉ người dùng chọn highlight ngẫu nhiên</SelectItem>
                  <SelectItem value="specific">Chỉ người dùng chọn highlight cụ thể</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "test" && option === "specific" && (
              <div className="space-y-2">
                <Label>Chọn highlight</Label>
                <Select
                  value={selectedHighlightId || ""}
                  onValueChange={setSelectedHighlightId}
                  disabled={isLoadingHighlights}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingHighlights ? "Đang tải..." : "Chọn highlight"} />
                  </SelectTrigger>
                  <SelectContent>
                    {highlights.map((highlight) => (
                      <SelectItem key={highlight.id} value={highlight.id}>
                        {highlight.books?.title || "Unknown Book"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch id="show-details" checked={showDetails} onCheckedChange={setShowDetails} />
              <Label htmlFor="show-details">Hiển thị chi tiết kết quả</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={triggerCronJob} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Kích hoạt ngay"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả kích hoạt</CardTitle>
            <CardDescription>
              {result.success ? "Cron job đã được kích hoạt thành công" : "Có lỗi x���y ra khi kích hoạt cron job"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{result.success ? "Thành công" : "Lỗi"}</AlertTitle>
                <AlertDescription>{result.message || result.error}</AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Thời gian: {new Date(result.timestamp).toLocaleString()}</span>
              </div>

              {showDetails && result.success && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>Chi tiết kết quả</AccordionTrigger>
                    <AccordionContent>
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
