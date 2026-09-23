'use client';

import { useState } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import { COURSE_ICONS, COURSE_ICON_LIST } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { StudySubject } from '@/lib/types';
import {
  Languages, PenLine, Music, BookMarked, GraduationCap, Heart, BookOpen,
  Calculator, FlaskConical, Globe, Code, Palette, Brain, Library,
  Microscope, Atom, Compass, Scroll, Feather, History, Map, Trophy, Star,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Languages, PenLine, Music, BookMarked, GraduationCap, Heart, BookOpen,
  Calculator, FlaskConical, Globe, Code, Palette, Brain, Library,
  Microscope, Atom, Compass, Scroll, Feather, History, Map, Trophy, Star,
};

function getIcon(name?: string | null): LucideIcon {
  if (name && ICON_MAP[name]) return ICON_MAP[name];
  return BookOpen;
}

const COLOR_OPTIONS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#f43f5e',
  '#0ea5e9', '#22c55e', '#a855f7', '#eab308',
];

interface CourseForm {
  name: string;
  code: string;
  color: string;
  icon_name: string;
  description: string;
  tags: string;
  show_in_nav: boolean;
  is_in_english_ratio: boolean;
  weekly_goal_min: number;
  monthly_goal_min: number;
  sort_order: number;
}

const emptyForm: CourseForm = {
  name: '',
  code: '',
  color: '#3b82f6',
  icon_name: 'BookOpen',
  description: '',
  tags: '',
  show_in_nav: true,
  is_in_english_ratio: false,
  weekly_goal_min: 0,
  monthly_goal_min: 0,
  sort_order: 0,
};

export default function CoursesPage() {
  const { subjects, loading, refresh } = useAppData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<StudySubject | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyForm);

  const sortedSubjects = [...subjects].sort((a, b) => a.sort_order - b.sort_order);

  function openAdd() {
    setEditingCourse(null);
    setForm({
      ...emptyForm,
      sort_order: subjects.length + 1,
      code: `course_${Date.now()}`,
    });
    setDialogOpen(true);
  }

  function openEdit(course: StudySubject) {
    setEditingCourse(course);
    setForm({
      name: course.name,
      code: course.code || '',
      color: course.color,
      icon_name: course.icon_name || 'BookOpen',
      description: course.description || '',
      tags: (course.tags || []).join(', '),
      show_in_nav: course.show_in_nav,
      is_in_english_ratio: course.is_in_english_ratio,
      weekly_goal_min: course.weekly_goal_min,
      monthly_goal_min: course.monthly_goal_min,
      sort_order: course.sort_order,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên môn học.');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const data = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      color: form.color,
      icon_name: form.icon_name,
      description: form.description.trim() || null,
      tags: tags.length > 0 ? tags : null,
      show_in_nav: form.show_in_nav,
      is_in_english_ratio: form.is_in_english_ratio,
      weekly_goal_min: form.weekly_goal_min,
      monthly_goal_min: form.monthly_goal_min,
      sort_order: form.sort_order,
    };

    if (editingCourse) {
      const { error } = await supabase
        .from('study_subjects')
        .update(data)
        .eq('id', editingCourse.id);
      if (error) {
        toast.error('Không thể cập nhật môn học.');
        return;
      }
      toast.success('Đã cập nhật môn học.');
    } else {
      const { error } = await supabase.from('study_subjects').insert(data);
      if (error) {
        toast.error('Không thể tạo môn học.');
        return;
      }
      toast.success('Đã tạo môn học mới.');
    }

    setDialogOpen(false);
    refresh();
  }

  async function handleDelete(course: StudySubject) {
    const { error } = await supabase.from('study_subjects').delete().eq('id', course.id);
    if (error) {
      toast.error('Không thể xóa môn học.');
      return;
    }
    toast.success(`Đã xóa môn học "${course.name}".`);
    refresh();
  }

  async function toggleNav(course: StudySubject) {
    const { error } = await supabase
      .from('study_subjects')
      .update({ show_in_nav: !course.show_in_nav })
      .eq('id', course.id);
    if (error) {
      toast.error('Không thể cập nhật.');
      return;
    }
    refresh();
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý môn học</h1>
          <p className="mt-1 text-muted-foreground">
            Tạo và quản lý các môn học tùy chỉnh. Môn học hiển thị trong thanh menu sẽ xuất hiện ở sidebar.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Thêm môn học
        </Button>
      </div>

      {sortedSubjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Library className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Chưa có môn học nào. Hãy tạo môn học đầu tiên.</p>
            <Button onClick={openAdd} variant="outline">
              <Plus className="h-4 w-4" /> Tạo môn học
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSubjects.map((course) => {
            const Icon = getIcon(course.icon_name);
            return (
              <Card key={course.id} className="group relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: course.color }}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${course.color}15` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: course.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{course.name}</CardTitle>
                        {course.code && (
                          <p className="text-xs text-muted-foreground font-mono">{course.code}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => toggleNav(course)}
                      title={course.show_in_nav ? 'Ẩn khỏi sidebar' : 'Hiện trên sidebar'}
                    >
                      {course.show_in_nav ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  )}

                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {course.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {course.is_in_english_ratio && (
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Tính trong tỷ lệ tiếng Anh
                      </span>
                    )}
                    <span>Mục tiêu tuần: {course.weekly_goal_min} phút</span>
                  </div>

                  <div className="flex gap-1 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => openEdit(course)}>
                      <Pencil className="h-3.5 w-3.5" /> Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(course)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Sửa môn học' : 'Tạo môn học mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tên môn học *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Triết học, Lịch sử, Toán học..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã môn (tùy chọn)</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="VD: philosophy"
                />
              </div>
              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả (tùy chọn)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về môn học..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (phân tách bằng dấu phẩy)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="VD: tự học, lý thuyết, thực hành"
              />
            </div>

            <div className="space-y-2">
              <Label>Biểu tượng</Label>
              <div className="flex flex-wrap gap-2">
                {COURSE_ICON_LIST.map((iconName) => {
                  const Icon = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setForm({ ...form, icon_name: iconName })}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                        form.icon_name === iconName
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      form.color === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mục tiêu tuần (phút)</Label>
                <Input
                  type="number"
                  value={form.weekly_goal_min}
                  onChange={(e) => setForm({ ...form, weekly_goal_min: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mục tiêu tháng (phút)</Label>
                <Input
                  type="number"
                  value={form.monthly_goal_min}
                  onChange={(e) => setForm({ ...form, monthly_goal_min: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Hiện trên sidebar</p>
                <p className="text-xs text-muted-foreground">Môn học sẽ xuất hiện trong menu điều hướng</p>
              </div>
              <Switch
                checked={form.show_in_nav}
                onCheckedChange={(v) => setForm({ ...form, show_in_nav: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Tính trong tỷ lệ tiếng Anh</p>
                <p className="text-xs text-muted-foreground">Thời gian học môn này được tính vào tỷ lệ tiếng Anh</p>
              </div>
              <Switch
                checked={form.is_in_english_ratio}
                onCheckedChange={(v) => setForm({ ...form, is_in_english_ratio: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editingCourse ? 'Lưu thay đổi' : 'Tạo môn học'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
