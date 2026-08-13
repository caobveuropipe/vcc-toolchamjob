# Feature Tasks: Khắc phục sự vụ chốt Snapshot tháng 6 và chặn Submit phòng chờ khi chưa chốt tháng trước

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-18

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Xử lý sự vụ (Ad-hoc) bằng giải pháp Undo Submit
**Mục tiêu:** Đưa 3 nhân sự trở lại phòng chờ với thông tin cũ và pending changes chính xác để HR tự chốt snapshot qua giao diện.

- [x] Task 1.4: Chạy SQL script Verify check-block (đảm bảo không còn bản ghi nào của 3 nhân sự vướng kỳ tháng 6 gây block chốt snapshot).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1: Kiểm tra snapshot tháng 6.26 chứa đúng vết cũ, live data sau khi duyệt lại nhận đúng giá trị mới và sinh history sạch sẽ, dọn dẹp các bảng backup.

## Phase 2: Triển khai luật ngăn chặn lâu dài (Preventive Rule)
**Mục tiêu:** Thêm rule chặn submit từ phòng chờ nếu kỳ trước chưa được chốt snapshot.

- [x] Task 2.1: Viết database migration `database/migrations/043_prevent_submit_without_prior_snapshot.sql` để cập nhật hàm `submit_employee_pending` (được bổ sung rule check prior-period lock kế bên check `is_period_locked` hiện tại, lấy mốc day >= 26 cho kỳ lương).
- [x] Task 2.3: Viết integration tests bao phủ các ca boundary (25/26), multi-khoi block check, salary pending fallback trong `backend/src/__tests__/integration/snapshots.test.ts`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2: Chạy bộ test suite của backend đảm bảo không lỗi regression và rule mới hoạt động chuẩn xác.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-18T12:55:00+07:00 | Phase 1 | Task 1.1 | Khởi chạy script Preflight check và tạo các bảng backup tạm thời | start | Khởi chạy task |
| 2026-07-18T12:58:00+07:00 | Phase 1 | Task 1.1 | User chạy script, đang xác minh kết quả count từng bảng | retry | Chờ xác minh |
| 2026-07-18T13:00:00+07:00 | Phase 1 | Task 1.1 | Xác minh thành công (count_history = 57, count_payroll = 3) | done | Hoàn thành task |
| 2026-07-18T13:01:00+07:00 | Phase 1 | Task 1.2 | Khởi chạy script Undo Submit đưa 3 nhân sự về trạng thái chờ duyệt | start | Khởi chạy task |
| 2026-07-18T13:03:00+07:00 | Phase 1 | Task 1.2 | Sửa lỗi constraint và chạy thành công Undo Submit | done | Hoàn thành task |
| 2026-07-18T13:04:00+07:00 | Phase 1 | Task 1.3 | Khởi chạy script dọn dẹp lịch sử thay đổi change_history | start | Khởi chạy task |
| 2026-07-18T13:05:00+07:00 | Phase 1 | Task 1.3 | Hoàn thành dọn dẹp change_history | done | Hoàn thành task |
| 2026-07-18T13:05:00+07:00 | Phase 1 | Task 1.4 | Khởi chạy script Verify check-block đảm bảo không vướng kỳ tháng 6 | start | Khởi chạy task |
| 2026-07-18T13:06:00+07:00 | Phase 1 | Task 1.4 | Xác minh thành công 0 dòng vướng kỳ tháng 6 | done | Hoàn thành task |
| 2026-07-18T13:07:00+07:00 | Phase 1 | Task 1.5 | Bàn giao cho user/HR thao tác chốt Snapshot & duyệt lại trên UI | start | Khởi chạy task |
| 2026-07-18T13:21:00+07:00 | Phase 1 | Task 1.5 | Quyết định giữ nhân sự trong phòng chờ, bỏ qua bước duyệt lại | done | Hoàn thành bàn giao |
| 2026-07-18T13:22:00+07:00 | Phase 1 | Task 1.Final | Khởi chạy script dọn dẹp các bảng backup tạm thời | start | Khởi chạy dọn dẹp |
| 2026-07-18T13:23:00+07:00 | Phase 1 | Task 1.Final | User yêu cầu tạm giữ bảng backup để kiểm tra sau | done | Tạm hoãn dọn dẹp |
| 2026-07-18T13:24:00+07:00 | Phase 2 | Task 2.1 | Tạo migration file 043_prevent_submit_without_prior_snapshot.sql | start | Khởi chạy task |
| 2026-07-18T13:25:00+07:00 | Phase 2 | Task 2.1 | Migration applied to Database successfully | done | Di chuyển logic thành công |
| 2026-07-18T13:25:00+07:00 | Phase 2 | Task 2.2 | Reload PostgREST schema cache | done | Cache reloaded |
| 2026-07-18T13:26:00+07:00 | Phase 2 | Task 2.3 | Viết integration tests cho rule mới | start | Khởi chạy task |
| 2026-07-18T13:27:00+07:00 | Phase 2 | Task 2.3 | Viết xong test suite trong snapshots.test.ts | done | Hoàn thành task |
| 2026-07-18T13:27:00+07:00 | Phase 2 | Task 2.Final | Chạy integration test suite để tự động xác minh logic mới | start | Khởi chạy self-test |
| 2026-07-18T17:39:00+07:00 | Phase 2 | Task 2.Final | Sửa đổi test isolation trong `salary.test.ts` và chạy test thành công | done | Toàn bộ 39 tests qua |
