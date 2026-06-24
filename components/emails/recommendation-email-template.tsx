import type * as React from "react"

interface RecommendationEmailProps {
  userName?: string
  bookTitle: string
  bookAuthor: string
  bookCover?: string
  bookGenre?: string
  bookRating?: number
  reason: string
  trackingToken: string
  siteUrl: string
  unsubscribeUrl: string
  bookDescription?: string
  relatedBookTitle?: string
  relatedBookCover?: string
  relatedBookAuthor?: string
  relatedBookGenre?: string
  relatedBookReason?: string
}

export const RecommendationEmailTemplate: React.FC<Readonly<RecommendationEmailProps>> = ({
  userName = "Reader",
  bookTitle,
  bookAuthor,
  bookCover,
  bookGenre,
  bookRating,
  reason,
  trackingToken,
  siteUrl,
  unsubscribeUrl,
  bookDescription,
  relatedBookTitle,
  relatedBookCover,
  relatedBookAuthor,
  relatedBookGenre,
  relatedBookReason,
}) => {
  const buttonBaseUrl = `${siteUrl}/api/recommendations/track?token=${trackingToken}`

  const buttonStyle = {
    display: "inline-block",
    padding: "12px 24px",
    margin: "8px 4px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "bold",
    textAlign: "center" as const,
    border: "none",
    cursor: "pointer",
    fontFamily: '"Charter BT Pro", serif',
  }

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#10b981",
    color: "#ffffff",
  }

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f3f4f6",
    color: "#374151",
  }

  const containerStyle = {
    fontFamily: '"Charter BT Pro", serif',
    maxWidth: "600px",
    margin: "0 auto",
    padding: "40px 20px",
    backgroundColor: "#ffffff",
    color: "#333333",
  }

  const headerStyle = {
    textAlign: "center" as const,
    marginBottom: "30px",
  }

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "bold" as const,
    color: "#111827",
    marginBottom: "5px",
    fontFamily: '"Charter BT Pro", serif',
  }

  const authorStyle = {
    fontSize: "18px",
    fontWeight: "normal" as const,
    color: "#6b7280",
    marginBottom: "20px",
    fontFamily: '"Charter BT Pro", serif',
  }

  const reasonStyle = {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "20px",
    fontFamily: '"Charter BT Pro", serif',
    fontStyle: "italic" as const,
    textAlign: "center" as const,
  }

  const descriptionStyle = {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#374151",
    marginBottom: "30px",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    fontFamily: '"Charter BT Pro", serif',
  }

  const surveyContainerStyle = {
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid #eeeeee",
    textAlign: "center" as const,
  }

  const surveyTitleStyle = {
    fontSize: "16px",
    fontWeight: "bold" as const,
    color: "#111827",
    marginBottom: "20px",
    fontFamily: '"Charter BT Pro", serif',
  }

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap" as const,
    marginBottom: "20px",
    gap: "10px",
  }

  const footerStyle = {
    textAlign: "center" as const,
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid #eeeeee",
    fontSize: "12px",
    color: "#6b7280",
    fontFamily: '"Charter BT Pro", serif',
  }

  return (
    <div style={containerStyle}>
      {/* Greeting */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "20px" }}>
          Hi,
        </p>
        <p style={{ fontSize: "16px", color: "#6b7280", marginBottom: "20px" }}>
          Based on your reading preferences, we found a book we think you'll love:
        </p>
      </div>

      {/* Book Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>{bookTitle}</h1>
        <h2 style={authorStyle}>by {bookAuthor}</h2>
      </div>

      {/* Recommendation Reason */}
      <div style={reasonStyle}>
        {reason}
      </div>

      {/* Book Cover Image */}
      {bookCover && (
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img
            src={bookCover || "/placeholder.svg"}
            alt={bookTitle}
            style={{
              maxWidth: "220px",
              height: "auto",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      )}

      {/* Suitability Survey Section */}
      <div style={surveyContainerStyle}>
        <h3 style={surveyTitleStyle}>Do you like this book?</h3>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
          Your feedback help a lot.
        </p>


        <table
          role="presentation"
          width="100%"
          style={{ marginTop: "16px" }}
        >
          <tr>
            <td align="center">
              <table role="presentation">
                <tr>
                  <td style={{ paddingRight: "8px" }}>
                    <a
                      href={`${buttonBaseUrl}&action=suitable_yes`}
                      style={{
                        ...primaryButtonStyle,
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        padding: "10px 30px",
                        fontSize: "15px",
                        textDecoration: "none",
                        borderRadius: "6px",
                        display: "inline-block",
                      }}
                    >
                      Yes
                    </a>
                  </td>

                  <td style={{ paddingLeft: "8px" }}>
                    <a
                      href={`${buttonBaseUrl}&action=suitable_no`}
                      style={{
                        ...primaryButtonStyle,
                        backgroundColor: "#ef4444",
                        color: "#ffffff",
                        padding: "10px 30px",
                        fontSize: "15px",
                        textDecoration: "none",
                        borderRadius: "6px",
                        display: "inline-block",
                      }}
                    >
                      No
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ marginTop: "10px" }}>
          You're receiving this because you subscribed to personalized recommendations.
        </p>
        <p style={{ marginTop: "10px" }}>
          <a href={unsubscribeUrl} style={{ color: "#6b7280", textDecoration: "underline" }}>
            Manage preferences
          </a>
          {" | "}
          <a href={unsubscribeUrl} style={{ color: "#6b7280", textDecoration: "underline" }}>
            Unsubscribe
          </a>
        </p>
        <p style={{ marginTop: "10px", fontSize: "11px" }}>
          © Tomorrow • Your Daily Reading Companion
        </p>
      </div>

      {/* Tracking Pixel */}
      <img
        src={`${siteUrl}/api/recommendations/track?token=${trackingToken}&action=opened`}
        alt=""
        width="1"
        height="1"
        style={{ display: "none" }}
      />
    </div>
  )
}
