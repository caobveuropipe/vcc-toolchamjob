# Rebuttal Log: pr8-pr9-verification-tests

## Round 1 - 2026-07-27T15:55:00+07:00

### Tổng kết
- EFR: 6 (accepted: 6, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `backend/vitest.integration.config.ts:1-32`, `backend/src/__tests__/integration/snapshots.test.ts:8-14`, `.agent/active/pr8-pr9-verification-tests/EXPERT_REVIEW.md:1-68`

### EFR Đã Chấp Nhận -> [EFR-01]: Chưa có chốt chặn thực thi bảo đảm integration test chỉ kết nối Supabase Local | Sửa: Bổ sung task 1.1 tạo setup file `vitest.integration.setup.ts` kiểm tra `SUPABASE_URL` thuộc `127.0.0.1:54321` / `localhost` và crash process nếu trỏ sang Cloud DB.
### EFR Đã Chấp Nhận -> [EFR-02]: Tiêu chí 100% branch coverage không thể đo bằng toolchain hiện tại | Sửa: Thay thế tuyên bố "100% branches" bằng Ma trận Branch Test Matrix cụ thể trong Acceptance Criteria & Tasks 1.3-1.4.
### EFR Đã Chấp Nhận -> [EFR-03]: Phase integration đang lặp lại coverage đã merge | Sửa: Bổ sung Gap Analysis so với `snapshots.test.ts` hiện tại, tập trung vào test cases còn thiếu (`x-api-key` sai/rỗng, route precedence, exact salary assertions).
### EFR Đã Chấp Nhận -> [EFR-04]: Task unit test "lọc deleted từ mock response" không khớp với service thực thi | Sửa: Đổi wording task unit test sang verify Supabase query builder `.neq('snapshots.snapshot_status', 'deleted')`, việc filter deleted end-to-end do Integration test đảm nhiệm.
### EFR Đã Chấp Nhận -> [EFR-05]: Acceptance "không regression 15 endpoints" chưa có ma trận chứng minh | Sửa: Thu hẹp acceptance về Route Precedence & Anti-collision giữa `/employees-detail` và `/:id`, kết hợp chạy toàn bộ integration suite sẵn có.
### EFR Đã Chấp Nhận -> [EFR-06]: Seed và cleanup chưa được thiết kế để test độc lập, phục hồi được | Sửa: Quy định Namespace fixture riêng `T12.2099` kết hợp `try/finally` cleanup trong `afterAll`.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-129` và `FEATURE_TASKS.md:1-60` (đã cập nhật hoàn toàn khớp với 6 EFR accepted).

---

## Round 2 - 2026-07-27T16:05:00+07:00

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md:1-134`, `FEATURE_TASKS.md:1-65`, `backend/src/services/snapshotService.ts:351-417`, `database/001_schema.sql:283-327`

### EFR Đã Chấp Nhận -> [EFR-07]: Test `undefined -> INVALID_FORMAT` không thể pass với code hiện tại | Sửa: Bỏ case `undefined` khỏi Unit test contract của service vì route HTTP layer đã validate `if (!thang)` trước khi gọi service.
### EFR Đã Chấp Nhận -> [EFR-08]: Safety Guard mới chỉ khóa Supabase URL, chưa cô lập full integration suite khỏi Upstash/external network | Sửa: Mở rộng Safety Guard dùng `new URL()` validation strict origin + mock `@upstash/redis` client trong test setup, bổ sung unit test riêng cho Safety Guard (task 1.2).
### EFR Đã Chấp Nhận -> [EFR-09]: Branch Matrix bỏ sót định dạng tháng ba chữ số mà regex hiện đang chấp nhận | Sửa: Thêm cases `T001.2024`, `T012.2024` vào Unit Test Matrix, bổ sung task 1.6 cho phép cập nhật regex thành `^T(0?[1-9]|1[0-2])\.\d{4}$` nếu bị lọt.
### EFR Đã Chấp Nhận -> [EFR-10]: Fixture `snapshots` chưa khai báo các cột bắt buộc sau migration | Sửa: Chốt đầy đủ Fixture Schema Contract trong task 2.4 với unique `khoi = 'TEST_FIXTURE_KHOI'`, `period_start`, `period_end`, `snapshot_status = 'locked'`, `ma_nhan_su` namespace riêng và thứ tự delete FK (`snapshot_employees` trước, `snapshots` sau).

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-134` và `FEATURE_TASKS.md:1-65` (đã cập nhật hoàn toàn khớp với 4 EFR Round 2 accepted).

---

## Round 3 - 2026-07-27T16:11:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md:1-148`, `FEATURE_TASKS.md:1-75`, `backend/src/services/snapshotService.ts:351-417`, `packages/shared/src/utils/date.ts:1-34`

### EFR Đã Chấp Nhận -> [EFR-11]: Regex remediation làm mất capture group của năm và phá valid requests | Sửa: Cập nhật regex remediation trong plan/tasks thành `^T(0?[1-9]|1[0-2])\.(\d{4})$` đảm bảo giữ đủ 2 capture groups (month = `match[1]`, year = `match[2]`).
### EFR Đã Chấp Nhận -> [EFR-12]: Fixture period dates không tuân thủ helper kỳ lương chuẩn | Sửa: Sửa Task 2.4 sử dụng helper `getPeriodDates('2099-12')` từ `@vcc/shared` để tính `period_start` (`2099-11-26`) và `period_end` (`2099-12-25`) đúng invariant nghiệp vụ.
### EFR Đã Chấp Nhận -> [EFR-13]: Cleanup chỉ ở `afterAll` chưa idempotent qua lần chạy bị gián đoạn | Sửa: Sửa Task 2.4 gọi `cleanupFixture()` ở CẢ `beforeAll` (preflight) lẫn `afterAll` (postflight), đảm bảo suite rerunnable 100% không lo lỗi unique constraint `(month, khoi)`.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-148` và `FEATURE_TASKS.md:1-75` (đã cập nhật hoàn toàn khớp với 3 EFR Round 3 accepted).

---

## Round 4 - 2026-07-27T16:16:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md:1-148`, `FEATURE_TASKS.md:1-75`, `backend/scripts/seed_dev_users.ts:1-113`

### EFR Đã Chấp Nhận -> [EFR-14]: Supabase Local harness chưa có provisioning contract để chạy được từ trạng thái sạch | Sửa: Bổ sung quy trình/task provisioning Local DB (task 2.1) nạp `database/001_schema.sql` + `database/migrations/` và chạy `ALLOW_DEV_SEED=true tsx backend/scripts/seed_dev_users.ts` để nạp các tài khoản auth `admin.dev@vccorp.vn` và `loi.admicro@gmail.com` trước khi chạy full integration suite.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-148` và `FEATURE_TASKS.md:1-78` (đã cập nhật hoàn toàn khớp với 1 EFR Round 4 accepted).

---

## Round 5 - 2026-07-27T17:51:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md:1-150`, `FEATURE_TASKS.md:1-85`, `backend/scripts/seed_dev_users.ts:1-113`

### EFR Đã Chấp Nhận -> [EFR-15]: Provisioning chạy trước safety guard và có thể seed nhầm Cloud DB | Sửa: Tích hợp Local URL Safety Check vào đầu `backend/scripts/seed_dev_users.ts` (task 1.2) để ngắt ngay nếu `SUPABASE_URL` không trỏ tới `127.0.0.1:54321`. Cập nhật lệnh seed thành cú pháp chuẩn PowerShell (`$env:ALLOW_DEV_SEED='true'; npx tsx backend/scripts/seed_dev_users.ts`) trong task 2.1.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-150` và `FEATURE_TASKS.md:1-85` (đã cập nhật hoàn toàn khớp với 1 EFR Round 5 accepted).

---

## Round 6 - 2026-07-27T17:55:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md:1-151`, `FEATURE_TASKS.md:1-86`, `package.json:1-50`

### EFR Đã Chấp Nhận -> [EFR-16]: PowerShell seed command chạy sai working directory và không có local credentials | Sửa: Thay đổi lệnh seed provisioning trong plan và tasks thành lệnh monorepo root `$env:ALLOW_DEV_SEED='true'; pnpm seed` (thực thi `pnpm --filter backend exec tsx scripts/seed_dev_users.ts`), đảm bảo CWD luôn ở `backend/` để load đúng `backend/.env.local`.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-151` và `FEATURE_TASKS.md:1-86` (đã cập nhật hoàn toàn khớp với 1 EFR Round 6 accepted).
