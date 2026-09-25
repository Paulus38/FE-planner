'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, ListChecks } from 'lucide-react';
import { useAppData } from '@/hooks/use-app-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TASK_STATUS_LABELS, getWeekPatternLabel } from '@/lib/constants';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { subjects, scheduleEntries, tasks, sessions, loading } = useAppData();
  const course = subjects.find((subject) => subject.id === params.id);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground">Đang tải...</div>;
  }

  if (!course) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <BookOpen className="h-10 w-10 text-muted-foreground/50" />
        <div>
          <h1 className="text-xl font-semibold">Không tìm thấy môn học</h1>
          <p className="mt-1 text-sm text-muted-foreground">Môn học này có thể đã bị xóa hoặc không thuộc tài khoản của bạn.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/courses">Quay lại danh sách môn học</Link>
        </Button>
      </div>
    );
  }

  const courseSchedule = scheduleEntries.filter(
    (entry) => entry.subject_id === course.id || entry.subject_name === course.name
  );
  const courseTasks = tasks.filter((task) => task.subject_code === course.code);
  const courseSessions = sessions.filter((session) => session.subject_code === course.code);

  return (
    <div className="space-y-6 animate-fade-in">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/courses">
          <ArrowLeft className="h-4 w-4" />
          Môn học của tôi
        </Link>
      </Button>

      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${course.color}15` }}
        >
          <BookOpen className="h-7 w-7" style={{ color: course.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
          {course.code && <p className="mt-1 font-mono text-sm text-muted-foreground">{course.code}</p>}
          {course.description && <p className="mt-2 text-muted-foreground">{course.description}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Mục tiêu tuần</p>
            <p className="mt-1 text-2xl font-bold">{course.weekly_goal_min} phút</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Lịch học</p>
            <p className="mt-1 text-2xl font-bold">{courseSchedule.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Phiên học</p>
            <p className="mt-1 text-2xl font-bold">{courseSessions.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lịch học môn này
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseSchedule.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có lịch học.</p>
            ) : (
              <div className="space-y-3">
                {courseSchedule.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">Thứ {entry.weekday === 0 ? 'Chủ nhật' : entry.weekday + 1}</span>
                    <span className="text-sm font-medium tabular-nums">{entry.start_time}–{entry.end_time}</span>
                    <Badge variant="outline">{getWeekPatternLabel(entry.week_pattern)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Nhiệm vụ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courseTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có nhiệm vụ cho môn này.</p>
            ) : (
              <div className="space-y-2">
                {courseTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Dự kiến: {task.estimated_min} phút
                        {task.actual_min !== null && task.actual_min !== undefined ? ` · Thực tế: ${task.actual_min} phút` : ''}
                        {task.due_date ? ` · Hạn: ${task.due_date}` : ''}
                      </p>
                    </div>
                    <Badge variant="outline">{TASK_STATUS_LABELS[task.status] || 'Chưa xác định'}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
