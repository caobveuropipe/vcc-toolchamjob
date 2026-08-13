# Feature Plan: Cập nhật hiển thị NNTTV và Tùy chọn xuất Excel nhân sự nghỉ việc

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Khuyến nghị gọi `feature-review` để duyệt lại cấu trúc component và luồng UI.
> **Feature slug**: `update-nnt-display-and-export-options`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-23

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** 
  1. Người quản trị cần theo dõi nhanh Người nghiệm thu thử việc (NNTTV) trực tiếp trên bảng danh sách nhân sự chính thay vì phải vào chi tiết. Trường Email hiện tại không quá cấp thiết để hiển thị trên bảng chính.
  2. Khi xuất full danh sách Excel, hệ thống đang tự động lọc bỏ các nhân sự có trạng thái `nghi_viec` (nghỉ việc). HR mong muốn có tùy chọn linh hoạt để bao gồm cả những nhân sự đã nghỉ việc khi cần.
- **Vấn đề cần giải quyết:**
  1. Thay thế cột **Email** bằng cột **Người nghiệm thu thử việc** ở cả giao diện **Danh sách nhân sự** (employee table thông thường) và **Phòng chờ**.
     - Ở Danh sách nhân sự chính (`state_phong_cho = false`), cột NNTTV sẽ hiển thị email dạng text hoặc link.
     - Ở Phòng chờ (`state_phong_cho = true`), do đã có sẵn cột Người nghiệm thu chính thức (`nnt`), ta sẽ thay thế hoàn toàn cột Email bằng cột NNTTV (`nguoi_nghiem_thu_thu_viec`) để đảm bảo không bị trùng cột.
  2. Bổ sung popup hoặc modal confirm/select khi click "Xuất full danh sách", cho phép người dùng lựa chọn: "Có bao gồm nhân sự đã nghỉ việc hay không?".
- **Mục tiêu:** 
  - Đảm bảo UX hiển thị NNTTV đồng bộ và trực quan.
  - Tăng tính linh hoạt của chức năng Xuất Excel Full theo đúng nghiệp vụ.
- **Kết quả mong đợi:** 
  - Bảng nhân sự ở cả 2 chế độ (thường & phòng chờ) hiển thị cột "Người nghiệm thu thử việc" (lấy dữ liệu từ trường `nguoi_nghiem_thu_thu_viec` thay thế cho Email).
  - Nút "Xuất full danh sách" sẽ hiển thị một Modal/Confirm hỏi "Bạn có muốn bao gồm nhân sự đã nghỉ việc trong file xuất không?". Dựa vào phản hồi, API query params `trang_thai` sẽ được cấu hình tương ứng.

## 2. Phạm vi

### In scope
- Chỉnh sửa file [EmployeeTable.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/EmployeeTable.tsx) để thay thế cột Email bằng cột Người nghiệm thu thử việc (`nguoi_nghiem_thu_thu_viec`).
- Chỉnh sửa file [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx) để thêm Modal/Confirm lựa chọn trạng thái xuất file.
- Cập nhật API query params gửi từ Frontend lên Backend dựa trên lựa chọn của người dùng.

### Out of scope
- Chỉnh sửa database schema (sử dụng các trường dữ liệu hiện có).
- Chỉnh sửa backend logic (API `/employees` đã hỗ trợ filter theo `trang_thai`).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Tôn trọng RLS và phân quyền kiểm soát dữ liệu.
  - Watermark và thông tin người xuất vẫn được giữ nguyên.
- **"Cấm kỵ" cần tránh:**
  - Tránh phá vỡ CSS và cấu trúc layout của Ant Design v6. Không sử dụng Tailwind CSS.
  - Đảm bảo không làm giảm hiệu năng tải bảng do việc lấy dữ liệu NNT.

## 4. Giả định và câu hỏi mở

### Giả định
- Cột NNTTV trên cả 2 màn hình sẽ hiển thị dữ liệu từ trường `nguoi_nghiem_thu_thu_viec` trên bảng `employees`.
- Khi người dùng chọn "Không bao gồm nhân sự nghỉ việc" khi xuất full, tham số `trang_thai` sẽ là `thu_viec,chinh_thuc,nghi_sinh` (như cũ). Khi chọn "Có bao gồm", tham số `trang_thai` sẽ bị loại bỏ hoặc truyền `thu_viec,chinh_thuc,nghi_sinh,nghi_viec` (lấy tất cả trạng thái).
- Khi người dùng đóng Modal/Confirm hoặc nhấn Cancel/X/ESC, hệ thống sẽ **hủy bỏ** quá trình xuất Excel (abort) thay vì tự động chọn một phương án mặc định.

### Câu hỏi mở
- *Không có.*

## 5. Acceptance Criteria

- [ ] Cột **Email** trên bảng tại màn hình Danh sách nhân sự và Phòng chờ được thay thế hoàn toàn bằng cột **Người nghiệm thu thử việc** (lấy trường `nguoi_nghiem_thu_thu_viec`).
- [ ] Ma trận cột hiển thị chuẩn:
  - Ở màn thường (`state_phong_cho = false`): `STT` | `Mã NS` | `Họ và tên` | `Ngày vào` | `Khối` | `Trạng thái` | `BU` | `Line nhân sự` | `Người nghiệm thu thử việc` | `Hành động` (Ẩn Email).
  - Ở Phòng chờ (`state_phong_cho = true`): `STT` | `Mã NS` | `Họ và tên` | `Ngày vào` | `Khối` | `Trạng thái` | `Người nghiệm thu` (chính thức - `nnt`) | `Line nhân sự` | `Bộ phận` | `Người nghiệm thu thử việc` | `Hành động` (Ẩn Email).
- [ ] Khi click vào "Xuất full danh sách" tại Danh sách nhân sự, một Modal custom (hoặc Modal.confirm với custom footer/extra button) của Antd hiện lên hỏi: *"Bạn có muốn xuất kèm cả nhân sự đã nghỉ việc không?"*.
- [ ] Modal này phải trả về 3 trạng thái phân biệt rõ ràng:
  1. Chọn "Có, bao gồm nghỉ việc" (Include): Gọi API với `trang_thai` bao gồm `nghi_viec` hoặc không truyền để lấy tất cả.
  2. Chọn "Không, chỉ nhân sự đang hoạt động" (Exclude): Gọi API với `trang_thai=thu_viec,chinh_thuc,nghi_sinh`.
  3. Chọn "Hủy" (Cancel/Close/ESC): Hủy hoàn toàn và **không phát sinh bất kỳ network request nào**.
- [ ] Refactor header export actions: Cập nhật dependency list cho effect của `setPageInfo` (đưa `menuItems`, `searchParams` vào hoặc sử dụng `useRef`/`useCallback` đúng cách) để triệt tiêu vĩnh viễn lỗi stale closure khi search/filter thay đổi trước khi bấm xuất file.
- [ ] File Excel xuất ra phản ánh chính xác cấu trúc dữ liệu, bộ lọc trạng thái được chọn, và đảm bảo tuân thủ rate limit, audit log, watermark bảo mật. (Dữ liệu lương được mask về null nếu user không có quyền xem).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [EmployeeTable.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/EmployeeTable.tsx) | Sửa | Thay thế cấu hình cột `email` thành cột `nguoi_nghiem_thu_thu_viec` (Người nghiệm thu thử việc). | 🟢 Thấp | Không |
| [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx) | Sửa | Thêm Modal/Confirm khi nhấn xuất full danh sách và cập nhật query params. | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo render NNTTV (`nguoi_nghiem_thu_thu_viec`) hoạt động ổn định và không làm crash table khi dữ liệu trống.
- **Review focus areas:** Trải nghiệm UX của Modal confirm xuất Excel có mượt mà và trực quan hay không.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1:** Chỉnh sửa giao diện bảng `EmployeeTable.tsx` để hiển thị cột Người nghiệm thu thử việc thay cho Email.
  - **Phase 2:** Cập nhật logic và UI xuất Excel tại `EmployeeListPage.tsx` với Modal confirm.
- **Thứ tự triển khai:** Cập nhật bảng trước, sau đó cập nhật tính năng xuất Excel.

## 9. Test Strategy

- **Manual verification:**
  1. Mở màn hình Danh sách nhân sự và kiểm tra cột Email đã biến mất, thay bằng cột Người nghiệm thu.
  2. Mở màn hình Phòng chờ và kiểm tra giao diện tương tự.
  3. Click "Xuất Excel" -> "Xuất full danh sách", xác nhận modal confirm hiển thị.
  4. Test xuất cả 2 phương án (Có/Không bao gồm nhân sự nghỉ việc) và kiểm tra file Excel tải về.

## 10. Rollback Plan

- Sử dụng Git checkout để hoàn tác các file:
  - `git checkout -- frontend/src/components/EmployeeTable.tsx`
  - `git checkout -- frontend/src/pages/Employees/EmployeeListPage.tsx`

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
