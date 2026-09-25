'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { supabase } from '@/lib/api';
import {
  buildTimelineForDay,
  formatVietnameseDate,
  formatDuration,
  timeToMinutes,
  getCurrentMinutes,
  dateStr,
  todayStr,
} from '@/lib/scheduler';
import { getCategoryColors, SUBJECT_NAMES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import type { TimelineActivity, StudySession } from '@/lib/types';

export default function TodayPage() {
  const { settings, fixedActivities, scheduleEntries, sessions, tasks, loading, refresh } = useAppData();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const ds = todayStr();

  const timeline = useMemo(
    () => buildTimelineForDay(today, fixedActivities, scheduleEntries, sessions),
    [fixedActivities, scheduleEntries, sessions]
  );

  const selfStudyItems = timeline.filter((a) => a.is_self_study || a.category === 'journal');
  const completedCount = selfStudyItems.filter((a) => a.status === 'completed').length;
  const totalCount = selfStudyItems.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function toggleComplete(activity: TimelineActivity) {
    if (!activity.session_id) return;
    const session = sessions.find((s) => s.id === activity.session_id);
    if (!session) return;

    const newStatus = session.status === 'completed' ? 'planned' : 'completed';
    const actualMin = newStatus === 'completed' ? session.planned_min : null;

    const { error } = await supabase
      .from('study_sessions')
      .update({ status: newStatus, actual_min: actualMin, updated_at: new Date().toISOString() })
      .eq('id', session.id);

    if (error) {
      toast.error('Không thể cập nhật. Vui lòng thử lại.');
    } else {
      toast.success(newStatus === 'completed' ? 'Đã đánh dấu hoàn thành!' : 'Đã bỏ đánh dấu.');
      refresh();
    }
  }

  async function updateActualMinutes(sessionId: string, min: number) {
    const { error } = await supabase
      .from('study_sessions')
      .update({ actual_min: min, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) {
      toast.error('Không thể cập nhật thời gian.');
    } else {
      toast.success('Đã cập nhật thời gian thực tế.');
      refresh();
    }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  const currentMin = getCurrentMinutes();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lịch hôm nay</h1>
          <p className="mt-1 text-muted-foreground">{formatVietnameseDate(today)}</p>
        </div>
        <Card className="px-4 py-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Tiến độ</p>
              <p className="text-xl font-bold">{completionPct}%</p>
            </div>
            <div className="w-32">
              <Progress value={completionPct} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground">{completedCount}/{totalCount}</p>
          </div>
        </Card>
      </div>

      <div className="space-y-2">
        {timeline.map((activity) => {
          const cat = getCategoryColors(activity.category);
          const startMin = timeToMinutes(activity.start_time);
          let endMin = timeToMinutes(activity.end_time);
          if (endMin < startMin) endMin += 24 * 60;
          const isCurrent = currentMin >= startMin && currentMin < endMin;
          const isPast = currentMin >= endMin;
          const isCompleted = activity.status === 'completed';
          const canCheck = activity.is_self_study || activity.category === 'journal';

          return (
            <ActivityRow
              key={activity.id}
              activity={activity}
              isCurrent={isCurrent}
              isPast={isPast}
              isCompleted={isCompleted}
              canCheck={canCheck}
              onToggle={() => toggleComplete(activity)}
              onUpdateMin={updateActualMinutes}
            />
          );
        })}
      </div>

      {timeline.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có lịch cho hôm nay. Hãy tạo kế hoạch tự học.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActivityRow({
  activity,
  isCurrent,
  isPast,
  isCompleted,
  canCheck,
  onToggle,
  onUpdateMin,
}: {
  activity: TimelineActivity;
  isCurrent: boolean;
  isPast: boolean;
  isCompleted: boolean;
  canCheck: boolean;
  onToggle: () => void;
  onUpdateMin: (sessionId: string, min: number) => void;
}) {
  const cat = getCategoryColors(activity.category);
  const [expanded, setExpanded] = useState(false);
  const [actualMin, setActualMin] = useState(activity.actual_min?.toString() || '');

  const duration = formatDuration(
    activity.planned_min ||
    (activity.end_time < activity.start_time
      ? 24 * 60 - timeToMinutes(activity.start_time) + timeToMinutes(activity.end_time)
      : timeToMinutes(activity.end_time) - timeToMinutes(activity.start_time))
  );

  return (
    <div
      className={`rounded-lg border transition-all ${
        isCurrent ? `${cat.bg} ${cat.border} shadow-sm` : 'border-border'
      } ${isPast && !isCompleted ? 'opacity-50' : ''} ${isCompleted ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {canCheck ? (
          <Checkbox checked={isCompleted} onCheckedChange={onToggle} className="shrink-0" />
        ) : (
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cat.dot}`} />
        )}

        <div className="flex w-20 shrink-0 flex-col">
          <span className="text-sm font-medium tabular-nums">{activity.start_time}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{activity.end_time}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isCompleted ? 'line-through' : ''} ${isCurrent ? 'font-semibold' : ''}`}>
              {activity.title}
            </span>
            {isCurrent && <Badge variant="default" className="text-xs">now</Badge>}
          </div>
          {activity.skill && (
            <span className="text-xs text-muted-foreground">{activity.skill}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{duration}</span>
          {activity.category !== 'fixed' && activity.category !== 'sleep' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {expanded && activity.session_id && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Thời gian thực tế (phút):</span>
            <input
              type="number"
              value={actualMin}
              onChange={(e) => setActualMin(e.target.value)}
              onBlur={() => {
                const min = parseInt(actualMin);
                if (!isNaN(min) && min >= 0) {
                  onUpdateMin(activity.session_id!, min);
                }
              }}
              className="w-20 rounded border border-input px-2 py-1 text-sm"
              placeholder={activity.planned_min?.toString()}
            />
          </div>
          {activity.note && <p className="text-sm text-muted-foreground">{activity.note}</p>}
        </div>
      )}
    </div>
  );
}
