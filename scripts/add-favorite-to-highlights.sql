-- Add favorite column to highlights table
ALTER TABLE highlights
ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE;

-- Create index for better query performance on favorite highlights
CREATE INDEX IF NOT EXISTS idx_highlights_favorite 
ON highlights(user_id, favorite) 
WHERE favorite = TRUE;

-- No RLS changes needed as existing policies will cover the new column
