## Round 1 - 2026-07-29T09:42:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `supabase/migrations/043_prevent_submit_without_prior_snapshot.sql`

### EFR Đã Chấp Nhận -> [EFR-01]: Kỳ lương hiện hành chưa được neo vào múi giờ nghiệp vụ | Sửa: Đã chuyển sang sử dụng `timezone('Asia/Ho_Chi_Minh', now())::date` để xác định ngày nghiệp vụ độc lập với session timezone của PostgreSQL.
### EFR Đã Chấp Nhận -> [EFR-02]: Nguồn `ngay_vao_cong_ty` của hồ sơ tuyển mới chưa được đặc tả | Sửa: Đã đặc tả cụ thể cách lấy ngày hiệu lực qua `COALESCE(NULLIF(v_emp_pending->>'ngay_vao_cong_ty','')::DATE, v_employee.ngay_vao_cong_ty)` cho hồ sơ tuyển mới.
### EFR Đã Chấp Nhận -> [EFR-03]: Quy tắc nhận diện `tuyen_moi` qua document chưa đủ xác định | Sửa: Thiết lập điều kiện so khớp chính xác sử dụng `EXISTS` kiểm tra `temp_uuid = p_temp_uuid AND document_type = 'tuyen_moi'` cùng fallback `employee_id` khi `p_temp_uuid` null.
### EFR Đã Chấp Nhận -> [EFR-04]: Test breakdown chưa chứng minh anti-drift guard không bị nới lỏng | Sửa: Mở rộng Task 2.1 thành ma trận test case đầy đủ bao gồm anti-drift, new hire start date, salary adjustments, timezone boundaries, document overrides, và các ranh giới ngày 25/26.
### EFR Đã Chấp Nhận -> [EFR-05]: Rollback chưa có baseline và tác vụ thực thi xác định | Sửa: Thiết lập baseline rollback chính xác là Migration 043. Thêm Phase 3 chi tiết trong FEATURE_TASKS.md để thực thi và verify rollback trên local DB.

## Round 2 - 2026-07-29T10:04:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `backend/src/services/employeeService.ts`, `backend/src/services/salaryService.ts`, `frontend/src/pages/PendingRoom/PendingRoomPage.tsx`

### EFR Đã Chấp Nhận -> [EFR-01 (Round 3)]: `p_temp_uuid` của salary document có thể che mất hồ sơ `tuyen_moi` | Sửa: Chuyển sang xác định hồ sơ tuyển mới (`v_is_new_hire`) bằng cách truy vấn xem có document loại `tuyen_moi` nào của nhân viên tồn tại trong bảng `employee_documents` hoặc kiểm tra xem nhân viên chưa từng có `change_history` (không phụ thuộc vào tham số `p_temp_uuid` truyền lên từ API).
### EFR Đã Chấp Nhận -> [EFR-02 (Round 3)]: Test ranh giới thời gian không thể chạy xác định với `now()` hiện tại | Sửa: Tách logic tính toán kỳ lương thành helper function `get_payroll_month(DATE)` để test trực tiếp ranh giới ngày 25/26 độc lập với đồng hồ hệ thống.
### EFR Đã Chấp Nhận -> [EFR-03 (Round 3)]: Rollback script chưa có path và có nguy cơ bị đặt vào migration auto-run | Sửa: Quy định rõ đường dẫn rollback là `database/rollbacks/044_refine_prior_snapshot_check.rollback.sql` nằm độc lập ngoài thư mục auto-run.

## Round 3 - 2026-07-29T10:15:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-01 (Round 5)]: Predicate `v_is_new_hire` mới biến hồ sơ tuyển cũ và employee không có history thành new hire | Sửa: Tinh chỉnh điều kiện xác thực hồ sơ tuyển mới chưa submit: Phải đồng thời thỏa mãn: đang ở trong phòng chờ (`state_phong_cho = true`), chưa có `change_history`, và tồn tại document `tuyen_moi` có `temp_uuid IS NOT NULL` (document chưa submit). Đồng thời bổ sung 2 test cases regression check cho nhân viên đã onboard cũ và nhân viên bulk-imported không lịch sử.

## Round 4 - 2026-07-29T10:18:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-01 (Round 7)]: Plan nhận diện được document tuyển mới nhưng chưa finalize/link đúng document đó | Sửa: Truy vấn và lấy riêng `v_new_hire_document_id` từ document `tuyen_moi` active khi `v_is_new_hire = true` để gán chính xác làm ngoại khóa cho `change_history` của thông tin nhân sự. Đồng thời nâng cấp câu lệnh finalize khi submit thành công để clear `temp_uuid = NULL` cho tất cả tài liệu pending của nhân sự đó, tránh việc document tuyển mới vẫn giữ `temp_uuid` sau submit. Thêm các assertions vào test case tương ứng.

## Round 5 - 2026-07-29T10:24:00+07:00

### Tổng kết
- EFR: 0 | SFR mới: 0 | Plan sửa: có (Loại bỏ bypass tương lai để bảo vệ luật nghiêm ngặt)
- Mode: normal
- Context loaded: Phản hồi của User

### Thay đổi -> Loại bỏ hoàn toàn cơ chế "Bỏ qua kỳ tương lai" ở Prior-period snapshot check. Giữ nguyên luật khóa kỳ lương nghiêm ngặt đối với mọi hồ sơ điều chỉnh (kể cả tương lai).
