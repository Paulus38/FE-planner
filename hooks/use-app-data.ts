'use client';

import { useEffect, useState, useCallback } from 'react';
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
        const token = localStorage.getItem('sb-access-token');
        const res = await fetch(`${API_URL}/data`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to load data');
        const d = await res.json();

        if (cancelled) return;

        setSettings(d.settings || null);
        setFixedActivities(d.fixedActivities || []);
        setScheduleEntries(d.scheduleEntries || []);
        setSubjects(d.subjects || []);
        setTasks(d.tasks || []);
        setSessions(d.sessions || []);
        setJournalEntries(d.journalEntries || []);
        setWeeklyGoals(d.weeklyGoals || []);
        setDailyProgress(d.dailyProgress || []);
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
