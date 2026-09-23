export type ActivityCategory =
  | 'fixed'
  | 'mass'
  | 'meal'
  | 'class'
  | 'prayer'
  | 'rest'
  | 'sports'
  | 'self_study'
  | 'journal'
  | 'sleep'
  | 'homework'
  | 'study';

export interface Settings {
  id: string;
  wake_time: string;
  sleep_time: string;
  mass_time_start: string;
  mass_time_end: string;
  breakfast_start: string;
  breakfast_end: string;
  lunch_start: string;
  lunch_end: string;
  nap_start: string;
  nap_end: string;
  sports_start: string;
  sports_end: string;
  dinner_start: string;
  dinner_end: string;
  evening_prayer_time: string;
  study_block1_start: string;
  study_block1_end: string;
  study_block2_start: string;
  study_block2_end: string;
  self_study_start: string;
  self_study_end: string;
  session_duration_min: number;
  break_duration_min: number;
  english_target_pct: number;
  journal_min_min: number;
  notifications_enabled: boolean;
  notify_before_study_min: number;
  notify_before_end_min: number;
  notify_journal: boolean;
  notify_sleep: boolean;
  notify_incomplete: boolean;
  notify_weekly_review: boolean;
}

export interface FixedActivity {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  category: ActivityCategory;
  icon?: string | null;
  sort_order: number;
}

export interface ScheduleEntry {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  subject_name: string;
  session_type: string;
  note?: string | null;
  sort_order: number;
}

export interface StudySubject {
  id: string;
  name: string;
  code: string;
  color: string;
  icon?: string | null;
  is_in_english_ratio: boolean;
  weekly_goal_min: number;
  monthly_goal_min: number;
  sort_order: number;
}

export interface Task {
  id: string;
  title: string;
  subject_code?: string | null;
  priority: number;
  due_date?: string | null;
  estimated_min: number;
  actual_min?: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject_code: string;
  skill?: string | null;
  title: string;
  planned_min: number;
  actual_min?: number | null;
  status: 'planned' | 'completed' | 'skipped' | 'rescheduled';
  priority: number;
  note?: string | null;
  source: 'auto' | 'manual';
  rescheduled_from?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  grateful_for?: string | null;
  good_deed?: string | null;
  needs_improvement?: string | null;
  realization?: string | null;
  want_to_change?: string | null;
  prayer?: string | null;
  duration_min: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string | null;
  total_pages: number;
  current_page: number;
  daily_goal_pages: number;
  start_date?: string | null;
  target_date?: string | null;
  note?: string | null;
  status: 'reading' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface InstrumentPractice {
  id: string;
  practice_date: string;
  solfege_min: number;
  theory_min: number;
  technique_min: number;
  repertoire?: string | null;
  practice_min: number;
  note?: string | null;
  created_at: string;
}

export interface WeeklyGoal {
  id: string;
  week_start: string;
  subject_code: string;
  target_min: number;
  actual_min: number;
  skill?: string | null;
  note?: string | null;
}

export interface MonthlyGoal {
  id: string;
  year: number;
  month: number;
  subject_code: string;
  target_min: number;
  actual_min: number;
  target_tasks: number;
  completed_tasks: number;
  target_journal_days: number;
  actual_journal_days: number;
}

export interface SemesterGoal {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  english_target_min: number;
  vietnamese_target_min: number;
  instrument_target_min: number;
  reading_target_min: number;
  target_books: number;
  target_essays: number;
  target_tasks: number;
  target_journal_days: number;
}

export interface DailyProgress {
  id: string;
  progress_date: string;
  english_min: number;
  vietnamese_min: number;
  instrument_min: number;
  reading_min: number;
  homework_min: number;
  journal_min: number;
  total_study_min: number;
  tasks_completed: number;
  tasks_total: number;
  journal_completed: boolean;
  plan_completed: boolean;
  english_ratio: number;
}

export interface WeeklyReview {
  id: string;
  week_start: string;
  total_study_min: number;
  english_min: number;
  vietnamese_min: number;
  instrument_min: number;
  reading_min: number;
  english_ratio: number;
  tasks_completed: number;
  tasks_total: number;
  journal_days: number;
  completion_rate: number;
  what_went_well?: string | null;
  what_needs_improvement?: string | null;
  next_week_focus?: string | null;
}

export interface MonthlyReview {
  id: string;
  year: number;
  month: number;
  total_study_min: number;
  english_min: number;
  vietnamese_min: number;
  instrument_min: number;
  reading_min: number;
  english_ratio: number;
  tasks_completed: number;
  journal_days: number;
  plan_completed_days: number;
  streak: number;
  reflection?: string | null;
}

export interface TimelineActivity {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  category: ActivityCategory;
  subject_code?: string;
  skill?: string | null;
  status?: 'planned' | 'completed' | 'skipped' | 'rescheduled';
  priority?: number;
  note?: string | null;
  session_id?: string;
  is_fixed: boolean;
  is_class: boolean;
  is_self_study: boolean;
  planned_min?: number;
  actual_min?: number | null;
}
