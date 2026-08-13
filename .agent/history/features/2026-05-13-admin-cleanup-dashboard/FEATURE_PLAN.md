# Feature Plan: Quản trị viên Dọn dẹp dữ liệu (Admin Cleanup Dashboard)

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: [Đã thông qua phản biện hội đồng chuyên gia - Sẵn sàng triển khai]
> **Feature slug**: admin-cleanup-dashboard
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-13

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống có nhiều dữ liệu test (MOCK, ONB, TMP) lẫn lộn với dữ liệu thật. Việc xóa dữ liệu đang phải thực hiện qua SQL hoặc xóa từng người một trên UI, gây khó khăn cho Super Admin (SA) khi muốn dọn dẹp hệ thống.
- **Vấn đề cần giải quyết:** Thiếu giao diện tập trung để SA có thể lọc, chọn và xóa vĩnh viễn hàng loạt nhân sự (bao gồm cả nhân sự chính thức và nhân sự trong phòng chờ).
- **Mục tiêu:** Cung cấp tab "Dọn dẹp dữ liệu" trên Dashboard của SA với khả năng lọc thông minh và xóa hàng loạt an toàn.
- **Kết quả mong đợi:** SA có thể dọn dẹp nhanh tối đa 50 nhân sự test/mẫu chỉ trong vài click mà không làm ảnh hưởng đến dữ liệu thật.

## 2. Phạm vi

### In scope
- API Admin chuyên dụng: `GET /api/admin/cleanup/employees` (Lấy danh sách dọn dẹp) và `POST /api/admin/cleanup/employees/bulk-hard-delete` (Xóa hàng loạt).
- Sử dụng PostgreSQL RPC (`fn_bulk_hard_delete_employees`) để thực hiện xóa DB + Ghi Audit Log tập trung trong 1 Transaction.
- Thu thập toàn bộ file R2 liên quan đến cả `employee_id` và `temp_uuid` (cho hồ sơ pending).
- Giao diện Tab mới trên Admin Dashboard cho Super Admin với Modal xác nhận cấp độ cao (nhập text xác nhận).
- Tính năng lọc nhân sự thông minh và xóa hàng loạt (Max 50).

### Out of scope
- Xóa các bản ghi `change_history` mồ côi (giữ lại theo contract bảo toàn lịch sử của KB).
- Xóa các bản ghi Snapshots.
- Phục hồi dữ liệu sau khi đã xóa vĩnh viễn.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
    - [2026-03-13] Hybrid Security: Enforce SA role qua middleware.
    - [2026-03-13] Tính bất biến: `ma_nhan_su` là định danh chính.
    - [2026-05-04] TMP-based New Hire: Nhận diện nhân sự mới qua mã TMP.
- **"Cấm kỵ" cần tránh:** 
    - Tuyệt đối không để user không phải Super Admin (EA, VI, VA) thấy hoặc gọi được API này.
- **Ràng buộc kiến trúc liên quan:** 
    - Phải xóa file vật lý trên Cloudflare R2 để tránh lãng phí dung lượng. Cần thu thập object_key (bao gồm cả các file gắn với `temp_uuid` trong pending payload) trước khi xóa DB.
    - Sử dụng PostgreSQL RPC (`SECURITY DEFINER`) để thực hiện xóa DB + ghi Audit Log chứa danh sách object_keys ngay trong transaction để đảm bảo durable trail.
    - Auth Authoritative: Sử dụng middleware `requireSuperAdmin` (query DB tươi) cho cả hai endpoint admin mới.

## 4. Giả định và câu hỏi mở

### Giả định
- Super Admin là người duy nhất được phép truy cập tab này.
- Dữ liệu test chủ yếu được nhận diện qua tiền tố mã nhân sự hoặc email đặc thù.

### Câu hỏi mở
- [Non-blocking] Có nên tự động backup dữ liệu ra file Excel trước khi xóa vĩnh viễn không? (Tạm thời: Không, SA tự export nếu cần).

## 5. Acceptance Criteria

- [ ] SA có thể truy cập tab "DỌN DẸP DỮ LIỆU" trên Admin Dashboard.
- [ ] Danh sách hiển thị đầy đủ nhân sự (Live + Pending) thông qua endpoint chuyên dụng.
- [ ] Có thể lọc nhanh và chọn nhiều bản ghi qua checkbox.
- [ ] Backend thực hiện xóa DB atomic và ghi Audit Log Baseline chứa mảng ID và R2 keys.
- [ ] Xóa R2 best-effort; nếu lỗi, danh sách `failed_keys` được trả về FE và ghi Audit Log bổ sung kết quả R2.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/routes/admin.ts` | Sửa | Thêm admin cleanup routes | 🟡 | Có |
| `backend/src/services/employeeService.ts` | Sửa | Thêm logic fetch & bulk delete admin | 🔴 | Có |
| `frontend/src/pages/Admin/AdminDashboard.tsx` | Sửa | Thêm tab "Dọn dẹp dữ liệu" | 🟢 | Có |
| `frontend/src/pages/Admin/tabs/CleanupTab.tsx` | Tạo mới | UI chính cho tính năng | 🟢 | Chưa |
| `packages/shared/src/schemas/employee.ts` | Sửa | Thêm validation schema (mảng max 50 IDs) | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Bắt buộc)
- **Risk hotspots:** 
    - Logic xóa vĩnh viễn trên R2: Cần bọc try-catch từng file để không block DB delete; lưu vết failed keys vào Audit Log.
- **Review focus areas:** 
    - Đảm bảo RPC ghi Audit Baseline đầy đủ trước khi cascade xóa.
    - Modal xác nhận phía FE hiển thị đúng danh sách mã nhân sự sẽ bị xóa.
- **Known pitfalls / historical issues:** KB yêu cầu giữ `change_history`. Khi xóa nhân sự, mã nhân sự trong history sẽ bị NULL (SET NULL), đây là hành vi mong muốn để bảo toàn vết thay đổi trong quá khứ.

## 8. Chiến lược triển khai

- **Phase strategy:** 3 Phase
    - Phase 1: Backend API & Service (Hỗ trợ xóa hàng loạt + Unit Test).
    - Phase 2: Frontend UI (Cleanup Tab + Confirmation Modal).
    - Phase 3: Hoàn thiện tài liệu & Archive.
- **Thứ tự triển khai:** Backend trước -> Frontend sau.
- **Điểm cần phối hợp:** Dev cần test kỹ với R2 mockup hoặc dev bucket.
- **Yêu cầu migration / config / deploy:** Cần migration tạo RPC `fn_bulk_hard_delete_employees`.

## 9. Test Strategy

- **Automated tests:** 
    - Integration Test cho `bulkHardDeleteEmployees` bao phủ:
        - SA fetch list và delete thành công; Non-SA bị 403 (cả GET và POST).
        - Gửi 51 bản ghi trả về 400 (Bad Request).
        - Giả lập R2 failure -> Assert ghi nhận `failed_keys` vào Audit Log.
- **Manual verification:** 
    - SA đăng nhập -> Chọn nhân sự test -> Xóa -> Kiểm tra danh sách và R2.
- **Data / env chuẩn bị trước khi test:** Seed data mock qua script `seed-mock-data.ts`.

## 10. Rollback Plan

- Tính năng xóa vĩnh viễn (Hard Delete) không có rollback tự động. SA cần xác nhận kỹ qua Modal. Nếu lỡ tay, chỉ có thể khôi phục từ bản backup DB hàng ngày (GCP Cloud SQL backup).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
