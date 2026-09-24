'use client';

import { useState } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import { WEEKDAY_NAMES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Clock, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import type { ScheduleEntry } from '@/lib/types';

const RECURRENCE_LABELS: Record<string, string> = {
  weekly: 'Hàng tuần',
  daily: 'Hàng ngày',
  biweekly: '2 tuần/lần',
  once: 'Một lần',
};

export default function SchedulePage() {
  const { scheduleEntries, subjects, loading, refresh } = useAppData();
  const [selectedDay, setSelectedDay] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState({
    weekday: 1,
    start_time: '08:00',
    end_time: '08:40',
    subject_name: '',
    subject_id: '' as string | null,
    session_type: 'class',
    recurrence: 'weekly',
    recurrence_end_date: '' as string | null,
    note: '',
  });

  const dayEntries = scheduleEntries
    .filter((e) => e.weekday === selectedDay)
    .sort((a, b) => a.sort_order - b.sort_order);

  function openAdd() {
    setEditingEntry(null);
    setForm({
      weekday: selectedDay,
      start_time: '08:00',
      end_time: '08:40',
      subject_name: '',
      subject_id: null,
      session_type: 'class',
      recurrence: 'weekly',
      recurrence_end_date: null,
      note: '',
    });
    setDialogOpen(true);
  }

  function openEdit(entry: ScheduleEntry) {
    setEditingEntry(entry);
    setForm({
      weekday: entry.weekday,
      start_time: entry.start_time,
      end_time: entry.end_time,
      subject_name: entry.subject_name,
      subject_id: entry.subject_id || null,
      session_type: entry.session_type,
      recurrence: entry.recurrence || 'weekly',
      recurrence_end_date: entry.recurrence_end_date || null,
      note: entry.note || '',
    });
    setDialogOpen(true);
  }

  function handleSelectCourse(courseId: string) {
    if (!courseId) {
      setForm({ ...form, subject_id: null });
      return;
    }
    const subject = subjects.find((s) => s.id === courseId);
    setForm({
      ...form,
      subject_id: courseId,
      subject_name: subject ? subject.name : form.subject_name,
    });
  }

  async function handleSave() {
    if (!form.subject_name.trim()) {
      toast.error('Vui lòng nhập tên môn học.');
      return;
    }

    const maxOrder = dayEntries.length > 0 ? Math.max(...dayEntries.map((e) => e.sort_order)) : 0;
    const data = {
      weekday: form.weekday,
      start_time: form.start_time,
      end_time: form.end_time,
      subject_name: form.subject_name.trim(),
      subject_id: form.subject_id || null,
      session_type: form.session_type,
      recurrence: form.recurrence,
      recurrence_end_date: form.recurrence_end_date || null,
      note: form.note.trim() || null,
      sort_order: editingEntry ? editingEntry.sort_order : maxOrder + 1,
    };

    if (editingEntry) {
      const { error } = await supabase.from('schedule_entries').update(data).eq('id', editingEntry.id);
      if (error) {
        toast.error('Không thể cập nhật.');
        return;
      }
      toast.success('Đã cập nhật môn học.');
    } else {
      const { error } = await supabase.from('schedule_entries').insert(data);
      if (error) {
        toast.error('Không thể thêm môn học.');
        return;
      }
      toast.success('Đã thêm môn học.');
    }

    setDialogOpen(false);
    refresh();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('schedule_entries').delete().eq('id', id);
    if (error) {
      toast.error('Không thể xóa.');
      return;
    }
    toast.success('Đã xóa môn học.');
    refresh();
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thời khóa biểu</h1>
          <p className="mt-1 text-muted-foreground">Lịch học chính khóa theo ngày</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Thêm môn học
        </Button>
      </div>

      {/* Day selector */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6, 0].map((day) => (
          <Button
            key={day}
            variant={selectedDay === day ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDay(day)}
          >
            {WEEKDAY_NAMES[day]}
          </Button>
        ))}
      </div>

      {/* Schedule table */}
      <Card>
        <CardHeader>
          <CardTitle>{WEEKDAY_NAMES[selectedDay]}</CardTitle>
        </CardHeader>
        <CardContent>
          {dayEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có môn học nào. Hãy thêm môn học.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Giờ</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead className="hidden sm:table-cell w-28">Lặp lại</TableHead>
                  <TableHead className="hidden sm:table-cell w-28">Loại</TableHead>
                  <TableHead className="w-24">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dayEntries.map((entry) => {
                  const linkedSubject = entry.subject_id
                    ? subjects.find((s) => s.id === entry.subject_id)
                    : null;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm font-medium tabular-nums">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {entry.start_time}–{entry.end_time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {linkedSubject && (
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: linkedSubject.color }}
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium">{entry.subject_name}</p>
                            {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs gap-1">
                          <Repeat className="h-3 w-3" />
                          {RECURRENCE_LABELS[entry.recurrence || 'weekly'] || 'Hàng tuần'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground capitalize">{entry.session_type}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Sửa môn học' : 'Thêm môn học'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Ngày</Label>
              <Select
                value={String(form.weekday)}
                onValueChange={(v) => setForm({ ...form, weekday: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {WEEKDAY_NAMES[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giờ bắt đầu</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Giờ kết thúc</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Môn học (từ danh sách môn đã tạo)</Label>
              <Select
                value={form.subject_id || 'none'}
                onValueChange={handleSelectCourse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học hoặc nhập tay bên dưới" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Nhập tay —</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tên môn học (hiển thị)</Label>
              <Input
                value={form.subject_name}
                onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                placeholder="VD: Giáo lý HTCG 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select
                  value={form.session_type}
                  onValueChange={(v) => setForm({ ...form, session_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Học chính khóa</SelectItem>
                    <SelectItem value="study">Tự học</SelectItem>
                    <SelectItem value="reading">Đọc sách</SelectItem>
                    <SelectItem value="labor">Lao động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lặp lại</Label>
                <Select
                  value={form.recurrence}
                  onValueChange={(v) => setForm({ ...form, recurrence: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Hàng tuần</SelectItem>
                    <SelectItem value="daily">Hàng ngày</SelectItem>
                    <SelectItem value="biweekly">2 tuần/lần</SelectItem>
                    <SelectItem value="once">Một lần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.recurrence !== 'once' && (
              <div className="space-y-2">
                <Label>Ngày kết thúc lặp lại (tùy chọn)</Label>
                <Input
                  type="date"
                  value={form.recurrence_end_date || ''}
                  onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value || null })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Ghi chú (tùy chọn)</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ghi chú thêm..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editingEntry ? 'Lưu' : 'Thêm'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
