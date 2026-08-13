# Feature Tasks: API Backend Lấy Snapshot Chi Tiết Nhân Sự và Lương Target

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành

## Phase 1: Phát triển Backend API và Query Logic

**Mục tiêu:** Tạo function service và endpoint route để trả về chi tiết snapshot của tháng yêu cầu qua `x-api-key`.

- [x] Task 1.1: Tạo function `getSnapshotEmployeesDetail(thang: string)` trong `backend/src/services/snapshotService.ts`.
  - Parse chuẩn hóa `thang` (ví dụ `T6.2026` hoặc `T06.2026`) thành `YYYY-MM`.
  - Guard: monthNum phải nằm trong [1,12] — throw `INVALID_FORMAT` nếu ngoài phạm vi (FR-01).
  - Sử dụng Supabase client query dữ liệu từ `snapshot_employees` join với `snapshots` (`snapshots!inner`).
  - Lọc theo `snapshots.month = YYYY-MM` và `snapshots.snapshot_status != 'deleted'`.
  - Map dữ liệu trả về array các object; map `snapshot.month (YYYY-MM)` → `Tx.YYYY` cho trường `thang` (FR-07).
  - Null fields giữ nguyên trong response (FR-04).
- [x] Task 1.2: Tạo endpoint route GET `/api/snapshots/employees-detail` trong `backend/src/routes/snapshots.ts`.
  - Khai báo static route TRƯỚC các dynamic route `/:id`.
  - Validate header `x-api-key` khớp với `env.INTERNAL_API_KEY`.
  - Parse query parameter `thang` và gọi hàm `getSnapshotEmployeesDetail`.
  - Trả về `{ data: [] }` HTTP 200 khi không có snapshot (không trả 404) (FR-03).
  - Thêm `logger.info({path, ip, thang})` khi gọi thành công (FR-05).
  - Cập nhật Contract header `snapshots.ts` (FR-02).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Dry run biên dịch backend `pnpm run build` không lỗi.


## Phase 2: Integration Tests và Hoàn thiện

**Mục tiêu:** Đảm bảo API mới hoạt động ổn định và chính xác dưới các kịch bản thực tế.

- [x] Task 2.1: Viết integration tests trong `backend/src/__tests__/integration/snapshots.test.ts`.
  - Test case 1: Gọi thành công API với `x-api-key` hợp lệ và `thang` hợp lệ, kiểm tra cấu trúc JSON đủ 12 trường.
  - Test case 2: Gọi API thiếu `x-api-key` hoặc sai key, trả về `401 Unauthorized`.
  - Test case 3: Bảng test invalid `thang` — tất cả phải trả về `400 Bad Request` (EFR-03):
    - Thiếu query param `thang` → 400
    - Sai định dạng `2026-06` → 400
    - Tháng out-of-range `T0.2026` → 400
    - Tháng out-of-range `T13.2026` → 400
  - Test case 4a: Tháng không tồn tại trong DB → HTTP 200 `{ data: [] }` (EFR-01, không trả 404).
  - Test case 4b: Snapshot tồn tại nhưng `snapshot_status = 'deleted'` → HTTP 200 `{ data: [] }` — assert employee thuộc snapshot đó không xuất hiện (EFR-02).
- [x] Task 2.2: Chạy bộ test integration để kiểm chứng: `pnpm --filter backend test:integration`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - Bộ tests của backend pass 100%.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-07-25 10:20] | Phase 1 | Setup | Khởi tạo kế hoạch feature | done | |
| [2026-07-25 14:12] | Phase 1 | Task 1.1 | Bắt đầu cài đặt getSnapshotEmployeesDetail | start | |
| [2026-07-25 14:20] | Phase 1 | Task 1.1 | Hoàn tất cài đặt getSnapshotEmployeesDetail | done | |
| [2026-07-25 14:21] | Phase 1 | Task 1.2 | Hoàn tất tạo route GET /employees-detail | done | |
| [2026-07-25 14:22] | Phase 1 | Task 1.Final | Bắt đầu dry-run test build backend | start | |
| [2026-07-25 14:25] | Phase 1 | Task 1.Final | Build backend biên dịch thành công 100% | done | |
| [2026-07-25 14:26] | Phase 2 | Task 2.1 | Bắt đầu viết integration test | start | |
| [2026-07-25 14:30] | Phase 2 | Task 2.1 | Hoàn tất viết integration test | done | |
| [2026-07-25 14:31] | Phase 2 | Task 2.2 | Bắt đầu chạy integration tests | start | |
| [2026-07-25 14:35] | Phase 2 | Task 2.2 | Rerun integration tests thành công 100% | done | |
| [2026-07-25 14:36] | Phase 2 | Task 2.Final | Bắt đầu nghiệm thu Phase 2 | start | |
| [2026-07-25 14:38] | Phase 2 | Task 2.Final | User xác nhận nghiệm thu thành công | done | |
