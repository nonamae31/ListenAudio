## I. CORE REQUIREMENTS (Từ yêu cầu user — BẮT BUỘC thực hiện)
- **FE-001**: Fix Web Name / Logo thành 'Listen Audio'.
- **FE-002**: Thêm input nhập Timestamp (HH:MM:SS) vào Player UI để tua trực tiếp.
- **FE-003**: Optimize History Saving Logic: Chỉ lưu vị trí khi user pause, stop, hoặc unmount (thay vì polling mỗi 5-6s) để tránh DB overload.
- **FE-004**: Add Playback History UI: Hiển thị danh sách audio đã xem và timestamp cuối cùng trên trang chính.
- **FE-005**: Delete Individual History Record: Thêm nút xóa từng record trong danh sách History.

## II. ENHANCEMENT PROPOSALS (Từ nghiên cứu — USER CHỌN)
> ⚠️ Phần này chứa các đề xuất cải tiến từ nghiên cứu internet.
> User có toàn quyền chọn ALL, SOME, hoặc NONE.
> Enhancement bị bỏ sẽ KHÔNG ảnh hưởng đến Core.

### 🔍 Nguồn nghiên cứu
- Nguồn 1: Tìm kiếm Web về "localstorage vs SQLite history caching Next.js best practices 2024" (Dexie.js/IndexedDB vs LocalStorage).
- Nguồn 2: Tìm kiếm Web về "Audio custom timeline input Next.js App Router" (Component isolation, sendBeacon, Accessibility).
- Nguồn 3: Tìm kiếm Web về "Audio custom timeline input UX patterns" (Scrubbing preview, keyboard support).

### Danh sách Enhancement
| # | Enhancement | Mô tả | Lý do | Nguồn | Effort | Chọn? |
|---|---|---|---|---|---|---|
| E1 | Dùng IndexedDB (Dexie.js) thay vì LocalStorage | Lưu Cache frontend lịch sử bằng IndexedDB. Nó hoạt động bất đồng bộ, không làm đơ UI (jank) như LocalStorage, nhẹ nhàng hơn SQLite. | Theo chuẩn web hiện đại, LocalStorage chỉ dùng cho state siêu nhỏ. IndexedDB tối ưu nhất cho danh sách lịch sử. | Nguồn 1 | Trung bình | ☐ |
| E2 | Dùng `fetch` với cờ `keepalive` (hoặc `sendBeacon`) | Khi tắt browser/chuyển trang, component unmount, dùng cờ `keepalive` để API lưu timestamp không bị huỷ giữa chừng. | Đảm bảo không mất dữ liệu lịch sử ở giây cuối cùng trước khi user rời web. | Nguồn 2 | Nhỏ | ☐ |
| E3 | Hiển thị Tooltip Timeline (Scrubbing Preview) | Hover chuột lên thanh Timeline sẽ hiện thời gian tương ứng. | Là chuẩn UX quen thuộc trên các player hiện đại, giúp người dùng định hướng vị trí cần tua. | Nguồn 3 | Trung bình | ☐ |
| E4 | Hỗ trợ Keyboard Shortcuts & ARIA | Phím Mũi tên trái/phải để tua nhanh; gán `role="slider"` cho thanh timeline. | Cải thiện độ khả dụng (Accessibility/WCAG). Thanh tua âm thanh tự chế thường thiếu hỗ trợ bàn phím. | Nguồn 2 | Nhỏ | ☐ |
| E5 | Nút "Clear All" History | Thêm nút Xoá toàn bộ lịch sử trong giao diện History UI. | Bổ sung cho FE-005, giúp user dọn dẹp danh sách dài một cách nhanh chóng (Chuẩn UI History chung). | Kiến thức chuyên gia | Nhỏ | ☐ |

## III. ARCHITECTURE (Thiết kế cho CORE + các ENHANCED đã duyệt)

### 1. Phân Loại Components (Iron Law 1)
- **`'use client'` BẮT BUỘC**:
  - `components/player/audio-player.tsx`: Nơi gắn thẻ `<audio>` và quản lý state (`isPlaying`, `currentTime`).
  - `components/player/timestamp-input.tsx`: Chứa form nhập liệu HH:MM:SS.
  - `components/history/history-list.tsx`: Quản lý danh sách, xoá phần tử, sử dụng SWR để fetch data (FE-004, FE-005).
- **Server Components (Không có 'use client')**:
  - `app/layout.tsx` / Header gốc: Cập nhật brand name thành "Listen Audio" (FE-001).
  - Layout bao quanh History UI (nếu có) để fetch dữ liệu SEO/Metadata tĩnh.

### 2. Data Flow & Routing (Iron Law 2 & 4)
- **Xử lý lưu lịch sử (FE-003)**:
  - Ngừng setInterval. Bắt sự kiện trực tiếp trên `<audio onPause={handleSave} onEnded={handleSave} />`.
  - Trong `useEffect` của `audio-player.tsx`, return hàm cleanup thực thi `handleSave()` kèm logic Keepalive (E2) khi component unmount.
- **Fetch Data History (FE-004)**:
  - **NGHIÊM CẤM** dùng `useEffect` + `fetch`. PHẢI dùng `SWR` hoặc `React Query` trong `history-list.tsx` để lấy danh sách từ API `/api/history`.
- **Delete Record (FE-005)**:
  - Gọi API method DELETE (hoặc Server Action) -> sau đó gọi `mutate()` của SWR để update UI ngay lập tức.
- **Phòng tránh Hydration Mismatch**: Format ngày tháng (Last Watched) phải được render cẩn thận trong Client, ưu tiên format ở Server trả về `string` tĩnh hoặc dùng useEffect/suppressHydrationWarning để render ngày giờ thực (Iron Law 2).

### 3. TypeScript Conventions (Iron Law 3)
- Tuyệt đối không dùng `any`.
- Các Props cần interface rõ ràng, ví dụ:
```typescript
interface TimestampInputProps {
  onSeek: (timeInSeconds: number) => void;
}
interface HistoryRecord {
  id: string;
  audioUrl: string;
  lastPosition: number;
  updatedAt: string;
}
```
- Function bắt buộc có Explicit Return Type (`Promise<void>`, `JSX.Element`).
