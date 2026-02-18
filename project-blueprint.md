=== Database Tables ===

-- 1) profiles
-- This stores the AI-understood candidate.

create table profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  full_name text,
  primary_role text,
  experience_level text,
  skills jsonb,
  summary text,
  qualifications jsonb, -- Array of degrees/certifications: [{degree: 'BSc Computer Science', institution: 'University Name', year: 2020, grade: 'First Class'}]
  created_at timestamp default now()
);

-- 2) cvs
-- Stores uploaded CVs.

create table cvs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  file_path text,
  extracted_text text,
  created_at timestamp default now()
);

-- 3) jobs
-- to manually insert 20-50 jobs for demo.

create table jobs (
  id uuid primary key default uuid_generate_v4(),
  title text,
  company text,
  location text,
  description text,
  requirements text,
  apply_email text,
  website text,
  created_at timestamp default now()
);

-- 4) matches
-- AI matching results.

create table matches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  job_id uuid references jobs(id) on delete cascade,
  match_score int,
  reason text,
  status text default 'suggested',
  created_at timestamp default now()
);

-- 5) applications
-- Stores generated applications.

create table applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  cv_id uuid references cvs(id)
  job_id uuid,
  cover_letter text,
  applied_at timestamp default now()
);

-- 6) THE MOST IMPORTANT TABLE → tasks
-- This is your worker communication system.

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  type text,
  payload jsonb,
  status text default 'pending',  {(pending, processing, completed, failed)}
  result jsonb,
  created_at timestamp default now()
);

