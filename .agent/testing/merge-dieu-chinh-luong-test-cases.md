# Test Cases - Merge Salary Adjustment Feature

> Tạo ngày: 2026-05-06
> Liên kết feature: `merge-dieu-chinh-luong`
> Phạm vi: Feature / Bug fix / Regression

---

## 1. Mục tiêu kiểm thử

- Xác nhận logic trích xuất `ngay_dieu_chinh_luong` và `is_target_cc_include_kn_m1` hoạt động đúng sau khi submit hồ sơ.
- Đảm bảo Salary Isolation cho role VI không bị phá vỡ (không thấy 3 trường mới khôi phục trong lịch sử).
- Verify tính ổn định của migration 023 sau khi fix lỗi Function Overloading.

## 2. Tiền điều kiện

- Database đã apply đủ migrations từ 020 đến 023.
- Môi trường backend đang chạy (Local hoặc Test).
- Tài khoản EA (Admicro) để thực hiện submit.
- Tài khoản VI để verify isolation.

## 3. Happy Path (Integration)

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Gửi request `PUT /api/salaries/:ma_nhan_su` kèm `is_target_cc_include_kn_m1` và `ngay_dieu_chinh_luong` vào pending. | Status 200, dữ liệu được lưu vào `salaries.pending_changes`. |
| HP-02 | Gửi request `PUT /api/employees/:ma_nhan_su/submit` để duyệt hồ sơ. | Status 200, `is_target_cc_include_kn_m1` cập nhật vào bảng `salaries`, `ngay_dieu_chinh_luong` cập nhật vào bảng `employees`. |
| HP-03 | Kiểm tra `GET /api/change-history/:ma_nhan_su` sau khi submit. | Thấy các bản ghi thay đổi cho các trường lương vừa cập nhật. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Chạy `npx vitest` cho file `salary.test.ts`. | Toàn bộ 8/8 tests pass xanh. |
| RG-02 | Chạy `pnpm --filter @vcc/shared test`. | `schema-sync.test.ts` pass với count = 31. |

## 5. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Đăng nhập bằng tài khoản VI, gọi API `GET /api/change-history/:ma_nhan_su`. | Response không chứa bất kỳ bản ghi nào có `field_changed` thuộc `SALARY_FIELDS` (bao gồm cả 3 trường mới khôi phục). |

## 6. Ghi chú regression

- Cần chú ý kiểm tra lại logic bóc tách `ngay_dieu_chinh_luong` nếu sau này có thay đổi cấu trúc bảng `employees`.
- Đảm bảo `SALARY_FIELDS` luôn được cập nhật đồng bộ khi thêm cột lương mới.
