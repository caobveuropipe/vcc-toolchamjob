# Test Cases: Phase 0 Infrastructure & Docker
> Ngày tạo: 2026-03-14
> Liên quan đến: Phase 0 Foundation | Review 3 (Performance & Security)

## Phân loại Test

| # | Loại | Use Case | Steps | Kết quả mong đợi | Mức ưu tiên |
|---|------|----------|-------|-------------------|-------------|
| 1 | ⚡ Perf | Chống treo boot khi Redis lỗi | 1. Sai URL Redis<br>2. Trigger Cloud Run boot | App boot nhanh (~2s), không treo ping | 🔴 Cao |
| 2 | 🔒 Security | Kiểm tra ẩn danh Nginx | `curl -I [URL]` | Header `Server` không hiện version | 🔴 Cao |
| 3 | 🔒 Security | Kiểm tra NODE_ENV production | Kiểm tra logs/responses | Không lộ stack trace/debug info | 🔴 Cao |
| 4 | 🏗️ Infra | Kiểm tra Docker CI Cache | Chạy build Docker liên tiếp | Lần 2 nhanh hơn (dùng pnpm cache mount) | 🟡 Trung bình |

## Chi tiết từng Use Case

### UC-1: Chống treo boot khi Redis lỗi (⚡ Perf)
- **Precondition:** Config Cloud Run với `min-instances=0` (scale-to-zero).
- **Given:** Biến môi trường Redis bị sai hoặc dịch vụ Upstash Redis tạm thời không phản hồi.
- **When:** Có request đầu tiên đến API (Trigger Cloud Run boot từ trạng thái ngủ).
- **Then:** Server phải khởi động và sẵn sàng xử lý (hoặc trả 401/404) trong vòng ~2-3s. Không được xảy ra tình trạng "treo" chờ kết quả `ping` từ Redis dẫn đến Gateway Timeout.

### UC-2: Ẩn version Server (🔒 Security)
- **Precondition:** Frontend đã được deploy thành công qua Docker/Nginx.
- **Given:** User có quyền truy cập mạng công cộng.
- **When:** Chạy lệnh `curl -I [FE_URL]`.
- **Then:** Phản hồi từ server phải có header `Server: nginx`. TUYỆT ĐỐI không được hiện `nginx/1.2x.x` để tránh bị scan lỗ hổng theo version.

### UC-3: Enforce Production Mode (🔒 Security)
- **Precondition:** Backend deploy với Dockerfile đã cập nhật.
- **Given:** Xảy ra lỗi 500 bất kỳ trên server.
- **When:** Client nhận phản hồi lỗi.
- **Then:** Phản hồi chỉ chứa mã lỗi và message chung. Không được hiển thị stack trace, biến môi trường, hoặc các thông tin debug của Hono/Node.js.
