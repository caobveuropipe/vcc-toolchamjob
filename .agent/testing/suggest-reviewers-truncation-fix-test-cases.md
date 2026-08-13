# Test Cases: Sửa lỗi giới hạn dữ liệu khi gợi ý Người Nghiệm Thu (NNT)

## 1. Happy Path
- **Kịch bản**: HR thực hiện submit một nhân sự chưa được gán NNT hoặc chưa tích "Không có NNT" từ phòng chờ.
- **Hành động**: Bấm vào nút "Submit" trên dòng của nhân viên.
- **Kết quả mong đợi**:
  - Modal "Xác nhận NNT" hiển thị đúng danh sách tối đa 2 người nghiệm thu được gợi ý.
  - Danh sách gợi ý tuân thủ đúng logic `AND` điều kiện tiên quyết (Khối + Line nhân sự) kết hợp với fallback chain tổ chức (`nhom_team` -> `phong_ban` -> `bo_phan`).
  - Phân cấp ưu tiên gợi ý người xuất hiện nhiều nhất (COUNT) và mới nhất (Tie-breaker `created_at`).
  - Sau khi chọn NNT và bấm xác nhận, nhân sự được duyệt khỏi phòng chờ thành công.

- **Kịch bản**: HR bấm "Submit" nhân sự đã được gán NNT hoặc đã tích chọn "Không có NNT".
- **Hành động**: Click nút "Submit" trên dòng nhân viên.
- **Kết quả mong đợi**:
  - Hệ thống trực tiếp thực hiện submit và duyệt nhân sự mà KHÔNG mở ra modal gợi ý NNT.

## 2. Edge / Negative
- **Kịch bản**: Khối hoặc Line nhân sự của nhân viên bị trống (mặc dù luật là bắt buộc, ta phòng vệ an toàn).
- **Hành động**: Gọi gợi ý NNT cho nhân viên bị khuyết một trong hai trường này.
- **Kết quả mong đợi**:
  - API Backend chặn sớm và trả cảnh báo rõ ràng thay vì gọi RPC gặp lỗi hoặc trả danh sách sai lệch.

- **Kịch bản**: Sửa đổi cơ cấu tổ chức của nhân viên sang một bộ phận mới chưa được lưu chính thức (chờ duyệt).
- **Hành động**: Mở Modal sửa đổi lương/hồ sơ của nhân sự, chọn tổ chức mới và bấm Lưu nháp. Sau đó mở Modal đánh giá thử việc / điều chuyển để kiểm tra mismatch.
- **Kết quả mong đợi**:
  - Modal "ReviewerCard" hiển thị cảnh báo "Reviewer Mismatch" chuẩn xác theo cơ cấu tổ chức mới (pending changes).
  - Khi click nút "Cập nhật theo gợi ý", hệ thống gọi API với cờ `use_pending=true` và lấy đúng NNT được gợi ý theo tổ chức mới.

## 3. Large Dataset & Security
- **Kịch bản**: Số lượng bản ghi gán NNT của hệ thống lớn hơn 1000 bản ghi.
- **Hành động**: Gọi gợi ý NNT cho nhân viên có NNT nằm ở phần bản ghi ngoài ngưỡng 1000.
- **Kết quả mong đợi**:
  - Gợi ý NNT hoạt động chính xác và đầy đủ, tuyệt đối không bị cắt cụt do giới hạn 1000 dòng của API gateway (vì logic lọc và distinct đã chuyển hẳn xuống tầng DB RPC).

- **Kịch bản**: Người dùng không có quyền hoặc gọi RPC trực tiếp từ Client Anon/Authenticated.
- **Hành động**: Gọi RPC `fn_suggest_reviewers` trực tiếp qua Supabase Client hoặc API Client không được phân quyền.
- **Kết quả mong đợi**:
  - Hệ thống chặn đứng cuộc gọi và trả về lỗi `403 Permission Denied` (do RPC đã bị thu hồi quyền PUBLIC và chỉ cho phép `service_role` thực thi).
