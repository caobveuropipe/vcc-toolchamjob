# Test Cases: Salary Target Validation & Formula Enforcement

> Feature: salary-target-validation
> Ngày tạo: 2026-05-05
> Trạng thái: Sẵn sàng kiểm thử

## 1. Happy Path: Dữ liệu hợp lệ

| ID | Mô tả | Đầu vào mẫu | Kết quả mong đợi |
|----|-------|-------------|------------------|
| HP-01 | Bộ Giấy tờ khớp tổng | Target GT: 10M. LCD: 5M, HS: 3M, Nhuận: 1M, OKR: 0.5M, DS: 0.5M | Cho phép Lưu / Nút Submit enable. |
| HP-02 | Bộ Cơ chế khớp (không KN) | Target CC: 10M. Lương CB: 5M, HS: 3M, KPI: 1M, OKR: 1M. Checkbox KN: Off. | Cho phép Lưu / Nút Submit enable. |
| HP-03 | Bộ Cơ chế khớp (có KN) | Target CC: 12M. Các thành phần cũ: 10M. KN M1: 2M. Checkbox KN: **On**. | Cho phép Lưu / Nút Submit enable. |

## 2. Edge Cases: Trường hợp biên

| ID | Mô tả | Đầu vào mẫu | Kết quả mong đợi |
|----|-------|-------------|------------------|
| EC-01 | Dữ liệu NULL/Trống | Target GT: 10M. LCD: 10M. Các trường khác: Trống. | Coi các trường trống là 0. Hợp lệ. |
| EC-02 | Giá trị 0 | Target GT: 0. Các thành phần: 0. | Hợp lệ. |
| EC-03 | Checkbox KN On nhưng KN M1 = 0 | Target CC: 10M. Thành phần khác: 10M. KN M1: 0. Checkbox: On. | Hợp lệ. |

## 3. Negative Path: Chặn dữ liệu sai lệch

| ID | Mô tả | Đầu vào mẫu | Kết quả mong đợi |
|----|-------|-------------|------------------|
| NP-01 | Bộ Giấy tờ sai tổng | Target GT: 10M. Tổng thành phần: 9.5M. | Chặn Lưu, hiện cảnh báo chênh lệch 500,000. |
| NP-02 | Bộ Cơ chế sai (quên tick KN) | Target CC: 12M. Tổng thành phần (không KN): 10M. KN M1: 2M. Checkbox: **Off**. | Chặn Lưu, hiện cảnh báo. |
| NP-03 | Sai lệch số lẻ | Target GT: 10,000,001. Tổng thành phần: 10,000,000. | Chặn Lưu, hiện chênh lệch 1đ. |

## 4. UI/UX & Persistence

| ID | Mô tả | Hành động | Kết quả mong đợi |
|----|-------|-----------|------------------|
| UX-01 | Tooltip Phòng chờ | Di chuột vào nút Submit bị disable của NS sai lương. | Hiện danh sách chi tiết các lỗi công thức. |
| UX-02 | Persistence Checkbox | Tick checkbox -> Lưu nháp -> Mở lại Modal. | Checkbox vẫn giữ trạng thái Tick. |
| UX-03 | Delta Warning | Nhập sai lương -> Bấm Lưu. | Cảnh báo hiện rõ: "Tổng hiện tại (X) khác Target (Y). Chênh lệch: (Z)". |
