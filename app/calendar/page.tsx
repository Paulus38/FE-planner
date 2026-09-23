'use client';

import { useMemo, useState } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import { buildTimelineForDay, dateStr, getWeekDates, addDays, formatVietnameseDate } from '@/lib/scheduler';
import { CATEGORY_COLORS, WEEKDAY_NAMES_SHORT } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { TimelineActivity } from '@/lib/types';

export default function CalendarPage() {
  const { fixedActivities, scheduleEntries, sessions, loading, refresh } = useAppData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [monthAnchor, setMonthAnchor] = useState(new Date());

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);

  const selectedTimeline = useMemo(
    () => buildTimelineForDay(selectedDate, fixedActivities, scheduleEntries, sessions),
    [fixedActivities, scheduleEntries, sessions, selectedDate]
  );

  const monthDays = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [monthAnchor]);

  function getDayActivities(date: Date): TimelineActivity[] {
    return buildTimelineForDay(date, fixedActivities, scheduleEntries, sessions);
  }

  function getActivityCount(date: Date): number {
    return sessions.filter((s) => s.date === dateStr(date)).length;
  }

  function getCompletedCount(date: Date): number {
    return sessions.filter((s) => s.date === dateStr(date) && s.status === 'completed').length;
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lịch</h1>
        <p className="mt-1 text-muted-foreground">Xem lịch theo ngày, tuần và tháng</p>
      </div>

      <Tabs defaultValue="week">
        <TabsList>
          <TabsTrigger value="day">Ngày</TabsTrigger>
          <TabsTrigger value="week">Tuần</TabsTrigger>
          <TabsTrigger value="month">Tháng</TabsTrigger>
        </TabsList>

        {/* DAY VIEW */}
        <TabsContent value="day" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="text-sm font-medium">{formatVietnameseDate(selectedDate)}</p>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <DayTimeline activities={selectedTimeline} />
        </TabsContent>

        {/* WEEK VIEW */}
        <TabsContent value="week" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="text-sm font-medium">
              {dateStr(weekDates[0])} → {dateStr(weekDates[6])}
            </p>
            <Button variant="ghost" size="icon" onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid gap-2 lg:grid-cols-7">
            {weekDates.map((date) => {
              const activities = getDayActivities(date);
              const isToday = dateStr(date) === dateStr(new Date());
              const isSelected = dateStr(date) === dateStr(selectedDate);
              return (
                <button
                  key={dateStr(date)}
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-lg border p-2 text-left transition-colors min-h-[140px] ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  } ${isToday ? 'ring-1 ring-primary' : ''}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {WEEKDAY_NAMES_SHORT[date.getDay()]}
                    </span>
                    <span className={`text-sm font-bold ${isToday ? 'text-primary' : ''}`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {activities.slice(0, 5).map((a) => {
                      const cat = CATEGORY_COLORS[a.category];
                      return (
                        <div key={a.id} className="flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${cat.dot} shrink-0`} />
                          <span className="truncate text-[10px] text-muted-foreground">
                            {a.start_time} {a.title}
                          </span>
                        </div>
                      );
                    })}
                    {activities.length > 5 && (
                      <p className="text-[10px] text-muted-foreground">+{activities.length - 5} nữa</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <DayTimeline activities={selectedTimeline} />
        </TabsContent>

        {/* MONTH VIEW */}
        <TabsContent value="month" className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <p className="text-sm font-medium">
              Tháng {monthAnchor.getMonth() + 1}, {monthAnchor.getFullYear()}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_NAMES_SHORT.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {monthDays.map((date, i) => {
              if (!date) return <div key={i} className="min-h-[80px] rounded-lg" />;
              const count = getActivityCount(date);
              const completed = getCompletedCount(date);
              const isToday = dateStr(date) === dateStr(new Date());
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedDate(date);
                    document.getElementById('day-view')?.click();
                  }}
                  className={`min-h-[80px] rounded-lg border p-1.5 text-left transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isToday ? 'font-bold text-primary' : ''}`}>
                      {date.getDate()}
                    </span>
                    {completed > 0 && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </div>
                  {count > 0 && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DayTimeline({ activities }: { activities: TimelineActivity[] }) {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chi tiết ngày</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.map((a) => {
            const cat = CATEGORY_COLORS[a.category];
            const startMin = parseInt(a.start_time.split(':')[0]) * 60 + parseInt(a.start_time.split(':')[1]);
            let endMin = parseInt(a.end_time.split(':')[0]) * 60 + parseInt(a.end_time.split(':')[1]);
            if (endMin < startMin) endMin += 24 * 60;
            const isCurrent = currentMin >= startMin && currentMin < endMin;
            const isPast = currentMin >= endMin;

            return (
              <div
                key={a.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  isCurrent ? cat.bg : isPast ? 'opacity-50' : ''
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${cat.dot} shrink-0`} />
                <div className="w-24 shrink-0">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {a.start_time}–{a.end_time}
                  </span>
                </div>
                <span className="flex-1 text-sm">{a.title}</span>
                {a.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                <span className={`hidden sm:inline text-xs ${cat.text}`}>{cat.label}</span>
              </div>
            );
          })}
          {activities.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Không có hoạt động nào.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
