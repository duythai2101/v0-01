-- Create email_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS email_logs_user_id_idx ON email_logs(user_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS email_logs_created_at_idx ON email_logs(created_at);
