'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/api';
import { useAppData } from '@/hooks/use-app-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Settings as SettingsIcon, Save, Bell, Clock, Target } from 'lucide-react';
import { toast } from 'sonner';
import type { Settings } from '@/lib/types';

export default function SettingsPage() {
  const { settings, loading, refresh, error } = useAppData();
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', form.id);
      if (error) throw error;
      toast.success('Đã lưu cài đặt.');
      refresh();
    } catch {
      toast.error('Không thể lưu cài đặt.');
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">Không thể tải cài đặt</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={refresh} variant="outline">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !form) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Cài đặt
          </h1>
          <p className="mt-1 text-muted-foreground">Tùy chỉnh lịch sinh hoạt và mục tiêu</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>

      {/* Daily Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lịch sinh hoạt cố định
          </CardTitle>
          <CardDescription>Thời gian sinh hoạt hàng ngày</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TimeField label="Thức dậy" value={form.wake_time} onChange={(v) => setForm({ ...form, wake_time: v })} />
            <TimeField label="Đi ngủ" value={form.sleep_time} onChange={(v) => setForm({ ...form, sleep_time: v })} />
            <TimeField label="Kinh tối" value={form.evening_prayer_time} onChange={(v) => setForm({ ...form, evening_prayer_time: v })} />
            <TimeField label="Thánh lễ (bắt đầu)" value={form.mass_time_start} onChange={(v) => setForm({ ...form, mass_time_start: v })} />
            <TimeField label="Thánh lễ (kết thúc)" value={form.mass_time_end} onChange={(v) => setForm({ ...form, mass_time_end: v })} />
            <TimeField label="Ăn sáng (bắt đầu)" value={form.breakfast_start} onChange={(v) => setForm({ ...form, breakfast_start: v })} />
            <TimeField label="Ăn sáng (kết thúc)" value={form.breakfast_end} onChange={(v) => setForm({ ...form, breakfast_end: v })} />
            <TimeField label="Cơm trưa (bắt đầu)" value={form.lunch_start} onChange={(v) => setForm({ ...form, lunch_start: v })} />
            <TimeField label="Cơm trưa (kết thúc)" value={form.lunch_end} onChange={(v) => setForm({ ...form, lunch_end: v })} />
            <TimeField label="Nghỉ trưa (bắt đầu)" value={form.nap_start} onChange={(v) => setForm({ ...form, nap_start: v })} />
            <TimeField label="Nghỉ trưa (kết thúc)" value={form.nap_end} onChange={(v) => setForm({ ...form, nap_end: v })} />
            <TimeField label="Thể thao (bắt đầu)" value={form.sports_start} onChange={(v) => setForm({ ...form, sports_start: v })} />
            <TimeField label="Thể thao (kết thúc)" value={form.sports_end} onChange={(v) => setForm({ ...form, sports_end: v })} />
            <TimeField label="Ăn tối (bắt đầu)" value={form.dinner_start} onChange={(v) => setForm({ ...form, dinner_start: v })} />
            <TimeField label="Ăn tối (kết thúc)" value={form.dinner_end} onChange={(v) => setForm({ ...form, dinner_end: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Study blocks */}
      <Card>
        <CardHeader>
          <CardTitle>Khung giờ học</CardTitle>
          <CardDescription>Thời gian học chính khóa và tự học</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <TimeField label="Học sáng (bắt đầu)" value={form.study_block1_start} onChange={(v) => setForm({ ...form, study_block1_start: v })} />
            <TimeField label="Học sáng (kết thúc)" value={form.study_block1_end} onChange={(v) => setForm({ ...form, study_block1_end: v })} />
            <TimeField label="Học chiều (bắt đầu)" value={form.study_block2_start} onChange={(v) => setForm({ ...form, study_block2_start: v })} />
            <TimeField label="Học chiều (kết thúc)" value={form.study_block2_end} onChange={(v) => setForm({ ...form, study_block2_end: v })} />
            <TimeField label="Tự học tối (bắt đầu)" value={form.self_study_start} onChange={(v) => setForm({ ...form, self_study_start: v })} />
            <TimeField label="Tự học tối (kết thúc)" value={form.self_study_end} onChange={(v) => setForm({ ...form, self_study_end: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Study session settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Mục tiêu và phiên học
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mục tiêu tiếng Anh: {form.english_target_pct}%</Label>
            </div>
            <Slider
              value={[form.english_target_pct]}
              onValueChange={([v]) => setForm({ ...form, english_target_pct: v })}
              min={20}
              max={80}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Tiếng Anh phải chiếm {form.english_target_pct}% tổng thời gian tự học (Tiếng Anh + Việt văn + Đàn + Đọc sách)
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Thời lượng phiên học (phút)</Label>
              <Input
                type="number"
                value={form.session_duration_min}
                onChange={(e) => setForm({ ...form, session_duration_min: parseInt(e.target.value) || 45 })}
                min={15}
                max={90}
              />
            </div>
            <div className="space-y-2">
              <Label>Thời gian nghỉ (phút)</Label>
              <Input
                type="number"
                value={form.break_duration_min}
                onChange={(e) => setForm({ ...form, break_duration_min: parseInt(e.target.value) || 10 })}
                min={5}
                max={30}
              />
            </div>
            <div className="space-y-2">
              <Label>Nhật ký tối thiểu (phút)</Label>
              <Input
                type="number"
                value={form.journal_min_min}
                onChange={(e) => setForm({ ...form, journal_min_min: parseInt(e.target.value) || 15 })}
                min={5}
                max={60}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Thông báo
          </CardTitle>
          <CardDescription>Cấu hình nhắc nhở</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Bật thông báo</Label>
            <Switch
              checked={form.notifications_enabled}
              onCheckedChange={(v) => setForm({ ...form, notifications_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Nhắc trước khi học (phút)</Label>
            <Input
              type="number"
              value={form.notify_before_study_min}
              onChange={(e) => setForm({ ...form, notify_before_study_min: parseInt(e.target.value) || 10 })}
              className="w-24"
              disabled={!form.notifications_enabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Nhắc trước khi kết thúc (phút)</Label>
            <Input
              type="number"
              value={form.notify_before_end_min}
              onChange={(e) => setForm({ ...form, notify_before_end_min: parseInt(e.target.value) || 5 })}
              className="w-24"
              disabled={!form.notifications_enabled}
            />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            <SwitchRow label="Nhắc viết nhật ký" checked={form.notify_journal} onChange={(v) => setForm({ ...form, notify_journal: v })} disabled={!form.notifications_enabled} />
            <SwitchRow label="Nhắc đi ngủ" checked={form.notify_sleep} onChange={(v) => setForm({ ...form, notify_sleep: v })} disabled={!form.notifications_enabled} />
            <SwitchRow label="Nhắc nhiệm vụ chưa hoàn thành" checked={form.notify_incomplete} onChange={(v) => setForm({ ...form, notify_incomplete: v })} disabled={!form.notifications_enabled} />
            <SwitchRow label="Tổng kết tuần" checked={form.notify_weekly_review} onChange={(v) => setForm({ ...form, notify_weekly_review: v })} disabled={!form.notifications_enabled} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu...' : 'Lưu tất cả cài đặt'}
        </Button>
      </div>
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function SwitchRow({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
