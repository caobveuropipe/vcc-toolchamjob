# Feature Tasks: Hủy thay đổi trong phòng chờ (Reject Pending Changes)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-06

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database & Backend Implementation

**Mục tiêu:** Cung cấp API atomic để reset trạng thái pending của nhân sự.

- [x] Task 1.1: Tạo migration `024_add_reject_pending_function.sql` định nghĩa RPC `fn_reject_employee_pending`.
- [x] Task 1.2: Thêm hàm `rejectPendingChanges` vào `backend/src/services/employeeService.ts`.
- [x] Task 1.3: Đăng ký route `POST /employees/:ma_nhan_su/reject-pending` trong `backend/src/routes/employeeRoutes.ts`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Sử dụng Postman/Curl gọi thử API và check DB).

## Phase 2: Frontend Implementation

**Mục tiêu:** Hiển thị nút "Hủy thay đổi" và tích hợp với API.

- [x] Task 2.1: Thêm hook `useRejectEmployeePending` trong `frontend/src/hooks/useEmployees.ts`.
- [x] Task 2.2: Cập nhật `renderActions` trong `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` để hiển thị nút "Hủy thay đổi" cho nhân sự cũ.
- [x] Task 2.3: Thêm Modal xác nhận trước khi thực hiện Hủy.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (End-to-end test từ UI).

## Phase 3: Audit & Cleanup

**Mục tiêu:** Đảm bảo log đầy đủ và dọn dẹp tài liệu.

- [x] Task 3.1: Kiểm tra bảng `audit_log` sau khi thực hiện Hủy.
- [x] Task 3.2: Cập nhật tài liệu `.agent/changelog/` nếu cần.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-06 | Phase 0 | Plan | Khởi tạo kế hoạch | done | |
| 2026-05-06 | Phase 1 | Task 1.1 | Bắt đầu tạo migration | start | |
| 2026-05-06 | Phase 1 | Task 1.1 | Tạo migration thành công | done | |
| 2026-05-06 | Phase 1 | Task 1.2 | Thêm hàm thành công | done | |
| 2026-05-06 | Phase 1 | Task 1.3 | Đăng ký route thành công | done | |
| 2026-05-06 | Phase 1 | Task 1.Final | Verify thành công | done | |
| 2026-05-06 | Phase 2 | Task 2.1 | Thêm hook thành công | done | |
| 2026-05-06 | Phase 2 | Task 2.2 | Cập nhật UI thành công | done | |
| 2026-05-06 | Phase 2 | Task 2.3 | Thêm Modal thành công | done | |
| 2026-05-06 | Phase 2 | Task 2.Final | Verify UI thành công | done | |
| 2026-05-07 | Phase 3 | Task 3.1 | Kiểm tra logic log thành công | done | |
| 2026-05-07 | Phase 3 | Task 3.2 | Cập nhật Changelogs thành công | done | |
| 2026-05-07 | Phase 3 | Task 3.Final | Hoàn tất feature | done | |
