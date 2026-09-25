'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import {
  calcEnglishRatio,
  calcEnglishRatioFromMinutes,
  smartPlan,
  generateStudySessions,
  dateStr,
  todayStr,
  formatDuration,
  getWeekDates,
  dateStr as toStr,
} from '@/lib/scheduler';
import { SUBJECT_NAMES, SUBJECT_COLORS, WEEKDAY_NAMES, getSubjectName, getSubjectColor } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, AlertTriangle, CheckCircle2, Wand2, BookOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
} from 'recharts';

export default function SelfStudyPage() {
  const { settings, fixedActivities, scheduleEntries, sessions, tasks, subjects, loading, refresh } = useAppData();
  const [generating, setGenerating] = useState(false);

  const today = new Date();
  const ds = todayStr();
  const weekday = today.getDay();

  const weekDates = useMemo(() => getWeekDates(today), []);
  const weekStartStr = dateStr(weekDates[0]);
  const weekEndStr = dateStr(weekDates[6]);

  const weekSessions = useMemo(
    () => sessions.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr),
    [sessions, weekStartStr, weekEndStr]
  );

  const ratio = useMemo(() => calcEnglishRatio(weekSessions), [weekSessions]);

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === ds),
    [sessions, ds]
  );

  const todayRatio = useMemo(() => calcEnglishRatio(todaySessions), [todaySessions]);

  const pendingTasks = useMemo(
    () => tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
    [tasks]
  );

  const pieData = useMemo(() => {
    return [
      { name: getSubjectName(subjects, 'english'), value: ratio.english, color: getSubjectColor(subjects, 'english') },
      { name: getSubjectName(subjects, 'vietnamese'), value: ratio.vietnamese, color: getSubjectColor(subjects, 'vietnamese') },
      { name: getSubjectName(subjects, 'instrument'), value: ratio.instrument, color: getSubjectColor(subjects, 'instrument') },
      { name: getSubjectName(subjects, 'reading'), value: ratio.reading, color: getSubjectColor(subjects, 'reading') },
    ].filter((d) => d.value > 0);
  }, [ratio, subjects]);

  const targetPieData = useMemo(() => {
    const total = ratio.total > 0 ? ratio.total : 420;
    const target = settings?.english_target_pct || 50;
    return [
      { name: 'Tiếng Anh (mục tiêu)', value: Math.round(total * target / 100), color: getSubjectColor(subjects, 'english') },
      { name: 'Các môn khác (mục tiêu)', value: Math.round(total * (100 - target) / 100), color: '#94a3b8' },
    ];
  }, [ratio.total, settings, subjects]);

  async function toggleSession(sessionId: string, status: string) {
    const nextStatus = status === 'completed' ? 'planned' : 'completed';
    const { error } = await supabase.from('study_sessions').update({
      status: nextStatus,
      actual_min: nextStatus === 'completed'
        ? sessions.find((session) => session.id === sessionId)?.planned_min ?? null
        : null,
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId);
    if (error) {
      toast.error('Không thể cập nhật trạng thái phiên học.');
      return;
    }
    toast.success(nextStatus === 'completed' ? 'Đã hoàn thành phiên học.' : 'Đã bỏ hoàn thành phiên học.');
    refresh();
  }

  async function handleGeneratePlan() {
    if (!settings) return;
    setGenerating(true);
    try {
      const existing = sessions.filter((s) => s.date === ds && s.source === 'auto');
      if (existing.length > 0) {
        await supabase.from('study_sessions').delete().in('id', existing.map((s) => s.id));
      }

      const selfStudyStart = parseInt(settings.self_study_start.split(':')[0]) * 60 + parseInt(settings.self_study_start.split(':')[1]);
      const selfStudyEnd = parseInt(settings.self_study_end.split(':')[0]) * 60 + parseInt(settings.self_study_end.split(':')[1]);
      const availableMin = selfStudyEnd - selfStudyStart - settings.break_duration_min;

      const planned = smartPlan(availableMin, pendingTasks, weekday, settings.english_target_pct);
      const newSessions = generateStudySessions(today, settings, planned);

      if (newSessions.length > 0) {
        const { error } = await supabase.from('study_sessions').insert(newSessions);
        if (error) throw error;
      }

      toast.success('Đã tạo kế hoạch tự học cho hôm nay!');
      refresh();
    } catch (err) {
      console.error(err);
      toast.error('Không thể tạo kế hoạch. Vui lòng thử lại.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  const englishPct = settings?.english_target_pct || 50;
  const isOnTarget = Math.abs(todayRatio.ratio - englishPct) < 3;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tự học cá nhân</h1>
          <p className="mt-1 text-muted-foreground">Quản lý thời gian tự học và tỷ lệ tiếng Anh</p>
        </div>
        <Button onClick={handleGeneratePlan} disabled={generating}>
          <Wand2 className="h-4 w-4" />
          {generating ? 'Đang tạo...' : 'Tạo lịch tự động'}
        </Button>
      </div>

      {/* English 50% Rule Banner */}
      <Alert className={isOnTarget ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}>
        <div className="flex items-start gap-3">
          {isOnTarget ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertTitle className={isOnTarget ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}>
              {isOnTarget ? 'Tỷ lệ tiếng Anh đạt mục tiêu!' : 'Tỷ lệ tiếng Anh chưa đạt mục tiêu'}
            </AlertTitle>
            <AlertDescription>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <span>
                  Tiếng Anh: <strong>{Math.round(todayRatio.ratio)}%</strong> / Mục tiêu: <strong>{englishPct}%</strong>
                </span>
                <span className="text-muted-foreground">
                  ({formatDuration(todayRatio.english)} / {formatDuration(todayRatio.total)})
                </span>
              </div>
              <Progress
                value={todayRatio.ratio}
                className="mt-3 h-2"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className={isOnTarget ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                  {Math.round(todayRatio.ratio)}%
                </span>
                <span>100%</span>
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Today's study sessions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phiên học hôm nay</CardTitle>
            <CardDescription>{WEEKDAY_NAMES[weekday]}, {today.getDate()}/{today.getMonth() + 1}</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySessions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">Chưa có phiên học nào.</p>
                <Button onClick={handleGeneratePlan} disabled={generating} variant="outline">
                  <Sparkles className="h-4 w-4" /> Tạo kế hoạch ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map((s) => {
                  const color = getSubjectColor(subjects, s.subject_code);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {s.start_time}–{s.end_time} · {formatDuration(s.planned_min)}
                        </p>
                      </div>
                      {s.status === 'completed' ? (
                        <Button size="sm" variant="outline" onClick={() => toggleSession(s.id, s.status)}>
                          <CheckCircle2 className="h-4 w-4 text-green-600" /> Đã xong
                        </Button>
                      ) : s.status === 'skipped' ? (
                        <Badge variant="secondary">Đã bỏ qua</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => toggleSession(s.id, s.status)}>
                          Đánh dấu đã học
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* English Ratio Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bổ thời gian tuần này</CardTitle>
            <CardDescription>Tỷ lệ tiếng Anh so với các môn tự học</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu tuần này.
              </div>
            ) : (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number) => formatDuration(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-blue-500/5 p-2">
                    <p className="text-xs text-muted-foreground">Tiếng Anh</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatDuration(ratio.english)} ({Math.round(ratio.ratio)}%)
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-500/5 p-2">
                    <p className="text-xs text-muted-foreground">Việt văn</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">{formatDuration(ratio.vietnamese)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-500/5 p-2">
                    <p className="text-xs text-muted-foreground">Đàn</p>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">{formatDuration(ratio.instrument)}</p>
                  </div>
                  <div className="rounded-lg bg-violet-500/5 p-2">
                    <p className="text-xs text-muted-foreground">Đọc sách</p>
                    <p className="font-semibold text-violet-600 dark:text-violet-400">{formatDuration(ratio.reading)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Smart Planner Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Planner
          </CardTitle>
          <CardDescription>
            Hệ thống tự động tính thời gian có thể tự học và phân bổ theo ưu tiên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoBox label="Bài tập pending" value={pendingTasks.length.toString()} sub={`${pendingTasks.reduce((s, t) => s + t.estimated_min, 0)} phút cần làm`} />
            <InfoBox label="Ưu tiên 1" value="Bài tập" sub="Ôn bài + chuẩn bị" />
            <InfoBox label="Ưu tiên 2" value="Tiếng Anh" sub={`${englishPct}% thời gian`} />
            <InfoBox label="Ưu tiên 3" value="Đọc sách" sub="Phát triển cá nhân" />
          </div>
          <div className="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Cách hoạt động:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tính thời gian bị khóa (sinh hoạt, học chính khóa, ngủ)</li>
              <li>Tìm thời gian trống trong khung tự học tối</li>
              <li>Ưu tiên bài tập, sau đó tiếng Anh {englishPct}%, còn lại cho các môn khác</li>
              <li>Đảm bảo nhật ký thiêng liêng tối thiểu 15 phút</li>
              <li>Không xếp lịch sau 21:20</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
