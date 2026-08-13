# Test Cases - Tích hợp Người nghiệm thu chính thức vào Form và Phòng chờ duyệt

> Tạo ngày: 2026-06-18
> Liên kết feature: `employee-reviewer-field`
> Phạm vi: Feature / Permission / Integration

---

## 1. Mục tiêu kiểm thử

- Xác minh trường `Người nghiệm thu chính thức` (`reviewer_emails`) có thể chọn nhiều email và tự động gợi ý qua autocomplete.
- Kiểm tra tính năng phân quyền: chỉ SA/EA mới có quyền thay đổi danh sách người nghiệm thu.
- Xác minh luồng Sửa hồ sơ khi thay đổi người nghiệm thu sẽ đi qua phòng chờ duyệt (`/personnel-pending`), và khi phê duyệt thì dữ liệu đồng bộ chính xác vào bảng `employee_reviewers`.
- Kiểm tra bảo mật của endpoint gợi ý autocomplete `/api/employees/reviewer-options` không để leak dữ liệu hoặc bị lợi dụng bởi vai trò không hợp lệ.

## 2. Tiền điều kiện

- Database đã chạy migration `037_add_reviewer_form_integration.sql`.
- Tài khoản Test:
  - Super Admin (SA): `admin.dev@vccorp.vn`
  - EA Khối Admicro (EA): `loi.admicro@gmail.com`
  - EA Khối khác (EA): `loi.knd@gmail.com`
  - Reviewer/Viewer (VI): `reviewer.dev@vccorp.vn`

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Đăng nhập SA/EA, gõ từ 2 ký tự vào ô "Người nghiệm thu chính thức" | Danh sách gợi ý hiển thị đúng dạng `Tên <email> (Nguồn)` |
| HP-02 | EA gán NNT chính thức cho nhân viên mới và submit tạo | Nhân viên được tạo và bảng `employee_reviewers` được cập nhật tự động |
| HP-03 | EA sửa NNT chính thức của nhân sự | Dữ liệu chuyển qua phòng chờ `pending_changes.reviewer_emails` và hiện thông báo chờ duyệt |
| HP-04 | SA phê duyệt thay đổi (submit) của nhân sự ở phòng chờ | Dữ liệu `reviewer_emails` từ pending được đồng bộ vào bảng `employee_reviewers`, các bản ghi cũ bị xóa |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Sửa hồ sơ nhân sự mà không thay đổi `reviewer_emails` | Lưu bình thường (nếu là EA thì lưu nháp, nếu có chỉnh sửa reviewer thì scrub no-op để không báo lỗi) |
| RG-02 | Nhập chuỗi tìm gợi ý ngắn hơn 2 ký tự | Select dropdown trả về trống `[]` |

## 5. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Đăng nhập tài khoản Viewer/Reviewer cố tình truy cập endpoint `/reviewer-options` | Bị trả về lỗi 403 Forbidden |
| SC-02 | EA khối khác cố tình gửi request lưu pending thay đổi `reviewer_emails` cho nhân viên khối Admicro | Bị từ chối bằng lỗi 403 Forbidden |
