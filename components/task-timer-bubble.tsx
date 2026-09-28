'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Pause, Play, Square, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/api';
import type { Task } from '@/lib/types';

const STORAGE_KEY = 'study-planner-active-task';

type ActiveTask = {
  task: Task;
  startedAt: string;
  pausedAt?: string;
  accumulatedSeconds: number;
};

function readActiveTask(): ActiveTask | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveTask;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function startTaskTimer(task: Task) {
  const active: ActiveTask = {
    task,
    startedAt: new Date().toISOString(),
    accumulatedSeconds: 0,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
  window.dispatchEvent(new Event('task-timer-changed'));
}

export function TaskTimerBubble() {
  const [active, setActive] = useState<ActiveTask | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const sync = () => setActive(readActiveTask());
    sync();
    window.addEventListener('task-timer-changed', sync);
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.removeEventListener('task-timer-changed', sync);
      window.clearInterval(interval);
    };
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!active) return 0;
    const runningSeconds = active.pausedAt
      ? 0
      : Math.max(0, Math.floor((now - Date.parse(active.startedAt)) / 1000) - active.accumulatedSeconds);
    return active.accumulatedSeconds + runningSeconds;
  }, [active, now]);

  if (!active) return null;

  const display = `${Math.floor(elapsedSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  async function finish(status: 'completed' | 'planned') {
    const currentActive = active;
    if (!currentActive) return;
    const endedAt = new Date().toISOString();
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const { error } = await supabase.from('tasks').update({
      status,
      actual_min: minutes,
      ended_at: status === 'completed' ? endedAt : null,
      updated_at: endedAt,
    }).eq('id', currentActive.task.id);
    if (error) {
      toast.error('Không thể cập nhật task.');
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('task-timer-changed'));
    const message = status === 'completed' ? 'Đã hoàn thành task.' : 'Đã dừng task, có thể tiếp tục sau.';
    toast.success(message);
    if (status === 'completed' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Study Planner', { body: `${message} ${currentActive.task.title}` });
    }
  }

  function togglePause() {
    const currentActive = active;
    if (!currentActive) return;
    const updated: ActiveTask = currentActive.pausedAt
      ? {
          ...currentActive,
          pausedAt: undefined,
          startedAt: new Date(Date.now() - currentActive.accumulatedSeconds * 1000).toISOString(),
        }
      : {
          ...currentActive,
          pausedAt: new Date().toISOString(),
          accumulatedSeconds: elapsedSeconds,
        };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('task-timer-changed'));
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 rounded-2xl border border-primary/30 bg-card p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2"><Timer className="h-5 w-5 text-primary" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">Task đang chạy</p>
          <p className="truncate font-semibold">{active.task.title}</p>
          <p className="mt-1 font-mono text-lg tabular-nums">{display}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={togglePause}>
          {active.pausedAt ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {active.pausedAt ? 'Tiếp tục' : 'Tạm dừng'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => finish('planned')}><Square className="h-4 w-4" /> Dừng</Button>
        <Button size="sm" onClick={() => finish('completed')}><Check className="h-4 w-4" /> Xong</Button>
      </div>
    </div>
  );
}
