# Test Cases - NS-002 Quản lý Tiền Lương

> Tạo ngày: 2026-04-07
> Liên kết feature: `phase-3-salary-crud`
> Phạm vi: Feature / Permission / Security

---

## 1. Mục tiêu kiểm thử

- Đảm bảo EA/SA có thể xem/sửa lương (vào pending).
- Đảm bảo Atomic Submit (Hồ sơ + Lương) hoạt động đúng qua RPC.
- Đảm bảo Reviewer có quyền sửa lương NS được gán.
- Đảm bảo VI bị chặn hoàn toàn truy cập dữ liệu lương.

## 2. Tiền điều kiện

- Account: EA (Admicro), VA (Admicro), VI (KND), SA (SuperAdmin), Reviewer (được gán NS cụ thể).
- Seed data: Employees đã có salary row (backfill done).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | EA mở trang Quản lý Lương, click cell để sửa lương | Cell hiển thị input, lưu thành công vào pending (có indicator). |
| HP-02 | EA mở Modal Điều chỉnh lương, upload chứng từ và lưu | PUT thành công, chứng từ được bind qua temp_uuid. |
| HP-03 | SA mở Phòng chờ, nhấn Submit cho NS có cả pending hồ sơ và pending lương | Cả 2 được apply atomic, History ghi nhận đủ 2 nhóm thay đổi. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Sửa lương cho NS đã nghỉ việc (`trang_thai = nghi_viec`) | EA bị chặn (403), SA được phép sửa. |
| RG-02 | EA Export Excel lương | File có watermark tên User + Thời gian + Khối. |
| RG-03 | Rate limit: Nhấn nút Export liên tục (>5 lần/phút) | Bị chặn bởi middleware Rate Limit (429). |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | EA khối A cố tình gọi API GET `/api/salaries/:ma_ns_khối_B` | Trả về 403 (IDOR Protection). |
| NG-02 | Reviewer cố tình sửa lương cho NS không thuộc danh sách gán | Trả về 403. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | VI truy cập trực tiếp URL `/salaries` | Redirect về Dashboard hoặc Error 403. |
| SC-02 | VI gọi API `/api/salaries` qua Postman | Trả về 403 bởi Middleware Permission. |
| SC-03 | VI xem lịch sử thay đổi của 1 nhân sự | Các records thay đổi lương bị ẩn (field, old, new value masked). |
| SC-04 | Kiểm tra API `/api/employees/:id`: VI có thấy `pending_changes` chứa lương không? | Không thấy (Cột `pending_changes` bị strip bởi service layer). |

## 7. Ghi chú regression

- Kiểm tra luồng Tạo mới NS (Phase 2): Phải tự động tạo Salary row trống.
- Kiểm tra luồng Sửa hồ sơ (Phase 2): Không được chứa các field lương trong payload.
