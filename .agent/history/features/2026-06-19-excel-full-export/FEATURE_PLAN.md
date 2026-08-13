# Feature Plan: Xuất Excel full danh sách nhân sự

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: excel-full-export
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-18
> **Cập nhật**: 2026-06-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống hỗ trợ xuất danh sách nhân sự mặc định (chỉ gồm thông tin cơ bản) và xuất danh sách nhân sự thử việc kèm lương. Chưa có tính năng xuất toàn bộ danh sách nhân sự với đầy đủ tất cả các trường (bao gồm cả 31 trường lương nhạy cảm).
- **Vấn đề cần giải quyết:** 
  - Thiếu lựa chọn "Xuất full danh sách" hiển thị đầy đủ thông tin nhất có thể.
  - Phân quyền bảo mật: Vai trò `VI` (Viewer) không được xem lương, do đó nếu xuất full danh sách phải ẩn/để trống các cột lương để tránh lộ thông tin.
  - Xử lý giới hạn 1000 dòng từ API/Gateway (nếu có) và cảnh báo người dùng khi dữ liệu chạm ngưỡng giới hạn tối đa 5000 dòng.
  - Loại bỏ các nhân sự đã nghỉ việc (`trang_thai === 'nghi_viec'`) ra khỏi tệp xuất Excel này.
  - **Mới (EFR-11):** Chặn việc né tránh audit log/rate limit bằng cách chia nhỏ trang (paginated queries với `include_salaries=true`).
- **Mục tiêu:** 
  - Bổ sung tùy chọn "Xuất full danh sách" hoạt động trơn tru với dữ liệu lớn.
  - Tuân thủ quy định bảo mật lương (Salary Isolation) của hệ thống.
  - Lọc loại bỏ nhân sự đã nghỉ việc khi xuất danh sách.
  - Đảm bảo mọi request chứa dữ liệu lương đều bị áp đặt Rate Limiter và ghi nhận Audit Log.
- **Kết quả mong đợi:** 
  - Dropdown "Xuất Excel" trên UI có thêm nút "Xuất full danh sách".
  - Khi xuất full danh sách, file Excel chứa 56 cột thông tin (25 trường nhân sự cơ bản + 31 trường lương).
  - Loại bỏ các nhân sự có `trang_thai === 'nghi_viec'`.
  - Đối với user `VI`, các cột lương (từ 26 đến 56) hiển thị trống hoặc không có giá trị nhạy cảm.
  - Cảnh báo người dùng bằng UI Alert/Message rõ ràng nếu dữ liệu bị giới hạn/cắt ngắn ở mốc 5000 dòng.
  - Mọi request `include_salaries=true` (kể cả phân trang nhỏ như `limit=50`) đều bị áp `exportRateLimiter` (5 lần/phút) và ghi nhận vào `audit_log`.

## 2. Phạm vi

### In scope
- **Backend:**
  - Hỗ trợ thêm tham số `include_salaries=true` (chỉ kích hoạt khi truyền chính xác `"true"`, các trường hợp khác mặc định là `false`) và cơ chế lọc bỏ nhân sự nghỉ việc ở API `GET /api/employees`.
  - Enforce `EXPORT_LIMIT = 5000` cho mọi request bulk/export (`limit = -1` hoặc `limit > 5000`).
  - Chỉ select và map các trường nằm trong `SALARY_FIELDS` khi gộp thông tin lương, loại bỏ hoàn toàn các trường metadata hệ thống hoặc `pending_changes` của salaries.
  - Xác thực quyền xem lương dựa trên `canViewSalary` và phân quyền reviewer theo từng nhân sự. Nếu không có quyền (user `VI`), thông tin lương của employee đó sẽ trả về `null`.
  - <!-- Sửa theo EFR-11: Áp dụng rate limit và audit log cho toàn bộ request chứa thông tin lương --> Enforce `exportRateLimiter` và `recordAuditLog` cho **tất cả** request có `include_salaries=true`, bất kể giá trị `limit` lớn hay nhỏ.
  - Ghi nhận rõ hành động `export` kèm chi tiết `export_type: "employee_full_with_salary"` hoặc `include_salaries: true` trong bảng `audit_log`.
- **Frontend:**
  - Bổ sung tùy chọn "Xuất full danh sách" trong dropdown button "Xuất Excel" ở trang [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx).
  - Khai báo một danh sách cột tĩnh `FULL_EXPORT_FIELDS` duy nhất kế thừa `SALARY_FIELDS` để làm bản đồ mapping đồng bộ.
  - Lọc loại bỏ nhân sự có `trang_thai === 'nghi_viec'` bằng cách truyền filter query param.
  - Thêm cảnh báo bằng Modal hoặc Message nếu phát hiện dữ liệu xuất bị chạm ngưỡng 5000 dòng (`meta.truncated === true`).
- **Shared Package:**
  - Khai báo `truncated?: boolean` vào interface `ApiListResponse` trong [api.ts](file:///d:/ToolNhanSuVcc/packages/shared/src/types/api.ts).

### Out of scope
- Sửa đổi các file xuất Excel chuyên biệt khác như xuất danh sách thử việc làm thưởng KD.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-03-14] Giới hạn export 5 lần/phút/user, tối đa 5000 dòng/file để chống scraping dữ liệu lớn.`
  - `[2026-03-14] Traceability: Enforce Security Headers (HSTS, NoSniff...) và watermark (User/Time/Khối) trên mọi file export.`
  - Quyết định Salary Isolation: Cách ly thông tin lương đối với vai trò `VI`.
- **"Cấm kỵ" cần tránh:**
  - Tuyệt đối không trả về thông tin lương nhạy cảm cho vai trò `VI` dưới mọi hình thức (kể cả payload API ẩn).
  - Không sử dụng Tailwind CSS trên Frontend.
- **Ràng buộc kiến trúc liên quan:**
  - Hàm `listEmployees` sử dụng phân trang và giới hạn `clampLimit = limit === -1 ? 5000 : limit`. Cần đảm bảo nếu dữ liệu thực tế lớn hơn 5000 dòng, backend sẽ tự động cắt ở 5000 dòng và trả về cờ `truncated: true`.

## 4. Giả định và câu hỏi mở

### Giả định
- Với user `VI`, các cột lương trong file Excel vẫn xuất hiện tiêu đề cột nhưng giá trị các ô dữ liệu sẽ để trống `""` hoặc hiển thị `"-"` để đảm bảo cấu trúc file Excel xuất ra đồng bộ.

### Câu hỏi mở
- Không có câu hỏi mở nào thêm.

## 5. Acceptance Criteria

- [ ] Dropdown "Xuất Excel" trên trang danh sách nhân sự hiển thị tùy chọn "Xuất full danh sách".
- [ ] Khi nhấn "Xuất full danh sách": không bao gồm bất kỳ nhân sự nào có trạng thái `nghi_viec`.
- [ ] Khi nhấn "Xuất full danh sách" với quyền EA/SA: file Excel tải về chứa đầy đủ 56 trường thông tin nhân sự + lương.
- [ ] Khi nhấn "Xuất full danh sách" với quyền VI: các trường lương trong file Excel hoàn toàn trống/không có giá trị.
- [ ] Nếu số lượng dòng dữ liệu lớn hơn hoặc bằng 5000: hiển thị cảnh báo bằng `notification` hoặc `modal` của Ant Design thông báo cho người dùng biết dữ liệu đã bị giới hạn ở 5000 dòng đầu tiên.
- [ ] Không bị giới hạn ở ngưỡng 1000 dòng do lỗi phân trang/gateway.
- [ ] Mọi request `include_salaries=true` (kể cả phân trang nhỏ ví dụ `limit=10`) đều bị chặn bởi Rate Limiter xuất Excel (5 lần/phút) và được ghi vết trong Audit Log.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx) | Sửa | Thêm lựa chọn menu, thêm logic map 56 trường, lọc bỏ nhân sự nghỉ việc, xử lý cảnh báo truncated | 🟢 Thấp | Có |
| [employeeService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/employeeService.ts) | Sửa | Hỗ trợ gộp dữ liệu lương từ bảng `salaries` khi có tham số `include_salaries` | 🟡 Trung bình (cần đảm bảo kiểm tra quyền kỹ lưỡng) | Có |
| [employees.ts](file:///d:/ToolNhanSuVcc/backend/src/routes/employees.ts) | Sửa | Nhận tham số query `include_salaries` và truyền vào service. Enforce rate limiter & audit log khi `include_salaries === "true"`. | 🟡 Trung bình | Có |
| [api.ts](file:///d:/ToolNhanSuVcc/packages/shared/src/types/api.ts) | Sửa | Thêm `truncated` vào `meta` type | 🟢 Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Phân quyền lương cho vai trò `VI`. Cần đảm bảo hàm check quyền `canViewSalary` hoặc check view lương trong `employeeService.ts` hoạt động chính xác trước khi gộp dữ liệu từ bảng `salaries` vào response payload.
- **Review focus areas:**
  - Cách thức lấy dữ liệu lương cho 5000 bản ghi hiệu quả nhất.
  - Đảm bảo payload trả về không leak trường lương nào đối với tài khoản Viewer (`VI`).
  - Bảo vệ API khỏi việc quét/cào dữ liệu lương thông qua chia trang nhỏ.

## 8. Chiến lược triển khai

- **Phase strategy:** Chia làm 2 phase:
  - **Phase 1 (Backend API & Shared):** Bổ sung API param, cập nhật type `ApiListResponse` trong `shared`, tích hợp kéo dữ liệu lương an toàn sử dụng whitelist `SALARY_FIELDS`, lọc bảo mật theo quyền, áp rate limit và ghi audit log chặt chẽ cho toàn bộ request chứa lương, viết test case kiểm chứng.
  - **Phase 2 (Frontend UI):** Cập nhật UI dropdown, định nghĩa danh sách 56 trường Excel sử dụng `FULL_EXPORT_FIELDS`, áp dụng bộ lọc bỏ nhân sự nghỉ việc, và xử lý thông báo cảnh báo 5000 dòng.
- **Thứ tự triển khai:** Backend trước -> Frontend sau -> Kiểm thử tích hợp.
- **Yêu cầu migration / config / deploy:** Không cần thay đổi Database schema.

## 9. Test Strategy

- **Automated tests:**
  - Viết integration test trong `backend/src/__tests__/integration/` giả lập gọi API `GET /api/employees?limit=all&include_salaries=true` bằng tài khoản SA/EA (trả về full data) và tài khoản VI (che giấu lương).
  - Viết integration test kiểm tra trường hợp dữ liệu lớn > 5000 dòng để xác minh cờ `truncated: true`.
  - Tích hợp kiểm thử ma trận phân quyền chi tiết (SA global, EA/VA có lương, VI rỗng, mixed quyền EA khối A + VI khối B, reviewer assigned được xem lương cho employee của mình, reviewer unassigned bị chặn xem lương).
  - **Mới (EFR-11):** Kiểm thử cuộc gọi API `GET /api/employees?include_salaries=true&limit=10` đảm bảo:
    - Bị giới hạn bởi `exportRateLimiter` (kiểm tra status 429 nếu gọi nhiều).
    - Tạo bản ghi trong `audit_log` ghi nhận truy cập dữ liệu lương.
- **Manual verification:**
  - Chuẩn bị dữ liệu mẫu > 1000 dòng và một số nhân sự ở trạng thái `nghi_viec` để xác minh danh sách xuất ra bỏ qua các nhân sự nghỉ việc này và không bị giới hạn 1000 dòng.
  - Kiểm tra giao diện xuất file, xác minh file Excel tải xuống có đầy đủ 56 cột hay không.

## 10. Rollback Plan

- Hoàn tác (git checkout) các thay đổi tại Route/Service backend và UI Component frontend.
