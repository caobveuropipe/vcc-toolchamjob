# Feature Plan: Hủy thay đổi trong phòng chờ (Reject Pending Changes)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: [Đã qua review]
> **Feature slug**: reject-pending-changes
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, khi một nhân sự đang làm việc (Existing Employee) có các thay đổi về lương hoặc thông tin cá nhân, họ được đưa vào "Phòng chờ" với cờ `state_phong_cho = true`.
- **Vấn đề cần giải quyết:** Nếu người dùng muốn hủy bỏ các thay đổi này (không áp dụng nữa), hệ thống đang thiếu nút "Hủy" an toàn. Nút "Xóa vĩnh viễn" hiện có sẽ xóa sạch bản ghi nhân sự đó khỏi database, gây rủi ro mất dữ liệu cực lớn.
- **Mục tiêu:** Cung cấp cơ chế hủy bỏ các thay đổi đang chờ duyệt, đưa nhân sự về trạng thái "Live" bình thường mà không làm mất dữ liệu gốc.
- **Kết quả mong đợi:** Một nút "Hủy thay đổi" xuất hiện trong Phòng chờ dành riêng cho nhân sự cũ, khi bấm vào sẽ reset toàn bộ dữ liệu pending.

## 2. Phạm vi

### In scope
- SQL: Tạo Function `fn_reject_employee_pending` để reset trạng thái pending một cách atomic.
- Backend: Endpoint API để gọi hàm reject.
- Frontend: Thêm nút "Hủy thay đổi" cho nhân sự cũ VÀ giữ lại nút "Xóa vĩnh viễn" (với cảnh báo mạnh hơn) cho tất cả nhân sự trong Phòng chờ.
- Audit Log: Ghi nhận hành động hủy thay đổi.

### Out of scope
- Hủy từng phần thay đổi (chỉ hủy lương hoặc chỉ hủy thông tin) — Luồng này sẽ hủy toàn bộ session pending của nhân sự đó.
- Khôi phục lại các file đã upload (giữ nguyên file trong R2 hoặc xóa tùy theo thiết kế Cascade).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Tuân thủ cơ chế `state_phong_cho` và `pending_changes` (JSONB) đã định nghĩa trong `STATE_MACHINES.md`.
  - Sử dụng RPC SQL để đảm bảo tính Atomic (Reset cả Employee và Salary trong 1 transaction).
- **"Cấm kỵ" cần tránh:** 
  - KHÔNG được dùng lệnh `DELETE` lên bảng `employees` cho nhân sự cũ.
- **Ràng buộc kiến trúc liên quan:** 
  - Phải ghi Audit Log tương tự như luồng `submit`.

## 4. Giả định và câu hỏi mở

### Giả định
- Đối với nhân sự Tuyển mới (New Hire), nút "Xóa vĩnh viễn" vẫn giữ nguyên vì bản chất họ chưa có dữ liệu "Live" để quay về.

### Câu hỏi mở
- [Non-blocking] Có nên tự động xóa các file đính kèm liên quan đến session bị hủy không? (Quyết định tạm thời: Để DB Cascade xử lý hoặc giữ lại metadata trong Audit Log).

## 5. Acceptance Criteria

- [ ] RPC `fn_reject_employee_pending` hoạt động đúng: reset `pending_changes` = `{}`, `state_phong_cho` = `false`.
- [ ] Nhân sự sau khi bị Reject biến mất khỏi Phòng chờ và xuất hiện lại ở danh sách Nhân sự/Lương bình thường.
- [x] Nút "Hủy thay đổi" chỉ hiện cho `isNewHire === false`.
- [x] Nút "Xóa vĩnh viễn" hiển thị cho Super Admin/EA cho tất cả bản ghi (có Modal xác nhận phân biệt rõ với Hủy).
- [ ] Ghi Audit Log thành công với action `reject`.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/024_add_reject_pending_function.sql` | Tạo mới | Định nghĩa RPC reset pending | 🟢 | Có |
| `backend/src/services/employeeService.ts` | Sửa | Thêm hàm `rejectPendingChanges` | 🟢 | Có |
| `backend/src/routes/employeeRoutes.ts` | Sửa | Expose endpoint POST `/reject-pending` | 🟢 | Có |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Thêm UI nút Hủy thay đổi | 🟡 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo reset cả bảng `employees` và `salaries` đồng thời để tránh lệch trạng thái (ví dụ: Employee hết pending nhưng Salary vẫn còn).
- **Review focus areas:** Logic phân biệt `isNewHire` ở Frontend để không hiện nhầm nút Hủy cho nhân sự mới (vì nhân sự mới hủy xong sẽ không biết đi đâu).

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - Phase 1: Database & Backend (Atomic Reset logic).
  - Phase 2: Frontend UI & Integration.
- **Thứ tự triển khai:** Database -> Backend -> Frontend.
- **Yêu cầu migration / config / deploy:** Cần chạy migration SQL mới.

## 9. Test Strategy

- **Manual verification:** 
  - Tạo một thay đổi lương cho NS đang làm việc.
  - Vào phòng chờ, kiểm tra sự xuất hiện của nút "Hủy thay đổi".
  - Bấm Hủy, xác nhận modal.
  - Kiểm tra NS đó có về lại trạng thái Live không, dữ liệu cũ có còn nguyên không.
- **Data chuẩn bị:** 1 nhân sự `trang_thai = 'dang_lam'` có dữ liệu lương.

## 10. Rollback Plan

- Xóa RPC đã tạo và revert code Frontend.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
