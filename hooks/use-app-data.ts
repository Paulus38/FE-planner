'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/api';
import { useAuth } from '@/components/auth-provider';
import type {
  Settings,
  FixedActivity,
  ScheduleEntry,
  StudySubject,
  Task,
  StudySession,
  JournalEntry,
  WeeklyGoal,
  DailyProgress,
} from '@/lib/types';

export interface AppData {
  settings: Settings | null;
  fixedActivities: FixedActivity[];
  scheduleEntries: ScheduleEntry[];
  subjects: StudySubject[];
  tasks: Task[];
  sessions: StudySession[];
  journalEntries: JournalEntry[];
  weeklyGoals: WeeklyGoal[];
  dailyProgress: DailyProgress[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAppData(): AppData {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fixedActivities, setFixedActivities] = useState<FixedActivity[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          settingsRes,
          fixedRes,
          scheduleRes,
          subjectsRes,
          tasksRes,
          sessionsRes,
          journalRes,
          goalsRes,
          progressRes,
        ] = await Promise.all([
          supabase.from('settings').select('*').limit(1).maybeSingle(),
          supabase.from('fixed_activities').select('*').order('sort_order'),
          supabase.from('schedule_entries').select('*').order('weekday, sort_order'),
          supabase.from('study_subjects').select('*').order('sort_order'),
          supabase.from('tasks').select('*').order('due_date'),
          supabase.from('study_sessions').select('*').order('date, start_time'),
          supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }).limit(30),
          supabase.from('weekly_goals').select('*'),
          supabase.from('daily_progress').select('*').order('progress_date', { ascending: false }).limit(60),
        ]);

        if (cancelled) return;

        if (settingsRes.error) throw settingsRes.error;

        setSettings(settingsRes.data || null);
        setFixedActivities(fixedRes.data || []);
        setScheduleEntries(scheduleRes.data || []);
        setSubjects(subjectsRes.data || []);
        setTasks(tasksRes.data || []);
        setSessions(sessionsRes.data || []);
        setJournalEntries(journalRes.data || []);
        setWeeklyGoals(goalsRes.data || []);
        setDailyProgress(progressRes.data || []);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, user]);

  return {
    settings,
    fixedActivities,
    scheduleEntries,
    subjects,
    tasks,
    sessions,
    journalEntries,
    weeklyGoals,
    dailyProgress,
    loading,
    error,
    refresh,
  };
}
