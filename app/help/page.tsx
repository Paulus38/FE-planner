'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { resetOnboarding } from '@/components/onboarding-modal';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  BookOpen,
  GraduationCap,
  Languages,
  Heart,
  BookMarked,
  Music,
  BarChart3,
  PenLine,
  Settings,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const guides = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    href: '/',
    color: 'text-blue-500',
    sections: [
      'Trang chính hiển thị hoạt động đang diễn ra và hoạt động tiếp theo với đồng hồ đếm ngược.',
      'Bốn thẻ thống kê nhanh: tiến độ hôm nay, phút tiếng Anh tuần này, tỷ lệ tiếng Anh, và số bài tập còn lại.',
      'Xem trước lịch hôm nay ngay trên dashboard, nhấn "Xem tất cả" để vào trang chi tiết.',
    ],
  },
  {
    icon: CalendarDays,
    title: 'Lịch hôm nay',
    href: '/today',
    color: 'text-cyan-500',
    sections: [
      'Toàn bộ hoạt động trong ngày hiển thị theo thời gian thực, tự động cập nhật mỗi 30 giây.',
      'Tích vào ô tròn bên trái để đánh dấu hoàn thành phiên tự học hoặc nhật ký.',
      'Nhấn vào mũi tên để mở rộng, nhập thời gian thực tế đã học (phút) nếu khác kế hoạch.',
      'Hoạt động đã qua tự động mờ đi, hoạt động hiện tại được highlight và có nhãn "now".',
    ],
  },
  {
    icon: CalendarRange,
    title: 'Lịch tuần',
    href: '/calendar',
    color: 'text-teal-500',
    sections: [
      'Xem toàn bộ lịch trong tuần, chuyển đổi giữa các ngày bằng các tab hoặc nút trái/phải.',
      'Mỗi ngày hiển thị timeline đầy đủ với mã màu theo loại hoạt động.',
      'Kiểm tra nhanh xem ngày nào có nhiều bài tập hoặc phiên học nhất.',
    ],
  },
  {
    icon: BookOpen,
    title: 'Thời khóa biểu',
    href: '/schedule',
    color: 'text-indigo-500',
    sections: [
      'Quản lý thời khóa biểu cố định theo thứ trong tuần.',
      'Thêm, sửa, xóa các tiết học với môn học, thời gian và ghi chú.',
      'Thay đổi ở đây sẽ ảnh hưởng đến cách hệ thống tạo lịch tự học.',
    ],
  },
  {
    icon: GraduationCap,
    title: 'Tự học cá nhân',
    href: '/self-study',
    color: 'text-emerald-500',
    sections: [
      'Nhấn "Tạo lịch tự động" để hệ thống tự phân bổ thời gian tự học tối ưu cho hôm nay.',
      'Hệ thống ưu tiên: bài tập pending trước, sau đó tiếng Anh theo tỷ lệ mục tiêu, còn lại cho các môn khác.',
      'Biểu đồ tròn hiển thị tỷ lệ phân bổ thời gian học trong tuần.',
      'Thanh cảnh báo cho biết tỷ lệ tiếng Anh đã đạt mục tiêu hay chưa.',
    ],
  },
  {
    icon: Languages,
    title: 'Tiếng Anh',
    href: '/english',
    color: 'text-blue-500',
    sections: [
      'Theo dõi thời gian học tiếng Anh theo 7 kỹ năng: từ vựng, ngữ pháp, đọc, nghe, nói, phát âm, dịch.',
      'Mỗi kỹ năng có mục tiêu phút/tuần riêng, hiển thị tiến độ bằng thanh прогресс.',
      'Thêm phiên học thủ công với kỹ năng, thời gian và ghi chú.',
      'Mục tiêu chung: tối thiểu 50% thời gian tự học dành cho tiếng Anh.',
    ],
  },
  {
    icon: Heart,
    title: 'Nhật ký thiêng liêng',
    href: '/journal',
    color: 'text-rose-500',
    sections: [
      'Mỗi tối, viết nhật ký thiêng liêng tối thiểu 15 phút.',
      'Ghi lại 5 phần: điều biết ơn, việc tốt đã làm, điều cần cải thiện, nhận thức, và lời nguyện.',
      'Đánh dấu hoàn thành khi đã viết xong. Lịch sử hiển thị 30 ngày gần nhất.',
      'Số ngày viết nhật ký liên tục được theo dõi để tạo thói quen.',
    ],
  },
  {
    icon: BookMarked,
    title: 'Đọc sách',
    href: '/books',
    color: 'text-violet-500',
    sections: [
      'Thêm sách đang đọc với tổng số trang, mục tiêu trang/ngày, và ngày bắt đầu.',
      'Cập nhật số trang hiện tại mỗi ngày, ứng dụng tự tính tiến độ phần trăm.',
      'Trạng thái: đang đọc, đã xong, tạm dừng.',
      'Theo dõi tốc độ đọc và dự đoán ngày hoàn thành dựa trên mục tiêu.',
    ],
  },
  {
    icon: Music,
    title: 'Thực hành đàn',
    href: '/instrument',
    color: 'text-amber-500',
    sections: [
      'Ghi lại thời gian tập đàn mỗi ngày theo 4 phần: xướng âm, lý thuyết, kỹ thuật, tác phẩm.',
      'Tổng thời gian tự động tính từ các phần trên.',
      'Thêm ghi chú về tác phẩm đang tập và tiến độ.',
      'Xem lịch sử tập luyện theo ngày và tổng thời gian tuần này.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Thống kê',
    href: '/statistics',
    color: 'text-indigo-500',
    sections: [
      'Biểu đồ thống kê thời gian học theo ngày, tuần, tháng.',
      'Phân tích theo từng môn học: tiếng Anh, Việt văn, đàn, đọc sách, bài tập, nhật ký.',
      'Theo dõi tỷ lệ tiếng Anh theo thời gian để đảm bảo đạt mục tiêu.',
      'Số liệu tự động cập nhật khi bạn hoàn thành phiên học.',
    ],
  },
  {
    icon: PenLine,
    title: 'Tổng kết tuần',
    href: '/weekly-review',
    color: 'text-purple-500',
    sections: [
      'Cuối tuần, tổng hợp toàn bộ hoạt động trong tuần: thời gian học, tỷ lệ tiếng Anh, bài tập, nhật ký.',
      'Viết phản tích: điều gì tốt, điều gì cần cải thiện, trọng tâm tuần tới.',
      'Tỷ lệ hoàn thành kế hoạch tự học được tính tự động.',
      'Lưu lại để theo dõi sự tiến bộ qua các tuần.',
    ],
  },
  {
    icon: Settings,
    title: 'Cài đặt',
    href: '/settings',
    color: 'text-slate-500',
    sections: [
      'Tùy chỉnh giờ thức dậy, giờ ngủ, giờ kinh, giờ ăn, giờ nghỉ, giờ thể thao.',
      'Thiết lập khung tự học tối: thời gian bắt đầu, kết thúc, thời lượng phiên, khoảng nghỉ.',
      'Thay đổi tỷ lệ tiếng Anh mục tiêu (mặc định 50%).',
      'Bật/tắt thông báo nhắc nhở cho phiên học, nhật ký, giờ ngủ, và tổng kết tuần.',
    ],
  },
];

const tips = [
  {
    icon: Sparkles,
    title: 'Bắt đầu nhanh',
    text: 'Khi đăng ký, dữ liệu mẫu đã được tạo sẵn. Chỉ cần vào trang "Tự học" và nhấn "Tạo lịch tự động" để có kế hoạch hôm nay.',
  },
  {
    icon: GraduationCap,
    title: 'Quy tắc 50% tiếng Anh',
    text: 'Mục tiêu quan trọng nhất: tối thiểu 50% thời gian tự học dành cho tiếng Anh. Hệ thống tự động theo dõi và cảnh báo.',
  },
  {
    icon: Heart,
    title: 'Thói quen hàng ngày',
    text: 'Đánh dấu hoàn thành mỗi phiên học ngay sau khi xong. Viết nhật ký thiêng liêng mỗi tối trước khi ngủ.',
  },
  {
    icon: PenLine,
    title: 'Phản tích cuối tuần',
    text: 'Dành thời gian cuối tuần viết tổng kết. Nhìn lại tuần qua để điều chỉnh kế hoạch tuần tới hiệu quả hơn.',
  },
];

export default function HelpPage() {
  function handleShowOnboarding() {
    resetOnboarding();
    window.location.href = '/';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hướng dẫn sử dụng</h1>
          <p className="mt-1 text-muted-foreground">
            Tìm hiểu cách sử dụng các tính năng của ứng dụng
          </p>
        </div>
        <Button variant="outline" onClick={handleShowOnboarding}>
          <HelpCircle className="h-4 w-4" />
          Xem lại hướng dẫn nhanh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <Card key={tip.title} className="border-primary/20">
              <CardContent className="flex items-start gap-3 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{tip.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card key={guide.href}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className={`h-5 w-5 ${guide.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{guide.title}</CardTitle>
                  </div>
                  <Link href={guide.href}>
                    <Button variant="ghost" size="sm" className="text-primary">
                      Mở <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guide.sections.map((section, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                      <span className="leading-relaxed">{section}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <Sparkles className="h-8 w-8 text-primary" />
          <p className="text-lg font-semibold">Sẵn sàng bắt đầu?</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Nhấn "Tạo lịch tự động" trong trang Tự học để hệ thống tạo kế hoạch học tập tối ưu cho bạn ngay hôm nay.
          </p>
          <Link href="/self-study">
            <Button className="mt-2">
              <GraduationCap className="h-4 w-4" />
              Đi đến Tự học
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
