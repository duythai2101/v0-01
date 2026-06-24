-- Create book_tags table for many-to-many relationship between books and tags
CREATE TABLE IF NOT EXISTS book_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE book_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for book_tags
CREATE POLICY "Users can view their own book_tags"
  ON book_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own book_tags"
  ON book_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book_tags"
  ON book_tags FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_book_tags_book_id ON book_tags(book_id);
CREATE INDEX IF NOT EXISTS idx_book_tags_tag_id ON book_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_book_tags_user_id ON book_tags(user_id);
