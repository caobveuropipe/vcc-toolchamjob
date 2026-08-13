# Feature Tasks: Xem giấy tờ chưa submit trong Phòng chờ

> **Trạng thái**: ✅ Đã hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Backend Endpoint & Service Logic

**Mục tiêu:** Xây dựng logic service và API endpoint bảo mật để lấy danh sách tài liệu chưa submit của nhân sự.

- [x] Task 1.1: Thêm hàm `getPendingDocuments` trong [documentService.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/services/documentService.ts) để truy vấn tài liệu chờ submit theo `ma_nhan_su` (phân tách luồng TMP mới và kiểm tra `_temp_uuid` cho nhân sự cũ).
- [x] Task 1.2: Đăng ký endpoint `GET /api/employees/:id/pending-documents` trong [employees.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/routes/employees.ts) với kiểm tra IDOR nghiêm ngặt (chỉ cho phép SA, EA khối, Reviewer; chặn 403 với VI/VA).
- [x] Task 1.3: Cập nhật hàm `listEmployees` trong [employeeService.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/services/employeeService.ts) để fetch `salaries.pending_changes` và `employee_documents` theo chunked query; tự động ẩn icon PDF (trả về `pending_document_uuid = null`) đối với tài khoản không có quyền xem tài liệu (VI/VA).
- [x] Task 1.4: Viết và bổ sung 4 kịch bản integration test (Case 1: Onboard TMP, Case 2: Salary adjustment, Case 3: Chặn VI/VA, Case 4: Lọc stale drafts) trong [employee.test.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/__tests__/integration/employee.test.ts).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc): Đảm bảo các test case tích hợp chạy thành công (`pnpm --filter backend test:integration`).

---

## Phase 2: Frontend Popover UI & Integration

**Mục tiêu:** Cải tiến UI Phòng chờ hiển thị Popover chứa danh sách tài liệu tải từ API backend.

- [x] Task 2.1: Sửa [PendingRoomPage.tsx](file:///d:/Project_VCC/Module_NhanSu_moi/frontend/src/pages/PendingRoom/PendingRoomPage.tsx): Tích hợp component `Popover` của Ant Design quanh icon `FilePdfOutlined`.
- [x] Task 2.2: Tích hợp logic fetch danh sách tài liệu khi mở Popover từ API backend `/api/employees/:id/pending-documents`.
- [x] Task 2.3: Thêm xử lý click cho từng tài liệu trong Popover: Gọi API `GET /api/documents/:id` để lấy fresh signed URL và mở tab mới (window.open), giải quyết triệt độ vấn đề hết hạn link 180s.
- [x] Task 2.4: Hiển thị giao diện danh sách file thân thiện trong Popover: có loading spin, error/empty state, icon PDF/Ảnh, tên file rút gọn.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc): Kiểm thử trực quan trên giao diện local với tài khoản EA (hiển thị và xem được tài liệu) và tài khoản VI/VA (không hiển thị icon tài liệu).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-05-25 18:00] | [Phase 1] | Setup | Khởi tạo kế hoạch | [done] | |
| [2026-05-25 18:25] | [Phase 1] | Task 1.1 | Bắt đầu triển khai service getPendingDocuments | [start] | |
| [2026-05-25 18:26] | [Phase 1] | Task 1.1 | Hoàn thành service getPendingDocuments | [done] | |
| [2026-05-25 18:26] | [Phase 1] | Task 1.2 | Bắt đầu khai báo route /:id/pending-documents | [start] | |
| [2026-05-25 18:27] | [Phase 1] | Task 1.2 | Hoàn thành khai báo route /:id/pending-documents | [done] | |
| [2026-05-25 18:27] | [Phase 1] | Task 1.3 | Bắt đầu cập nhật listEmployees hỗ trợ fetch salaries.pending_changes và documents map | [start] | |
| [2026-05-25 18:28] | [Phase 1] | Task 1.3 | Hoàn thành cập nhật listEmployees | [done] | |
| [2026-05-25 18:28] | [Phase 1] | Task 1.4 | Bắt đầu viết 4 integration test cases trong employee.test.ts | [start] | |
| [2026-05-25 18:43] | [Phase 1] | Task 1.4 | Hoàn thành viết và gỡ lỗi 4 kịch bản test tích hợp | [done] | |
| [2026-05-25 18:44] | [Phase 1] | Task 1.Final | Chạy toàn bộ test suite thành công | [done] | |
| [2026-05-25 18:50] | [Phase 2] | Task 2.1 | Bắt đầu tích hợp Popover UI ở PendingRoomPage.tsx | [start] | |
| [2026-05-25 18:55] | [Phase 2] | Task 2.1-2.4 | Hoàn thành Popover UI, fetch API, tích hợp popup blocker fix và tối ưu hoá giao diện | [done] | |
| [2026-05-25 18:56] | [Phase 2] | Task 2.Final | Build frontend thành công và hoàn tất kiểm thử | [done] | |
