"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { EmailPreview } from "@/components/email-preview"
import { Loader2, RefreshCw, AlertCircle, Send, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function EmailPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<any[]>([])
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)
  const [selectedHighlight, setSelectedHighlight] = useState<any | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("preview")
  const [userName, setUserName] = useState<string>("")
  const [recipientEmail, setRecipientEmail] = useState<string>("")

  useEffect(() => {
    if (user?.email) {
      const nameFromEmail = user.email.split("@")[0]
      setUserName(nameFromEmail)
      setRecipientEmail(user.email)

      const fetchUserName = async () => {
        try {
          const { data } = await supabase.from("users").select("name").eq("id", user.id).single()

          if (data?.name) {
            setUserName(data.name)
          }
        } catch (error) {
          console.log("Error fetching user name:", error)
        }
      }

      fetchUserName()
    }
  }, [user])

  useEffect(() => {
    const highlightId = searchParams.get("highlight")
    if (highlightId) {
      setSelectedHighlightId(highlightId)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchHighlights = async () => {
      if (!user) return

      try {
        setIsLoading(true)
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

        if (selectedHighlightId && data) {
          const highlight = data.find((h) => h.id === selectedHighlightId)
          if (highlight) {
            setSelectedHighlight(highlight)
          } else if (data.length > 0) {
            setSelectedHighlightId(data[0].id)
            setSelectedHighlight(data[0])
          }
        } else if (data && data.length > 0) {
          setSelectedHighlightId(data[0].id)
          setSelectedHighlight(data[0])
        }
      } catch (err: any) {
        console.error("Error fetching highlights:", err)
        setError(err.message || "Failed to load highlights")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHighlights()
  }, [user, selectedHighlightId])

  useEffect(() => {
    if (selectedHighlightId && highlights.length > 0) {
      const highlight = highlights.find((h) => h.id === selectedHighlightId)
      setSelectedHighlight(highlight || null)
    }
  }, [selectedHighlightId, highlights])

  const handleHighlightChange = (id: string) => {
    setSelectedHighlightId(id)
    router.push(`/email-preview?highlight=${id}`)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
    setSendResult(null)

    const fetchHighlights = async () => {
      try {
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

        if (selectedHighlightId && data) {
          const highlight = data.find((h) => h.id === selectedHighlightId)
          if (highlight) {
            setSelectedHighlight(highlight)
          }
        }
      } catch (err: any) {
        console.error("Error refreshing highlights:", err)
        setError(err.message || "Failed to refresh highlights")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHighlights()
  }

  const handleSendEmail = async () => {
    if (!selectedHighlight || !recipientEmail) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn highlight và nhập email người nhận",
        variant: "destructive",
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Email không hợp lệ",
        description: "Vui lòng nhập địa chỉ email hợp lệ",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSending(true)
      setSendResult(null)
      setError(null)

      const response = await fetch("/api/send-preview-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: recipientEmail,
          highlightId: selectedHighlight.id,
          recipientName: userName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      setSendResult(data)
      setActiveTab("sent")

      toast({
        title: "Gửi email thành công!",
        description: `Highlight đã được gửi đến ${recipientEmail}`,
      })
    } catch (err: any) {
      console.error("Error sending email:", err)
      setError(err.message || "Failed to send email")
      toast({
        title: "Lỗi gửi email",
        description: err.message || "Không thể gửi email. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gửi Highlight</h1>
        <p className="text-muted-foreground mt-2">Chọn highlight và gửi đến email bất kỳ</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Chọn Highlight</h2>
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : highlights.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Không tìm thấy highlight nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select value={selectedHighlightId || ""} onValueChange={handleHighlightChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn highlight" />
                      </SelectTrigger>
                      <SelectContent>
                        {highlights.map((highlight) => (
                          <SelectItem key={highlight.id} value={highlight.id}>
                            {highlight.books?.title || "Unknown Book"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedHighlight && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Sách:</span> {selectedHighlight.books?.title || "Unknown Book"}
                        </div>
                        {selectedHighlight.books?.author && (
                          <div className="text-sm">
                            <span className="font-medium">Tác giả:</span> {selectedHighlight.books.author}
                          </div>
                        )}
                        <div className="text-sm line-clamp-3">
                          <span className="font-medium">Nội dung:</span> {selectedHighlight.content}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="recipient-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email người nhận
                      </Label>
                      <Input
                        id="recipient-email"
                        type="email"
                        placeholder="example@email.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <Button
                      onClick={handleSendEmail}
                      disabled={isSending || !selectedHighlight || !recipientEmail}
                      className="w-full"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Gửi Email
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="preview">Xem trước</TabsTrigger>
              <TabsTrigger value="sent">Đã gửi</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="mt-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : selectedHighlight ? (
                <EmailPreview
                  title={selectedHighlight.books?.title || "Unknown Book"}
                  author={selectedHighlight.books?.author || "Unknown Author"}
                  content={selectedHighlight.content}
                  recipientName={userName}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <p className="text-muted-foreground">Chọn highlight để xem trước</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {sendResult ? (
                    <div className="space-y-4">
                      <Alert className="border border-green-500/20 bg-green-500/10">
                        <AlertDescription>
                          Email đã được gửi thành công!
                          <div className="mt-2 text-xs">
                            <div>
                              <span className="font-medium">Email ID:</span> {sendResult.data?.id}
                            </div>
                            <div>
                              <span className="font-medium">Gửi đến:</span> {sendResult.data?.to}
                            </div>
                            <div>
                              <span className="font-medium">Thời gian:</span> {new Date().toLocaleString()}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                      <p className="text-sm text-muted-foreground">
                        Kiểm tra hộp thư đến của bạn. Nếu không thấy email, hãy kiểm tra thư mục spam.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Chưa có email nào được gửi</p>
                      <p className="text-sm text-muted-foreground mt-2">Chọn highlight và nhập email để gửi</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
