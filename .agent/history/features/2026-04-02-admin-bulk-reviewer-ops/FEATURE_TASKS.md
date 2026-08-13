# Feature Tasks: Admin Bulk Reviewer Operations

> **Trạng thái**: ✅ Hoàn thành (Cập nhật: Hỗ trợ chọn lọc một phần)
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-01

---

## Phase 1: Backend & Transaction Foundation

**Mục tiêu:** Cung cấp API Transaction và cơ chế validation quyền chặt chẽ.

- [x] Task 1.0: Tạo SQL Migration cho Postgres RPC
- [x] Task 1.1: Triển khai Middleware/Validator cho Bulk Op
- [x] Task 1.2: Thêm `GET /api/admin/reviewers/bulk-preview`
- [x] Task 1.3: Thêm `POST /api/admin/reviewers/bulk`
- [x] Task 1.Final: 🧪 Test & Verify Phase 1

## Phase 2: Frontend Implementation (Bulk Tab with Preview)

**Mục tiêu:** Cung cấp UI an toàn với bước Dry-run (xem trước).

- [x] Task 2.0: Cập nhật `frontend/src/services/adminService.ts` và `hooks/useAdmin.ts`
- [x] Task 2.1: Triển khai UI Flow trong `BulkReviewerOps.tsx`
- [x] Task 2.2: Mount và Polish UI Tab.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2

## Phase 3: Partial Selection Upgrade (Nâng cấp chuyển 1 phần)

**Mục tiêu:** Cho phép Admin chọn lọc nhân sự cụ thể trong danh sách Preview.

- [x] Task 3.0: Cập nhật Postgres RPC `bulk_update_reviewers` nhận `p_selected_ids`.
- [x] Task 3.1: Cập nhật Backend Service & Route để pass `selected_ids`.
- [x] Task 3.2: Cập nhật Frontend UI: Thêm bảng Preview kèm Checkbox selection.
- [x] Task 3.Final: 🧪 Verify: Chỉ chuyển những người được tích chọn.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-01 16:33 | Phase 2 | All Tasks | Hoàn thành Giao diện Tab Bulk Operations | done | |
| 2026-04-01 17:15 | Phase 3 | All Tasks | Nâng cấp hỗ trợ chọn lọc nhân sự (Partial Selection) | done | Done full-stack |
| 2026-04-01 17:15 | - | Final | Hoàn thành toàn bộ tính năng Admin Bulk Reviewer Ops | done | Sẵn sàng cho review/archive |
