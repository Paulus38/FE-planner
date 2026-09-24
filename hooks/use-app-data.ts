'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { apiFetch } from '@/lib/api';
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
  userConfig: Record<string, any>;
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
  const [userConfig, setUserConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Bạn chưa đăng nhập. Vui lòng đăng nhập để xem cài đặt.');
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const d = await apiFetch('/data');
        if (cancelled) return;
        if (d.error) throw new Error(d.error);
        setSettings(d.settings || null);
        setFixedActivities(d.fixedActivities || []);
        setScheduleEntries(d.scheduleEntries || []);
        setSubjects(d.subjects || []);
        setTasks(d.tasks || []);
        setSessions(d.sessions || []);
        setJournalEntries(d.journalEntries || []);
        setWeeklyGoals(d.weeklyGoals || []);
        setDailyProgress(d.dailyProgress || []);
        setUserConfig(d.userConfig || {});
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
    userConfig,
    loading,
    error,
    refresh,
  };
}
