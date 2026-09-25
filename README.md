# Study Planner Frontend

Giao diện web của Study Planner, xây dựng bằng Next.js App Router, TypeScript và Tailwind CSS. Ứng dụng cung cấp dashboard, lịch học, tự học, task, đọc sách, nhật ký, thống kê và các màn hình quản lý cá nhân.

## Yêu cầu

- Node.js 18 trở lên
- npm 9 trở lên
- Backend Study Planner đang chạy

## Cài đặt và chạy

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

Trước khi chạy, tạo file `.env.local` với nội dung:

Kiểm tra và build production:

```bash
npm run typecheck
npm run build
npm start
```

## Biến môi trường

Tạo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

`NEXT_PUBLIC_API_URL` là URL REST API của backend. Frontend dùng token đăng nhập để gọi các endpoint được bảo vệ.

## Các màn hình

| Route | Chức năng |
|---|---|
| `/` | Dashboard, tiến độ hôm nay, streak và lịch sử gần đây |
| `/today` | Timeline và đánh dấu phiên học hoàn thành |
| `/calendar` | Lịch theo tuần |
| `/schedule` | Tạo thời khóa biểu, hỗ trợ tuần chẵn/lẻ |
| `/self-study` | Smart Planner và phiên tự học |
| `/tasks` | Tạo, cập nhật, hoàn thành task |
| `/books` | Quản lý sách, tiến độ trang, lịch sử sách đã đọc và chi tiết sách |
| `/english` | Theo dõi các kỹ năng tiếng Anh |
| `/journal` | Nhật ký thiêng liêng |
| `/instrument` | Ghi nhận luyện đàn |
| `/courses` | Danh sách môn học |
| `/courses/[id]` | Chi tiết môn học, lịch, task và phiên học |
| `/statistics` | Thống kê học tập |
| `/weekly-review` | Tổng kết tuần |
| `/settings` | Cài đặt thời gian, mục tiêu và thông báo |
| `/help` | Hướng dẫn sử dụng |

Menu sidebar chứa các route chính và các môn học được bật `show_in_nav`.

## Luồng dữ liệu

`lib/api.ts` là lớp gọi REST API và quản lý token. `hooks/use-app-data.ts` tải dữ liệu tổng hợp từ `/api/data` để dùng chung giữa Dashboard, lịch, task và thống kê. Các thao tác cập nhật dùng cùng API client tương thích Supabase trong `lib/api.ts`; frontend không nên tự tạo logic phân quyền.

Luồng sử dụng khuyến nghị:

1. Đăng ký hoặc đăng nhập.
2. Hoàn tất onboarding và kiểm tra `/settings`.
3. Tạo thời khóa biểu, task và sách.
4. Vào `/self-study` để tạo kế hoạch tự học.
5. Đánh dấu phiên học/task/sách đã hoàn thành.
6. Kiểm tra tiến độ tại `/today`, `/` và `/statistics`.

## Cấu trúc thư mục

```text
frontend/
├── app/                 # Các route của Next.js App Router
├── components/          # AppShell, Sidebar, auth, onboarding, UI
├── hooks/               # use-app-data
├── lib/
│   ├── api.ts           # REST client và auth token
│   ├── scheduler.ts     # Smart Planner, timeline, streak
│   ├── constants.ts     # Nhãn tiếng Việt, màu và cấu hình
│   └── types.ts         # Kiểu dữ liệu ứng dụng
├── public/
├── package.json
└── next.config.js
```

## Quy tắc nghiệp vụ chính

- Task có thể đánh dấu hoàn thành trước hạn; hạn chỉ dùng để ưu tiên/lọc.
- Smart Planner ưu tiên task `pending` và `in_progress`.
- Phiên học hoàn thành dùng `actual_min` hoặc `planned_min` cho thống kê.
- Streak dựa trên `daily_progress.plan_completed`.
- Lịch `all`, `odd`, `even`, `biweekly`, `week_1_and_3`, `week_2_and_4` được lọc theo ngày hiện tại.
- Sách lưu tiến độ trang, trạng thái `reading/completed/paused`, tác giả, ngày bắt đầu, ngày dự kiến và ghi chú.

## Deploy

### Vercel hoặc Netlify

1. Chọn thư mục `frontend` làm project.
2. Đặt `NEXT_PUBLIC_API_URL` trỏ tới backend production.
3. Build command: `npm run build`.
4. Start command (nếu nền tảng yêu cầu): `npm start`.

Đảm bảo backend cho phép domain frontend trong `FRONTEND_URL` và CORS.
