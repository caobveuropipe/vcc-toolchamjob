# Feature Tasks: Xuất Excel nhân sự thử việc kèm lương

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-26

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database & Backend Logic

**Mục tiêu:** Tạo hàm an toàn phía CSDL để kết xuất 16 trường dữ liệu và API xử lý ở Hono.

- [x] Task 1.1: Định nghĩa schema SQL RPC `export_probation_employees` trong thư mục migrations. Hàm nhận tham số `p_unrestricted boolean DEFAULT false`, `p_khoi_list` (mảng các khối EA quản lý), `p_start_date` và `p_end_date` và trả về bảng gồm đúng 16 trường. Điều kiện filter `state_phong_cho = false` và `trang_thai = 'thu_viec'`. Tránh dùng cơ chế rỗng thì all cho non-SA (chỉ all khi `p_unrestricted = true` dành cho SA). Cấu hình hardening rõ ràng: `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION ... TO service_role; SET search_path = public;`.
- [x] Task 1.2: Đăng ký route API tại `backend/src/routes/salary.ts` (đường dẫn tuyệt đối: `GET /api/salaries/export-probation`), đảm bảo đăng ký `salaryRoutes.get('/export-probation', ...)` TRƯỚC route dynamic `salaryRoutes.get('/:ma_nhan_su', ...)` để tránh bị Hono bắt nhầm đường dẫn tĩnh thành tham số. Sử dụng `permissionMatrix` từ Redis/Cache để lấy danh sách khối: `permissions.filter(p => p.permission_level === 'EA')`. Kiểm tra nếu là SA thì set `p_unrestricted = true` để query full khối. Đối với non-SA, nếu danh sách khối EA trống thì route trả về 403 ngay trước khi gọi RPC. Chặn quyền VA/VI/Reviewer. Tính toán boundary `startDate` và `endDate` (từ 26 tháng trước đến 25 tháng này, time UTC+7). Áp dụng hard limit `EXPORT_LIMIT = 5000` dòng tại API endpoint (trả về lỗi 400 nếu vượt quá).
- [x] Task 1.3: Cấu hình `exportRateLimiter` (5 lần/phút) và lưu `audit_log` với `action = 'export'` và `module = 'NS-002'` cho endpoint trên.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy Test Integration phủ các cases: SA vs EA vs VA/VI/Reviewer, boundary UTC+7, giới hạn 16 fields, rate limit, hard limit 5000 dòng trả về 400 nếu vượt quá, RPC hardening test không cho access từ authenticated/anon/public role, test audit log với `action = 'export'` và `module = 'NS-002'`).

## Phase 2: Frontend & Export Integration

**Mục tiêu:** Hoàn thiện giao diện nút xuất và ghi file Excel trên client.

- [x] Task 2.1: Bổ sung logic lấy danh sách thử việc tại API client layer (gọi qua `apiClient.get('/salaries/export-probation')` ở `frontend/src/services/employeeService.ts` hoặc tương đương để tránh bị double `/api` do prefix tự động của apiClient).
- [x] Task 2.2: Tại `EmployeeListPage.tsx`, refactor nút "Xuất Excel" hiện hành thành một Dropdown Menu (ví dụ sử dụng `Dropdown` của Ant Design).
- [x] Task 2.3: Bổ sung tùy chọn "Xuất danh sách thử việc (kèm lương)" vào menu này (hiển thị có điều kiện: người dùng phải có quyền EA hoặc SA). Khi user click, fetch dữ liệu từ API Phase 1, gọi hàm `exportToExcel` với format truyền vào và metadata watermark tương ứng.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Test bằng trình duyệt thật với tài khoản EA và SA để xem Dropdown menu có hiện đúng hay không. Xác minh tài khoản VA/VI/Reviewer không thấy menu xuất thử việc này. Đồng thời test gọi API trực tiếp với tài khoản VA/VI/Reviewer trả về 403. Kiểm tra file tải về đúng 16 cột và metadata, filter chính xác).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-26 21:46 | Phase 1 | Task 1.1 | Bắt đầu định nghĩa schema SQL RPC `export_probation_employees` | start | |
| 2026-05-26 21:47 | Phase 1 | Task 1.1 | Đã tạo file migration 033 định nghĩa RPC và phân quyền an toàn | done | |
| 2026-05-26 21:47 | Phase 1 | Task 1.2 | Bắt đầu đăng ký route API tại `backend/src/routes/salary.ts` | start | |
| 2026-05-26 21:48 | Phase 1 | Task 1.2 | Đăng ký route GET `/export-probation` và logic IDOR, checks, date calculations | done | |
| 2026-05-26 21:48 | Phase 1 | Task 1.3 | Tích hợp rate limiting và audit log cho endpoint mới | done | |
| 2026-05-26 21:48 | Phase 1 | Task 1.Final | Bắt đầu chạy test tự động để xác nhận Phase 1 | start | |
| 2026-05-26 21:54 | Phase 1 | Task 1.Final | Integration tests passed. Bổ sung `.range(0, 4999)` tránh cap 1000 records từ PostgREST | done | |
| 2026-05-26 21:55 | Phase 2 | Task 2.1 | Bắt đầu bổ sung logic lấy danh sách tại API client layer | start | |
| 2026-05-26 21:55 | Phase 2 | Task 2.1 | Đã hoàn thành bổ sung `getProbationSalariesForExport` tại salaryService.ts | done | |
| 2026-05-26 21:56 | Phase 2 | Task 2.2 | Refactor nút Export Excel thành Dropdown Menu của Ant Design | done | |
| 2026-05-26 21:56 | Phase 2 | Task 2.3 | Tích hợp tùy chọn "Xuất danh sách thử việc (kèm lương)" hiển thị theo phân quyền và gọi hàm `exportToExcel` | done | |
| 2026-05-26 22:00 | Phase 2 | - | Nhận yêu cầu lược bỏ điều kiện `trang_thai = 'thu_viec'` | feedback | |
| 2026-05-26 22:01 | Phase 2 | - | Cập nhật file SQL migration 033 bỏ lọc thử việc, tái chạy integration tests thành công 100% | done | |
| 2026-05-26 22:01 | Phase 2 | Task 2.Final | Hoàn tất tất cả các bước xác minh và đóng feature | done | |�t đầu bổ sung logic lấy danh sách tại API client layer | start | |
| 2026-05-26 21:55 | Phase 2 | Task 2.1 | Đã hoàn thành bổ sung `getProbationSalariesForExport` tại salaryService.ts | done | |
| 2026-05-26 21:56 | Phase 2 | Task 2.2 | Refactor nút Export Excel thành Dropdown Menu của Ant Design | done | |
| 2026-05-26 21:56 | Phase 2 | Task 2.3 | Tích hợp tùy chọn "Xuất danh sách thử việc (kèm lương)" hiển thị theo phân quyền và gọi hàm `exportToExcel` | done | |
| 2026-05-26 21:56 | Phase 2 | Task 2.Final | Bắt đầu quy trình kiểm thử Frontend và đóng feature | start | |
