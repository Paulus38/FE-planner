'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import {
  calcEnglishRatio,
  getWeekDates,
  dateStr,
  formatDuration,
  calcCompletionRate,
} from '@/lib/scheduler';
import { SUBJECT_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PenLine, ChevronLeft, ChevronRight, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WeeklyReview } from '@/lib/types';

export default function WeeklyReviewPage() {
  const { sessions, journalEntries, tasks, loading, refresh } = useAppData();
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [form, setForm] = useState({ what_went_well: '', what_needs_improvement: '', next_week_focus: '' });
  const [saving, setSaving] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const weekStart = dateStr(weekDates[0]);
  const weekEnd = dateStr(weekDates[6]);

  const weekSessions = useMemo(
    () => sessions.filter((s) => s.date >= weekStart && s.date <= weekEnd),
    [sessions, weekStart, weekEnd]
  );

  const ratio = useMemo(() => calcEnglishRatio(weekSessions), [weekSessions]);

  const subjectMinutes = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of weekSessions) {
      if (s.status === 'planned' || s.status === 'completed') {
        const min = s.actual_min ?? s.planned_min;
        map[s.subject_code] = (map[s.subject_code] || 0) + min;
      }
    }
    return map;
  }, [weekSessions]);

  const totalStudyMin = Object.values(subjectMinutes).reduce((a, b) => a + b, 0);

  const weekJournal = journalEntries.filter((j) => j.entry_date >= weekStart && j.entry_date <= weekEnd);
  const journalDays = weekJournal.filter((j) => j.completed).length;

  const weekTasks = tasks.filter((t) => t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd);
  const completedTasks = weekTasks.filter((t) => t.status === 'completed').length;
  const totalTasks = weekTasks.length;

  const selfStudyItems = weekSessions.filter((s) => s.subject_code !== 'journal');
  const completedSessions = selfStudyItems.filter((s) => s.status === 'completed').length;
  const completionRate = calcCompletionRate(completedSessions, selfStudyItems.length);

  async function loadReview() {
    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('week_start', weekStart)
      .maybeSingle();
    if (error) {
      console.error(error);
      return;
    }
    setReview(data);
    if (data) {
      setForm({
        what_went_well: data.what_went_well || '',
        what_needs_improvement: data.what_needs_improvement || '',
        next_week_focus: data.next_week_focus || '',
      });
    } else {
      setForm({ what_went_well: '', what_needs_improvement: '', next_week_focus: '' });
    }
  }

  useEffect(() => {
    loadReview();
  }, [weekStart]);

  async function handleSave() {
    setSaving(true);
    try {
      const data = {
        week_start: weekStart,
        total_study_min: totalStudyMin,
        english_min: ratio.english,
        vietnamese_min: ratio.vietnamese,
        instrument_min: ratio.instrument,
        reading_min: ratio.reading,
        english_ratio: ratio.ratio,
        tasks_completed: completedTasks,
        tasks_total: totalTasks,
        journal_days: journalDays,
        completion_rate: completionRate,
        what_went_well: form.what_went_well.trim() || null,
        what_needs_improvement: form.what_needs_improvement.trim() || null,
        next_week_focus: form.next_week_focus.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (review) {
        const { error } = await supabase.from('weekly_reviews').update(data).eq('id', review.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('weekly_reviews').insert(data);
        if (error) throw error;
      }

      toast.success('Đã lưu tổng kết tuần.');
      loadReview();
      refresh();
    } catch {
      toast.error('Không thể lưu tổng kết.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PenLine className="h-6 w-6" />
            Tổng kết tuần
          </h1>
          <p className="mt-1 text-muted-foreground">{weekStart} → {weekEnd}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => {
            const d = new Date(weekAnchor);
            d.setDate(d.getDate() - 7);
            setWeekAnchor(d);
          }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
            const d = new Date(weekAnchor);
            d.setDate(d.getDate() + 7);
            setWeekAnchor(d);
          }}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Tổng thời gian học</p>
            <p className="text-2xl font-bold">{formatDuration(totalStudyMin)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Tiếng Anh</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatDuration(ratio.english)}</p>
            <p className="text-xs text-muted-foreground">Tỷ lệ: {Math.round(ratio.ratio)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Nhật ký</p>
            <p className="text-2xl font-bold">{journalDays}/7 ngày</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Hoàn thành kế hoạch</p>
            <p className="text-2xl font-bold">{completionRate}%</p>
            <Progress value={completionRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Subject breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ thời gian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { code: 'english', min: ratio.english },
              { code: 'vietnamese', min: ratio.vietnamese },
              { code: 'instrument', min: ratio.instrument },
              { code: 'reading', min: ratio.reading },
            ].map((s) => (
              <div key={s.code} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[s.code] }} />
                  <span className="text-sm font-medium">
                    {s.code === 'english' ? 'Tiếng Anh' : s.code === 'vietnamese' ? 'Việt văn' : s.code === 'instrument' ? 'Đàn' : 'Đọc sách'}
                  </span>
                </div>
                <p className="mt-1 text-lg font-bold">{formatDuration(s.min)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reflection */}
      <Card>
        <CardHeader>
          <CardTitle>Suy ngẫm</CardTitle>
          <CardDescription>Nhìn lại tuần qua và đặt mục tiêu cho tuần tới</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Điều tôi đã làm tốt</Label>
            <Textarea
              value={form.what_went_well}
              onChange={(e) => setForm({ ...form, what_went_well: e.target.value })}
              placeholder="Những điều tốt trong tuần qua..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Điều tôi cần cải thiện</Label>
            <Textarea
              value={form.what_needs_improvement}
              onChange={(e) => setForm({ ...form, what_needs_improvement: e.target.value })}
              placeholder="Những điều cần cải thiện..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Tuần sau tôi muốn tập trung vào</Label>
            <Textarea
              value={form.next_week_focus}
              onChange={(e) => setForm({ ...form, next_week_focus: e.target.value })}
              placeholder="Mục tiêu tuần tới..."
              rows={3}
              className="resize-none"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu tổng kết'}
          </Button>
          {review && (
            <Badge className="ml-2 bg-green-500/10 text-green-600 border-0">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Đã lưu
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
