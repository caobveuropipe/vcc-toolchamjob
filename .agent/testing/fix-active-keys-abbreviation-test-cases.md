# Test Cases - Sửa lỗi lệch khóa đối chiếu Snapshot (API active-keys)

> Tạo ngày: 2026-07-20
> Liên kết feature: `fix-active-keys-abbreviation`
> Phạm vi: Bug fix / Integration test

---

## 1. Mục tiêu kiểm thử

- Đảm bảo hàm `khoisAbbreviation` không cắt cụt tên của các khối dùng tên đầy đủ dạng viết hoa (`BIZFLY CLOUD`, `SOHAGAME`, `BIZFLY MARTECH & SALE TECH`, `KND`, `MY SOHA`, `VCCORP`, `VIVA`, `NANDA`, `CNND`, `SUPPORT`).
- Đảm bảo việc chuẩn hóa tháng trong `getActiveKeys` loại bỏ zero-padding (ví dụ `T06.2026` -> `T6.2026`).
- Bảo toàn logic viết tắt cho các khối đặc thù cũ (`ADMICRO` -> `ADM`, `KENH14` -> `K14`...) và fallback 3 chữ cái đầu cho khối thường.

## 2. Tiền điều kiện

- Môi trường database có bảng `snapshot_employees` được link tới snapshot tháng `2026-06`.
- Có API key nội bộ `INTERNAL_API_KEY` hợp lệ để xác thực qua header `x-api-key`.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Gọi `GET /api/snapshots/active-keys?thang=T6.2026` | Trả về mã HTTP 200 và danh sách key đối chiếu đúng định dạng: `T6.2026-[Mã nhân sự]-[Tên khối đầy đủ]` cho các khối thuộc danh sách fullNameBlocks. |
| HP-02 | Đối chiếu với các khối viết tắt cũ (`ADMICRO`, `KENH14`...) | Trả về active-key với tên khối viết tắt chuẩn: `T6.2026-[Mã nhân sự]-ADM` hoặc `K14`. |
| HP-03 | Đối chiếu với khối thường không đặc thù | Trả về active-key với tên khối là 3 ký tự đầu: `T6.2026-[Mã nhân sự]-[Fallback 3 ký tự]`. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Case-insensitive & trim kiểm thử (ví dụ: `  Bizfly Martech & Sale Tech  ` hoặc `knd`) | Tên khối tự động trim khoảng trắng và đưa về dạng chữ in hoa khớp đúng danh sách fullNameBlocks. |
| RG-02 | Truyền tham số tháng có zero-padding (`thang=T06.2026`) | API tự động chuẩn hóa tiền tố các key trả về thành `T6.2026-...` thay vì giữ nguyên `T06.2026`. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Gọi API không truyền `thang` hoặc truyền sai định dạng (`thang=2026-06`) | Trả về mã HTTP 400 Bad Request kèm thông báo định dạng tháng không hợp lệ. |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Gọi API không truyền hoặc sai header `x-api-key` | Trả về mã HTTP 401 Unauthorized. |

## 7. Ghi chú regression

- Cần chạy lại bộ test `snapshots.test.ts` để chắc chắn không ảnh hưởng đến các chức năng chốt phụ, xuất Excel hoặc khôi phục snapshot.
