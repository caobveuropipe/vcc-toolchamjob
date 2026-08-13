# Test Cases: Quản trị viên Dọn dẹp dữ liệu (Admin Cleanup Dashboard)

> Slug: admin-cleanup-dashboard
> Layer: Backend (Integration), Frontend (UI/UX)
> Trạng thái: ✅ Hoàn thành

## 1. Backend Integration Tests (`adminCleanup.test.ts`)

| ID | Mô tả | Đầu vào | Kết quả mong đợi | Trạng thái |
|:---|:---|:---|:---|:---|
| BE-CL-01 | SA lấy danh sách dọn dẹp thành công | `GET /admin/cleanup/employees` (Super Admin) | 200 OK, trả về mảng nhân sự (Live + Pending) | ✅ Pass |
| BE-CL-02 | Non-SA bị chặn lấy danh sách | `GET /admin/cleanup/employees` (EA hoặc VA) | 403 Forbidden | ✅ Pass |
| BE-CL-03 | Xóa hàng loạt thành công (DB + R2) | `POST /admin/cleanup/employees/bulk-hard-delete` kèm mảng 3 mã NS | 200 OK, `deleted_count: 3`, Audit Log baseline được ghi | ✅ Pass |
| BE-CL-04 | Chặn xóa quá giới hạn (Max 50) | Mảng 51 mã nhân sự | 400 Bad Request | ✅ Pass |
| BE-CL-05 | Xử lý lỗi R2 best-effort | Mock R2 delete lỗi 1 file | 200 OK, Audit Log ghi nhận `failed_r2_keys` | ✅ Pass |

## 2. Frontend UI/UX Tests

| ID | Mô tả | Thao tác | Kết quả mong đợi | Trạng thái |
|:---|:---|:---|:---|:---|
| FE-CL-01 | Hiển thị Tab Dọn dẹp | Đăng nhập SA -> Dashboard | Thấy Tab "DỌN DẸP" màu xanh dương | ✅ Pass |
| FE-CL-02 | Lọc theo pattern | Chọn tab MOCK hoặc Mã TMP | Danh sách tự động reload theo filter | ✅ Pass |
| FE-CL-03 | Modal xác nhận bảo mật | Chọn items -> Click Xóa | Hiện Modal yêu cầu nhập "XÓA VĨNH VIỄN" | ✅ Pass |
| FE-CL-04 | Chặn xác nhận sai | Nhập "Xóa" hoặc để trống | Nút xác nhận xóa bị chặn hoặc báo lỗi | ✅ Pass |
| FE-CL-05 | Feedback sau khi xóa | Nhập đúng -> Xác nhận | Hiện Toast success, danh sách tự reload | ✅ Pass |

## 3. Security & Integrity

| ID | Mô tả | Kiểm tra | Kết quả mong đợi | Trạng thái |
|:---|:---|:---|:---|:---|
| SEC-CL-01 | Bảo toàn Audit Trail | Kiểm tra bảng `change_history` sau khi xóa | `ma_nhan_su` bị SET NULL nhưng nội dung lịch sử cũ vẫn còn | ✅ Pass |
| SEC-CL-02 | Rate Limit | Gọi liên tiếp API xóa | Trả về 429 Too Many Requests (sensitiveRateLimiter) | ✅ Pass |
