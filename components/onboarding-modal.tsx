'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Languages,
  Heart,
  BookMarked,
  Music,
  BarChart3,
  PenLine,
  Settings,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const ONBOARDING_KEY = 'study-planner-onboarded';

const steps = [
  {
    icon: LayoutDashboard,
    title: 'Chào mừng đến với Study Planner',
    description:
      'Ứng dụng giúp bạn quản lý thời gian học tập, sinh hoạt và đời sống thiêng liêng. ' +
      'Khi đăng ký tài khoản mới, dữ liệu mẫu đã được tạo sẵn gồm thời khóa biểu, lịch sinh hoạt và mục tiêu.',
    color: 'text-blue-500',
  },
  {
    icon: CalendarDays,
    title: 'Lịch hôm nay & Lịch tuần',
    description:
      'Trang "Lịch hôm nay" hiển thị toàn bộ hoạt động trong ngày theo thời gian thực. ' +
      'Bạn có thể đánh dấu hoàn thành các phiên tự học bằng ô tích. ' +
      'Trang "Lịch tuần" cho phép xem toàn bộ lịch của cả tuần và chuyển đổi giữa các ngày.',
    color: 'text-cyan-500',
  },
  {
    icon: GraduationCap,
    title: 'Tự học thông minh',
    description:
      'Nhấn nút "Tạo lịch tự động" để hệ thống tự động phân bổ thời gian tự học tối ưu. ' +
      'Hệ thống ưu tiên bài tập trước, sau đó phân bổ tiếng Anh theo tỷ lệ mục tiêu (mặc định 50%), ' +
      'còn lại cho các môn khác. Bạn luôn có thể chỉnh sửa thủ công.',
    color: 'text-emerald-500',
  },
  {
    icon: Languages,
    title: 'Tiếng Anh & Tỷ lệ học',
    description:
      'Theo dõi tỷ lệ thời gian học tiếng Anh so với các môn khác. ' +
      'Mục tiêu là duy trì tối thiểu 50% thời gian tự học cho tiếng Anh. ' +
      'Ghi lại từng phiên học theo kỹ năng: từ vựng, ngữ pháp, đọc, nghe, nói, phát âm, dịch.',
    color: 'text-blue-500',
  },
  {
    icon: Heart,
    title: 'Nhật ký thiêng liêng',
    description:
      'Mỗi tối, hãy dành ít nhất 15 phút viết nhật ký thiêng liêng. ' +
      'Ghi lại những điều biết ơn, việc tốt đã làm, những điều cần cải thiện, ' +
      'nhận thức sâu sắc, lời nguyện và những điều muốn thay đổi.',
    color: 'text-rose-500',
  },
  {
    icon: BookMarked,
    title: 'Đọc sách',
    description:
      'Quản lý danh sách sách đang đọc. Cập nhật số trang mỗi ngày, ' +
      'ứng dụng sẽ theo dõi tiến độ so với mục tiêu hàng ngày và dự đoán ngày hoàn thành.',
    color: 'text-violet-500',
  },
  {
    icon: Music,
    title: 'Thực hành đàn',
    description:
      'Ghi lại thời gian tập đàn theo từng phần: xướng âm, lý thuyết, kỹ thuật, và tác phẩm. ' +
      'Theo dõi tổng thời gian tập luyện theo ngày và tuần.',
    color: 'text-amber-500',
  },
  {
    icon: BarChart3,
    title: 'Thống kê & Tổng kết tuần',
    description:
      'Xem biểu đồ thống kê thời gian học theo ngày, tuần, tháng. ' +
      'Cuối tuần, vào trang "Tổng kết tuần" để phản tích: điều gì tốt, điều gì cần cải thiện, ' +
      'trọng tâm cho tuần tới.',
    color: 'text-indigo-500',
  },
  {
    icon: Settings,
    title: 'Cài đặt cá nhân',
    description:
      'Tùy chỉnh giờ thức dậy, giờ ngủ, thời gian học chính khóa, khung tự học tối, ' +
      'tỷ lệ tiếng Anh mục tiêu, thời lượng phiên học và khoảng nghỉ. ' +
      'Thay đổi tại trang "Cài đặt" sẽ ảnh hưởng đến cách hệ thống tạo lịch tự động.',
    color: 'text-slate-500',
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleClose() {
    setOpen(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
  }

  function handleSkip() {
    setOpen(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
  }

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSkip()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted`}>
            <Icon className={`h-7 w-7 ${current.color}`} />
          </div>
          <DialogTitle className="text-center text-xl">{current.title}</DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed pt-2">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Bước {step + 1} / {steps.length}</span>
            {step === steps.length - 1 && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" /> Sẵn sàng!
              </span>
            )}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            Bỏ qua
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                Quay lại
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {step === steps.length - 1 ? (
                <>
                  <Sparkles className="h-4 w-4" /> Bắt đầu sử dụng
                </>
              ) : (
                'Tiếp theo'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function resetOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ONBOARDING_KEY);
  }
}
