# Rebuttal Log: Xuất Excel full danh sách nhân sự

## Round 1 - 2026-06-19T09:50:00+07:00

### Tổng kết
- EFR: 8 (accepted: 8, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `d:\ToolNhanSuVcc\packages\shared\src\types\permission.ts:39-42`
  - `d:\ToolNhanSuVcc\packages\shared\src\types\api.ts:7-15`
  - `d:\ToolNhanSuVcc\packages\shared\src\constants\salary-fields.ts:16-63`
  - `d:\ToolNhanSuVcc\database\migrations\036_add_probation_reviewer_field.sql:19-54`

### EFR Đã Chấp Nhận:
- **EFR-01: Ma trận quyền xem lương cho full export chưa explicit**
  - *Sửa:* Đã cập nhật vào `FEATURE_PLAN.md` và `FEATURE_TASKS.md` yêu cầu kiểm tra chi tiết theo hàm `canViewSalary` và phân quyền reviewer theo từng nhân sự trước khi gộp lương, tránh all-or-nothing.
- **EFR-02: Salary flattening chưa ràng buộc whitelist SALARY_FIELDS**
  - *Sửa:* Ràng buộc chỉ lấy các trường lương có trong whitelist `SALARY_FIELDS`, loại trừ metadata/pending fields.
- **EFR-03: Mapping 56 cột Excel chưa có source of truth unique**
  - *Sửa:* Khai báo `FULL_EXPORT_FIELDS` tĩnh làm source of truth duy nhất và xử lý `tam_ung_hang_thang` như một trường lương khi mask quyền `VI`.
- **EFR-04: Contract include_salaries và route-service signature chưa đủ rõ**
  - *Sửa:* Chỉ kích hoạt khi `include_salaries === "true"`, truyền options object xuống service và viết test case kiểm chứng.
- **EFR-05: Shared response meta chưa khai báo truncated**
  - *Sửa:* Bổ sung `truncated?: boolean` vào interface `ApiListResponse` của shared package.
- **EFR-06: Numeric limit chưa được validate/clamp theo hard limit**
  - *Sửa:* Thiết lập `EXPORT_LIMIT = 5000` làm giới hạn cứng cho mọi request bulk/export.
- **EFR-07: Traceability/audit cho full salary export chưa đủ task hóa**
  - *Sửa:* Thêm task audit log chi tiết ghi rõ `export_type: "employee_full_with_salary"`.
- **EFR-08: Verification bulk limit và semantics ngưỡng 5000 chưa đủ rõ**
  - *Sửa:* Thêm task verify với mock dataset lớn hơn 5000 dòng để kích hoạt truncated cảnh báo trên UI.

### Phát Hiện Bổ Sung
- Không có.

---

## Round 2 - 2026-06-19T10:05:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `packages/shared/src/constants/khoi.ts:22-31`
  - `backend/src/services/employeeService.ts:135-137`
  - `backend/src/services/employeeService.ts:279-280`

### EFR Đã Chấp Nhận:
- **EFR-09: Ví dụ filter dùng trạng thái không tồn tại, làm mất nhân sự chính thức**
  - *Sửa:* Đã cập nhật `FEATURE_TASKS.md` Task 2.2 sửa bộ lọc query param thành `trang_thai=thu_viec,chinh_thuc,nghi_sinh` (vì enum không có `dang_lam`, trạng thái hoạt động chính là `chinh_thuc`).
- **EFR-10: Bản sửa quyền lương chưa task hóa test VA/mixed/reviewer**
  - *Sửa:* Đã mở rộng `FEATURE_PLAN.md` và `FEATURE_TASKS.md` Task 1.7 để bắt buộc kiểm thử ma trận phân quyền chi tiết (bao gồm: SA, EA/VA, VI, user mixed quyền EA khối A + VI khối B, reviewer assigned được xem lương và reviewer unassigned bị che giấu).

### Phát Hiện Bổ Sung
- Không có.

---

## Round 3 - 2026-06-19T10:22:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `backend/src/routes/employees.ts:47-83`

### EFR Đã Chấp Nhận:
- **EFR-11: `include_salaries=true` có thể né audit/rate-limit khi gọi phân trang nhỏ**
  - *Sửa:* Đã cập nhật `FEATURE_PLAN.md` và `FEATURE_TASKS.md` để đảm bảo **tất cả** các request có `include_salaries=true` đều phải kích hoạt `exportRateLimiter` (giới hạn 5 lần/phút/user) và ghi nhận vào `audit_log`, bất kể `limit` lớn hay nhỏ, triệt tiêu hoàn toàn nguy cơ quét/cào dữ liệu lương qua phân trang nhỏ.

### Phát Hiện Bổ Sung
- Không có.
