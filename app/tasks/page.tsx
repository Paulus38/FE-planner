'use client';

import { useMemo, useState } from 'react';
import { Check, ListTodo, Plus } from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Task } from '@/lib/types';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/constants';

export default function TasksPage() {
  const { tasks, subjects, loading, refresh } = useAppData();
  const [title, setTitle] = useState('');
  const [subjectCode, setSubjectCode] = useState('none');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMin, setEstimatedMin] = useState('45');
  const [priority, setPriority] = useState('1');
  const [saving, setSaving] = useState(false);

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.status !== 'skipped'),
    [tasks]
  );
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'completed'), [tasks]);

  async function addTask() {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên nhiệm vụ.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      subject_code: subjectCode === 'none' ? null : subjectCode,
      due_date: dueDate || null,
      estimated_min: Math.max(5, Number(estimatedMin) || 45),
      priority: Number(priority),
      status: 'pending',
      note: null,
    });
    setSaving(false);
    if (error) {
      toast.error(`Không thể tạo nhiệm vụ: ${error}`);
      return;
    }
    setTitle('');
    setDueDate('');
    setEstimatedMin('45');
    setPriority('1');
    toast.success('Đã thêm nhiệm vụ.');
    refresh();
  }

  async function updateStatus(task: Task, status: Task['status']) {
    const { error } = await supabase.from('tasks').update({
      status,
      actual_min: status === 'completed' ? task.actual_min ?? task.estimated_min : task.actual_min,
      updated_at: new Date().toISOString(),
    }).eq('id', task.id);
    if (error) {
      toast.error(`Không thể cập nhật nhiệm vụ: ${error}`);
      return;
    }
    refresh();
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ListTodo className="h-6 w-6" />
          Nhiệm vụ
        </h1>
        <p className="mt-1 text-muted-foreground">Tạo bài cần làm để Smart Planner xếp thành phiên học.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Thêm nhiệm vụ mới</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_180px_160px_120px_140px_auto] md:items-end">
          <div className="space-y-2">
            <Label>Tên nhiệm vụ</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="VD: Ôn chương 1 Giáo lý" />
          </div>
          <div className="space-y-2">
            <Label>Môn học</Label>
            <Select value={subjectCode} onValueChange={setSubjectCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không gắn môn</SelectItem>
                {subjects.map((subject) => <SelectItem key={subject.id} value={subject.code}>{subject.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hạn hoàn thành</Label>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phút dự kiến</Label>
            <Input type="number" min={5} value={estimatedMin} onChange={(event) => setEstimatedMin(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Độ ưu tiên</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Cao</SelectItem>
                <SelectItem value="2">Trung bình</SelectItem>
                <SelectItem value="3">Thấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addTask} disabled={saving}><Plus className="h-4 w-4" /> Thêm</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Đang cần làm ({openTasks.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {openTasks.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có nhiệm vụ. Hãy thêm nhiệm vụ đầu tiên.</p> : openTasks.map((task) => (
            <TaskRow key={task.id} task={task} subjects={subjects} onComplete={() => updateStatus(task, 'completed')} onStart={() => updateStatus(task, 'in_progress')} />
          ))}
        </CardContent>
      </Card>

      {completedTasks.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Đã hoàn thành ({completedTasks.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {completedTasks.map((task) => <TaskRow key={task.id} task={task} subjects={subjects} onComplete={() => updateStatus(task, 'pending')} />)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TaskRow({ task, subjects, onComplete, onStart }: { task: Task; subjects: { code: string; name: string }[]; onComplete: () => void; onStart?: () => void }) {
  const subject = subjects.find((item) => item.code === task.subject_code);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <Button variant={task.status === 'completed' ? 'default' : 'outline'} size="icon" onClick={onComplete} title="Đánh dấu hoàn thành">
        <Check className="h-4 w-4" />
      </Button>
      <div className="min-w-0 flex-1">
        <p className={task.status === 'completed' ? 'font-medium line-through opacity-60' : 'font-medium'}>{task.title}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Môn: {subject?.name || 'Không gắn môn'}</span>
          <span>Ưu tiên: {TASK_PRIORITY_LABELS[task.priority] || `Mức ${task.priority}`}</span>
          <span>Dự kiến: {task.estimated_min} phút</span>
          {task.actual_min !== null && task.actual_min !== undefined && <span>Thực tế: {task.actual_min} phút</span>}
          {task.due_date && <span>Hạn: {task.due_date}</span>}
        </div>
        {task.note && <p className="mt-1 text-xs text-muted-foreground">Ghi chú: {task.note}</p>}
      </div>
      <Badge variant="outline">{TASK_STATUS_LABELS[task.status] || 'Chưa xác định'}</Badge>
      {onStart && task.status === 'pending' && <Button variant="ghost" size="sm" onClick={onStart}>Bắt đầu</Button>}
    </div>
  );
}
