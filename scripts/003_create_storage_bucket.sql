-- Create storage bucket for audio recordings
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', true)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Users can upload their own recordings"
on storage.objects for insert
with check (
  bucket_id = 'recordings' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own recordings"
on storage.objects for select
using (
  bucket_id = 'recordings' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own recordings"
on storage.objects for delete
using (
  bucket_id = 'recordings' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
