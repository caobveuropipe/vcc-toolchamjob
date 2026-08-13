# Test Cases - Chặn Triệt Để Test Tác Động Vào DB Cloud

> Tạo ngày: 2026-07-28
> Liên kết feature: `prevent-test-cloud-db-execution`
> Phạm vi: [Feature / Regression / Ops change]

---

## 1. Mục tiêu kiểm thử

- Đảm bảo môi trường chạy Integration Test hoàn toàn độc lập và chỉ được kết nối đến instance Supabase Local Docker.
- Đảm bảo cơ chế tự động ngăn chặn thảm họa (fail-fast) hoạt động chính xác khi cấu hình sai URL hướng lên Cloud.
- Đảm bảo quy trình cài đặt kiểm thử tự động đồng bộ migrations và seed dữ liệu chuẩn xác lên local database mà không gặp lỗi.

## 2. Tiền điều kiện

- Máy tính đã cài đặt Docker và Docker Desktop đang chạy.
- Supabase CLI đã được khởi chạy trên local (`supabase start`).

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Chạy lệnh `pnpm test:integration:fresh` trong thư mục `backend/` | Lệnh khởi chạy suôn sẻ: đồng bộ migrations thành công, reset local database, seed dữ liệu người dùng thành công và chạy toàn bộ 143 integration tests đạt kết quả Pass 100%. |
| HP-02 | Chạy lệnh `pnpm test` để kích hoạt các unit test trong `backend/` | Tất cả unit test (bao gồm các ca kiểm thử safety guard) đều pass. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Kiểm tra các migration chứa các assertion kỳ vọng số dòng dữ liệu thực tế (như migration 039, 040) khi sync migrations sang local | Script sync-migrations.cjs tự động phát hiện môi trường local và patch giá trị kỳ vọng về `0` để tránh lỗi bootstrap DB trên instance sạch. |
| RG-02 | Chạy nhiều request nhanh lên API `/api/employees` có tích hợp rate limiter khi `TEST_RATE_LIMIT=true` được bật động | API phản hồi mã lỗi `429 Too Many Requests` đúng quy định mà không phụ thuộc vào kết nối Upstash Redis Cloud thực tế. |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Cấu hình `SUPABASE_URL` trỏ tới một domain Cloud (ví dụ `https://ymmqxoxtnaavkcidpoaq.supabase.co`) rồi chạy test hoặc load file setup | Tiến trình lập tức crash kèm theo thông báo lỗi bảo mật: `SECURITY REFUSAL: Target SUPABASE_URL "..." is NOT a valid local Supabase Docker instance!`. |

## 6. Ghi chú regression

- Bất cứ khi nào cấu trúc hoặc phiên bản của Supabase CLI thay đổi, hãy xác minh lại file `supabase/config.toml` xem trường `auto_expose_new_tables` có bị thay đổi hoặc deprecate hoàn toàn hay không để tránh lỗi phân quyền (Permission Denied).
