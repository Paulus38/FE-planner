'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import {
  buildTimelineForDay,
  findCurrentActivity,
  findNextActivity,
  secondsUntilNext,
  secondsRemainingInCurrent,
  formatCountdown,
  formatVietnameseDate,
  getGreeting,
  calcEnglishRatio,
  dateStr,
  todayStr,
  formatDuration,
  timeToMinutes,
  getCurrentMinutes,
} from '@/lib/scheduler';
import { getCategoryColors } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, TrendingUp, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { TimelineActivity } from '@/lib/types';

export default function DashboardPage() {
  const {
    settings,
    fixedActivities,
    scheduleEntries,
    subjects,
    tasks,
    sessions,
    journalEntries,
    weeklyGoals,
    loading,
  } = useAppData();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const todayDateStr = todayStr();

  const timeline = useMemo(
    () => buildTimelineForDay(today, fixedActivities, scheduleEntries, sessions),
    [fixedActivities, scheduleEntries, sessions, today]
  );

  const current = useMemo(() => findCurrentActivity(timeline), [timeline, now]);
  const next = useMemo(() => findNextActivity(timeline), [timeline, now]);
  const countdown = secondsUntilNext(next);
  const remaining = secondsRemainingInCurrent(current);

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === todayDateStr),
    [sessions, todayDateStr]
  );

  const completedToday = todaySessions.filter((s) => s.status === 'completed').length;
  const totalToday = timeline.filter((a) => a.is_self_study || a.category === 'journal').length;
  const completionPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const weekSessions = useMemo(() => {
    const monday = new Date(today);
    const day = today.getDay();
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    const mondayStr = dateStr(monday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = dateStr(sunday);
    return sessions.filter((s) => s.date >= mondayStr && s.date <= sundayStr);
  }, [sessions, today]);

  const englishRatio = useMemo(() => calcEnglishRatio(weekSessions), [weekSessions]);

  const englishWeeklyGoal = useMemo(() => {
    const monday = new Date(today);
    const day = today.getDay();
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    const mondayStr = dateStr(monday);
    const goals = weeklyGoals.filter((g) => g.week_start === mondayStr && g.subject_code === 'english');
    return goals.reduce((sum, g) => sum + g.target_min, 0);
  }, [weeklyGoals, today]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const journalToday = journalEntries.find((j) => j.entry_date === todayDateStr);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentCat = current ? getCategoryColors(current.category) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{getGreeting(now)}</h1>
        <p className="mt-1 text-muted-foreground">{formatVietnameseDate(now)}</p>
      </div>

      {/* Current activity + countdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Đang diễn ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            {current ? (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${currentCat?.dot}`} />
                      <p className="text-xl font-semibold lg:text-2xl">{current.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {current.start_time} – {current.end_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Còn lại</p>
                    <p className="text-2xl font-bold tabular-nums text-primary">
                      {formatCountdown(remaining)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress value={calcProgress(current)} className="h-2" />
                </div>
              </div>
            ) : (
              <div className="flex h-20 items-center text-muted-foreground">
                Hiện không có hoạt động nào đang diễn ra.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
              Tiếp theo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {next ? (
              <div>
                <p className="text-lg font-semibold">{next.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {next.start_time} – {next.end_time}
                </p>
                <div className="mt-3 rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs text-muted-foreground">Bắt đầu sau</p>
                  <p className="text-xl font-bold tabular-nums text-primary">
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-20 items-center text-muted-foreground">
                Không còn hoạt động nào hôm nay.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Tiến độ hôm nay"
          value={`${completionPct}%`}
          sub={`${completedToday}/${totalToday} hoạt động`}
          progress={completionPct}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Tiếng Anh tuần này"
          value={`${englishRatio.english}`}
          sub={`/ ${englishWeeklyGoal} phút`}
          progress={englishWeeklyGoal > 0 ? Math.min(100, Math.round((englishRatio.english / englishWeeklyGoal) * 100)) : 0}
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5" />}
          label="Tỷ lệ tiếng Anh"
          value={`${Math.round(englishRatio.ratio)}%`}
          sub={`Mục tiêu: ${settings?.english_target_pct || 50}%`}
          progress={Math.round(englishRatio.ratio)}
          progressColor={englishRatio.isOnTarget ? 'bg-green-500' : 'bg-amber-500'}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Nhiệm vụ còn lại"
          value={`${pendingTasks.length}`}
          sub="bài tập pending"
          progress={tasks.length > 0 ? Math.round(((tasks.length - pendingTasks.length) / tasks.length) * 100) : 100}
        />
      </div>

      {/* Today's timeline preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lịch hôm nay</CardTitle>
          <Link href="/today" className="text-sm text-primary hover:underline">
            Xem tất cả →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {timeline.slice(0, 8).map((activity) => (
              <TimelineRow key={activity.id} activity={activity} now={now} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calcProgress(activity: TimelineActivity): number {
  const now = getCurrentMinutes();
  const start = timeToMinutes(activity.start_time);
  let end = timeToMinutes(activity.end_time);
  if (end < start) end += 24 * 60;
  const total = end - start;
  const elapsed = now - start;
  return total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
}

function StatCard({
  icon,
  label,
  value,
  sub,
  progress,
  progressColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  progress: number;
  progressColor?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
        <Progress value={progress} className={`mt-3 h-1.5 ${progressColor || ''}`} />
      </CardContent>
    </Card>
  );
}

function TimelineRow({ activity, now }: { activity: TimelineActivity; now: Date }) {
  const cat = getCategoryColors(activity.category);
  const currentMin = getCurrentMinutes();
  const startMin = timeToMinutes(activity.start_time);
  let endMin = timeToMinutes(activity.end_time);
  if (endMin < startMin) endMin += 24 * 60;
  const isCurrent = currentMin >= startMin && currentMin < endMin;
  const isPast = currentMin >= endMin;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
        isCurrent ? `${cat.bg} ${cat.border} border` : isPast ? 'opacity-50' : ''
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${cat.dot}`} />
      <span className="w-12 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
        {activity.start_time}
      </span>
      <span className={`flex-1 text-sm ${isCurrent ? 'font-semibold' : ''}`}>
        {activity.title}
      </span>
      {isCurrent && (
        <Badge variant="secondary" className="text-xs">now</Badge>
      )}
      {activity.status === 'completed' && (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
    </div>
  );
}
