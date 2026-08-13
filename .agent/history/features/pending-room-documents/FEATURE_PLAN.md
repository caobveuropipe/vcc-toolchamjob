# Feature Plan: Xem giấy tờ chưa submit trong Phòng chờ

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Đã được User phê duyệt và chỉ đạo triển khai
> **Feature slug**: pending-room-documents
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-25

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, trong Phòng chờ (Pending Room), các nhân sự có thay đổi chưa duyệt hoặc nhân sự mới có icon PDF đỏ (`FilePdfOutlined`) để hiển thị trạng thái "Có tài liệu đính kèm". Tuy nhiên, người dùng chưa thể click vào icon này để xem hoặc tải xuống các tài liệu đó, gây khó khăn cho việc kiểm tra hồ sơ trước khi bấm nút "Submit".
- **Vấn đề cần giải quyết:** Thiếu nút/liên kết trực quan để tải/xem các giấy tờ của đợt upload hiện tại nhưng chưa submit (gắn với `temp_uuid` hoặc mới onboard) trực tiếp từ danh sách Phòng chờ.
- **Mục tiêu:** 
  - Xây dựng API backend hỗ trợ lấy danh sách metadata tài liệu của đợt up hiện tại (chưa submit) theo mã nhân sự.
  - Cải tiến giao diện Phòng chờ ở frontend: Chuyển đổi icon PDF tĩnh thành một nút bấm tương tác (sử dụng Popover của Ant Design) để xem danh sách tài liệu và mở xem trực tiếp trong tab mới.
- **Kết quả mong đợi:** Người dùng có thể bấm vào biểu tượng tài liệu ở mỗi dòng nhân sự trong Phòng chờ, danh sách các tài liệu chưa submit hiện ra lập tức, click vào từng file để xem trực tiếp (qua signed URL của R2).

## 2. Phạm vi

### In scope
- **Backend:**
  - Thêm hàm `getPendingDocuments` trong [documentService.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/services/documentService.ts) để truy vấn tài liệu chờ submit theo `ma_nhan_su`. Tự động phân tách: query theo `employee_id` trực tiếp đối với onboarding nhân sự mới (TMP), hoặc query theo danh sách `_temp_uuid` lấy từ `employees.pending_changes` và `salaries.pending_changes` đối với nhân sự cũ có điều chỉnh.
  - Đăng ký endpoint `GET /api/employees/:id/pending-documents` trong [employees.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/routes/employees.ts) với kiểm tra phân quyền IDOR nghiêm ngặt.
  - Cập nhật `listEmployees` trong [employeeService.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/services/employeeService.ts) để fetch cả `salaries.pending_changes` và bảng `employee_documents` để hiển thị đúng icon PDF cho cả 2 trường hợp thay đổi thông tin/lương và onboarding mới.
  - Viết Integration Test cho API mới bao phủ đủ các case an toàn và phân quyền.
- **Frontend:**
  - Cải tiến cột hành động/icon tài liệu trong [PendingRoomPage.tsx](file:///d:/Project_VCC/Module_NhanSu_moi/frontend/src/pages/PendingRoom/PendingRoomPage.tsx).
  - Tích hợp component `Popover` của Ant Design quanh nút tài liệu: Gọi API lấy danh sách tài liệu chờ submit khi mở Popover, và gọi API `/api/documents/:id` để lấy signed URL mới nhất khi người dùng click vào file, tránh hết hạn link 180s.

### Out of scope
- Thay đổi logic upload/nén ảnh/OCR.
- Sửa đổi các tài liệu đã chốt/lịch sử cũ.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - Tôn trọng phân quyền theo khối và IDOR check. 
  - Sử dụng Presigned URL của R2 với thời hạn 180 giây để bảo mật thông tin nhạy cảm.
- **"Cấm kỵ" cần tránh:** 
  - ⛔ **KHÔNG** cho phép vai trò chỉ xem (`VI`, `VA`) lấy danh sách hoặc tải tài liệu. Chỉ có `Superadmin`, `EA` thuộc khối quản lý, hoặc `Reviewer` của nhân sự đó được phép truy cập.
  - Tránh trả về các file nháp stale/cũ bị hủy. Chỉ trả về tài liệu khớp với `_temp_uuid` đang có hiệu lực.

## 4. Giả định và câu hỏi mở

### Giả định
- Tài liệu của đợt thay đổi hiện tại được liên kết với `_temp_uuid` lưu trong trường `pending_changes` (cả employees và salaries). Khi submit, `submit_employee_pending` sẽ clear `temp_uuid` và chuyển thành tài liệu live chính thức.
- Đối với nhân sự mới tạo (TMP), tài liệu đính kèm có `temp_uuid` đã bị RPC set về `NULL`, nhưng vì là nhân sự nháp mới tạo nên tất cả tài liệu có `employee_id` khớp đều là tài liệu chờ submit.

### Câu hỏi mở
- *Không có.*

## 5. Acceptance Criteria

- [ ] Backend có endpoint `GET /api/employees/:id/pending-documents` trả về tài liệu đang chờ submit.
- [ ] Endpoint backend chặn tuyệt đối vai trò `VA`/`VI` bằng mã lỗi 403. Chỉ cho phép Superadmin, EA có quyền trên khối đó, hoặc Reviewer của nhân sự đó.
- [ ] Phân biệt được tài liệu của nhân sự mới (TMP) và tài liệu của nhân sự cũ có điều chỉnh (chỉ lấy tài liệu khớp với `_temp_uuid` của đợt thay đổi hiện tại, lọc bỏ stale drafts).
- [ ] Ở frontend, icon PDF đỏ trong phòng chờ trở thành nút tương tác dạng `Popover`. Bấm vào sẽ gọi API backend tải danh sách file (có loading spinner/empty state).
- [ ] Khi click vào một tài liệu trong Popover, frontend mở tab mới và gọi API `/api/documents/:id` để lấy downloadUrl fresh nhất, loại bỏ hoàn toàn rủi ro link hết hạn sau 180s.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [documentService.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/services/documentService.ts) | Sửa | Thêm hàm `getPendingDocuments` để fetch dữ liệu từ DB | 🟢 Thấp | Có |
| [employees.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/routes/employees.ts) | Sửa | Định nghĩa endpoint `GET /:id/pending-documents` | 🟢 Thấp | Có |
| [employeeService.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/services/employeeService.ts) | Sửa | Cập nhật `listEmployees` để fetch salary pending changes và docs map | 🟢 Trung bình | Có |
| [employee.test.ts](file:///d:/Project_VCC/Module_NhanSu_moi/backend/src/__tests__/integration/employee.test.ts) | Sửa | Bổ sung 4 test cases kiểm thử an toàn và phân quyền | 🟢 Thấp | Không |
| [PendingRoomPage.tsx](file:///d:/Project_VCC/Module_NhanSu_moi/frontend/src/pages/PendingRoom/PendingRoomPage.tsx) | Sửa | Cải tiến hiển thị tài liệu đính kèm từ tĩnh sang Popover động và download fresh URL | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Đảm bảo IDOR check chặt chẽ và không cho phép rò rỉ tài liệu nhạy cảm cho nhóm VA/VI.
- **Risk hotspots:** Rò rỉ thông tin giấy tờ nếu IDOR check bị bypass. Lấy sai tài liệu nháp cũ/stale. Lỗi hết hạn link URL.
- **Review focus areas:** Kiểm thử kỹ lưỡng logic phân tách TMP mới và nhân sự cũ điều chỉnh, đảm bảo không sót tài liệu và không lấy thừa tài liệu stale.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai một lượt do quy mô feature nhỏ và cô lập.
- **Thứ tự triển khai:**
  1. Cập nhật `listEmployees` trong `employeeService.ts`.
  2. Viết hàm nghiệp vụ trong `documentService.ts`.
  3. Bổ sung API route trong `employees.ts`.
  4. Viết và chạy test tích hợp backend (`employee.test.ts`).
  5. Cập nhật frontend `PendingRoomPage.tsx` để gọi API, hiển thị Popover và download fresh URL.
  6. Kiểm thử toàn diện frontend/backend trên môi trường local.

## 9. Test Strategy

- **Automated tests:** 
  - Viết test cases tích hợp trong `employee.test.ts` kiểm tra:
    - **Case 1:** Nhân sự mới onboard (TMP) có tài liệu (temp_uuid = NULL). Verify lấy được danh sách documents.
    - **Case 2:** Chỉ thay đổi lương (salary-only pending document). Verify lấy được tài liệu khớp với salary pending `_temp_uuid`.
    - **Case 3:** Tài khoản VI/VA bị chặn 403 khi gọi API.
    - **Case 4:** Các tài liệu stale draft (temp_uuid không khớp với pending_changes) không được trả về.
- **Manual verification:**
  - Kiểm thử giao diện Phòng chờ với các vai trò EA, VI/VA để xác nhận hiển thị và bảo mật đúng theo yêu cầu.

## 10. Rollback Plan

- Sử dụng Git checkout/revert để phục hồi trạng thái code cũ.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
