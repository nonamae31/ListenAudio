## I. CORE REQUIREMENTS (Từ yêu cầu user — BẮT BUỘC thực hiện)

- **FE-001**: Đổi tên hiển thị/logo trang web thành "Listen Audio" trên toàn bộ Layout và Page.
- **FE-002**: Bổ sung input field ở giao diện Audio Player cho phép người dùng nhập trực tiếp timestamp (VD: `HH:MM:SS`) để nhảy nhanh đến vị trí mong muốn.
- **FE-003**: Tối ưu hóa logic lưu lịch sử: Chỉ lưu vị trí phát khi user Pause, Stop, hoặc trước khi Component bị unmount (thay vì interval 5-6s).
- **FE-004**: Bổ sung giao diện Playback History (modal hoặc section trên main page) hiển thị danh sách các audio đã nghe và vị trí timestamp cuối cùng, cho phép click để nghe tiếp.
- **FE-005**: Thêm nút "Xóa" cho từng item trong danh sách Playback History để người dùng dọn dẹp lịch sử.

## II. ENHANCEMENT PROPOSALS (Từ nghiên cứu — USER CHỌN)
> ⚠️ Phần này chứa các đề xuất cải tiến từ nghiên cứu internet.
> User có toàn quyền chọn ALL, SOME, hoặc NONE.
> Enhancement bị bỏ sẽ KHÔNG ảnh hưởng đến Core.

### 🔍 Nguồn nghiên cứu
- [Next.js Audio Player best practices]: Sử dụng Zustand persist & Global State trong RootLayout để giữ player state across navigation.
- [Modern Web UX timestamp UI]: UI-Patterns, Flowmapp, Think.design về Two-Way Timestamp interaction & Keyboard shortcuts.

### Danh sách Enhancement
| # | Enhancement | Mô tả | Lý do | Nguồn | Effort | Chọn? |
|---|---|---|---|---|---|---|
| E1 | Persistent Local History | Dùng `Zustand persist` middleware để lưu History list ở Client `localStorage` kết hợp đồng bộ DB, giúp list tải ngay lập tức không cần chờ API. | Theo kiến trúc Next.js App Router 2024, giảm tải render và query API cho client components. | [Best Practice 2024] | Nhỏ | ☐ |
| E2 | Clickable Timestamps (Two-Way UI) | Tự động quét mô tả audio (nếu có) tìm các chuỗi dạng `HH:MM:SS` và biến chúng thành link click được để tua ngay đến đó. | Chuẩn UX hiện đại (như YouTube), giúp người dùng không phải nhập tay nhiều lần. | [UX Patterns] | Trung bình | ☐ |
| E3 | MediaSession API | Tích hợp `navigator.mediaSession` để hiển thị tên audio, cho phép Play/Pause/Seek qua thanh điều khiển của hệ điều hành (Lock screen, Control Center). | Mang lại trải nghiệm native-like cho Web Audio Player. | [Best Practice 2024] | Nhỏ | ☐ |
| E4 | Persistent Layout Player | Đặt Component AudioPlayer tại `RootLayout` để người dùng có thể duyệt qua trang History/Home mà audio không bị ngắt quãng. | Khắc phục đặc thù unmount của App Router khi chuyển trang. | [Best Practice 2024] | Lớn | ☐ |
| E5 | Keyboard Accessibility | Hỗ trợ phím Space để Play/Pause, phím mũi tên Trái/Phải để tua nhanh (Skip 10s) cho Audio Player. | Đảm bảo tính tiếp cận (Accessibility) theo tiêu chuẩn web hiện đại. | [UX Patterns] | Nhỏ | ☐ |

## III. ARCHITECTURE (Thiết kế cho CORE + các ENHANCED đã duyệt)

### 1. Kiến trúc thư mục (File Structure)
- `app/layout.tsx`: Root Layout (cập nhật Web Name FE-001).
- `app/components/AudioPlayer/`:
  - `AudioPlayer.tsx`: Component chính (chứa audio tag).
  - `TimestampSeeker.tsx`: Component chứa ô input nhập HH:MM:SS (FE-002).
- `app/components/History/`:
  - `HistoryList.tsx`: Hiển thị danh sách lịch sử nghe (FE-004).
  - `HistoryItem.tsx`: Từng item, có nút xóa (FE-005).
- `app/store/useAudioStore.ts`: Zustand store quản lý state (History, Current Time) (FE-003, FE-004).

### 2. Quản lý trạng thái (State Management - Zustand)
- Khởi tạo store Zustand (Client-side) với chức năng lưu vị trí `currentTime`.
- **Logic FE-003**: 
  - Player sẽ trigger hàm `syncHistoryToDB()` chỉ ở các sự kiện: `onPause`, `onEnded`, và xử lý trong `useEffect` cleanup return function (khi unmount).

### 3. API Calls (Next.js Server Actions)
- `actions/history.ts`:
  - `saveAudioHistory(audioId, timestamp)`: Cập nhật vị trí nghe vào DB.
  - `getAudioHistory()`: Lấy danh sách cho UI FE-004.
  - `deleteAudioHistory(audioId)`: Xóa một record (FE-005).

### 4. Iron Laws Compliance Check
- **Iron Law 1 (Client/Server)**: Các component `AudioPlayer`, `HistoryList` bắt buộc có `'use client'` vì dùng `useState`/`useEffect` và DOM Events.
- **Iron Law 2 (Hydration)**: `HistoryList` sẽ được mount an toàn hoặc bọc trong hook để đảm bảo không bị lệch render lần đầu.
- **Iron Law 4 (Fetching)**: Sử dụng Server Actions cho các hàm thay đổi data (Save/Delete), `getAudioHistory` gọi trực tiếp trên Server Component nếu render từ server, hoặc dùng SWR cho list lịch sử hiển thị dạng Modal client-side.
- **Iron Law 3 & 5 (TypeScript & Convention)**: Sẽ áp dụng strict typing (không `any`), PascalCase component names, absolute import `@/`, và đảm bảo `page.tsx`/`layout.tsx` sử dụng Next.js metadata đúng chuẩn.
