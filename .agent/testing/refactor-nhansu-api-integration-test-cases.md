# Test Cases - Refactor Tích Hợp API Snapshot Nhân Sự & Lương Mới

> Tạo ngày: 2026-08-13  
> Liên kết feature: `refactor-nhansu-api-integration`  
> Phạm vi: Integration / Backend GAS / Client UI / Security Preflight  

---

## 1. Mục tiêu kiểm thử

- Xác minh hàm backend GAS `pg_general_1_LayDanhSachLuong` đọc API Snapshot nhân sự mới `/api/snapshots/employees-detail` trả về mảng Object Array chính xác.
- Xác minh Strict Preflight Check dừng hệ thống ngay lập tức khi `APP_ENV` không hợp lệ hoặc thiếu thông số cấu hình Production (fail-closed).
- Xác minh Client UI render đúng 14 cột bảng Tổng hợp hiệu suất, tính toán `luongTarget` và `luongCoDinh` chính xác.
- Kiểm thử phân biệt 2 trạng thái API: Thất bại (withFailureHandler toast) vs Không có dữ liệu (bảng rỗng `[]`).
- Xác minh cache invalidation khi thay đổi kỳ nghiệm thu báo cáo (`kyBaoCao`).

---

## 2. Tiền điều kiện

- Môi trường GAS backend có kịch bản ScriptProperties `APP_ENV` = `'development'` hoặc `'production'`.
- Web App UI đã deploy thành công qua `.\push-all.ps1` hoặc `.\deploy-all.ps1`.

---

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Mở modal Tổng hợp hiệu suất, chọn kỳ nghiệm thu (ví dụ: `2026-07`) | Client gọi backend GAS kèm `kyNghiemThu = '2026-07'`, lấy dữ liệu mảng Object Array từ API backend thành công. |
| HP-02 | Kiểm tra dữ liệu rendering trên bảng Tổng hợp hiệu suất | 14 cột hiển thị đúng thông tin nhân sự, `luongTarget` > 0, `luongCoDinh` gán từ `luong_co_dinh` hoặc `lcd_gt`, tỷ lệ % target/lương cố định tính toán chính xác. |
| HP-03 | Đổi dropdown `kyBaoCao` từ `2026-07` sang `2026-08` | Modal tự động refetch dữ liệu lương kỳ `2026-08` mới, bảng cập nhật lại chỉ số phù hợp với kỳ mới chọn. |

---

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Gọi API cho kỳ nghiệm thu hợp lệ nhưng không có nhân sự (API trả `[]`) | UI hiển thị bảng rỗng sạch sẽ, KHÔNG hiển thị toast thông báo lỗi, KHÔNG render lương = 0 cho nhân sự rỗng. |
| RG-02 | Xem chi tiết hiệu suất cá nhân tại `pg_general_3_XemHieuSuatChiTiet()` | Hệ thống không tự động gọi prefetch lương rỗng kỳ, loại bỏ request thừa không cần thiết. |
| RG-03 | Thực hiện gọi API 2 lần liên tiếp trong khoảng 600s cùng 1 kỳ nghiệm thu | Request thứ 2 trả về kết quả nhanh chóng từ `CacheService.getScriptCache()` mà không phải gửi lại request HTTP sang server. |

---

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Giả lập server API trả về lỗi HTTP 500 hoặc Timeout | Backend GAS throw Exception, Client kích hoạt `withFailureHandler`, hiển thị toast thông báo lỗi trực quan cho người dùng. |
| NG-02 | Cấu hình sai `INTERNAL_API_KEY` trong ScriptProperties ở môi trường `production` | Backend throw Exception 401/403, Client không render dữ liệu rác, hiển thị toast lỗi rõ ràng. |

---

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Đặt `APP_ENV` = `undefined`, `null` hoặc chuỗi lạ (ví dụ: `'test'`) | Backend GAS throw Exception ngay ở bước Preflight Check, ngăn chặn hoàn toàn việc gọi API với cấu hình không hợp lệ (Strict Fail-Closed). |
| SC-02 | Đặt `APP_ENV` = `'production'` nhưng xóa `API_BASE_URL` hoặc `INTERNAL_API_KEY` | Preflight check báo lỗi thiếu thông số Production, KHÔNG tự động fallback sang URL dev. |

---

## 7. Ghi chú regression

- Retest luồng xuất báo cáo Excel Tổng hợp hiệu suất đảm bảo số liệu trùng khớp với giao diện bảng.
- Retest việc nạp danh sách nhân sự tại màn hình Quản lý danh mục.
