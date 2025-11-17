-- =====================================================
-- StreetWise Coach V2 Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'coach' CHECK (role IN ('coach', 'admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rank TEXT NOT NULL DEFAULT 'white',
  avatar TEXT,
  notes TEXT,
  session_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson plans table
CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lesson_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Student progress table (stores step-level progress)
CREATE TABLE IF NOT EXISTS public.student_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  slice_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  importance TEXT DEFAULT 'standard' CHECK (importance IN ('standard', 'important', 'critical')),
  next_action TEXT CHECK (next_action IN ('Teach', 'Review', 'Reteach')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id, slice_id, step_number)
);

-- Lesson metadata table (stores lesson-level info)
CREATE TABLE IF NOT EXISTS public.lesson_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Coaching sessions table
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lesson_id TEXT NOT NULL,
  lesson_name TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  notes TEXT,
  session_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test drill progress table
CREATE TABLE IF NOT EXISTS public.test_drill_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  curriculum_id TEXT NOT NULL,
  drill_number INTEGER NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN,
  total_time_seconds INTEGER,
  tested_slices JSONB,
  score_deductions JSONB,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, curriculum_id, drill_number)
);

-- Test drill attempts history
CREATE TABLE IF NOT EXISTS public.test_drill_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  curriculum_id TEXT NOT NULL,
  drill_number INTEGER NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN,
  total_time_seconds INTEGER,
  tested_slices JSONB,
  score_deductions JSONB,
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom lesson edits (per-student lesson customizations)
CREATE TABLE IF NOT EXISTS public.custom_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  custom_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Student feedback table
CREATE TABLE IF NOT EXISTS public.student_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('strength', 'improvement', 'note')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_students_coach_id ON public.students(coach_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_student_id ON public.lesson_plans(student_id);

CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON public.student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_lesson_id ON public.student_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_completed ON public.student_progress(completed);

CREATE INDEX IF NOT EXISTS idx_lesson_metadata_student_id ON public.lesson_metadata(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_metadata_lesson_id ON public.lesson_metadata(lesson_id);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_student_id ON public.coaching_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_id ON public.coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_started_at ON public.coaching_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_drill_progress_student_id ON public.test_drill_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_test_drill_attempts_student_id ON public.test_drill_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_test_drill_attempts_tested_at ON public.test_drill_attempts(tested_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_lessons_student_id ON public.custom_lessons(student_id);

CREATE INDEX IF NOT EXISTS idx_student_feedback_student_id ON public.student_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_student_feedback_created_at ON public.student_feedback(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drill_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_feedback ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Students policies
CREATE POLICY "Coaches can view their own students"
  ON public.students FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create students"
  ON public.students FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own students"
  ON public.students FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own students"
  ON public.students FOR DELETE
  USING (coach_id = auth.uid());

-- Lesson plans policies
CREATE POLICY "Coaches can view lesson plans for their students"
  ON public.lesson_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = lesson_plans.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage lesson plans for their students"
  ON public.lesson_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = lesson_plans.student_id
      AND students.coach_id = auth.uid()
    )
  );

-- Student progress policies
CREATE POLICY "Coaches can view progress for their students"
  ON public.student_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_progress.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage progress for their students"
  ON public.student_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_progress.student_id
      AND students.coach_id = auth.uid()
    )
  );

-- Lesson metadata policies
CREATE POLICY "Coaches can view lesson metadata for their students"
  ON public.lesson_metadata FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = lesson_metadata.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage lesson metadata for their students"
  ON public.lesson_metadata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = lesson_metadata.student_id
      AND students.coach_id = auth.uid()
    )
  );

-- Coaching sessions policies
CREATE POLICY "Coaches can view their own sessions"
  ON public.coaching_sessions FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create sessions"
  ON public.coaching_sessions FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own sessions"
  ON public.coaching_sessions FOR UPDATE
  USING (coach_id = auth.uid());

-- Test drill policies
CREATE POLICY "Coaches can view test progress for their students"
  ON public.test_drill_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = test_drill_progress.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage test progress for their students"
  ON public.test_drill_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = test_drill_progress.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view test attempts for their students"
  ON public.test_drill_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = test_drill_attempts.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create test attempts"
  ON public.test_drill_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = test_drill_attempts.student_id
      AND students.coach_id = auth.uid()
    )
  );

-- Custom lessons policies
CREATE POLICY "Coaches can view custom lessons for their students"
  ON public.custom_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = custom_lessons.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can manage custom lessons for their students"
  ON public.custom_lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = custom_lessons.student_id
      AND students.coach_id = auth.uid()
    )
  );

-- Student feedback policies
CREATE POLICY "Coaches can view feedback for their students"
  ON public.student_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_feedback.student_id
      AND students.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create feedback for their students"
  ON public.student_feedback FOR INSERT
  WITH CHECK (
    coach_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = student_feedback.student_id
      AND students.coach_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON public.lesson_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_metadata_updated_at BEFORE UPDATE ON public.lesson_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_sessions_updated_at BEFORE UPDATE ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_drill_progress_updated_at BEFORE UPDATE ON public.test_drill_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_lessons_updated_at BEFORE UPDATE ON public.custom_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_feedback_updated_at BEFORE UPDATE ON public.student_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment student session count
CREATE OR REPLACE FUNCTION increment_student_session_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.students
  SET session_count = session_count + 1
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_session_count_on_insert
  AFTER INSERT ON public.coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION increment_student_session_count();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VIEWS (for easier querying)
-- =====================================================

-- View: Student summary with progress stats
CREATE OR REPLACE VIEW student_summary AS
SELECT
  s.id,
  s.coach_id,
  s.name,
  s.rank,
  s.avatar,
  s.session_count,
  s.created_at,
  s.updated_at,
  lp.id as plan_id,
  lp.name as plan_name,
  COUNT(DISTINCT sp.lesson_id) as lessons_started,
  AVG(sp.confidence)::INTEGER as avg_confidence,
  COUNT(CASE WHEN sp.completed THEN 1 END)::INTEGER as steps_completed,
  COUNT(sp.id)::INTEGER as total_steps
FROM public.students s
LEFT JOIN public.lesson_plans lp ON s.id = lp.student_id
LEFT JOIN public.student_progress sp ON s.id = sp.student_id
GROUP BY s.id, lp.id, lp.name;

-- View: Lesson progress summary per student
CREATE OR REPLACE VIEW lesson_progress_summary AS
SELECT
  sp.student_id,
  sp.lesson_id,
  lm.started_at,
  lm.completed_at,
  COUNT(sp.id)::INTEGER as total_steps,
  COUNT(CASE WHEN sp.completed THEN 1 END)::INTEGER as completed_steps,
  AVG(sp.confidence)::INTEGER as avg_confidence,
  CASE
    WHEN lm.completed_at IS NOT NULL THEN 'completed'
    WHEN lm.started_at IS NOT NULL THEN 'in_progress'
    ELSE 'not_started'
  END as status
FROM public.student_progress sp
LEFT JOIN public.lesson_metadata lm
  ON sp.student_id = lm.student_id
  AND sp.lesson_id = lm.lesson_id
GROUP BY sp.student_id, sp.lesson_id, lm.started_at, lm.completed_at;
