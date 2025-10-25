-- Create profiles table for teacher information
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamp with time zone default now()
);

-- Create courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create recordings table
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  audio_url text,
  duration_seconds integer,
  transcription text,
  summary text,
  study_materials text,
  status text default 'recording' check (status in ('recording', 'processing', 'completed', 'failed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.recordings enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for courses
create policy "Teachers can view their own courses"
  on public.courses for select
  using (auth.uid() = teacher_id);

create policy "Teachers can insert their own courses"
  on public.courses for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update their own courses"
  on public.courses for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete their own courses"
  on public.courses for delete
  using (auth.uid() = teacher_id);

-- RLS Policies for recordings
create policy "Teachers can view their own recordings"
  on public.recordings for select
  using (auth.uid() = teacher_id);

create policy "Teachers can insert their own recordings"
  on public.recordings for insert
  with check (auth.uid() = teacher_id);

create policy "Teachers can update their own recordings"
  on public.recordings for update
  using (auth.uid() = teacher_id);

create policy "Teachers can delete their own recordings"
  on public.recordings for delete
  using (auth.uid() = teacher_id);
