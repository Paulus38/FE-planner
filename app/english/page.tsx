'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import {
  calcEnglishRatio,
  getWeekDates,
  dateStr,
  formatDuration,
} from '@/lib/scheduler';
import { ENGLISH_SKILLS, SUBJECT_COLORS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Languages, Target, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import type { WeeklyGoal } from '@/lib/types';

export default function EnglishPage() {
  const { settings, sessions, weeklyGoals, loading, refresh } = useAppData();
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalValues, setGoalValues] = useState<Record<string, number>>({});

  const today = new Date();
  const weekDates = useMemo(() => getWeekDates(today), []);
  const weekStartStr = dateStr(weekDates[0]);
  const weekEndStr = dateStr(weekDates[6]);

  const weekSessions = useMemo(
    () => sessions.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr),
    [sessions, weekStartStr, weekEndStr]
  );

  const englishSessions = weekSessions.filter((s) => s.subject_code === 'english');
  const totalEnglishActual = englishSessions.reduce((sum, s) => sum + (s.actual_min ?? s.planned_min), 0);
  const totalEnglishPlanned = englishSessions.reduce((sum, s) => sum + s.planned_min, 0);

  const weekGoals = weeklyGoals.filter(
    (g) => g.week_start === weekStartStr && g.subject_code === 'english'
  );
  const totalWeeklyGoal = weekGoals.reduce((sum, g) => sum + g.target_min, 0);

  const skillData = useMemo(() => {
    return ENGLISH_SKILLS.map((skill) => {
      const goal = weekGoals.find((g) => g.skill === skill.code);
      const targetMin = goal?.target_min || skill.target;
      const actualMin = englishSessions
        .filter((s) => s.skill === skill.code)
        .reduce((sum, s) => sum + (s.actual_min ?? s.planned_min), 0);
      const remaining = Math.max(0, targetMin - actualMin);
      const pct = targetMin > 0 ? Math.min(100, Math.round((actualMin / targetMin) * 100)) : 0;
      return {
        ...skill,
        targetMin,
        actualMin,
        remaining,
        pct,
      };
    });
  }, [weekGoals, englishSessions]);

  const ratio = useMemo(() => calcEnglishRatio(weekSessions), [weekSessions]);

  const chartData = useMemo(() => {
    return skillData.map((s) => ({
      name: s.name,
      'Đã học': s.actualMin,
      'Mục tiêu': s.targetMin,
    }));
  }, [skillData]);

  useEffect(() => {
    if (weekGoals.length > 0) {
      const vals: Record<string, number> = {};
      ENGLISH_SKILLS.forEach((s) => {
        const g = weekGoals.find((g) => g.skill === s.code);
        vals[s.code] = g?.target_min || s.target;
      });
      setGoalValues(vals);
    }
  }, [weekGoals]);

  async function saveGoals() {
    try {
      for (const skill of ENGLISH_SKILLS) {
        const val = goalValues[skill.code] || skill.target;
        const existing = weekGoals.find((g) => g.skill === skill.code);
        if (existing) {
          await supabase.from('weekly_goals').update({ target_min: val }).eq('id', existing.id);
        } else {
          await supabase.from('weekly_goals').insert({
            week_start: weekStartStr,
            subject_code: 'english',
            target_min: val,
            skill: skill.code,
          });
        }
      }
      toast.success('Đã lưu mục tiêu tuần.');
      setEditingGoals(false);
      refresh();
    } catch {
      toast.error('Không thể lưu mục tiêu.');
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
            <Languages className="h-6 w-6 text-blue-500" />
            Tiếng Anh
          </h1>
          <p className="mt-1 text-muted-foreground">Theo dõi 7 kỹ năng tiếng Anh</p>
        </div>
        <Button variant="outline" onClick={() => setEditingGoals(!editingGoals)}>
          <Target className="h-4 w-4" />
          {editingGoals ? 'Hủy' : 'Chỉnh mục tiêu'}
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Tuần này</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatDuration(totalEnglishActual)}
            </p>
            <p className="text-xs text-muted-foreground">Mục tiêu: {formatDuration(totalWeeklyGoal)}</p>
            <Progress
              value={totalWeeklyGoal > 0 ? Math.min(100, Math.round((totalEnglishActual / totalWeeklyGoal) * 100)) : 0}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Tỷ lệ English</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {Math.round(ratio.ratio)}%
            </p>
            <p className="text-xs text-muted-foreground">Mục tiêu: {settings?.english_target_pct || 50}%</p>
            <Progress
              value={ratio.ratio}
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-sm">Còn lại tuần này</span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {formatDuration(Math.max(0, totalWeeklyGoal - totalEnglishActual))}
            </p>
            <p className="text-xs text-muted-foreground">
              {Math.max(0, 7 - today.getDay() + (today.getDay() === 0 ? 0 : 0))} ngày còn lại
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Skills breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kỹ năng tiếng Anh</CardTitle>
          <CardDescription>Theo dõi tiến độ từng kỹ năng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillData.map((skill) => (
              <div key={skill.code} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: skill.color }} />
                    <span className="text-sm font-medium">{skill.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingGoals ? (
                      <Input
                        type="number"
                        value={goalValues[skill.code] ?? skill.targetMin}
                        onChange={(e) => setGoalValues({ ...goalValues, [skill.code]: parseInt(e.target.value) || 0 })}
                        className="w-20 h-8 text-sm"
                      />
                    ) : null}
                    <span className="text-sm font-medium tabular-nums">
                      {skill.actualMin} / {skill.targetMin}
                    </span>
                    <span className="text-xs text-muted-foreground">phút</span>
                    {skill.pct >= 100 && <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">Done</Badge>}
                  </div>
                </div>
                <Progress value={skill.pct} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{skill.pct}%</span>
                  <span>Còn {skill.remaining} phút</span>
                </div>
              </div>
            ))}
            {editingGoals && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingGoals(false)}>Hủy</Button>
                <Button onClick={saveGoals}>Lưu mục tiêu</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ kỹ năng</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip
                formatter={(value: number) => `${value} phút`}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              />
              <Bar dataKey="Mục tiêu" fill="hsl(var(--muted-foreground) / 0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Đã học" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
