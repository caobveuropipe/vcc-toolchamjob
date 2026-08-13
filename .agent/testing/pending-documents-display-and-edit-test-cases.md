# Kịch bản kiểm thử: Hiển thị và quản lý chứng từ đính kèm (pending-documents-display-and-edit)

## Scope
- Kiểm thử luồng tải chứng từ (Cloudflare R2 Presign / Metadata Finalize API).
- Kiểm thử hiển thị danh sách chứng từ đính kèm (Phòng chờ & Trang Chi tiết nhân sự).
- Kiểm thử phân quyền (SA, EA của khối, Reviewer, VA/VI).
- Kiểm thử cơ chế dọn dẹp R2 mồ côi và Lazy Sweep cleanup.

---

## 1. Happy Path Test Cases

### TC-DOC-01: EA Upload chứng từ tuyển mới khi tạo nhân sự nháp
- **Điều kiện**: Đăng nhập tài khoản EA. Vào form tạo nhân sự mới (`/employees/new`).
- **Các bước**:
  1. Chọn/chụp 1 file ảnh (PDF hoặc PNG < 5MB).
  2. Bấm upload.
- **Kỳ vọng**:
  - Client nén ảnh (nếu là ảnh), xin Presigned URL thành công.
  - PUT file lên R2 thành công, gọi POST `/api/documents` với `{ documentId }`.
  - Danh sách hiển thị file vừa upload với nhãn "Đã tải lên".
  - Nút **Lưu** trong `EmployeeForm` hết bị disabled (Hard-gate pass).

### TC-DOC-02: EA Xem và tải chứng từ đính kèm (Flow 2 bước)
- **Điều kiện**: Đăng nhập tài khoản EA hoặc Reviewer. Mở trang `/employees/:ma_nhan_su`.
- **Các bước**:
  1. Cuộn đến khối "Giấy tờ minh chứng đính kèm (chờ duyệt)".
  2. Bấm icon Mắt (Eye icon) tại 1 dòng tài liệu.
- **Kỳ vọng**:
  - Hệ thống gọi GET `/api/documents/:id` lấy `downloadUrl` ngắn hạn.
  - Trình duyệt tự mở tab mới hiển thị file an toàn mà không làm lộ URL R2 gốc.

### TC-DOC-03: EA Xóa chứng từ đính kèm
- **Điều kiện**: Đăng nhập tài khoản EA.
- **Các bước**:
  1. Bấm icon Thùng rác (Delete icon) tại tài liệu.
  2. Xác nhận Popconfirm "Xóa tài liệu này?".
- **Kỳ vọng**:
  - Hệ thống gọi `DELETE /api/documents/:id`.
  - Thực thi DB-first delete fail-closed atomic & ghi `recordAuditLogStrict`.
  - UI cập nhật danh sách ngay lập tức và thông báo "Đã xóa tài liệu".

---

## 2. Soft-gate & Hard-gate Policy Test Cases

### TC-DOC-04: Hard-gate khi tạo nhân sự / điều chuyển không chứng từ
- **Điều kiện**: Mở form tạo mới hoặc điều chuyển nhân sự (`EmployeeForm`).
- **Các bước**: Bỏ qua bước upload chứng từ, bấm **Lưu**.
- **Kỳ vọng**: Hệ thống chặn nộp, thông báo lỗi: "Vui lòng tải lên tài liệu tuyển dụng / quyết định điều chuyển trước khi tạo mới".

### TC-DOC-05: Soft-gate warning khi điều chỉnh lương không đính kèm file
- **Điều kiện**: Mở modal Cập nhật lương (`SalaryEditModal`).
- **Các bước**: Thay đổi lương nhưng không upload file chứng từ, bấm **Lưu vào phòng chờ**.
- **Kỳ vọng**:
  - Hiển thị dialog xác nhận: *"Bạn chưa tải lên tài liệu minh chứng"*.
  - Người dùng bấm nút **"Tôi hiểu, vẫn lưu"** -> Lưu thành công vào phòng chờ.

---

## 3. Negative & Security Test Cases

### TC-SEC-01: Chặn Presign API khi thiếu document_type (Zod Validation)
- **Các bước**: Bắn request trực tiếp `POST /api/documents/presign` thiếu trường `document_type`.
- **Kỳ vọng**: Server trả về `400 Bad Request` với thông báo lỗi validation.

### TC-SEC-02: Chặn Cross-actor Finalize API (Row-Derived Auth FIRST)
- **Các bước**: Actor B cố tình bắn `POST /api/documents` truyền `documentId` do Actor A vừa khởi tạo presign.
- **Kỳ vọng**: Server kiểm tra quyền của Actor B và trả về `403 Forbidden`.

### TC-SEC-03: Chặn Finalize file > 5MB qua S3 HeadObject Verification
- **Các bước**: Đăng ký presign file 2MB, nhưng cố tình PUT file 10MB lên R2 rồi gọi Finalize.
- **Kỳ vọng**: Server gọi S3 `HeadObject`, phát hiện `ContentLength > 5MB` hoặc lệch so với `size_bytes` đăng ký, từ chối và trả `400 Bad Request`.

### TC-SEC-04: Phân quyền truy cập chứng từ pending của VI/VA
- **Các bước**: Đăng nhập tài khoản có quyền VI/VA của khối. Mở trang chi tiết nhân sự đang ở phòng chờ.
- **Kỳ vọng**: Khối chứng từ chờ duyệt không hiển thị. Bắn API trực tiếp `GET /api/employees/:id/pending-documents` trả về `403 Forbidden`.
