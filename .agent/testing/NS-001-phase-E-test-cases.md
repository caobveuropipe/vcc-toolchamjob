# Test Cases - Phase E: Upload & AI OCR

> Tạo ngày: 2026-04-01
> Liên kết feature: `phase-2-taskE`
> Phạm vi: Feature (Upload & AI OCR Integration)

---

## 1. Mục tiêu kiểm thử

- Xác nhận luồng upload tài liệu qua Signed URL R2 hoạt động ổn định.
- Xác nhận AI OCR bóc tách đúng thông tin từ ảnh và hỗ trợ cache.
- Đảm bảo tính an toàn: Phân quyền truy cập tài liệu và cơ chế bind `temp_uuid` chống IDOR.

## 2. Tiền điều kiện

- Tài khoản test role: EA (Admin khối), SA (SuperAdmin), VI (Viewer).
- Cấu hình môi trường: `OCR_API_KEY`, `R2_BUCKET_NAME` hợp lệ.
- Seed data: Ít nhất 1 nhân sự mẫu để test bound state.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | EA xin Presign URL -> Upload file lên R2 -> Gọi POST /api/documents | Lưu metadata thành công, trả về doc_id. |
| HP-02 | EA gọi POST /api/documents/:id/ocr lần đầu | BE gọi OpenAI Vision, trả về JSON thông tin nhân sự. |
| HP-03 | EA gọi POST /api/documents/:id/ocr lần thứ hai | Trả về kết quả ngay lập tức từ `ocr_result` (Cache hit). |
| HP-04 | User tạo NS mới kèm `temp_uuid` | BE bind thành công `employee_id` cho tài liệu, xóa cờ draft. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Xin Presign URL nhưng không upload mà gọi nhầm Confirm Metadata | BE trả lỗi 404 hoặc Validation (File không tồn tại trên R2). |
| RG-02 | Upload file > 5MB | BE (Presign) trả lỗi 400 Validation. |
| RG-03 | Upload sai định dạng (vd: .exe) | BE (Presign) trả lỗi 400 Validation. |
| RG-04 | URL hết hạn (sau 3 phút) | FE tự động retry xin URL mới thành công. |

## 5. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | VI/VA gọi bất kỳ route `/api/documents/*` | Trả lỗi 403 Forbidden. |
| SC-02 | EA-Khối A truy cập file nháp của EA-Khối B | Trả lỗi 403 (Chỉ uploader hoặc SA mới được xem file nháp). |
| SC-03 | EA-Khối A tạo NS mới xài `temp_uuid` của file do EA-Khối B upload | Trả lỗi 400/403 (Verify created_by == actor). |
| SC-04 | EA-Khối A truy cập file đã bind của NS thuộc khối B | Trả lỗi 403. |

## 6. Ghi chú regression

- Kiểm tra cronjob `cron_cleanup_orphan.ts` định kỳ để đảm bảo file rác được dọn dẹp.
- Đảm bảo form Edit nhân sự cũ không xuất hiện nút Upload (Create-mode only).
