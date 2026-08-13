## Round 1 - 2026-06-16T15:15:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `database/migrations/035_fix_missing_history_documents.sql` (line 1-297) để kiểm tra cấu trúc fn_create_employee_onboarding và submit_employee_pending.
  - `backend/src/services/changeHistoryService.ts` (line 1-81) để xem logic diffEmployeeFields.
  - `frontend/src/pages/Employees/EmployeeDetailPage.tsx` (line 560-585) để kiểm tra ReviewerCard rendering logic.

### EFR Đã Chấp Nhận -> [EFR-01]: Trùng số thứ tự file migration
- Sửa: Đổi tên file migration dự kiến từ `034_add_probation_reviewer_field.sql` thành `036_add_probation_reviewer_field.sql` trong `FEATURE_TASKS.md` để tránh trùng lặp với migration 034 và 035 hiện có.

### EFR Đã Chấp Nhận -> [EFR-02]: Thiếu cập nhật các hàm DB/RPC và hàm so sánh history
- Sửa: Bổ sung task cập nhật các hàm PostgreSQL `fn_create_employee_onboarding`, `submit_employee_pending` (thêm `nguoi_nghiem_thu_thu_viec` vào danh sách cột và field allowlist) và hàm `diffEmployeeFields` trong `changeHistoryService.ts`.

### EFR Đã Chấp Nhận -> [EFR-03]: Thiếu kế hoạch phân quyền/hiển thị ReviewerCard ở chi tiết nhân sự
- Sửa: Đưa `EmployeeDetailPage.tsx` vào danh sách file bị ảnh hưởng. Điều chỉnh render ReviewerCard ở trang chi tiết cho cả Viewer (chế độ chỉ đọc) và thêm kiểm tra quyền EA khối/SA ở phía Frontend trước khi hiển thị nút Edit/Save.

### EFR Đã Chấp Nhận -> [EFR-04]: Chiến lược test quá hẹp đối với live update nhạy cảm
- Sửa: Bổ sung các integration test cụ thể cho API route mới bao gồm: kiểm tra phân quyền (SA/EA cùng khối thành công, EA khác khối/VI/VA/reviewer thất bại 403), validation email hợp lệ, kiểm tra state_phong_cho giữ nguyên, ghi change_history và audit_log chính xác.

## Round 2 - 2026-06-16T15:24:50+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `packages/shared/src/schemas/employee.ts` để xem định nghĩa `updateEmployeeSchema`.
  - `backend/src/routes/employees.ts` để xem logic route generic update.
  - `backend/src/services/employeeService.ts` để xem logic hàm `updateEmployee` và `savePersonnelToPending`.

### EFR Đã Chấp Nhận -> [EFR-01 (Round 2)]: Route update generic có thể bỏ qua xác thực của route probation-reviewer chuyên biệt
- Sửa: Loại bỏ trường `nguoi_nghiem_thu_thu_viec` khỏi `updateEmployeeSchema` để route generic `PUT /employees/:id` và `PUT /employees/:id/personnel-pending` không nhận diện hoặc cập nhật trường này. Chỉ cho phép thiết lập qua luồng tuyển mới/onboard (`createEmployeeSchema`/`createEmployeeOnboardSchema`) và route chuyên biệt `PUT /employees/:maNhanSu/probation-reviewer` (với check quyền EA khối/SA chặt chẽ). Bổ sung các negative integration test để chứng minh các route generic không cho phép cập nhật trường này.

## Round 3 - 2026-06-16T16:51:35+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `database/001_schema.sql` (line 72-83, 209-212) để kiểm chứng ràng buộc định dạng email của bảng `employees` và `employee_reviewers`.

### EFR Đã Chấp Nhận -> [EFR-01 (Round 3)]: DB migration thiếu ràng buộc CHECK email cho trường mới
- Sửa: Cập nhật migration và plan yêu cầu thêm ràng buộc check định dạng email trực tiếp ở DB: `CHECK (nguoi_nghiem_thu_thu_viec IS NULL OR nguoi_nghiem_thu_thu_viec ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')`. Đồng thời thực hiện chuẩn hóa email (trim và lowercase) ở tầng API trước khi lưu DB. Bổ sung test kiểm thử DB constraint đối với email không hợp lệ.

## Round 4 - 2026-06-16T17:24:14+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `frontend/src/components/ReviewerCard.tsx` để xem logic hiển thị và thêm/xóa reviewer.
  - `backend/src/routes/employees.ts` để xem phân quyền của route `PUT /employees/:id/reviewers`.

### EFR Đã Chấp Nhận -> [EFR-01 (Round 4)]: Thiết kế ReviewerCard và API Route của official reviewers rộng hơn contract SA-only
- Sửa: 
  - Tách rõ 2 cờ phân quyền ở FE: `canManageOfficialReviewers` (chỉ SA) và `canEditProbationReviewer` (SA hoặc EA cùng khối). 
  - Tại `ReviewerCard`, phần NNT chính thức (Official Reviewers) sẽ ẩn hoàn toàn các nút gợi ý, thêm, xóa và chuyển thành chế độ readonly đối với tất cả tài khoản non-SA.
  - Cập nhật backend route `PUT /employees/:id/reviewers` kiểm tra nghiêm ngặt chỉ cho phép tài khoản SA thực thi.
  - Bổ sung integration test để kiểm chứng EA/reviewer/VI/VA không thể thay đổi danh sách NNT chính thức.

## Round 5 - 2026-06-16T17:37:24+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `backend/src/routes/employees.ts` (line 274-284) để kiểm tra route `GET /:id/suggest-reviewers`.
  - `backend/src/services/nntService.ts` để xem logic gợi ý NNT chính thức.

### EFR Đã Chấp Nhận -> [EFR-01 (Round 5)]: Endpoint gợi ý NNT chính thức chưa được siết thành SA-only
- Sửa: Cập nhật backend route `GET /employees/:id/suggest-reviewers` để chỉ cho phép Super Admin thực thi. Trong `ReviewerCard`, chỉ gọi API này và thực hiện check mismatch NNT chính thức khi `canManageOfficialReviewers` của user là true. Bổ sung integration test cho endpoint này (SA thành công, các vai trò khác nhận 403).

### EFR Đã Chấp Nhận -> [EFR-02 (Round 5)]: Thiếu assert bản ghi audit_log trong Test Strategy của route mới
- Sửa: Bổ sung task và nội dung Test Strategy để xác nhận API `PUT /employees/:maNhanSu/probation-reviewer` ghi đúng record vào `audit_log` với `actor_email` tương ứng, `target_ma_nhan_su` khớp và trường `details` mô tả rõ thao tác cập nhật `nguoi_nghiem_thu_thu_viec`.

## Round 7 - 2026-06-17T09:48:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` (line 120-205) để phân tích hành vi gọi API suggest-reviewers và gán reviewers trong wizard submit của non-SA.

### EFR Đã Chấp Nhận -> [EFR-OPEN-01]: PendingRoomPage gọi API gán và gợi ý NNT chính thức bị chặn bởi phân quyền SA-only mới
- Sửa: 
  - Đưa `PendingRoomPage.tsx` vào danh sách file bị ảnh hưởng.
  - Sửa logic submit ở FE: Nếu user đăng nhập không phải SA (`isSA` là false), khi click Submit sẽ bỏ qua NNT Wizard Modal (bỏ qua API gán/gợi ý NNT chính thức vốn đã được chuyển thành SA-only) và tiến hành submit hồ sơ trực tiếp. NNT chính thức sẽ do SA bổ sung sau.
  - Nếu user là SA, giữ nguyên wizard gợi ý và gán NNT trước khi submit.
  - Bổ sung manual verification để kiểm chứng luồng submit của EA không bị lỗi 403.

## Round 8 - 2026-06-17T09:58:24+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `backend/src/routes/employees.ts` (line 326-359) để kiểm tra logic validate NNT trong endpoint submit `/employees/:id/submit`.

### EFR Đã Chấp Nhận -> [EFR-01 (Round 8)]: Luồng submit trực tiếp của non-SA bị lỗi 400 tại Backend do thiếu NNT chính thức
- Sửa: Cập nhật API route submit của Backend `PUT /employees/:id/submit` để chỉ kiểm tra bắt buộc có NNT chính thức (hoặc flag `khong_co_nnt`) khi người submit là Super Admin (SA). Đối với EA/non-SA, bỏ qua bước kiểm tra NNT chính thức này để họ có thể submit hồ sơ thành công (SA sẽ gán NNT sau). Bổ sung các integration test chứng minh EA submit không có NNT thì thành công, còn SA submit không có NNT (và không gửi `khong_co_nnt`) thì nhận lỗi 400.
