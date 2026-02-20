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

create table user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete cascade,

  -- Email settings
  application_email text,
  notification_email text,
  email_signature text,
  auto_send boolean default true,

  -- Notification settings
  notify_job_matches boolean default true,
  notify_application_status boolean default true,
  notify_system_updates boolean default false,
  notify_weekly_reports boolean default true,

  -- Preferences
  max_applications int default 10,
  min_match_score int default 70,
  preferred_locations jsonb default '[]',
  job_types jsonb default '[]',

  created_at timestamp default now(),
  updated_at timestamp default now()
);

