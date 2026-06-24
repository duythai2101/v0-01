import { Card, CardContent } from "@/components/ui/card"
import { EmailTemplate } from "@/components/emails/email-template"

interface EmailPreviewProps {
  title: string
  author: string
  content: string
}

export function EmailPreview({ title, author, content }: EmailPreviewProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-white text-black dark:bg-gray-900 dark:text-white">
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <EmailTemplate title={title} author={author} content={content} unsubscribeUrl="#" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
