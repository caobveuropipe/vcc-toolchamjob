# Test Cases: Fix Upload Presign Permission + CSP

## 1. Mục tiêu
Xác thực EA có thể upload tài liệu tuyển dụng khi chưa chọn Khối (draft state) và thumbnail preview hiển thị đúng. Chặn các trường hợp nới lỏng sai cho các loại tài liệu nhạy cảm khác.

## 2. Kịch bản xác thực (Manual & Auto)

### SC-01: EA Draft Upload (Happy Path)
- **Role**: EA (ví dụ: `loi.admicro@gmail.com`)
- **Hành động**: Vào `/employees/new` -> Chưa chọn Khối -> Kéo thả ảnh CCCD vào Dragger.
- **Kết quả mong đợi**:
  - [x] Request `/documents/presign` trả về 200 (Success).
  - [x] Thumbnail hiển thị ngay lập tức (Xác nhận CSP `blob:` ok).
  - [x] Upload PUT lên R2 thành công.
  - [x] Save metadata BE trả về 200.

### SC-02: EA Upload tài liệu khác (Negative)
- **Role**: EA
- **Hành động**: Gọi API thủ công hoặc dùng UI (nếu có) xin Presigned URL cho `document_type: 'dieu_chinh_luong'` mà không truyền `khoi`.
- **Kết quả mong đợi**: 
  - [x] Trả về 403 Forbidden. Logic nới lỏng **chỉ** áp dụng cho `tuyen_moi`.

### SC-03: VI/Reviewer Access (Security)
- **Role**: VI (chỉ xem)
- **Hành động**: Thử upload tại `/employees/new`.
- **Kết quả mong đợi**: 
  - [x] Trả về 403 Forbidden. Mặc dù là `tuyen_moi` nhưng role VI không được phép upload draft.

### SC-04: Superadmin Bypass (Happy Path)
- **Role**: Superadmin
- **Hành động**: Thực hiện upload tuyển mới không gán `khoi`.
- **Kết quả mong đợi**:
  - [x] Trả về 200 (Pass qua nhánh `is_superadmin`).

## 3. Regression Coverage
- [x] EA upload `tuyen_moi` **có** gán `khoi` (Logic cũ vẫn phải pass).
- [x] Reviewer upload cho nhân sự được gán mã nhân sự cụ thể (Logic cũ vẫn phải pass).
- [x] Typecheck backend & frontend pass 100%.

## 4. Evidence (Sơn kết quả test)
- Unit tests: `9/9 tests pass` (src/__tests__/unit/documentService.test.ts)
- Route tests: `4/4 tests pass` (src/__tests__/unit/documentPresignRoute.test.ts)
- Local Manual Verify: `Passed by NB1406 at 17:25`
