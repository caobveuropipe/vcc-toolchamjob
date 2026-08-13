# Feature Plan: Admin Bulk Reviewer Operations (NS-004 Enhancement)

> **Trạng thái**: ⏳ CHỜ REVIEW
> **Review gate**: [Khuyến nghị gọi `feature-review`]
> **Feature slug**: admin-bulk-reviewer-ops
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-01

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống Admin (NS-004) chỉ hỗ trợ gán/xóa Reviewer cho từng nhân sự một.
- **Vấn đề cần giải quyết:** Khi một Reviewer nghỉ việc hoặc chuyển khối, Admin cần chuyển hàng loạt (bulk) nhân sự của họ sang một Reviewer mới. Việc làm tay từng người rất tốn thời gian và dễ sai sót.
- **Mục tiêu:** Cung cấp công cụ cho Super Admin thực hiện các thao tác hàng loạt trên phân quyền Reviewer thông qua Database Transactions (nguyên tử).
- **Kết quả mong đợi:** Một tab mới "Bulk Operations" hỗ trợ Transfer/Copy/Remove hàng loạt với bước **Xem trước (Preview)** an toàn.

## 2. Phạm vi

### In scope
- API hỗ trợ bulk operations trên bảng `employee_reviewers`.
- UI Tab "Bulk Operations" trong Admin Dashboard.
- Các chức năng cụ thể:
    - **Transfer**: Chuyển (toàn bộ hoặc một phần) nhân sự từ Reviewer A sang Reviewer B.
    - **Copy**: Sao chép (toàn bộ hoặc một phần) nhân sự từ Reviewer A sang Reviewer B.
    - **Remove**: Gỡ Reviewer A khỏi nhân sự (toàn bộ hoặc một phần).
- Hỗ trợ **Chọn lọc nhân sự** trong bước Preview trước khi thực hiện Bulk.
- Kiểm tra tính hợp lệ của Reviewer mới (Bám sát PERMISSION_MATRIX: Phải là Super Admin hoặc có quyền EA/VA/VI trên khối tương ứng).

### Out of scope
- Bulk operation cho `user_permissions` (hiện tại chưa có nhu cầu cấp bách).
- Tự động hóa hoàn toàn việc resign (hiện tại vẫn cần Admin trigger thao tác thay thế).
- Hỗ trợ CSV Upload cho danh sách MA nhân sự tùy chỉnh (Phase sau nếu cần).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
    - Middleware `requireSuperAdmin` phục vụ bảo mật.
    - `invalidatePermissionCache` (Redis) cho mọi thay đổi.
- **"Cấm kỵ" cần tránh:** 
    - **KHÔNG** cho phép transfer nếu Reviewer đích không thuộc bảng `superadmins` VÀ thiếu quyền EA/VA/VI trên bất kỳ Khối nào của tập nhân sự (Bám sát PERMISSION_MATRIX).
    - **KHÔNG** thực hiện bulk bằng loop `await` ở BE; phải dùng Database Transaction (Postgres RPC).
- **Ràng buộc kiến trúc:** Tôn trọng cấu trúc bảng `employee_reviewers`.

## 4. Giả định và câu hỏi mở

### Giả định
- Mọi thao tác bulk sẽ được ghi thành **một** bản ghi Audit Log tổng hợp kèm list MA nhân sự bị ảnh hưởng để tránh làm rác database.
- Reviewer mới cần có quyền trên khối của các nhân sự đó (mặc dù họ có thể có nhãn "Mismatch" sau này nếu khối thay đổi).
- Bước **Preview** trên UI sẽ hiển thị bảng danh sách nhân sự kèm Checkbox để chọn lọc.


## 5. Acceptance Criteria

- [ ] Super Admin có thể xem **Preview** (số lượng nhân sự bị ảnh hưởng, thống kê Khối) trước khi thực thi.
- [ ] Backend **chặn cứng** (Error) nếu Reviewer mới không phải SA và thiếu quyền EA/VA/VI trên bất kỳ khối nào có trong tập nhân sự.
- [ ] Database Transaction (RPC) đảm bảo: Tất cả đều thành công hoặc không bản ghi nào bị đổi.
- [ ] Audit Log lưu summary: "Bulk transfer from A to B for [LIST]".

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/services/adminService.ts` | Sửa | Thêm `bulkUpdateReviewers` | 🟡 Bulk DB op | Có |
| `backend/src/routes/admin.ts` | Sửa | Thêm route `/admin/reviewers/bulk` | 🟡 Rate limiting | Có |
| `frontend/src/services/adminService.ts` | Sửa | Cập nhật API wrapper | 🟢 | Có |
| `frontend/src/pages/Admin/tabs/BulkReviewerOps.tsx` | Tạo | Giao diện Tab mới | 🟢 | - |
| `frontend/src/pages/Admin/AdminDashboard.tsx` | Sửa | Thêm Tab 5 | 🟢 | - |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Bắt buộc chốt Postgres Function/RPC)
- **Risk hotspots:** Transaction integrity, Massive Redis invalidation.
- **Security Check:** Chặn đứng privilege escalation nếu Admin gán NS cho người chưa có bất kỳ quyền nào (EA/VA/VI) trên khối đó (Ngoại trừ SA). Tuân thủ rule: VI+Reviewer=EA.

## 8. Chiến lược triển khai

- **Phase strategy:** 
    - Phase 1: Postgres Function (RPC) & API Security Validation & Preview API.
    - Phase 2: UI Tab (Dry-run step) & Integration.
- **Yêu cầu migration / config / deploy:** Migration tạo Postgres function `bulk_update_reviewers`.

## 9. Test Strategy

- **Automated tests:** Integration test cho `bulkUpdateReviewers` với mock data nhiều nhân sự.
- **Manual verification:** Thao tác thực tế từ A sang B, kiểm tra bảng `employee_reviewers` và Audit Log.

## 10. Rollback Plan

- Restore backup bảng `employee_reviewers` nếu cần (hoặc dùng Audit Log để truy ngược nhưng khá khó).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
