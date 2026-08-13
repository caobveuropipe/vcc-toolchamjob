# Test Cases - Thêm trường tạm ứng hàng tháng (Monthly Salary Advance)

> Tạo ngày: 2026-03-25
> Liên kết feature: `add-tam-ung-hang-thang`
> Phạm vi: Feature (DB Layer + Code Layer)

---

## 1. Mục tiêu kiểm thử

- Khai báo và lưu trữ thành công trường `tam_ung_hang_thang` (tạm ứng hàng tháng) trong database.
- Tự động copy giá trị này sang bảng snapshot khi thực hiện chốt snapshot tháng.
- Đảm bảo tính đồng bộ giữa DB, Zod schema và constants trong code layer.
- Đảm bảo cách ly lương (Salary Isolation): trường mới không xuất hiện trong view dành cho nhân sự (VI).

## 2. Tiền điều kiện

- Database đã chạy migration `003_add_tam_ung_hang_thang.sql`.
- Đã build package `@vcc/shared` mới nhất.
- Tài khoản test có quyền EA (để xem/sửa lương) và VI (để kiểm tra isolation).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Kiểm tra schema bảng `salaries` và `snapshot_employees` | Cột `tam_ung_hang_thang` tồn tại, kiểu `NUMERIC(15,0)`, nullable. |
| HP-02 | Insert/Update bản ghi `salaries` với `tam_ung_hang_thang` là số dương (VD: 5,000,000) | Lưu thành công vào DB. |
| HP-03 | Query view `employee_full` | Cột `tam_ung_hang_thang` xuất hiện và trả về giá trị đúng từ bảng `salaries`. |
| HP-04 | Thực hiện chốt snapshot tháng (gọi function `create_monthly_snapshot`) | Bản ghi trong `snapshot_employees` có giá trị `tam_ung_hang_thang` khớp với bảng `salaries` tại thời điểm chốt. |
| HP-05 | Kiểm tra `SALARY_FIELDS` constant trong code | Chứa `'tam_ung_hang_thang'`, độ dài mảng là 25. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Chạy lại migration `003` lần 2 | Thành công, không báo lỗi duplicate column hoặc phá vỡ view/function (Idempotency). |
| RG-02 | Để trống (NULL) trường `tam_ung_hang_thang` khi lưu | Chấp nhận giá trị NULL (vì là trường optional). |
| RG-03 | Chạy CI sync test `schema-sync.test.ts` | Pass 100% với kỳ vọng 25 fields. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Nhập giá trị âm cho `tam_ung_hang_thang` (VD: -100,000) | Database báo lỗi check constraint `tam_ung_hang_thang >= 0`. |
| NG-02 | Nhập kiểu dữ liệu không phải số (VD: "text") | Zod schema hoặc Database báo lỗi (Invalid number). |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Dùng role VI (Viewer) query view `employee_info_only` | Cột `tam_ung_hang_thang` **KHÔNG** xuất hiện (Salary Isolation). |
| SC-02 | Kiểm tra filter Change History cho VI | Các thay đổi liên quan đến `tam_ung_hang_thang` phải bị ẩn đối với user VI (qua filter `SALARY_FIELDS`). |

## 7. Ghi chú regression

- Cần kiểm tra kỹ module Snapshot sau khi thêm cột, tránh trường hợp lệch vị trí cột khi INSERT SELECT.
- Cần build `@vcc/shared` trước khi chạy các repo BE/FE phụ thuộc.
