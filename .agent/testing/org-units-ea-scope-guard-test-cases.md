# Test Cases: Phân Quyền Scope-Based EA Cho Danh Mục Tổ Chức (Org Units EA Scope Guard)

> **Feature slug**: `org-units-ea-scope-guard`
> **Ngày cập nhật**: 2026-08-05
> **File test tự động**: `backend/src/__tests__/integration/orgUnitsScope.test.ts` (7/7 Cases Pass)

---

## 1. Automated Integration Test Suite Matrix

| Stt | Tên Case Test | Loại | Mô tả kịch bản & Kỳ vọng (Expectations) | Trạng thái |
|---|---|---|---|---|
| 1 | **Case 1 (Line Global)** | Integration | User có quyền EA (hoặc SA) được phép tạo/sửa/đổi trạng thái `line_nhan_su` (Line Global); User VA/VI hoặc 0-EA bị từ chối 403 FORBIDDEN. | ✅ PASS |
| 2 | **Case 2 (Root Khối Rename & DB Invariants)** | Integration | Non-SA (EA) đổi tên Root Khối nhận 403; SA đổi tên Root Khối thành công (200 OK), verify DB đổi display `name` nhưng giữ nguyên machine key `code` & `khoi` (`Admicro`), `user_permissions` và `OrgUnitCascadingSelect` resolve đúng. | ✅ PASS |
| 3 | **Case 3 (Reparent Cross-Khối Subtree Update)** | Integration | EA reparent node cross-Khối nhận 403; SA reparent node cross-Khối thành công (200 OK), verify DB tự động cập nhật `khoi` của toàn bộ descendants subtree theo thứ tự top-down. | ✅ PASS |
| 4 | **Case 4 (DB RPC NULL Regression)** | Integration | Gọi trực tiếp `rpc_update_org_unit` với `p_actor_role = NULL` khi reparent cross-Khối bị ném ngoại lệ SQL `requires SA role`; với `p_actor_role = 'SA'` thành công. | ✅ PASS |
| 5 | **Case 5 (Non-leaf Status Conflict)** | Integration | Vô hiệu hóa đơn vị cha đang chứa đơn vị con active via `PATCH status` bị trả về HTTP 409 CONFLICT code `CONFLICT`. | ✅ PASS |
| 6 | **Case 6 (EA Scope Enforcement)** | Integration | EA Khối Admicro sửa node Admicro thành công (200 OK), nhưng sửa hoặc xóa node Khối KND nhận HTTP 403 FORBIDDEN code `FORBIDDEN`. Target node không tồn tại trả về 404. | ✅ PASS |
| 7 | **Case 7 (Dynamic Harness Test)** | Integration | Thay đổi `process.env.ORG_UNITS_MUTATION_MODE` động trong runtime: `sa_only` $\rightarrow$ Non-SA bị 403; `disabled` hoặc `invalid` $\rightarrow$ 100% callers nhận HTTP 503 Maintenance. | ✅ PASS |

---

## 2. Manual UI Verification Matrix

| Stt | Tên Kịch bản UI | Các bước thực hiện | Kết quả kỳ vọng trên UI | Trạng thái |
|---|---|---|---|---|
| 1 | **Tạo Đơn vị mới (Non-SA EA)** | Đăng nhập `loi.admicro@gmail.com` $\rightarrow$ Mở `/admin/org-units` $\rightarrow$ Bấm **Thêm Đơn vị Tổ chức**. | Option "Khối" bị ẩn khỏi dropdown Loại đơn vị; Dropdown Đơn vị cha chỉ hiển thị đơn vị thuộc Khối Admicro. | ✅ VERIFIED |
| 2 | **Kiểm tra Scope Guard trên cây 5 tầng** | Chuyển sang xem Khối `KND` bằng tài khoản `loi.admicro@gmail.com`. | Các nút Sửa (Cây bút), Vô hiệu hóa (Tích/Cấm), Cascade Deactivate, Xóa bị ẩn/disable 100%. | ✅ VERIFIED |
| 3 | **Bảo vệ Status Node Cha** | Bấm menu 3 chấm trên một BU/Phòng ban đang có con active $\rightarrow$ Chọn **Vô hiệu hóa**. | Hiển thị thông báo lỗi HTTP 409 CONFLICT yêu cầu dùng chức năng Cascade Deactivate. | ✅ VERIFIED |
| 4 | **Đổi tên Root Khối (SA)** | Đăng nhập `admin.dev@vccorp.vn` $\rightarrow$ Sửa tên Root Khối `Admicro` thành `Khối Truyền thông Admicro`. | Tên hiển thị đổi trên cây danh mục; Form Nhân sự chọn Khối vẫn load danh sách phòng ban chính xác. | ✅ VERIFIED |
