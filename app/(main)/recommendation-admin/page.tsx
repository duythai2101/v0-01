'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { RecommendationEmailTemplate } from '@/components/emails/recommendation-email-template'
import { Loader2, RefreshCw, AlertCircle, Send, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  name: string
}

interface Book {
  id: string
  title: string
  author: string
  coverUrl?: string
}

interface SendRecommendationPayload {
  userId: string
  email: string
  userName: string
  bookTitle: string
  bookAuthor: string
  bookCover?: string
  bookGenre?: string
  bookRating?: number
  reason: string
  recommendationId: string
}

// Simple UUID v4 generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function RecommendationAdminPage() {
  const { toast } = useToast()
  
  // State
  const [isLoading, setIsLoading] = useState(false)
  const [isBooksLoading, setIsBooksLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState('preview')
  
  // Book details state
  const [bookTitle, setBookTitle] = useState<string>('')
  const [bookAuthor, setBookAuthor] = useState<string>('')
  const [bookCover, setBookCover] = useState<string>('')
  const [bookGenre, setBookGenre] = useState<string>('')
  const [bookRating, setBookRating] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/get-users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        setUsers(data.users || [])

        if (data.users && data.users.length > 0) {
          setSelectedUserId(data.users[0].id)
          setSelectedUser(data.users[0])
        }
      } catch (err: any) {
        console.error('Error fetching users:', err)
        setError(err.message || 'Failed to fetch users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Fetch books from the specific user
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsBooksLoading(true)
        const response = await fetch('/api/get-books-by-user', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch books')
        }

        const data = await response.json()
        setBooks(data.books || [])

        if (data.books && data.books.length > 0) {
          setSelectedBookId(data.books[0].id)
          // Auto-fill book details from first book
          const firstBook = data.books[0]
          setBookTitle(firstBook.title)
          setBookAuthor(firstBook.author)
          setBookCover(firstBook.cover_url || '')
        }
      } catch (err: any) {
        console.error('Error fetching books:', err)
        setError(`Lỗi khi tải sách: ${err.message}`)
      } finally {
        setIsBooksLoading(false)
      }
    }

    fetchBooks()
  }, [])

  // Update selected user
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find(u => u.id === selectedUserId)
      setSelectedUser(user || null)
    }
  }, [selectedUserId, users])

  // Handle book selection
  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId)
    const selected = books.find(b => b.id === bookId)
    if (selected) {
      setBookTitle(selected.title)
      setBookAuthor(selected.author)
      setBookCover(selected.cover_url || '')
    }
  }

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
    setSendResult(null)

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/get-users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const data = await response.json()
        setUsers(data.users || [])

        if (data.users && data.users.length > 0 && selectedUserId) {
          const user = data.users.find((u: User) => u.id === selectedUserId)
          setSelectedUser(user || null)
        }
      } catch (err: any) {
        console.error('Error refreshing users:', err)
        setError(err.message || 'Failed to refresh users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }

  const handleSendEmail = async () => {
    if (!selectedUser) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn người dùng',
        variant: 'destructive',
      })
      return
    }

    if (!bookTitle || !bookAuthor) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập tiêu đề và tác giả sách',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSending(true)
      setSendResult(null)
      setError(null)

      const payload: SendRecommendationPayload = {
        userId: selectedUser.id,
        email: selectedUser.email,
        userName: selectedUser.name,
        bookTitle,
        bookAuthor,
        bookCover: bookCover || undefined,
        bookGenre: bookGenre || undefined,
        bookRating: bookRating ? parseFloat(bookRating) : undefined,
        reason,
        recommendationId: generateUUID(),
      }

      const response = await fetch('/api/send-recommendation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Không thể gửi email')
      }

      setSendResult(data)
      setActiveTab('sent')

      toast({
        title: 'Gửi email thành công!',
        description: `Email khuyến nghị đã được gửi đến ${selectedUser.email}`,
      })
    } catch (err: any) {
      console.error('Error sending email:', err)
      setError(err.message || 'Không thể gửi email')
      toast({
        title: 'Lỗi gửi email',
        description: err.message || 'Vui lòng thử lại sau',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const emailPreviewProps = {
    userName: selectedUser?.name || 'Reader',
    bookTitle,
    bookAuthor,
    bookCover: bookCover || undefined,
    bookGenre: bookGenre || undefined,
    bookRating: bookRating ? parseFloat(bookRating) : undefined,
    reason,
    trackingToken: 'preview-token-abc123',
    siteUrl: 'https://tomorrow.io.vn',
    unsubscribeUrl: 'https://tomorrow.io.vn/settings',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gửi Khuyến Nghị Sách</h1>
        <p className="text-muted-foreground mt-2">Chọn người dùng, cập nhật thông tin sách và gửi email khuyến nghị</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - User & Book Selection */}
        <div className="w-full lg:w-1/3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Chọn Người Dùng</CardTitle>
                  <CardDescription>Chọn người dùng để gửi khuyến nghị</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : users.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Không tìm thấy người dùng nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedUserId || ''} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn người dùng" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedUser && (
                    <div className="space-y-2 bg-muted p-3 rounded">
                      <div className="text-sm">
                        <span className="font-medium">Tên:</span> {selectedUser.name || 'N/A'}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Email:</span> {selectedUser.email}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Book Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chọn Sách để Khuyến Nghị</CardTitle>
              <CardDescription>Chọn từ thư viện sách có sẵn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <p className="text-sm font-medium">Lỗi: {error}</p>
                </div>
              )}
              {isBooksLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Không tìm thấy sách nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedBookId || ''} onValueChange={handleSelectBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sách" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map(book => (
                        <SelectItem key={book.id} value={book.id}>
                          {book.title} - {book.author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedBookId && (
                    <div className="space-y-2 bg-muted p-3 rounded">
                      <div className="text-sm">
                        <span className="font-medium">Tiêu đề:</span> {bookTitle}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Tác giả:</span> {bookAuthor}
                      </div>
                      {bookCover && (
                        <div className="mt-2">
                          <img
                            src={bookCover || "/placeholder.svg"}
                            alt={bookTitle}
                            className="w-full h-auto max-h-48 object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="book-genre">Thể Loại (Tùy chọn)</Label>
                <Input
                  id="book-genre"
                  placeholder="Ví dụ: Fantasy, Sci-Fi, Romance"
                  value={bookGenre}
                  onChange={e => setBookGenre(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Lý Do Khuyến Nghị</Label>
                <textarea
                  id="reason"
                  placeholder="Nhập lý do khuyến nghị sách này"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full min-h-20 px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <Button
                onClick={handleSendEmail}
                disabled={isSending || !selectedUser || !bookTitle || !bookAuthor}
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
                    Gửi Email Khuyến Nghị
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Email Preview */}
        <div className="w-full lg:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="preview">Xem Trước</TabsTrigger>
              <TabsTrigger value="sent">Đã Gửi</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : selectedUser ? (
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <RecommendationEmailTemplate {...emailPreviewProps} />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Chọn người dùng để xem trước email</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sent" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {sendResult ? (
                    <div className="space-y-4">
                      <Alert className="border border-green-500/20 bg-green-500/10">
                        <AlertDescription>
                          Email khuyến nghị đã được gửi thành công!
                          <div className="mt-3 space-y-2 text-xs">
                            <div>
                              <span className="font-medium">Email ID:</span> {sendResult.data?.id}
                            </div>
                            <div>
                              <span className="font-medium">Gửi đến:</span> {sendResult.data?.to}
                            </div>
                            <div>
                              <span className="font-medium">Sách:</span> {bookTitle} by {bookAuthor}
                            </div>
                            <div>
                              <span className="font-medium">Thời gian:</span> {new Date().toLocaleString('vi-VN')}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                      <p className="text-sm text-muted-foreground">
                        Kiểm tra hộp thư đến. Nếu không thấy, hãy kiểm tra thư mục spam hoặc promotions.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Chưa có email nào được gửi</p>
                      <p className="text-sm text-muted-foreground mt-2">Chọn người dùng và bấm nút gửi</p>
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
