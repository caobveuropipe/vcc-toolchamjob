# Integration Testing - Probation Evaluation Workflow

> Trạng thái: ✅ Đã kiểm chứng (40/40 tests passed)
> Môi trường: Local Integration (Real Supabase DB)

## 1. Tổng quan
Hệ thống integration testing cho phân hệ Đánh giá thử việc tập trung vào việc xác minh tính **nguyên tử (Atomicity)** của các giao dịch cơ sở dữ liệu khi thay đổi đồng thời cả trạng thái nhân sự và thông tin tiền lương.

## 2. Cách chạy Test
Để chạy bộ integration test, sử dụng lệnh:
```bash
cd backend
pnpm test:integration
```
*Lưu ý: Bộ test này sử dụng cấu hình `vitest.integration.config.ts` để chạy tuần tự (sequential) nhằm tránh race condition trên dữ liệu SuperAdmin.*

## 3. Các kịch bản trọng yếu (KIs)

### A. Luồng Đánh giá thử việc (probation.test.ts)
1. **Happy Path - Đạt thử việc**: 
   - Đầu vào: Personnel payload (chuyển sang `chinh_thuc`) + Salary payload.
   - Kết quả: Nhân viên vào phòng chờ, `pending_changes` chứa thông tin mới, `is_probation_eval = true`.
2. **Happy Path - Nghỉ việc**: 
   - Đầu vào: Personnel payload (chuyển sang `nghi_viec`).
   - Kết quả: Nhân viên vào phòng chờ với trạng thái nghỉ việc.
3. **Audit Log Verification**: 
   - Xác minh sau khi gọi RPC `fn_evaluate_probation`, 01 bản ghi audit log được tạo ra với action `probation_eval`.
4. **Failure Path - Atomic Rollback**:
   - Gửi payload lỗi (e.g. sai định dạng lương).
   - Xác minh: Không có dữ liệu nào được ghi vào DB (Rollback thành công).

### B. Bảo mật & Phân quyền (permission.test.ts)
- Xác minh EA chỉ có quyền trên khối của mình.
- Xác minh EA không có quyền SuperAdmin mặc định (IDOR check).
- **Cleanup logic**: Mọi test file đều tự động dọn dẹp SA role và invalidate cache để không ảnh hưởng đến kịch bản tiếp theo.

## 4. Troubleshooting
- **Timeout**: Nếu gặp lỗi timeout, hãy kiểm tra kết nối tới Supabase. Timeout mặc định được cấu hình là `30000ms`.
- **403 Forbidden**: Thường do cache quyền hạn cũ. Các test đã tích hợp gọi Webhook Invalidation nhưng nếu vẫn lỗi, hãy kiểm tra `WEBHOOK_SECRET` trong `.env.local`.
- **404 Not Found**: Xảy ra khi cleanup fails. Chạy lại bộ test hoặc xóa thủ công các bản ghi `TEST_...` trong bảng `employees`.
