# Feature Tasks: Quản trị viên Dọn dẹp dữ liệu (Admin Cleanup Dashboard)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-13

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Backend - Bulk Delete API & Service

- [x] Task 1.1: Tạo SQL migration cho RPC `fn_bulk_hard_delete_employees`.
    - Input: `p_ma_nhan_sus VARCHAR[]`, `p_actor_email TEXT`.
    - Logic: 
        1. Thu thập `object_key` từ `employee_documents` thông qua: `employee_id` khớp VÀ `temp_uuid` nằm trong `pending_changes` (JSONB) của cả hai bảng `employees` và `salaries`.
        2. Insert `audit_log` (action='delete', detail.type='bulk_hard_delete_baseline') chứa `ma_nhan_sus`, `r2_keys`.
        3. Delete employees (cascade).
        4. Trả về mảng `r2_keys` cho service.
- [x] Task 1.2: Cập nhật `@vcc/shared` thêm Zod schema cho bulk delete và admin list filtering.
- [x] Task 1.3: Thêm các Admin Routes trong `backend/src/routes/admin.ts`:
    - `GET /cleanup/employees`: Trả về danh sách tinh gọn (Live + Pending).
    - `POST /cleanup/employees/bulk-hard-delete`: Gọi service xóa hàng loạt.
    - Cả hai bắt buộc dùng `requireSuperAdmin` và `sensitiveRateLimiter`.
- [x] Task 1.4: Implement service logic `bulkHardDeleteEmployeesAdmin`.
    - Gọi RPC -> Nhận mảng `r2_keys`.
    - Loop xóa file R2 (try-catch từng file).
    - Bắt buộc: Nếu có lỗi xóa R2, ghi Audit Log (action='delete', details.type='bulk_hard_delete_r2_failure') chứa `failed_r2_keys`.
- [x] Task 1.5: Viết Integration Test bao phủ các case: SA fetch, Bulk delete, R2 cleanup, Validation.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Frontend - Cleanup Dashboard Tab

**Mục tiêu:** Giao diện trực quan cho SA thực hiện lọc và chọn dữ liệu dọn dẹp.

- [x] Task 2.1: Tạo component `CleanupTab.tsx` trong `frontend/src/pages/Admin/tabs/`.
- [x] Task 2.2: Implement bảng danh sách nhân sự dọn dẹp (MOCK, ONB, TMP).
- [x] Task 2.3: Implement logic gọi API bulk delete kèm Modal xác nhận nâng cao.
- [x] Task 2.4: Hiển thị thông báo kết quả (Success/Error notification) sau khi xóa.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

## Phase 3: Hoàn thiện & Tài liệu

**Mục tiêu:** Chốt tài liệu và bàn giao.

- [x] Task 3.1: Cập nhật `USER_MANUAL.md` về tính năng dọn dẹp cho SA.
- [x] Task 3.2: Chốt changelog và archive feature.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-05-13 10:50] | [Plan] | [Setup] | Khởi tạo kế hoạch và danh sách task | done | Sẵn sàng cho review |
| [2026-05-13 11:58] | Phase 1 | Task 1.1 | Bắt đầu tạo SQL migration cho RPC xóa hàng loạt | start | Đang triển khai |
| [2026-05-13 12:05] | Phase 1 | Task 1.1 | Hoàn thành SQL migration 028 | done | |
| [2026-05-13 12:05] | Phase 1 | Task 1.2 | Cập nhật shared schema cho bulk delete | start | |
| [2026-05-13 12:08] | Phase 1 | Task 1.2 | Hoàn thành Zod schemas | done | |
| [2026-05-13 12:08] | Phase 1 | Task 1.3 | Thêm Admin Cleanup Routes | start | |
| [2026-05-13 12:11] | Phase 1 | Task 1.3 | Hoàn thành Admin Routes | done | |
| [2026-05-13 12:11] | Phase 1 | Task 1.4 | Implement adminCleanupService | start | |
| [2026-05-13 12:17] | Phase 1 | Task 1.4 | Hoàn thành cleanup service logic | done | |
| [2026-05-13 12:17] | Phase 1 | Task 1.5 | Viết Integration Test cho Admin Cleanup | start | |
| [2026-05-13 12:25] | Phase 1 | Task 1.5 | Hoàn thành Integration Test | done | |
| [2026-05-13 12:25] | Phase 1 | Task 1.Final | Chạy test & verify Phase 1 | start | |
| [2026-05-13 12:38] | Phase 1 | Task 1.Final | Đã tự test thành công các logic Fetch, Filter, Validation. | done | |
| [2026-05-13 12:41] | Phase 1 | Task 1.Final | User đã chạy SQL 028. Integration Test PASSED. | done | Hoàn thành Phase 1. |
| [2026-05-13 12:41] | Phase 2 | Task 2.1 | Hoàn thành CleanupTab UI & Integration | done | |
| [2026-05-13 12:48] | Phase 2 | Task 2.2-2.4 | Hoàn thành logic Filter & Modal Delete | done | |
| [2026-05-13 12:41] | Phase 2 | Task 2.Final | User confirm UI hiển thị dữ liệu OK. | done | Hoàn thành Phase 2. |
| [2026-05-13 12:43] | Phase 3 | Task 3.1 | Hoàn thành cập nhật USER_MANUAL.md | done | |
| [2026-05-13 12:44] | Phase 3 | Fix UI | Sửa các cảnh báo deprecated và lỗi console UI | done | antd Modal, Alert, Text |
| [2026-05-13 12:45] | Phase 3 | Task 3.2 | Hoàn thành cập nhật Changelog (BE, FE, DB) | done | |
| [2026-05-13 12:45] | Phase 3 | Task 3.Final | Chốt verify Phase 3 và đề xuất archive | done | Hoàn thành toàn bộ feature. |
