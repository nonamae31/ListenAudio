# Handoff Report — Listen Audio Enhancement
**Sprint ID:** SPRINT-20260626-001 | **Date:** 2026-06-26 | **Status:** ✅ DELIVERED

## Executive Summary
Tính năng đổi tên web, tích hợp giao diện Tua tay (HH:MM:SS), quản lý danh sách Lịch sử (với tính năng xoá), và tối ưu gọi API Database đã hoàn tất. Quá trình kiểm thử Build thành công.

## Architecture Overview
- `layout.tsx`: Đổi Web Title (FE-001).
- `page.tsx`: 
  - Audio Player tích hợp Keyboard Events và sendBeacon API.
  - History UI tự load danh sách bản ghi và có nút xoá cho từng record / xoá tất cả.
- `api/audio/status/route.ts`:
  - Cho phép POST method để nhận tín hiệu `sendBeacon` khi người dùng ngắt trình duyệt.

## Files Delivered
| File Path | Component | Type |
|-----------|-----------|------|
| `src/app/page.tsx` | Trang chính (Player + History) | Client Component |
| `src/app/layout.tsx` | Layout gốc | Server Component |
| `src/app/api/audio/status/route.ts` | Route xử lý trạng thái audio | API Route |

## Setup Instructions
Chạy ứng dụng với:
```bash
npm run dev
```

## Manual UAT Testcases

- [ ] **TC-01: Giao diện Web Name**
  - Bước 1: Mở `http://localhost:3000/`
  - Bước 2: Quan sát tab title trình duyệt hiển thị "Listen Audio". Logo trên trang đổi thành "Listen Audio".
  - Kỳ vọng: Khớp 100%.

- [ ] **TC-02: Tua tay Timestamp**
  - Bước 1: Nhập link và phát.
  - Bước 2: Nhập "1:30" hoặc "01:30" vào ô "Chuyển đến mốc thời gian" rồi bấm "Đến".
  - Kỳ vọng: Audio tự động nhảy đến 1 phút 30 giây.

- [ ] **TC-03: Tối ưu lưu DB**
  - Bước 1: Mở F12 Network tab.
  - Bước 2: Nghe nhạc bình thường 10 giây. Không thấy API `/status` bị gọi.
  - Bước 3: Bấm nút Pause. API `/status` lập tức chạy và lưu vào DB thành công.

- [ ] **TC-04: UI Lịch sử**
  - Bước 1: Ở dưới trang chính sẽ hiện phần "Lịch sử nghe".
  - Bước 2: Xem các record lịch sử vừa chơi. Bấm thử vào một link cũ. Nhạc chuyển URL tương ứng.

- [ ] **TC-05: Xóa lịch sử**
  - Bước 1: Bấm nút Thùng rác (Xóa) cạnh 1 audio trong lịch sử.
  - Bước 2: Item đó biến mất khỏi UI. Bấm F5 thấy không còn.
  - Bước 3: Bấm nút "Xóa tất cả", tất cả item đều bay màu.
