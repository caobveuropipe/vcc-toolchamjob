# Bảng Ánh Xạ Trường Lương & Cơ Chế (UI ↔ DB Mapping)

Tài liệu này lưu trữ bảng ánh xạ chuẩn hóa giữa các Nhãn hiển thị trên giao diện (UI) và Tên cột thực tế trong Database (DB) cho toàn bộ các phân hệ liên quan đến Lương & Cơ chế của hệ thống.

---

## 1. Bộ Giấy tờ (Theo HĐLĐ)

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic |
| :--- | :--- | :--- |
| **Tổng thu nhập (GT)** | `luong_target_gt` | Tổng thu nhập target ký kết trên giấy tờ hợp đồng |
| **Lương cố định (GT)** | `lcd_gt` | Lương cố định trên giấy tờ |
| **Hiệu suất (GT)** | `luong_hieu_suat_gt` | Lương hiệu suất trên giấy tờ |
| **Nhuận bút (GT)** | `nhuan_but_gt` | Nhuận bút trên giấy tờ |
| **OKR (GT)** | `okr_gt` | OKR trên giấy tờ |
| **Thưởng KD (GT)** | `thuong_doanh_so_gt` | Thưởng kinh doanh trên giấy tờ, lưu ý khác biệt với thưởng doanh số |

---

## 2. Bộ Cơ chế (Nội bộ) - Base

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic / Công thức |
| :--- | :--- | :--- |
| **Tổng thu nhập** | `luong_target_cc` | Tổng thu nhập target cơ chế (Dùng để kiểm soát / Validate) |
| **Lương cố định** | `luong_cb` | Lương cố định cơ chế |
| **Hiệu suất** | *(Tính toán động)* | `= thuong_hieu_suat_cham_job_nhuan + thuong_kpi_m1 + thuong_doanh_so_m1 + thuong_du_an_m1 (+ thuong_kiem_nhiem_m1 nếu is_target_cc_include_kn_m1=true)` |
| **Nhuận bút** | `nhuan_but_cc` | Nhuận bút cơ chế |
| **OKR** | `thuong_okr_m1` | OKR cơ chế (OKR M1) (Trường `okr_cc` cũ đã bị loại bỏ) |
| **Thưởng KD** | *(Để trống)* | Để trống/`-` (Không được hiểu là thưởng doanh số, hai trường này khác biệt) |
| **Tạm ứng/tháng** | `tam_ung_hang_thang` | Số tiền tạm ứng hàng tháng |

---

## 3. Cơ chế chi tiết - Thưởng M1 / M2 / M3

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic |
| :--- | :--- | :--- |
| **HS Chấm/Job/Nhuận** | `thuong_hieu_suat_cham_job_nhuan` | Lương hiệu suất chấm job cơ chế |
| **KPI M1 / M2 / M3** | `thuong_kpi_m1`, `_m2`, `_m3` | Lương KPI cơ chế |
| **OKR M1 / M2 / M3** | `thuong_okr_m1`, `_m2`, `_m3` | Lương OKR cơ chế |
| **DS M1 / M2 / M3** | `thuong_doanh_so_m1`, `_m2`, `_m3` | Lương doanh số cơ chế |
| **Dự án M1 / M2 / M3** | `thuong_du_an_m1`, `_m2`, `_m3` | Lương dự án cơ chế |
| **KN M1 / M2 / M3** | `thuong_kiem_nhiem_m1`, `_m2`, `_m3` | Lương kiêm nhiệm cơ chế |

---

## 4. Các cấu hình và thông tin khác

| Nhãn trên UI | Cột DB thực tế | Mô tả / Logic |
| :--- | :--- | :--- |
| **Bậc lương** | `bac_luong` | Cột bậc lương (text) |
| **Tỷ lệ lương Thử việc (%)** | `ty_le_luong_tv` | Tỷ lệ % hưởng lương khi thử việc |
| **Target (CC) bao gồm KN M1** | `is_target_cc_include_kn_m1` | Checkbox xác định tổng thu nhập target cơ chế có bao gồm lương kiêm nhiệm không |
| **Ngày điều chỉnh** | `ngay_dieu_chinh_luong` | Ngày bắt đầu áp dụng cơ chế lương mới |

---

## 5. Các trường cũ/dư thừa (Đã xoá dữ liệu và ngưng sử dụng)

| Nhãn trên UI | Cột DB thực tế | Mô tả / Hành động |
| :--- | :--- | :--- |
| **OKR (CC)** | `okr_cc` | Trường OKR cc cũ $\rightarrow$ **Đã set NULL ở DB và ngưng sử dụng** |
| **Thưởng DS (CC)** | `thuong_doanh_so_cc` | Trường thưởng doanh số cc cũ $\rightarrow$ **Đã set NULL ở DB và ngưng sử dụng** |
