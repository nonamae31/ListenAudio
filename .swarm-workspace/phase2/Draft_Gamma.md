## I. CORE REQUIREMENTS (Từ yêu cầu user — BẮT BUỘC thực hiện)
1. Cập nhật Tên Web/Logo thành "Listen Audio" (FE-001).
2. Thêm Input Timestamp cho phép seek tay định dạng HH:MM:SS (FE-002).
3. Tối ưu logic lưu lịch sử: chỉ lưu khi Pause, Stop, hoặc Unmount thay vì interval (FE-003).
4. Thêm UI Playback History: danh sách URL và timestamp đã nghe để resume (FE-004).
5. Cho phép xóa từng record trong Playback History (FE-005).

## II. ENHANCEMENT PROPOSALS (Từ nghiên cứu — USER CHỌN)
> ⚠️ Phần này chứa các đề xuất cải tiến từ nghiên cứu internet.
> User có toàn quyền chọn ALL, SOME, hoặc NONE.
> Enhancement bị bỏ sẽ KHÔNG ảnh hưởng đến Core.

### 🔍 Nguồn nghiên cứu
- Nghiên cứu từ web/Medium/Reddit: Khuyên dùng Context Provider ở layout.tsx để giữ state không bị reset khi chuyển trang (Next.js App router audio state persistence).
- Nghiên cứu UX & Common Features: Các tính năng phổ biến cho Web Audio Player hiện đại.

### Danh sách Enhancement
| # | Enhancement | Mô tả | Lý do | Nguồn | Effort | Chọn? |
|---|---|---|---|---|---|---|
| E1 | Global Persistent Mini Player | Đưa Audio Player Provider vào `layout.tsx` để nhạc tiếp tục chạy và giữ state khi navigate giữa các trang. | Best practice cho Next.js App Router (tránh reload page phá vỡ audio state). | Nghiên cứu web | Trung bình | ☐ |
| E2 | Unmount Sync với `sendBeacon` | Sử dụng `navigator.sendBeacon` thay cho `fetch` thông thường trong hàm cleanup của useEffect. | Đảm bảo lưu history thành công (FE-003) khi user đột ngột đóng tab/trình duyệt. | Nghiên cứu web | Nhỏ | ☐ |
| E3 | Media Session API | Tích hợp Media Session API (hiển thị metadata bài nhạc, nút play/pause) trên màn hình khóa điện thoại hoặc lock screen. | Chuẩn UX hiện đại cho ứng dụng audio/podcast. | Nghiên cứu UX | Nhỏ | ☐ |
| E4 | LocalStorage Cache | Lưu offline cache cho lịch sử nghe trước khi gọi API lưu lên database. | Tăng tính ổn định, phòng trường hợp network request thất bại vẫn có dữ liệu để retry. | Nghiên cứu UX | Nhỏ | ☐ |
| E5 | Playback Speed Control | Thêm control chỉnh tốc độ (1x, 1.25x, 1.5x) vào player. | Tính năng cơ bản có mặt ở 90% web player / podcast app. | So sánh tính năng | Nhỏ | ☐ |

## III. ARCHITECTURE (Thiết kế cho CORE + các ENHANCED đã duyệt)

### 1. Component Tree
- `app/layout.tsx` (Server Component)
  - `AudioProvider` / `Zustand Global Store` (Client Component - Đặt ở Root)
    - `Header` (Client) -> Đổi tên thành "Listen Audio" (FE-001)
    - `main` -> Page Content
    - `GlobalAudioPlayer` (Client) -> Nằm ngoài router để giữ state.
      - `TimestampSeekInput` (Client) -> Input HH:MM:SS (FE-002)
- `app/page.tsx` (Server Component)
  - `PlaybackHistoryUI` (Client Component) -> Fetch & hiển thị danh sách (FE-004)
    - `HistoryRecordItem` (Client)
      - `DeleteHistoryButton` (Client) -> Nút xóa (FE-005)

### 2. State Hierarchy (Dự kiến dùng Zustand/Context)
- `useAudioStore` (Global State):
  - **State**: `currentAudioUrl`, `isPlaying`, `currentTime`, `lastSyncedTime`.
  - **Actions**: `play()`, `pause()`, `seekTo(time)`, `syncHistoryToServer()`.
  - **Side-effects**: 
    - Khi `pause` hoặc `stop` → trigger `syncHistoryToServer`.
    - Khi component Audio Player unmount → trigger `syncHistoryToServer` qua sendBeacon (FE-003).

### 3. Type Definitions
```typescript
// types/audio.ts
export interface PlaybackHistoryRecord {
  id: string;
  audioUrl: string;
  lastTimestamp: number;
  updatedAt: string;
}

export interface SyncHistoryPayload {
  audioUrl: string;
  timestamp: number;
}
```

### Tuân thủ Iron Laws (Kiến trúc chuẩn Next.js App Router)
1. **Server/Client Boundaries**: Đặt `"use client"` chặt chẽ ở các component tương tác như `GlobalAudioPlayer`, `PlaybackHistoryUI`, trong khi Layout và Page chính vẫn là Server Components.
2. **State Persistence Navigation**: Chuyển State management của Audio ra khỏi Page, đặt tại Root Layout.
3. **Optimistic Updates**: Khi xóa history (FE-005), update cache danh sách history trên UI ngay lập tức trước khi chờ response từ Server Action.
4. **API / Mutations**: Các hành động FE-003, FE-005 sẽ dùng Next.js Server Actions hoặc API Routes an toàn.
5. **No Prop Drilling**: Dùng global store thay vì đẩy props từ Layout vào từng Page con.
