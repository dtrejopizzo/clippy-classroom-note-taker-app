-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding TEXT,
  match_course_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  course_id UUID,
  source_type TEXT,
  source_id UUID,
  chunk_text TEXT,
  chunk_index INT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vec vector(1536);
BEGIN
  -- Parse the JSON string to vector
  query_vec := query_embedding::vector(1536);
  
  RETURN QUERY
  SELECT
    dc.id,
    dc.course_id,
    dc.source_type,
    dc.source_id,
    dc.chunk_text,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_vec) AS similarity
  FROM document_chunks dc
  WHERE dc.course_id = match_course_id
  ORDER BY dc.embedding <=> query_vec
  LIMIT match_count;
END;
$$;
