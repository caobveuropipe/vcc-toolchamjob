# Test Cases - Bổ sung trường người nghiệm thu thử việc

> Tạo ngày: 2026-06-17
> Liên kết feature: `probation-reviewer-field`
> Phạm vi: Feature / Permission / Integration

---

## 1. Mục tiêu kiểm thử

- Xác minh trường `nguoi_nghiem_thu_thu_viec` được nhập và lưu trữ thành công khi onboard/tạo mới.
- Kiểm tra tính năng cập nhật trực tiếp (Live Update) trường mới hoạt động chính xác thông qua API chuyên biệt mà không ảnh hưởng trạng thái phòng chờ.
- Kiểm tra chặt chẽ phân quyền: chỉ SA/EA cùng khối mới được gán NNT thử việc; chỉ SA mới được gán/gợi ý NNT chính thức.
- Xác minh luồng submit phòng chờ đối với non-SA không bị chặn bởi kiểm tra NNT chính thức.

## 2. Tiền điều kiện

- Database đã chạy migration `036_add_probation_reviewer_field.sql`.
- Tài khoản Test:
  - Super Admin (SA): `admin.dev@vccorp.vn`
  - EA Khối Admicro (EA): `loi.admicro@gmail.com`
  - Normal User/Reviewer (VI): `reviewer.dev@vccorp.vn`

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Đăng nhập EA, vào màn hình Thêm mới nhân sự, điền email NNT thử việc và tạo mới | Bản ghi được lưu thành công vào phòng chờ, cột `nguoi_nghiem_thu_thu_viec` lưu đúng giá trị |
| HP-02 | EA vào trang chi tiết nhân viên thử việc thuộc khối của mình, gán email NNT thử việc trong Card | Cập nhật Live Update thành công, ghi change_history và audit_log, state_phong_cho không đổi |
| HP-03 | SA vào trang chi tiết nhân sự bất kỳ, thực hiện gán/xóa NNT chính thức và NNT thử việc | Cập nhật thành công |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | EA cập nhật email NNT thử việc dạng chữ hoa hoặc có khoảng trắng | Hệ thống tự động trim và chuyển về dạng chữ thường trước khi lưu |
| RG-02 | Nhập email NNT thử việc rỗng hoặc null | Hệ thống xóa NNT thử việc thành công (trả về null) |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Gửi email NNT thử việc sai định dạng qua API hoặc DB | Request bị từ chối với mã lỗi 400 hoặc DB Check Constraint báo lỗi |
| NG-02 | Cập nhật trường `nguoi_nghiem_thu_thu_viec` qua route generic `PUT /employees/:id` | Bị trả về lỗi Validation (400) do Zod schema loại trừ trường này |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | EA cố tình cập nhật NNT thử việc cho nhân sự thuộc Khối khác | Hệ thống chặn 403 Forbidden |
| SC-02 | Reviewer/VI cố tình gọi API cập nhật NNT thử việc | Hệ thống chặn 403 Forbidden |
| SC-03 | EA hoặc Reviewer gọi API gợi ý/gán NNT chính thức | Hệ thống chặn 403 Forbidden (chỉ cho phép SA) |
| SC-04 | EA submit nhân sự chưa gán NNT chính thức từ phòng chờ | Submit thành công, state_phong_cho chuyển sang false |
| SC-05 | SA submit nhân sự chưa gán NNT chính thức mà không chọn bypass | Submit thất bại với mã lỗi 400 |

## 7. Ghi chú regression

- Cần kiểm tra tab "Lịch sử thay đổi" xem nhãn tiếng Việt "Người nghiệm thu thử việc" có được map chính xác khi trường này biến động không.
