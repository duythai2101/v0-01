// components/email-template.tsx
import * as React from "react"

interface EmailTemplateProps {
  title: string
  author: string
  content: string
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  title,
  author,
  content,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      backgroundColor: "#f9f9f9",
      color: "#333",
    }}
  >
    <h1 style={{ color: "#222" }}>{title}</h1>
    <h2 style={{ fontWeight: "normal", color: "#666" }}>by {author}</h2>
    <blockquote
      style={{
        marginTop: "20px",
        fontStyle: "italic",
        paddingLeft: "20px",
        borderLeft: "4px solid #ccc",
      }}
    >
      {content}
    </blockquote>
    <p style={{ marginTop: "40px", fontSize: "12px", color: "#999" }}>
      Sent with ❤️ from <strong>Tomorrow</strong>
    </p>
  </div>
)
