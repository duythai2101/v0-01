-- =====================================================
-- RECOMMENDATION EMAIL TRACKING TABLES
-- =====================================================

-- Main table for storing book recommendations sent to users
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  book_title VARCHAR(255) NOT NULL,
  book_author VARCHAR(255) NOT NULL,
  book_genre VARCHAR(100),
  book_rating DECIMAL(3, 1),
  book_cover_url TEXT,
  recommendation_reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, opened, clicked, feedback_given
  user_feedback BOOLEAN, -- NULL: not answered, TRUE: yes, FALSE: no
  feedback_given_at TIMESTAMP WITH TIME ZONE,
  email_id VARCHAR(255), -- Email service provider's email ID
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking email open events (pixel tracking)
CREATE TABLE IF NOT EXISTS email_open_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES book_recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for tracking email click events (button clicks)
CREATE TABLE IF NOT EXISTS email_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES book_recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- suitable_yes, suitable_no
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing recommendation feedback details
CREATE TABLE IF NOT EXISTS recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES book_recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL, -- suitable_yes, suitable_no
  feedback_text TEXT,
  rating INT,
  feedback_given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for aggregated email engagement metrics
CREATE TABLE IF NOT EXISTS email_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES book_recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMP WITH TIME ZONE,
  email_clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  feedback_given BOOLEAN DEFAULT FALSE,
  feedback_type VARCHAR(50), -- suitable_yes, suitable_no
  feedback_at TIMESTAMP WITH TIME ZONE,
  time_to_open_seconds INT, -- Time between send and open
  time_to_click_seconds INT, -- Time between send and click
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for daily analytics aggregation
CREATE TABLE IF NOT EXISTS email_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sent INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_feedback INT DEFAULT 0,
  positive_feedback INT DEFAULT 0,
  negative_feedback INT DEFAULT 0,
  open_rate DECIMAL(5, 2),
  click_rate DECIMAL(5, 2),
  feedback_rate DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE book_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_open_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for book_recommendations
CREATE POLICY "Users can view their own recommendations"
  ON book_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert recommendations"
  ON book_recommendations FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role can update recommendations"
  ON book_recommendations FOR UPDATE
  WITH CHECK (TRUE);

-- Policies for email_open_events
CREATE POLICY "Users can view their own open events"
  ON email_open_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert open events"
  ON email_open_events FOR INSERT
  WITH CHECK (TRUE);

-- Policies for email_click_events
CREATE POLICY "Users can view their own click events"
  ON email_click_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert click events"
  ON email_click_events FOR INSERT
  WITH CHECK (TRUE);

-- Policies for recommendation_feedback
CREATE POLICY "Users can view their own feedback"
  ON recommendation_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert feedback"
  ON recommendation_feedback FOR INSERT
  WITH CHECK (TRUE);

-- Policies for email_engagement_metrics
CREATE POLICY "Users can view their own metrics"
  ON email_engagement_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert/update metrics"
  ON email_engagement_metrics FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role can update metrics"
  ON email_engagement_metrics FOR UPDATE
  WITH CHECK (TRUE);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for book_recommendations
CREATE INDEX IF NOT EXISTS idx_book_recommendations_user_id ON book_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_book_id ON book_recommendations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_status ON book_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_created_at ON book_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_user_feedback ON book_recommendations(user_feedback);

-- Indexes for email_open_events
CREATE INDEX IF NOT EXISTS idx_email_open_events_recommendation_id ON email_open_events(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_email_open_events_user_id ON email_open_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_open_events_opened_at ON email_open_events(opened_at DESC);

-- Indexes for email_click_events
CREATE INDEX IF NOT EXISTS idx_email_click_events_recommendation_id ON email_click_events(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_email_click_events_user_id ON email_click_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_click_events_action_type ON email_click_events(action_type);
CREATE INDEX IF NOT EXISTS idx_email_click_events_clicked_at ON email_click_events(clicked_at DESC);

-- Indexes for recommendation_feedback
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_recommendation_id ON recommendation_feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_user_id ON recommendation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_feedback_type ON recommendation_feedback(feedback_type);

-- Indexes for email_engagement_metrics
CREATE INDEX IF NOT EXISTS idx_email_engagement_metrics_recommendation_id ON email_engagement_metrics(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_email_engagement_metrics_user_id ON email_engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_engagement_metrics_updated_at ON email_engagement_metrics(updated_at DESC);

-- Indexes for email_analytics_daily
CREATE INDEX IF NOT EXISTS idx_email_analytics_daily_date ON email_analytics_daily(date DESC);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for book_recommendations
CREATE TRIGGER update_book_recommendations_updated_at
  BEFORE UPDATE ON book_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for email_engagement_metrics
CREATE TRIGGER update_email_engagement_metrics_updated_at
  BEFORE UPDATE ON email_engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for email_analytics_daily
CREATE TRIGGER update_email_analytics_daily_updated_at
  BEFORE UPDATE ON email_analytics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENT ON TABLES
-- =====================================================

COMMENT ON TABLE book_recommendations IS 'Stores recommendation emails sent to users with status tracking';
COMMENT ON TABLE email_open_events IS 'Tracks when users open recommendation emails (pixel tracking)';
COMMENT ON TABLE email_click_events IS 'Tracks button clicks in recommendation emails';
COMMENT ON TABLE recommendation_feedback IS 'Stores user feedback (yes/no) to recommendations';
COMMENT ON TABLE email_engagement_metrics IS 'Aggregated engagement metrics per recommendation';
COMMENT ON TABLE email_analytics_daily IS 'Daily aggregated analytics for all recommendations';
