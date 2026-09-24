# Study Planner — Frontend

Giao diện người dùng cho ứng dụng quản lý thời gian và kế hoạch tự học dành cho chủng sinh. Giao tiếp với backend API qua REST, không kết nối trực tiếp đến database.

## Tính năng

- **Dashboard** — Tổng quan hoạt động hiện tại, countdown đến hoạt động tiếp theo
- **Lịch hôm nay** — Timeline chi tiết các hoạt động trong ngày
- **Lịch tuần** — Xem lịch tổng quan theo tuần
- **Thời khóa biểu** — Quản lý lịch học cố định T2–T6
- **Tự học** — Smart Planner tự động tạo lịch tự học theo ưu tiên
- **Tiếng Anh** — Theo dõi 7 kỹ năng với mục tiêu tỷ lệ 50%
- **Nhật ký thiêng liêng** — 6 câu hỏi phản tỉnh, theo dõi chuỗi viết
- **Đọc sách** — Theo dõi tiến độ đọc, số trang/ngày
- **Luyện đàn** — Ghi nhận thời gian luyện tập
- **Thống kê** — Biểu đồ thời gian học, tỷ lệ tiếng Anh
- **Tổng kết tuần** — Phản tỉnh tuần, kế hoạch tuần tới
- **Cài đặt** — Tùy chỉnh giờ giấc, mục tiêu, thông báo
- **Hướng dẫn** — Trang hướng dẫn sử dụng + onboarding modal
- **Dark mode** — Hỗ trợ chế độ tối/sáng
- **Responsive** — Tối ưu cho cả mobile và desktop

## Công nghệ

| Công nghệ | Vai trò |
|-----------|---------|
| Next.js 13 (App Router) | Framework React, SSR/SSG |
| TypeScript | Ngôn ngữ lập trình |
| Tailwind CSS | Styling |
| shadcn/ui + Radix UI | Component library |
| Recharts | Biểu đồ thống kê |
| Lucide React | Icons |
| date-fns | Xử lý ngày tháng |

## Cấu trúc thư mục

```
frontend/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (AuthProvider + AppShell + Onboarding)
│   ├── page.tsx                # Dashboard
│   ├── login/page.tsx          # Đăng nhập / Đăng ký
│   ├── today/page.tsx          # Lịch hôm nay
│   ├── calendar/page.tsx       # Lịch tuần
│   ├── schedule/page.tsx       # Thời khóa biểu
│   ├── self-study/page.tsx     # Tự học (Smart Planner)
│   ├── english/page.tsx        # Tiếng Anh
│   ├── journal/page.tsx        # Nhật ký thiêng liêng
│   ├── books/page.tsx          # Đọc sách
│   ├── instrument/page.tsx     # Luyện đàn
│   ├── statistics/page.tsx     # Thống kê
│   ├── weekly-review/page.tsx  # Tổng kết tuần
│   ├── settings/page.tsx       # Cài đặt
│   ├── help/page.tsx           # Hướng dẫn sử dụng
│   └── globals.css             # Global styles + Tailwind
│
├── components/
│   ├── auth-provider.tsx       # Context quản lý phiên đăng nhập
│   ├── app-shell.tsx           # Layout wrapper (bảo vệ route, sidebar)
│   ├── sidebar.tsx             # Thanh điều hướng
│   ├── user-menu.tsx           # Menu người dùng (đăng xuất)
│   ├── onboarding-modal.tsx    # Hướng dẫn nhanh khi đăng nhập lần đầu
│   ├── theme-provider.tsx      # Dark/light mode provider
│   ├── theme-toggle.tsx        # Nút chuyển dark/light
│   └── ui/                     # shadcn/ui components (60+ components)
│
├── hooks/
│   ├── use-app-data.ts         # Hook tải tất cả dữ liệu từ backend API
│   └── use-toast.ts            # Toast notifications
│
├── lib/
│   ├── api.ts                  # API client + auth (gọi backend REST API)
│   ├── scheduler.ts            # Logic Smart Planner (tạo lịch tự học)
│   ├── constants.ts            # Hằng số (màu sắc, nhãn, cấu hình)
│   ├── types.ts                # TypeScript interfaces cho database tables
│   └── utils.ts                # Tiện ích (cn, formatDate, v.v.)
│
├── public/
│   ├── icon.svg                # App icon
│   └── manifest.json           # PWA manifest
│
├── next.config.js              # Next.js config
├── tailwind.config.ts          # Tailwind theme
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies + scripts
├── .env.example                # Biến môi trường mẫu
└── .gitignore
```

## Biến môi trường

Sao chép `.env.example` thành `.env` và điền giá trị:

```bash
cp .env.example .env
```

| Biến | Mô tả | Ví dụ |
|------|-------|------|
| `NEXT_PUBLIC_API_URL` | URL backend API | `http://localhost:3001/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase project | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) | `eyJ...` |

> `NEXT_PUBLIC_` prefix để biến có thể truy cập từ browser.

## Cài đặt và chạy

### Yêu cầu

- Node.js 18+
- npm 9+

### Chạy local

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env
cp .env.example .env
# Chỉnh sửa .env nếu cần thay đổi URL backend

# 3. Chạy dev server
npm run dev

# 4. Mở trình duyệt
# http://localhost:3000
```

### Build production

```bash
npm run build
npm start
```

### Kiểm tra TypeScript

```bash
npm run typecheck
```

## Deploy

### Netlify (khuyến nghị)

1. Push code lên GitHub
2. Vào [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Chọn repo, Netlify tự nhận diện Next.js
4. Thêm biến môi trường trong Netlify settings:
   - `NEXT_PUBLIC_API_URL` — URL backend production
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

### Vercel

1. Push code lên GitHub
2. Vào [vercel.com](https://vercel.com) → "Add New Project"
3. Chọn repo, Vercel tự nhận diện Next.js
4. Thêm biến môi trường (same as above)
5. Deploy

## Liên kết với Backend

Frontend gọi backend API qua `NEXT_PUBLIC_API_URL`. Backend xử lý:
- Đăng ký / đăng nhập (Supabase Auth)
- CRUD tất cả bảng dữ liệu (qua route `/api/:table`)
- Tải tất cả dữ liệu người dùng (route `/api/data`)
- Tạo dữ liệu mẫu khi đăng ký mới (route `/api/seed`)

Xem README của backend để biết cách chạy backend.

## Giấy phép

Dự án nội bộ, không phân phối công khai.
