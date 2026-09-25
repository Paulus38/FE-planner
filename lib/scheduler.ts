import type {
  FixedActivity,
  ScheduleEntry,
  StudySession,
  Settings,
  TimelineActivity,
  Task,
} from './types';
import { DEFAULT_WEEKLY_PLAN } from './constants';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calcDuration(start: string, end: string): number {
  const startMin = timeToMinutes(start);
  let endMin = timeToMinutes(end);
  if (endMin < startMin) endMin += 24 * 60;
  return endMin - startMin;
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function dateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getWeekday(date: Date = new Date()): number {
  return date.getDay();
}

export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekDates(date: Date = new Date()): Date[] {
  const monday = getMondayOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return dateStr(d1) === dateStr(d2);
}

export function formatVietnameseDate(date: Date = new Date()): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  return `${days[date.getDay()]}, ${date.getDate()} tháng ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

export function getGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

export interface TimeSlot {
  start: number;
  end: number;
  duration: number;
}

export function findFreeSlots(
  fixedActivities: FixedActivity[],
  scheduleEntries: ScheduleEntry[],
  weekday: number,
  windowStart: number,
  windowEnd: number
): TimeSlot[] {
  const blocked: TimeSlot[] = [];

  for (const fa of fixedActivities) {
    const s = timeToMinutes(fa.start_time);
    let e = timeToMinutes(fa.end_time);
    if (e < s) e += 24 * 60;
    if (e > windowStart && s < windowEnd) {
      blocked.push({ start: Math.max(s, windowStart), end: Math.min(e, windowEnd), duration: 0 });
    }
  }

  for (const se of scheduleEntries) {
    if (se.weekday !== weekday) continue;
    const s = timeToMinutes(se.start_time);
    let e = timeToMinutes(se.end_time);
    if (e < s) e += 24 * 60;
    if (e > windowStart && s < windowEnd) {
      blocked.push({ start: Math.max(s, windowStart), end: Math.min(e, windowEnd), duration: 0 });
    }
  }

  blocked.sort((a, b) => a.start - b.start);

  const free: TimeSlot[] = [];
  let cursor = windowStart;
  for (const b of blocked) {
    if (b.start > cursor) {
      free.push({ start: cursor, end: b.start, duration: b.start - cursor });
    }
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < windowEnd) {
    free.push({ start: cursor, end: windowEnd, duration: windowEnd - cursor });
  }
  return free;
}

export function buildTimelineForDay(
  date: Date,
  fixedActivities: FixedActivity[],
  scheduleEntries: ScheduleEntry[],
  studySessions: StudySession[]
): TimelineActivity[] {
  const ds = dateStr(date);
  const weekday = getWeekday(date);
  const activities: TimelineActivity[] = [];

  for (const fa of fixedActivities) {
    if (fa.category === 'sleep') continue;
    activities.push({
      id: `fixed-${fa.id}`,
      date: ds,
      start_time: fa.start_time,
      end_time: fa.end_time,
      title: fa.name,
      category: fa.category,
      is_fixed: true,
      is_class: false,
      is_self_study: false,
      status: 'planned',
    });
  }

  for (const se of scheduleEntries) {
    if (se.weekday !== weekday) continue;
    if (!matchesWeekPattern(date, se.week_pattern)) continue;
    const cat = se.session_type === 'reading' ? 'class' : 'class';
    activities.push({
      id: `class-${se.id}`,
      date: ds,
      start_time: se.start_time,
      end_time: se.end_time,
      title: se.subject_name,
      category: cat,
      is_fixed: false,
      is_class: true,
      is_self_study: false,
      status: 'planned',
      note: se.note,
    });
  }

  function getIsoWeekNumber(date: Date): number {
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  function matchesWeekPattern(date: Date, pattern?: string | null): boolean {
    if (!pattern || pattern === 'all' || pattern === 'weekly') return true;

    const normalized = pattern.toLowerCase().replace(/\s+/g, '_');
    const isoWeek = getIsoWeekNumber(date);
    const weekOfMonth = Math.ceil(date.getDate() / 7);

    if (normalized === 'even' || normalized === 'week_even') return isoWeek % 2 === 0;
    if (normalized === 'odd' || normalized === 'week_odd') return isoWeek % 2 === 1;
    if (normalized === 'biweekly') return isoWeek % 2 === 1;

    const monthWeeks = normalized.match(/^week_(\d+)(?:_and_(\d+))?$/);
    if (monthWeeks) {
      const first = Number(monthWeeks[1]);
      const second = monthWeeks[2] ? Number(monthWeeks[2]) : undefined;
      return weekOfMonth === first || weekOfMonth === second;
    }

    return true;
  }

  for (const ss of studySessions) {
    if (ss.date !== ds) continue;
    const cat: TimelineActivity['category'] = ss.subject_code === 'homework' ? 'homework' : 'self_study';
    activities.push({
      id: `session-${ss.id}`,
      date: ds,
      start_time: ss.start_time,
      end_time: ss.end_time,
      title: ss.title,
      category: cat,
      subject_code: ss.subject_code,
      skill: ss.skill,
      is_fixed: false,
      is_class: false,
      is_self_study: true,
      status: ss.status,
      priority: ss.priority,
      note: ss.note,
      session_id: ss.id,
      planned_min: ss.planned_min,
      actual_min: ss.actual_min,
    });
  }

  activities.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  return activities;
}

export function findCurrentActivity(activities: TimelineActivity[]): TimelineActivity | null {
  const now = getCurrentMinutes();
  for (const a of activities) {
    const s = timeToMinutes(a.start_time);
    let e = timeToMinutes(a.end_time);
    if (e < s) e += 24 * 60;
    if (now >= s && now < e) return a;
  }
  return null;
}

export function findNextActivity(activities: TimelineActivity[]): TimelineActivity | null {
  const now = getCurrentMinutes();
  const upcoming = activities
    .filter((a) => timeToMinutes(a.start_time) > now)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  return upcoming[0] || null;
}

export function secondsUntilNext(next: TimelineActivity | null): number {
  if (!next) return 0;
  const now = getCurrentMinutes();
  const target = timeToMinutes(next.start_time);
  return Math.max(0, (target - now) * 60);
}

export function secondsRemainingInCurrent(current: TimelineActivity | null): number {
  if (!current) return 0;
  const now = getCurrentMinutes();
  let end = timeToMinutes(current.end_time);
  const start = timeToMinutes(current.start_time);
  if (end < start) end += 24 * 60;
  return Math.max(0, (end - now) * 60);
}

export interface EnglishRatioResult {
  english: number;
  vietnamese: number;
  instrument: number;
  reading: number;
  total: number;
  ratio: number;
  target: number;
  isOnTarget: boolean;
}

export function calcEnglishRatio(sessions: StudySession[]): EnglishRatioResult {
  let english = 0;
  let vietnamese = 0;
  let instrument = 0;
  let reading = 0;

  for (const s of sessions) {
    if (s.status === 'planned' || s.status === 'completed') {
      const min = s.actual_min ?? s.planned_min;
      switch (s.subject_code) {
        case 'english':
          english += min;
          break;
        case 'vietnamese':
          vietnamese += min;
          break;
        case 'instrument':
          instrument += min;
          break;
        case 'reading':
          reading += min;
          break;
      }
    }
  }

  const total = english + vietnamese + instrument + reading;
  const ratio = total > 0 ? (english / total) * 100 : 0;
  return {
    english,
    vietnamese,
    instrument,
    reading,
    total,
    ratio,
    target: 50,
    isOnTarget: Math.abs(ratio - 50) < 2,
  };
}

export function calcEnglishRatioFromMinutes(english: number, vietnamese: number, instrument: number, reading: number): EnglishRatioResult {
  const total = english + vietnamese + instrument + reading;
  const ratio = total > 0 ? (english / total) * 100 : 0;
  return {
    english,
    vietnamese,
    instrument,
    reading,
    total,
    ratio,
    target: 50,
    isOnTarget: Math.abs(ratio - 50) < 2,
  };
}

export interface PlannedSession {
  subject_code: string;
  title: string;
  skill?: string;
  duration_min: number;
  priority: number;
}

export function smartPlan(
  availableMin: number,
  tasks: Task[],
  weekday: number,
  englishTargetPct: number = 50
): PlannedSession[] {
  const result: PlannedSession[] = [];
  let remaining = availableMin;

  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const homeworkMin = pendingTasks.reduce((sum, t) => sum + t.estimated_min, 0);

  if (homeworkMin > 0 && remaining > 0) {
    const hwAlloc = Math.min(homeworkMin, remaining, availableMin * 0.4);
    result.push({
      subject_code: 'homework',
      title: 'Bài tập / Ôn bài',
      duration_min: Math.round(hwAlloc),
      priority: 1,
    });
    remaining -= Math.round(hwAlloc);
  }

  if (remaining <= 0) return result;

  const ratioSubjects = ['english', 'vietnamese', 'instrument', 'reading'];
  const englishFraction = englishTargetPct / 100;
  const otherFraction = (1 - englishFraction) / 3;

  const defaultPlan = DEFAULT_WEEKLY_PLAN[weekday] || DEFAULT_WEEKLY_PLAN[1];
  const session1Subject = defaultPlan.session1.subject;
  const session2Subject = defaultPlan.session2.subject;

  const englishMin = Math.round(remaining * englishFraction);
  const otherMin = Math.round(remaining * otherFraction);

  const allocations: Record<string, number> = {
    english: englishMin,
    vietnamese: otherMin,
    instrument: otherMin,
    reading: otherMin,
  };

  const orderedSubjects = [session1Subject, session2Subject].concat(
    ratioSubjects.filter((s) => s !== session1Subject && s !== session2Subject)
  );

  let allocated = 0;
  for (const subject of orderedSubjects) {
    if (remaining <= 0) break;
    if (subject === 'homework') continue;
    const amt = Math.min(allocations[subject] || 0, remaining);
    if (amt > 0) {
      const title = subject === 'english'
        ? defaultPlan.session2.title
        : subject === session1Subject
        ? defaultPlan.session1.title
        : SUBJECT_DEFAULT_TITLES[subject] || 'Tự học';
      const skill = subject === 'english' ? defaultPlan.session2.skill : subject === session1Subject ? defaultPlan.session1.skill : undefined;
      result.push({
        subject_code: subject,
        title,
        skill,
        duration_min: amt,
        priority: subject === 'english' ? 2 : 3,
      });
      remaining -= amt;
      allocated += amt;
    }
  }

  return result;
}

const SUBJECT_DEFAULT_TITLES: Record<string, string> = {
  english: 'English',
  vietnamese: 'Việt văn',
  instrument: 'Đàn',
  reading: 'Đọc sách',
};

export function generateStudySessions(
  date: Date,
  settings: Settings,
  plannedSessions: PlannedSession[]
): Omit<StudySession, 'id' | 'created_at' | 'updated_at'>[] {
  const ds = dateStr(date);
  const sessionDuration = settings.session_duration_min;
  const breakDuration = settings.break_duration_min;
  const startTime = timeToMinutes(settings.self_study_start);
  const endTime = timeToMinutes(settings.self_study_end);
  const journalStart = timeToMinutes('21:20');
  const journalEnd = timeToMinutes('21:35');

  const sessions: Omit<StudySession, 'id' | 'created_at' | 'updated_at'>[] = [];
  let cursor = startTime;

  for (const ps of plannedSessions) {
    if (cursor >= endTime) break;
    let remaining = ps.duration_min;
    while (remaining > 0 && cursor + sessionDuration <= journalStart) {
      const dur = Math.min(sessionDuration, remaining, journalStart - cursor);
      if (dur < 15) break;
      const start = minutesToTime(cursor);
      const end = minutesToTime(cursor + dur);
      sessions.push({
        date: ds,
        start_time: start,
        end_time: end,
        subject_code: ps.subject_code,
        skill: ps.skill || null,
        title: ps.title,
        planned_min: dur,
        actual_min: null,
        status: 'planned',
        priority: ps.priority,
        note: null,
        source: 'auto',
        rescheduled_from: null,
      });
      remaining -= dur;
      cursor += dur + breakDuration;
    }
  }

  if (cursor < journalStart) {
    sessions.push({
      date: ds,
      start_time: minutesToTime(cursor),
      end_time: '21:20',
      subject_code: 'homework',
      skill: null,
      title: 'Tổng kết / Chuẩn bị ngày mai',
      planned_min: journalStart - cursor,
      actual_min: null,
      status: 'planned',
      priority: 1,
      note: null,
      source: 'auto',
      rescheduled_from: null,
    });
  }

  sessions.push({
    date: ds,
    start_time: '21:20',
    end_time: '21:35',
    subject_code: 'journal',
    skill: null,
    title: 'Nhật ký thiêng liêng',
    planned_min: 15,
    actual_min: null,
    status: 'planned',
    priority: 1,
    note: null,
    source: 'auto',
    rescheduled_from: null,
  });

  sessions.push({
    date: ds,
    start_time: '21:35',
    end_time: '21:45',
    subject_code: 'homework',
    skill: null,
    title: 'Chuẩn bị ngủ',
    planned_min: 10,
    actual_min: null,
    status: 'planned',
    priority: 1,
    note: null,
    source: 'auto',
    rescheduled_from: null,
  });

  return sessions;
}

export function findRescheduleSlots(
  date: Date,
  fixedActivities: FixedActivity[],
  scheduleEntries: ScheduleEntry[],
  existingSessions: StudySession[],
  durationMin: number,
  settings: Settings
): TimeSlot[] {
  const weekday = getWeekday(date);
  const windowStart = timeToMinutes(settings.self_study_start);
  const windowEnd = timeToMinutes('21:20');

  const free = findFreeSlots(fixedActivities, scheduleEntries, weekday, windowStart, windowEnd);

  const ds = dateStr(date);
  const sessionBlocked = existingSessions
    .filter((s) => s.date === ds && s.status !== 'skipped' && s.status !== 'rescheduled')
    .map((s) => ({
      start: timeToMinutes(s.start_time),
      end: timeToMinutes(s.end_time),
    }));

  const result: TimeSlot[] = [];
  for (const f of free) {
    let cursor = f.start;
    while (cursor + durationMin <= f.end) {
      const conflict = sessionBlocked.some((b) => cursor < b.end && cursor + durationMin > b.start);
      if (!conflict) {
        result.push({ start: cursor, end: cursor + durationMin, duration: durationMin });
      }
      cursor += 15;
    }
  }
  return result;
}

export function calcCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function calcStreak(progressDates: { progress_date: string; plan_completed: boolean }[]): number {
  const completed = new Set(
    progressDates.filter((p) => p.plan_completed).map((p) => p.progress_date)
  );
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = dateStr(d);
    if (completed.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function calcRequiredDailyAvg(remaining: number, daysRemaining: number): number {
  if (daysRemaining <= 0) return remaining;
  return Math.ceil(remaining / daysRemaining);
}
