'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import {
  calcEnglishRatio,
  getWeekDates,
  dateStr,
  formatDuration,
  calcStreak,
  calcRequiredDailyAvg,
} from '@/lib/scheduler';
import { SUBJECT_COLORS, SUBJECT_NAMES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Clock, Flame, Target } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

export default function StatisticsPage() {
  const { settings, sessions, dailyProgress, journalEntries, tasks, loading } = useAppData();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(today), []);
  const weekStart = dateStr(weekDates[0]);
  const weekEnd = dateStr(weekDates[6]);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStartStr = dateStr(monthStart);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const monthEndStr = dateStr(monthEnd);

  const periodStart = period === 'week' ? weekStart : monthStartStr;
  const periodEnd = period === 'week' ? weekEnd : monthEndStr;

  const periodSessions = useMemo(
    () => sessions.filter((s) => s.date >= periodStart && s.date <= periodEnd),
    [sessions, periodStart, periodEnd]
  );

  const ratio = useMemo(() => calcEnglishRatio(periodSessions), [periodSessions]);

  const subjectMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of periodSessions) {
      if (s.status === 'planned' || s.status === 'completed') {
        const min = s.actual_min ?? s.planned_min;
        map[s.subject_code] = (map[s.subject_code] || 0) + min;
      }
    }
    return map;
  }, [periodSessions]);

  const totalStudyMin = Object.values(subjectMinutes).reduce((a, b) => a + b, 0);

  // Daily chart data
  const dailyChartData = useMemo(() => {
    const dates = period === 'week' ? weekDates : Array.from({ length: monthEnd.getDate() }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
      return d;
    });

    return dates.map((d) => {
      const ds = dateStr(d);
      const daySessions = sessions.filter((s) => s.date === ds);
      const eng = daySessions
        .filter((s) => s.subject_code === 'english')
        .reduce((sum, s) => sum + (s.actual_min ?? s.planned_min), 0);
      const other = daySessions
        .filter((s) => s.subject_code !== 'english' && s.subject_code !== 'journal')
        .reduce((sum, s) => sum + (s.actual_min ?? s.planned_min), 0);
      return {
        date: d.getDate().toString(),
        'Tiếng Anh': eng,
        'Khác': other,
      };
    });
  }, [sessions, period, weekDates, monthEnd, today]);

  // Subject pie data
  const pieData = Object.entries(subjectMinutes)
    .filter(([_, v]) => v > 0)
    .map(([code, min]) => ({
      name: SUBJECT_NAMES[code] || code,
      value: min,
      color: SUBJECT_COLORS[code] || '#94a3b8',
    }));

  // English ratio trend (last 7 days)
  const ratioTrendData = useMemo(() => {
    return weekDates.map((d) => {
      const ds = dateStr(d);
      const daySessions = sessions.filter((s) => s.date === ds);
      const r = calcEnglishRatio(daySessions);
      return {
        date: d.getDate().toString(),
        ratio: Math.round(r.ratio),
      };
    });
  }, [sessions, weekDates]);

  // Streak
  const streak = useMemo(() => calcStreak(dailyProgress), [dailyProgress]);

  // Task stats
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

  // Journal stats
  const periodJournal = journalEntries.filter(
    (j) => j.entry_date >= periodStart && j.entry_date <= periodEnd
  );
  const journalCompleted = periodJournal.filter((j) => j.completed).length;

  // Monthly forecast
  const englishMonthlyGoal = settings ? 1260 : 0;
  const englishCompleted = ratio.english;
  const englishRemaining = Math.max(0, englishMonthlyGoal - englishCompleted);
  const daysRemaining = Math.max(0, Math.ceil((monthEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const requiredDailyAvg = calcRequiredDailyAvg(englishRemaining, daysRemaining);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Thống kê
        </h1>
        <p className="mt-1 text-muted-foreground">Theo dõi tiến độ học tập</p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
        <TabsList>
          <TabsTrigger value="week">Tuần</TabsTrigger>
          <TabsTrigger value="month">Tháng</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          <StatsGrid
            totalStudyMin={totalStudyMin}
            ratio={ratio}
            journalCompleted={journalCompleted}
            streak={streak}
            completedTasks={completedTasks}
            pendingTasks={pendingTasks}
            targetPct={settings?.english_target_pct || 50}
          />
          <Charts
            dailyData={dailyChartData}
            pieData={pieData}
            ratioTrend={ratioTrendData}
          />
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <StatsGrid
            totalStudyMin={totalStudyMin}
            ratio={ratio}
            journalCompleted={journalCompleted}
            streak={streak}
            completedTasks={completedTasks}
            pendingTasks={pendingTasks}
            targetPct={settings?.english_target_pct || 50}
          />
          <Charts
            dailyData={dailyChartData}
            pieData={pieData}
            ratioTrend={ratioTrendData}
          />
          {/* Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Dự báo tháng
              </CardTitle>
              <CardDescription>Tốc độ cần duy trì để đạt mục tiêu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Mục tiêu tiếng Anh</p>
                  <p className="text-lg font-bold">{formatDuration(englishMonthlyGoal)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatDuration(englishCompleted)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Còn lại</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatDuration(englishRemaining)}</p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs text-muted-foreground">Trung bình cần/ngày</p>
                  <p className="text-lg font-bold text-primary">{requiredDailyAvg} phút</p>
                  <p className="text-xs text-muted-foreground">{daysRemaining} ngày còn lại</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsGrid({
  totalStudyMin,
  ratio,
  journalCompleted,
  streak,
  completedTasks,
  pendingTasks,
  targetPct,
}: {
  totalStudyMin: number;
  ratio: { english: number; ratio: number; isOnTarget: boolean };
  journalCompleted: number;
  streak: number;
  completedTasks: number;
  pendingTasks: number;
  targetPct: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Tổng thời gian học</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatDuration(totalStudyMin)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Tỷ lệ tiếng Anh</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{Math.round(ratio.ratio)}%</p>
          <p className="text-xs text-muted-foreground">Mục tiêu: {targetPct}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Streak</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{streak} ngày</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" />
            <span className="text-sm">Nhật ký</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{journalCompleted}</p>
          <p className="text-xs text-muted-foreground">Bài tập: {completedTasks}/{completedTasks + pendingTasks}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Charts({
  dailyData,
  pieData,
  ratioTrend,
}: {
  dailyData: { date: string; 'Tiếng Anh': number; 'Khác': number }[];
  pieData: { name: string; value: number; color: string }[];
  ratioTrend: { date: string; ratio: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Thời gian học theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                formatter={(value: number) => `${value} phút`}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="Tiếng Anh" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Khác" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Phân bổ môn học</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => formatDuration(value)} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tỷ lệ tiếng Anh theo ngày</CardTitle>
          <CardDescription>Mục tiêu: 50%</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ratioTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <RechartsTooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              />
              <Line type="monotone" dataKey="ratio" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
