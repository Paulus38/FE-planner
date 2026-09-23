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
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/today', label: 'Lịch hôm nay', icon: CalendarDays },
  { href: '/calendar', label: 'Lịch tuần', icon: CalendarRange },
  { href: '/schedule', label: 'Thời khóa biểu', icon: BookOpen },
  { href: '/self-study', label: 'Tự học', icon: GraduationCap },
  { href: '/english', label: 'Tiếng Anh', icon: Languages },
  { href: '/journal', label: 'Nhật ký', icon: Heart },
  { href: '/books', label: 'Đọc sách', icon: BookMarked },
  { href: '/instrument', label: 'Đàn', icon: Music },
  { href: '/statistics', label: 'Thống kê', icon: BarChart3 },
  { href: '/weekly-review', label: 'Tổng kết tuần', icon: PenLine },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
  { href: '/help', label: 'Hướng dẫn', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
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
          <NavList pathname={pathname} />
        </nav>
      </aside>
    </>
  );
}

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
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
    </ul>
  );
}
