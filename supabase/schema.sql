-- Supabase Schema for Digital Ledger App

-- ── User profiles ──────────────────────────────────────────────────────────
CREATE TABLE work_profiles (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name   TEXT,
  job_title   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'member',  -- 'admin' | 'member'
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ── Team invitations ────────────────────────────────────────────────────────
CREATE TABLE work_invitations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  job_title   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member',
  invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'accepted'
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE work_invitations ENABLE ROW LEVEL SECURITY;
-- Any authenticated user can view invitations; only admins insert (enforced in app)
CREATE POLICY "invitations_select" ON work_invitations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "invitations_insert" ON work_invitations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "invitations_update" ON work_invitations FOR UPDATE USING (auth.uid() IS NOT NULL);
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE work_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON work_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON work_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON work_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON work_profiles FOR DELETE USING (auth.uid() = user_id);
-- ───────────────────────────────────────────────────────────────────────────


-- Note: task_category is TEXT (not ENUM) to support custom user-defined categories
CREATE TYPE task_status AS ENUM ('Completed', 'In Progress', 'Pending', 'Overdue');

-- Create work_tasks table
CREATE TABLE work_tasks (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date          DATE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  time_slot     TEXT NOT NULL,
  status        task_status DEFAULT 'Pending' NOT NULL,
  assigned_to   TEXT,
  sop_duration  TEXT,
  notes         TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create work_task_logs table
CREATE TABLE work_task_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id      UUID REFERENCES work_tasks(id) ON DELETE CASCADE NOT NULL,
  date         DATE NOT NULL,
  actual_time  TEXT NOT NULL,
  status       task_status NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(task_id, date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE work_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_task_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for work_tasks
CREATE POLICY "Users can view their own work_tasks"   ON work_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own work_tasks" ON work_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own work_tasks" ON work_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own work_tasks" ON work_tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for work_task_logs
CREATE POLICY "Users can view their own work_task_logs"   ON work_task_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own work_task_logs" ON work_task_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own work_task_logs" ON work_task_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own work_task_logs" ON work_task_logs FOR DELETE USING (auth.uid() = user_id);

-- ── Migration notes (run if upgrading from the ENUM-based schema) ──────────
-- ALTER TABLE work_tasks ALTER COLUMN category TYPE TEXT;
-- ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS assigned_to  TEXT;
-- ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS sop_duration TEXT;
-- ALTER TABLE work_tasks ADD COLUMN IF NOT EXISTS notes        TEXT;
-- DROP TYPE IF EXISTS task_category;
