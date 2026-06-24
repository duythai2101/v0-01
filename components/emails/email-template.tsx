import type * as React from "react"

interface EmailTemplateProps {
  title: string
  author: string
  content: string
  unsubscribeUrl?: string
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  title,
  author,
  content,
  unsubscribeUrl = "#",
}) => {
  return (
    <div
      style={{
        fontFamily: '"Charter BT Pro", serif',
        maxWidth: "600px",
        margin: "0 auto",
        padding: "40px 20px",
        backgroundColor: "#ffffff",
        color: "#333333",
      }}
    >
      {/* Content */}
      <div style={{ textAlign: "center" }}>
        {/* Book Title */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "5px",
            fontFamily: '"Charter BT Pro", serif',
          }}
        >
          {title}
        </h1>

        {/* Author */}
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "normal",
            color: "#6b7280",
            marginBottom: "30px",
            fontFamily: '"Charter BT Pro", serif',
          }}
        >
          by {author}
        </h2>

        {/* Highlight */}
        <blockquote
          style={{
            fontSize: "20px",
            lineHeight: "1.6",
            color: "#374151",
            padding: "30px 20px",
            backgroundColor: "#f9fafb",
            borderLeft: "4px solid #6b7280",
            margin: "0 auto 30px auto",
            maxWidth: "500px",
            textAlign: "left",
            fontStyle: "italic",
            fontFamily: '"Charter BT Pro", serif',
          }}
        >
          {content}
        </blockquote>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          paddingTop: "20px",
          borderTop: "1px solid #eeeeee",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        <p style={{ marginTop: "10px", fontSize: "12px", fontFamily: '"Charter BT Pro", serif' }}>
          <a href={unsubscribeUrl} style={{ color: "#6b7280", textDecoration: "underline" }}>
            Unsubscribe
          </a>
        </p>
      </div>
    </div>
  )
}
