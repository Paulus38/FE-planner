'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  BookOpen,
  GraduationCap,
  Languages,
  PenLine,
  Music,
  BookMarked,
  Heart,
  BarChart3,
  Settings,
  Church,
  Menu,
  X,
  HelpCircle,
  Library,
  Calculator,
  FlaskConical,
  Globe,
  Code,
  Palette,
  Brain,
  Microscope,
  Atom,
  Compass,
  Scroll,
  Feather,
  History,
  Map,
  Trophy,
  Star,
  ListTodo,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/hooks/use-app-data';
import type { StudySubject } from '@/lib/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Languages, PenLine, Music, BookMarked, GraduationCap, Heart, BookOpen,
  Calculator, FlaskConical, Globe, Code, Palette, Brain, Library,
  Microscope, Atom, Compass, Scroll, Feather, History, Map, Trophy, Star,
};

function getIcon(iconName?: string | null): LucideIcon {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  return BookOpen;
}

const staticNavItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Lịch hôm nay', icon: CalendarDays },
  { href: '/calendar', label: 'Lịch tuần', icon: CalendarRange },
  { href: '/schedule', label: 'Thời khóa biểu', icon: BookOpen },
  { href: '/self-study', label: 'Tự học', icon: GraduationCap },
  { href: '/books', label: 'Đọc sách', icon: BookMarked },
  { href: '/tasks', label: 'Nhiệm vụ', icon: ListTodo },
  { href: '/courses', label: 'Quản lý môn học', icon: Library },
  { href: '/statistics', label: 'Thống kê', icon: BarChart3 },
  { href: '/weekly-review', label: 'Tổng kết tuần', icon: PenLine },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
  { href: '/help', label: 'Hướng dẫn', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { subjects } = useAppData();

  const courseNavItems = subjects
    .filter((s) => s.show_in_nav)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Church className="h-6 w-6 text-primary" />
          <span className="font-semibold">Chủng Sinh Planner</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[57px] z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <nav
            className="absolute left-0 top-0 h-full w-72 border-r border-border bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NavList
              pathname={pathname}
              courseNavItems={courseNavItems}
              onNavigate={() => setMobileOpen(false)}
            />
          </nav>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex items-center gap-2 border-b border-border px-6 py-5">
          <Church className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-sm font-semibold leading-tight">Chủng Sinh</h1>
            <p className="text-xs text-muted-foreground leading-tight">Study Planner</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <NavList pathname={pathname} courseNavItems={courseNavItems} />
        </nav>
      </aside>
    </>
  );
}

function NavList({
  pathname,
  courseNavItems,
  onNavigate,
}: {
  pathname: string;
  courseNavItems: StudySubject[];
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {staticNavItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" style={{ width: '1.125rem', height: '1.125rem' }} />
              {item.label}
            </Link>
          </li>
        );
      })}

      {courseNavItems.length > 0 && (
        <>
          <li className="px-3 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Môn học của tôi
            </p>
          </li>
          {courseNavItems.map((course) => {
            const active = pathname === `/courses/${course.id}`;
            const Icon = getIcon(course.icon_name);
            return (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.id}`}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon
                    className="h-4.5 w-4.5 shrink-0"
                    style={{ width: '1.125rem', height: '1.125rem', color: course.color }}
                  />
                  {course.name}
                </Link>
              </li>
            );
          })}
        </>
      )}
    </ul>
  );
}
