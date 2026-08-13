# Test Cases: Fix OCR Create Document Binding & Atomic Onboarding Hardening

> Feature Slug: `fix-ocr-create-document-binding`
> Ngày chốt: 2026-08-04
> Môi trường kiểm thử tự động: **Supabase Local Docker CLI Harness** (`127.0.0.1:54321`)

---

## 1. Happy Path Test Cases

### TC-01: Upload & Finalize Document -> Submit Onboarding Thành Công
- **Mục đích:** Đảm bảo khi file tải lên được finalize sang `upload_status = 'ready'`, UI cập nhật `hasBindableEvidence = true`, cho phép bấm nút "Tạo mới" submit thành công không bị báo lỗi toast thiếu tài liệu.
- **Tiền điều kiện:** Người dùng truy cập form Tạo mới nhân sự (`/employees/new`).
- **Các bước:**
  1. Tải lên 1 file giấy tờ tuyển dụng.
  2. Đợi nén ảnh và finalize metadata qua `POST /documents`.
  3. AI OCR tự động đọc và điền thông tin vào form.
  4. Bấm nút **Tạo mới**.
- **Kết quả mong đợi:**
  - Form submit thành công (HTTP 201 Created).
  - Record employee mới được tạo với đúng `temp_uuid`.
  - Document được gán `employee_id` và `temp_uuid` được clear về `NULL`.

---

## 2. Validation & Edge Cases

### TC-02: Chặn Submit Khi Upload Chưa Hoàn Tất (Status `uploading` / `reserved`)
- **Mục đích:** Đảm bảo nút Submit bị chặn và thông báo toast xuất hiện khi tài liệu chưa hoàn tất finalize.
- **Các bước:**
  1. Bắt đầu tải file giấy tờ tuyển dụng lên.
  2. Bấm nút **Tạo mới** ngay khi file vẫn đang ở trạng thái `uploading`.
- **Kết quả mong đợi:**
  - Nút Submit bị chặn với thông báo lỗi: *"Vui lòng tải lên tài liệu tuyển dụng trước khi tạo mới"*.
  - Không có HTTP request onboard nào được gửi lên server.

### TC-03: Reset Evidence State Khi Xóa File Duy Nhất
- **Mục đích:** Đảm bảo khi người dùng xóa file nháp vừa tải lên, `hasBindableEvidence` lập tức reset về `false`.
- **Các bước:**
  1. Tải lên file giấy tờ tuyển dụng hoàn tất.
  2. Bấm icon Xóa file nháp khỏi danh sách.
  3. Thử bấm nút **Tạo mới**.
- **Kết quả mong đợi:**
  - Form chặn submit hợp lệ với thông báo lỗi toast thiếu tài liệu.

---

## 3. Security & Concurrency Test Cases (Backend & DB)

### TC-04: Security Isolation — Direct RPC Execution Denial (42501)
- **Mục đích:** Đảm bảo RPC `fn_create_employee_onboarding` chỉ cho phép `service_role` gọi.
- **Các bước:**
  1. Sử dụng client `anon` gọi trực tiếp `supabase.rpc('fn_create_employee_onboarding', ...)`.
  2. Sử dụng client `authenticated` (token người dùng thông thường) gọi trực tiếp RPC trên.
- **Kết quả mong đợi:**
  - Cả 2 cuộc gọi trực tiếp đều bị PostgreSQL từ chối với mã lỗi `42501` (`permission denied`).

### TC-05: Single Transaction Clean Rollback Khi Đính Kèm File `reserved` Hoặc Sai Loại
- **Mục đích:** Đảm bảo DB rollback 100% sạch sẽ nếu RPC ném ngoại lệ do document claim thất bại.
- **Các bước:**
  1. Tạo 1 file chứng từ có `upload_status = 'reserved'` hoặc `document_type = 'khac'`.
  2. Gửi request `POST /api/employees/onboard` sử dụng `temp_uuid` của file này.
- **Kết quả mong đợi:**
  - Request bị reject với HTTP 400/409.
  - Assert DB: Không có employee row nào được tạo, không có salary row nào được tạo, document giữ nguyên trạng thái cũ.

### TC-06: Concurrent Double-Submit Lock (Race Condition Lock)
- **Mục đích:** Kiểm thử 2 request onboard đồng thời cạnh tranh cùng một `temp_uuid`.
- **Các bước:**
  1. Seed 1 file document `ready`.
  2. Gửi đồng thời 2 request `POST /api/employees/onboard` với 2 `ma_nhan_su` & `email` khác nhau nhưng cùng `temp_uuid`.
- **Kết quả mong đợi:**
  - Đúng 1 request thành công (HTTP 201 Created).
  - Request còn lại bị reject (HTTP 409/400 claim lock).
  - DB chỉ tạo duy nhất 1 employee record.

### TC-07: Replay Attack Rejection
- **Mục đích:** Đảm bảo `temp_uuid` không thể tái sử dụng sau khi đã consume.
- **Các bước:**
  1. Thực hiện submit thành công lần 1 với `temp_uuid` hợp lệ.
  2. Gửi tiếp request submit lần 2 bằng đúng `temp_uuid` đã consume đó.
- **Kết quả mong đợi:**
  - Request thứ 2 bị reject HTTP 400/409 với thông báo mã file không tồn tại hoặc đã được gán.

### TC-08: Salary `state_pending` Contract Verification
- **Mục đích:** Kiểm tra tính chính xác của cờ `state_pending` trong bảng `salaries`.
- **Các bước:**
  1. Gửi `POST /api/employees` (không chứa dữ liệu lương).
  2. Gửi `POST /api/employees/onboard` (chứa dữ liệu lương non-empty `salary: { luong_cb: 20000000 }`).
- **Kết quả mong đợi:**
  - Trường hợp 1: Row `salaries` được tạo có `state_pending = false`.
  - Trường hợp 2: Row `salaries` được tạo có `state_pending = true`.
