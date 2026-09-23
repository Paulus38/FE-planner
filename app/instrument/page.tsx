'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/api';
import { useAppData } from '@/hooks/use-app-data';
import { dateStr, todayStr, formatDuration, getWeekDates } from '@/lib/scheduler';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Music, Plus, Clock, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { InstrumentPractice } from '@/lib/types';

export default function InstrumentPage() {
  const { loading, refresh } = useAppData();
  const [practices, setPractices] = useState<InstrumentPractice[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    practice_date: todayStr(),
    solfege_min: 0,
    theory_min: 0,
    technique_min: 0,
    repertoire: '',
    practice_min: 30,
    note: '',
  });

  async function loadPractices() {
    const { data, error } = await supabase
      .from('instrument_practices')
      .select('*')
      .order('practice_date', { ascending: false })
      .limit(30);
    if (error) {
      toast.error('Không thể tải dữ liệu.');
      return;
    }
    setPractices(data || []);
  }

  useEffect(() => {
    loadPractices();
  }, []);

  const weekDates = getWeekDates(new Date());
  const weekStart = dateStr(weekDates[0]);
  const weekEnd = dateStr(weekDates[6]);
  const weekPractices = practices.filter(
    (p) => p.practice_date >= weekStart && p.practice_date <= weekEnd
  );
  const weekTotal = weekPractices.reduce((s, p) => s + p.practice_min, 0);
  const weekSessions = weekPractices.length;
  const weeklyGoalSessions = 3;

  const totalSolfege = weekPractices.reduce((s, p) => s + p.solfege_min, 0);
  const totalTheory = weekPractices.reduce((s, p) => s + p.theory_min, 0);
  const totalTechnique = weekPractices.reduce((s, p) => s + p.technique_min, 0);

  async function handleSave() {
    const data = {
      practice_date: form.practice_date,
      solfege_min: form.solfege_min,
      theory_min: form.theory_min,
      technique_min: form.technique_min,
      repertoire: form.repertoire.trim() || null,
      practice_min: form.practice_min,
      note: form.note.trim() || null,
    };

    const { error } = await supabase.from('instrument_practices').insert(data);
    if (error) {
      toast.error('Không thể lưu.');
      return;
    }
    toast.success('Đã ghi nhận buổi luyện đàn.');
    setDialogOpen(false);
    setForm({
      practice_date: todayStr(),
      solfege_min: 0,
      theory_min: 0,
      technique_min: 0,
      repertoire: '',
      practice_min: 30,
      note: '',
    });
    loadPractices();
    refresh();
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Music className="h-6 w-6 text-amber-500" />
            Luyện đàn
          </h1>
          <p className="mt-1 text-muted-foreground">Theo dõi việc luyện đàn Organ</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Ghi nhận buổi luyện
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Thời gian tuần này</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatDuration(weekTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span className="text-sm">Số buổi tuần này</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{weekSessions}/{weeklyGoalSessions}</p>
            <Progress value={(weekSessions / weeklyGoalSessions) * 100} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Mục tiêu</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{weeklyGoalSessions} buổi/tuần</p>
          </CardContent>
        </Card>
      </div>

      {/* Skill breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phân bổ thời gian tuần này</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-amber-500/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Xướng âm</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{totalSolfege}m</p>
            </div>
            <div className="rounded-lg bg-orange-500/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Nhạc lý</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{totalTheory}m</p>
            </div>
            <div className="rounded-lg bg-yellow-500/5 p-3 text-center">
              <p className="text-xs text-muted-foreground">Kỹ thuật</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{totalTechnique}m</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử luyện đàn</CardTitle>
        </CardHeader>
        <CardContent>
          {practices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có buổi luyện nào. Hãy ghi nhận buổi đầu tiên.
            </p>
          ) : (
            <div className="space-y-2">
              {practices.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="w-1.5 h-10 rounded-full bg-amber-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{p.practice_date}</span>
                      <Badge variant="secondary" className="text-xs">{p.practice_min} phút</Badge>
                    </div>
                    {p.repertoire && (
                      <p className="text-xs text-muted-foreground mt-0.5">Bài: {p.repertoire}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {p.solfege_min > 0 && <span>Xướng âm: {p.solfege_min}m</span>}
                      {p.theory_min > 0 && <span>Nhạc lý: {p.theory_min}m</span>}
                      {p.technique_min > 0 && <span>Kỹ thuật: {p.technique_min}m</span>}
                    </div>
                    {p.note && <p className="text-xs text-muted-foreground mt-1">{p.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận buổi luyện đàn</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Ngày</Label>
              <Input
                type="date"
                value={form.practice_date}
                onChange={(e) => setForm({ ...form, practice_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Xướng âm (phút)</Label>
                <Input
                  type="number"
                  value={form.solfege_min}
                  onChange={(e) => setForm({ ...form, solfege_min: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nhạc lý (phút)</Label>
                <Input
                  type="number"
                  value={form.theory_min}
                  onChange={(e) => setForm({ ...form, theory_min: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Kỹ thuật (phút)</Label>
                <Input
                  type="number"
                  value={form.technique_min}
                  onChange={(e) => setForm({ ...form, technique_min: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tổng thời gian (phút)</Label>
                <Input
                  type="number"
                  value={form.practice_min}
                  onChange={(e) => setForm({ ...form, practice_min: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bài đang luyện</Label>
                <Input
                  value={form.repertoire}
                  onChange={(e) => setForm({ ...form, repertoire: e.target.value })}
                  placeholder="VD: Thánh ca..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
