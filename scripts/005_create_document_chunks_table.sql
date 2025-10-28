-- Create document_chunks table for RAG vector storage
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('recording', 'material')),
  source_id UUID NOT NULL, -- ID of recording or material
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  metadata JSONB, -- Store additional metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_document_chunks_course_id ON public.document_chunks(course_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_source ON public.document_chunks(source_type, source_id);

-- Enable RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_chunks
CREATE POLICY "Users can view chunks from their courses"
  ON public.document_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = document_chunks.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert chunks for their courses"
  ON public.document_chunks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = document_chunks.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete chunks from their courses"
  ON public.document_chunks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = document_chunks.course_id
      AND courses.teacher_id = auth.uid()
    )
  );
