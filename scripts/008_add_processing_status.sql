-- Add processing_status column to course_materials table
ALTER TABLE course_materials 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add error_message column for debugging
ALTER TABLE course_materials 
ADD COLUMN IF NOT EXISTS error_message TEXT;
