'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import { todayStr, dateStr, formatVietnameseDate } from '@/lib/scheduler';
import { JOURNAL_QUESTIONS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, Save, Calendar as CalendarIcon, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { JournalEntry } from '@/lib/types';

export default function JournalPage() {
  const { settings, journalEntries, loading, refresh } = useAppData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState<Record<string, string>>({});
  const [duration, setDuration] = useState(15);
  const [saving, setSaving] = useState(false);

  const ds = dateStr(selectedDate);
  const todayJournal = journalEntries.find((j) => j.entry_date === ds);
  const minMinutes = settings?.journal_min_min || 15;

  const isToday = ds === todayStr();
  const hasContent = Object.values(form).some((v) => v && v.trim().length > 0);
  const canComplete = hasContent && duration >= minMinutes;

  useEffect(() => {
    if (todayJournal) {
      setForm({
        grateful_for: todayJournal.grateful_for || '',
        good_deed: todayJournal.good_deed || '',
        needs_improvement: todayJournal.needs_improvement || '',
        realization: todayJournal.realization || '',
        want_to_change: todayJournal.want_to_change || '',
        prayer: todayJournal.prayer || '',
      });
      setDuration(todayJournal.duration_min);
    } else {
      setForm({});
      setDuration(minMinutes);
    }
  }, [todayJournal, minMinutes]);

  // Last 30 days journal calendar
  const last30Days = useMemo(() => {
    const days: { date: Date; hasEntry: boolean; completed: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const entry = journalEntries.find((j) => j.entry_date === dateStr(d));
      days.push({ date: d, hasEntry: !!entry, completed: entry?.completed || false });
    }
    return days;
  }, [journalEntries]);

  const journalDaysCount = journalEntries.filter((j) => j.completed).length;
  const last7Days = last30Days.slice(-7);
  const last7Completed = last7Days.filter((d) => d.completed).length;

  async function handleSave(complete: boolean) {
    if (complete && !canComplete) {
      toast.error(`Cần ít nhất ${minMinutes} phút và nội dung để đánh dấu hoàn thành.`);
      return;
    }

    setSaving(true);
    try {
      const data = {
        entry_date: ds,
        grateful_for: form.grateful_for?.trim() || null,
        good_deed: form.good_deed?.trim() || null,
        needs_improvement: form.needs_improvement?.trim() || null,
        realization: form.realization?.trim() || null,
        want_to_change: form.want_to_change?.trim() || null,
        prayer: form.prayer?.trim() || null,
        duration_min: duration,
        completed: complete,
        updated_at: new Date().toISOString(),
      };

      if (todayJournal) {
        const { error } = await supabase.from('journal_entries').update(data).eq('id', todayJournal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('journal_entries').insert(data);
        if (error) throw error;
      }

      toast.success(complete ? 'Đã lưu và đánh dấu hoàn thành!' : 'Đã lưu nhật ký.');
      refresh();
    } catch {
      toast.error('Không thể lưu nhật ký.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />
          Nhật ký thiêng liêng
        </h1>
        <p className="mt-1 text-muted-foreground">Tối thiểu {minMinutes} phút mỗi ngày</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm">7 ngày qua</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{last7Completed}/7</p>
            <Progress value={(last7Completed / 7) * 100} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Tổng số nhật ký</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{journalDaysCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Tối thiểu</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{minMinutes} phút</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">30 ngày gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {last30Days.map((d, i) => (
              <div
                key={i}
                className={`h-7 w-7 rounded text-[10px] flex items-center justify-center font-medium ${
                  d.completed
                    ? 'bg-pink-500 text-white'
                    : d.hasEntry
                    ? 'bg-pink-500/30 text-pink-700 dark:text-pink-300'
                    : 'bg-muted text-muted-foreground'
                }`}
                title={`${dateStr(d.date)} ${d.completed ? '(hoàn thành)' : ''}`}
              >
                {d.date.getDate()}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journal entry form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{formatVietnameseDate(selectedDate)}</CardTitle>
              <CardDescription>
                {todayJournal?.completed ? (
                  <Badge className="mt-1 bg-green-500/10 text-green-600 border-0">Đã hoàn thành</Badge>
                ) : (
                  <Badge variant="outline" className="mt-1">Chưa hoàn thành</Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d);
                }}
              >
                ←
              </Button>
              {isToday ? (
                <Badge>Hôm nay</Badge>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setSelectedDate(new Date())}>
                  Hôm nay
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  if (d <= new Date()) setSelectedDate(d);
                }}
              >
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {JOURNAL_QUESTIONS.map((q) => (
            <div key={q.key} className="space-y-1.5">
              <Label className="text-sm font-medium">{q.label}</Label>
              <Textarea
                value={form[q.key] || ''}
                onChange={(e) => setForm({ ...form, [q.key]: e.target.value })}
                placeholder="Viết suy nghĩ của bạn..."
                rows={3}
                className="resize-none"
              />
            </div>
          ))}

          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Label className="text-sm font-medium shrink-0">Thời gian:</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-24"
              min={0}
            />
            <span className="text-sm text-muted-foreground">phút</span>
            {duration < minMinutes && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Cần tối thiểu {minMinutes} phút để hoàn thành
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="h-4 w-4" /> Lưu nháp
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving || !canComplete}>
              <CheckCircle2 className="h-4 w-4" /> Lưu & Hoàn thành
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent entries */}
      {journalEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nhật ký gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {journalEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedDate(new Date(entry.entry_date + 'T00:00:00'));
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {formatVietnameseDate(new Date(entry.entry_date + 'T00:00:00'))}
                  </span>
                  {entry.completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
                {entry.grateful_for && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    Biết ơn: {entry.grateful_for}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
