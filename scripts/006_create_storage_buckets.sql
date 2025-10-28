-- Create storage bucket for course materials (PDFs and text files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course-materials bucket
CREATE POLICY "Teachers can upload their own course materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can view their own course materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can delete their own course materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
