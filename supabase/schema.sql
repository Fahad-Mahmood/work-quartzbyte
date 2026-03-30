-- Supabase Schema for Digital Ledger App

-- Create custom types
CREATE TYPE task_category AS ENUM ('Recording', 'Cold Calling', 'Learning', 'Internal');
CREATE TYPE task_status AS ENUM ('Completed', 'In Progress', 'Pending', 'Overdue');

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  category task_category NOT NULL,
  time_slot TEXT NOT NULL,
  status task_status DEFAULT 'Pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create task_logs table
CREATE TABLE task_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  actual_time TEXT NOT NULL,
  status task_status NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(task_id, date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, update later with auth)
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own task_logs" ON task_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own task_logs" ON task_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own task_logs" ON task_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own task_logs" ON task_logs FOR DELETE USING (auth.uid() = user_id);
