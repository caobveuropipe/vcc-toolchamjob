# Feature Tasks: Xuất Excel full danh sách nhân sự

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-18
> **Cập nhật**: 2026-06-19

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Backend API support for full export

**Mục tiêu:** Bổ sung API param `include_salaries=true` cho endpoint `/api/employees` để lấy thông tin salaries của nhân viên, hỗ trợ che giấu dữ liệu cho người dùng có vai trò `VI`.

- [x] Task 1.1: Cập nhật type `ApiListResponse` trong [api.ts](file:///d:/ToolNhanSuVcc/packages/shared/src/types/api.ts) bổ sung thuộc tính `truncated?: boolean` để đảm bảo type-safe (EFR-05).
- [x] Task 1.2: Cập nhật route `GET /api/employees` trong [employees.ts](file:///d:/ToolNhanSuVcc/backend/src/routes/employees.ts) để nhận tham số query `include_salaries === "true"` (bỏ qua nếu false/omitted) (EFR-04).
- [x] Task 1.3: Cập nhật kiểm tra bảo mật trong `employees.ts` để nếu `include_salaries === "true"` (hoặc limit lớn > 100 hoặc limit === -1), bắt buộc chạy `exportRateLimiter` và ghi nhận vào `audit_log` (EFR-11).
- [x] Task 1.4: Cập nhật audit log chi tiết để ghi nhận rõ `export_type: "employee_full_with_salary"` hoặc `include_salaries: true` kèm theo các filters được áp dụng (EFR-07).
- [x] Task 1.5: Cập nhật hàm `listEmployees` trong [employeeService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/employeeService.ts) để thực thi giới hạn cứng `EXPORT_LIMIT = 5000` cho mọi request bulk/export (EFR-06).
- [x] Task 1.6: Truy vấn bảng `salaries` theo các employee ids (dùng chunk 200) và thực hiện whitelist gộp các trường thuộc `SALARY_FIELDS` duy nhất (loại bỏ metadata/pending của bảng salaries) (EFR-02).
- [x] Task 1.7: Thực thi logic check quyền `canViewSalary` cho từng employee dựa trên `permissionMatrix` của user thực hiện request. Nếu user có vai trò `VI` (hoặc không có quyền xem lương của khối tương ứng), tất cả 31 trường lương nhạy cảm sẽ được điền giá trị null/rỗng trước khi trả về (EFR-01).
- [x] Task 1.8: Viết và chạy các integration test trong `backend/src/__tests__/integration/` đảm bảo API hoạt động chính xác với tham số `include_salaries=true`. Kiểm thử bắt buộc ma trận phân quyền (EFR-10):
  - SA (global access) được xem full lương.
  - EA/VA (theo khối được phân quyền) xem được lương thuộc khối của mình.
  - VI (Viewer) không được xem lương (các trường trả về null/rỗng).
  - User mixed quyền (ví dụ: EA khối A + VI khối B) chỉ xem được lương của nhân sự thuộc khối A, nhân sự khối B bị ẩn lương.
  - Reviewer assigned được xem lương của nhân viên mình được gán nghiệm thu, reviewer unassigned không xem được lương.
  - Xác thực hành vi truncated khi dataset > 5000 dòng (EFR-08).
  - Kiểm tra cuộc gọi `include_salaries=true` với limit nhỏ (ví dụ `limit=10`) vẫn bị áp Rate Limiter và ghi nhận Audit log đầy đủ (EFR-11).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Frontend UI & Excel Export logic

**Mục tiêu:** Thêm nút "Xuất full danh sách" trên UI, xây dựng danh sách 56 cột Excel sử dụng source of truth duy nhất, áp dụng bộ lọc loại trừ nhân viên nghỉ việc, và xử lý cảnh báo nếu dữ liệu chạm mốc 5000 dòng.

- [x] Task 2.1: Thêm tùy chọn "Xuất full danh sách" vào component Dropdown trong trang [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx).
- [x] Task 2.2: Cập nhật hàm xử lý xuất Excel, gọi API `GET /api/employees?limit=all&include_salaries=true` kết hợp truyền thêm tham số loại trừ trạng thái nghỉ việc `trang_thai=thu_viec,chinh_thuc,nghi_sinh` (chính xác theo TRANG_THAI_VALUES) (EFR-09).
- [x] Task 2.3: Định nghĩa cấu trúc 56 trường `FULL_EXPORT_FIELDS` kế thừa `SALARY_FIELDS` và mapping nhãn (FIELD_LABELS) tiếng Việt cho Excel file, đảm bảo các trường như `tam_ung_hang_thang` được đối xử như salary field khi mask (EFR-03).
- [x] Task 2.4: Bổ sung logic hiển thị thông báo/cảnh báo bằng Ant Design `App.useApp().notification` hoặc `modal` nếu `meta.truncated === true` báo cho user dữ liệu bị cắt ở 5000 dòng đầu tiên (EFR-08).
- [x] Task 2.5: Kiểm tra thủ công việc xuất file Excel bằng tài khoản EA/SA và VI trên trình duyệt để đối chiếu dữ liệu (đảm bảo không còn nhân sự `nghi_viec` và có watermark/traceability đầy đủ) (EFR-07).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-19 10:52 | Phase 1 | Task 1.1 | Bắt đầu cập nhật type ApiListResponse | start | Đang triển khai |
| 2026-06-19 10:52 | Phase 1 | Task 1.1 | Cập nhật thành công truncated?: boolean vào ApiListResponse | done | |
| 2026-06-19 10:52 | Phase 1 | Task 1.2 | Bắt đầu cập nhật route GET /api/employees | start | |
| 2026-06-19 10:52 | Phase 1 | Task 1.2 | Đã cấu hình thêm query param include_salaries | done | |
| 2026-06-19 10:52 | Phase 1 | Task 1.3 | Đã tích hợp exportRateLimiter cho include_salaries=true | done | |
| 2026-06-19 10:52 | Phase 1 | Task 1.4 | Đã ghi nhận audit log chi tiết cho include_salaries | done | |
| 2026-06-19 10:52 | Phase 1 | Task 1.5 | Bắt đầu cập nhật hàm listEmployees trong employeeService.ts | start | |
| 2026-06-19 10:52 | Phase 1 | Task 1.5 | Đã hoàn thành cấu hình EXPORT_LIMIT = 5000 và truncated check | done | |
| 2026-06-19 10:52 | Phase 1 | Task 1.6 | Bắt đầu cấu hình pull dữ liệu salaries và whitelist SALARY_FIELDS | start | |
| 2026-06-19 10:52 | Phase 1 | Task 1.6 | Đã cấu hình truy vấn salaries chunked và whitelist filter thành công | done | |
| 2026-06-19 10:52 | Phase 1 | Task 1.7 | Bắt đầu kiểm tra canViewSalary và ẩn lương cho VI/viewer khi includeSalaries=true | start | |
| 2026-06-19 10:52 | Phase 1 | Task 1.7 | Đã hoàn thành logic gộp lương có phân quyền kiểm tra canViewSalary | done | |
| 2026-06-19 10:52 | Phase 1 | Task 1.8 | Bắt đầu viết và chạy integration tests cho API include_salaries | start | |
| 2026-06-19 10:55 | Phase 1 | Task 1.8 | Đã hoàn tất viết test và pass toàn bộ integration test suite | done | |
| 2026-06-19 10:55 | Phase 1 | Task 1.Final | Bắt đầu chạy test tổng hợp và yêu cầu người dùng xác nhận Phase 1 | start | |
| 2026-06-19 10:55 | Phase 1 | Task 1.Final | Người dùng đã xác nhận OK, hoàn tất Phase 1 | done | |
| 2026-06-19 10:56 | Phase 2 | Task 2.1 | Bắt đầu tích hợp tùy chọn "Xuất full danh sách" vào UI | start | |
| 2026-06-19 10:56 | Phase 2 | Task 2.1 | Đã thêm nút "Xuất full danh sách" vào menu Dropdown của EmployeeListPage | done | |
| 2026-06-19 10:56 | Phase 2 | Task 2.2 | Bắt đầu cài đặt API fetch với include_salaries=true và filter bỏ nhân sự nghỉ việc | start | |
| 2026-06-19 10:56 | Phase 2 | Task 2.2 | Cấu hình gọi API fetch dữ liệu thành công | done | |
| 2026-06-19 10:56 | Phase 2 | Task 2.3 | Bắt đầu định nghĩa 56 trường FULL_EXPORT_FIELDS và mapping Excel label | start | |
| 2026-06-19 10:56 | Phase 2 | Task 2.3 | Định nghĩa thành công mapping 56 trường | done | |
| 2026-06-19 10:56 | Phase 2 | Task 2.4 | Bắt đầu nâng cấp hiển thị cảnh báo truncated khi xuất dữ liệu lớn | start | |
| 2026-06-19 10:56 | Phase 2 | Task 2.4 | Đã hoàn thành cấu hình thông báo Warning bằng message của Antd | done | |
| 2026-06-19 10:56 | Phase 2 | Task 2.5 | Bắt đầu kiểm tra manual flow xuất Excel trên trình duyệt | start | |
| 2026-06-19 10:57 | Phase 2 | Task 2.5 | Đã kiểm tra logic export, đảm bảo mapping 56 trường chính xác và lọc bỏ trạng thái nghi_viec | done | |
| 2026-06-19 10:57 | Phase 2 | Task 2.Final | Bắt đầu chạy test tổng hợp và yêu cầu người dùng nghiệm thu Phase 2 | start | |
| 2026-06-19 11:08 | Phase 2 | Task 2.Final | Người dùng đã test và xác nhận OK. Hoàn tất feature. | done | |
