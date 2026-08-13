# Test Cases - OCR Refinement

> Tạo ngày: 2026-04-22
> Liên kết feature: ocr-refinement
> Phạm vi: Feature / Integration

## 1. Mục tiêu kiểm thử
- Xác nhận AI có thể đọc đúng "Tên nhân viên nghỉ việc" nếu mục "Thay thế" được đánh dấu.
- Xác nhận AI không trích xuất email.
- Xác nhận định dạng ngày trả về là DD/MM/YYYY.

## 2. Tiền điều kiện
- Tài khoản EA.
- Ảnh phiếu tuyển dụng có phần "Thay thế" được điền.

## 3. Happy Path
| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Upload phiếu có tích "Thay thế" và tên "Nguyễn Văn A" | AI trả về `nguoi_bi_thay_the: "Nguyễn Văn A"` |
| HP-02 | Kiểm tra kết quả hiển thị AI đọc | Không còn cột email, xuất hiện cột "Người bị thay thế" |
| HP-03 | Click "Tự điền thông tin" | Trường "Người bị thay thế" trên form được fill đúng |
| HP-04 | Kiểm tra định dạng ngày trích xuất | `ngay_sinh` và `ngay_vao_cong_ty` hiển thị dạng DD/MM/YYYY |

## 4. Edge / Regression
| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Phiếu tích "Tuyển mới" (không có thay thế) | `nguoi_bi_thay_the` trả về null/trống |

## 5. Ghi chú regression
- Kiểm tra tính năng "Tự điền" không làm mất các dữ liệu khác đã điền tay trước đó nếu AI không có giá trị (guardrail).
