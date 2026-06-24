-- Create recommendation_email_logs table
-- Tracks every recommendation email sent and the user's yes/no feedback

CREATE TABLE IF NOT EXISTS recommendation_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who received the email
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,

  -- Book that was recommended
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_cover TEXT,
  book_genre TEXT,
  book_rating NUMERIC(3, 1),
  reason TEXT,

  -- Tracking token used in the email links
  tracking_token TEXT,

  -- Email send metadata
  resend_email_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- User vote (null until they click Yes or No)
  vote TEXT CHECK (vote IN ('yes', 'no')),
  voted_at TIMESTAMPTZ,

  -- Extra metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_recommendation_email_logs_user_id
  ON recommendation_email_logs (user_id);

-- Index for fast lookup by tracking token (used when vote comes in)
CREATE INDEX IF NOT EXISTS idx_recommendation_email_logs_tracking_token
  ON recommendation_email_logs (tracking_token);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_recommendation_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recommendation_email_logs_updated_at ON recommendation_email_logs;
CREATE TRIGGER trg_recommendation_email_logs_updated_at
  BEFORE UPDATE ON recommendation_email_logs
  FOR EACH ROW EXECUTE FUNCTION update_recommendation_email_logs_updated_at();
