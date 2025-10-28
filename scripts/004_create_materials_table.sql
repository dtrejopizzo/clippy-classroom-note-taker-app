-- Create course_materials table for PDFs and text files
CREATE TABLE IF NOT EXISTS public.course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'text')),
  file_url TEXT NOT NULL,
  content TEXT, -- Extracted text content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_teacher_id ON public.course_materials(teacher_id);

-- Enable RLS
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_materials
CREATE POLICY "Teachers can view their own course materials"
  ON public.course_materials
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own course materials"
  ON public.course_materials
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own course materials"
  ON public.course_materials
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own course materials"
  ON public.course_materials
  FOR DELETE
  USING (auth.uid() = teacher_id);
