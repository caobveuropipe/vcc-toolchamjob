# Test Cases: Bổ sung bộ lọc Người nghiệm thu (NNT) dùng RPC (Tránh lỗi 414)

## 1. Mục tiêu
Xác thực tính năng lọc NNT trong Phòng Chờ hoạt động chính xác theo phân quyền, đồng bộ URL Search Params, hiển thị đúng thứ tự cột, và hoàn toàn bypass được giới hạn HTTP 414 (URL Too Long) khi Reviewer quản lý lượng lớn nhân sự (>500) hoặc xuất Excel hàng loạt.

## 2. Kịch bản xác thực (Manual & Auto)

### SC-01: Hiển thị giao diện & Thứ tự cột (Happy Path)
- **Hành động**: Đăng nhập với quyền EA -> Truy cập màn hình "Phòng Chờ" (`/pending-room`).
- **Kết quả mong đợi**:
  - [x] Cột "Người nghiệm thu" hiển thị trực quan và được đẩy lên đứng ngay trước cột "Line nhân sự".
  - [x] Cột BU bị ẩn đi tại màn hình Phòng Chờ để tối ưu không gian.
  - [x] Dropdown bộ lọc NNT xuất hiện đầy đủ danh sách NNT khả dụng dựa trên scope quyền của EA.

### SC-02: Lọc NNT và đồng bộ URL (Happy Path)
- **Hành động**: Chọn 1 NNT từ dropdown bộ lọc -> Click Lọc.
- **Kết quả mong đợi**:
  - [x] Danh sách nhân sự được lọc chính xác theo NNT đã chọn.
  - [x] URL Search Params cập nhật thêm `nnt=[Tên NNT]` (được encode chuẩn).
  - [x] Khi tải lại trang (F5), bộ lọc NNT vẫn được giữ nguyên trạng thái cũ.

### SC-03: Lọc NNT có số lượng nhân sự cực lớn >500 (Edge Case & Performance)
- **Mô phỏng/Thực tế**: Một NNT hoặc Reviewer scope quản lý >500 nhân sự (tương đương mảng >500 UUIDs).
- **Hành động**: Click lọc theo NNT này hoặc đăng nhập bằng tài khoản của Reviewer đó để xem Phòng chờ.
- **Kết quả mong đợi**:
  - [x] API danh sách nhân sự trả về kết quả thành công HTTP 200.
  - [x] **Xác thực mạng**: Hệ thống gọi RPC `get_employee_info_scoped` bằng method `POST` qua body JSON, bypass hoàn toàn lỗi `414 URI Too Long` (URL-too-long).
  - [x] Không phát sinh bất kỳ lỗi crash UI hay lỗi mạng nào.

### SC-04: Cách ly giao diện Danh sách nhân sự thường (Negative)
- **Hành động**: EA truy cập màn hình "Danh sách nhân sự" thường (`/employees`).
- **Kết quả mong đợi**:
  - [x] Bảng nhân sự thường KHÔNG hiển thị cột NNT.
  - [x] Cột BU vẫn hiển thị bình thường.
  - [x] Bộ lọc NNT không xuất hiện trên thanh tìm kiếm thường để tránh gây phân tán thông tin.

### SC-05: Xuất Excel hàng loạt (limit=all) với mảng UUID lớn (Security & Stability)
- **Hành động**: Click "Xuất báo cáo Excel" toàn bộ danh sách.
- **Kết quả mong đợi**:
  - [x] Service backend tự động chia nhỏ mảng IDs thành các lô 200 phần tử (`chunkArray(ids, 200)`) khi query bảng phụ (salary pending, info pending, nnt mapping).
  - [x] Tránh được giới hạn 414 URL trên các endpoint GET mặc định của Supabase client phụ trợ.
  - [x] File Excel tải về hoàn chỉnh, đầy đủ thông tin, không gặp lỗi HTTP 414 hay rò rỉ dữ liệu.

## 3. Regression Coverage
- [x] Phân quyền EA/SA/Reviewer hoạt động đúng scope dữ liệu.
- [x] Integration tests pass sạch sẽ 100% không bị regression logic cũ.
- [x] Typecheck & Linter pass sạch sẽ 100% trên toàn bộ packages/services.

## 4. Evidence (Sơn kết quả test)
- **Integration tests**: `43/43 tests pass`
- **Typecheck & Build**: `tsc --noEmit && vite build` PASS 100%.
- **Manual Verification**: Thực hiện smoke test cục bộ thành công trên môi trường localhost.
