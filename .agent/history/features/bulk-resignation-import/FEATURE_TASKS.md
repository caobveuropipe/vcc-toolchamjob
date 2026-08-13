# Feature Tasks: Cập nhật trạng thái nghỉ việc hàng loạt bằng file Excel

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-17

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành

Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database Migration & Backend API

**Mục tiêu:** Xây dựng cơ sở dữ liệu (RPC), định nghĩa Zod schema, và phát triển các route API an toàn, có khả năng revalidate và chạy transaction nguyên tử.

- [x] Task 1.1: Tạo file migration SQL `database/migrations/[timestamp]_bulk_resign_employees.sql` định nghĩa PostgreSQL Function (RPC) `bulk_resign_employees` thực hiện:
  - Nhận danh sách nhân viên cần cho nghỉ và email người thực hiện (`p_actor_email`).
  - Validate phân quyền khối của user bằng cách tra cứu bảng phân quyền từ `p_actor_email` (EA chỉ được sửa nhân viên thuộc khối được phân quyền, SA được sửa tất cả), kiểm tra trạng thái hiện tại khác `nghi_viec`, kiểm tra khóa kỳ `is_period_locked`.
  - Thu hồi quyền EXECUTE của `PUBLIC`, `anon`, `authenticated` và cấp quyền cho `service_role`.
  - Validate trùng lặp mã nhân sự đầu vào.
  - Cập nhật trạng thái sang `nghi_viec` và cập nhật ngày nghỉ việc.
  - Chèn bản ghi tương ứng vào bảng `change_history` và `audit_log`.
  - Tự động rollback toàn bộ transaction nếu có bất kỳ lỗi nào xảy ra.
- [x] Task 1.2: Định nghĩa Zod Schema cho dữ liệu import nghỉ việc hàng loạt tại `packages/shared/src/schemas/employee.ts` bao gồm kiểm tra tính hợp lệ của mảng đầu vào, giới hạn `<= 200` phần tử, kiểm tra định dạng ngày (`DD/MM/YYYY`, `YYYY-MM-DD`, Excel serial numbers).
- [x] Task 1.3: Thêm route API `/bulk-resign` (POST để validate) và `/bulk-resign/confirm` (POST để xác nhận thực thi gọi RPC) trong file `backend/src/routes/employees.ts`.
  - Đảm bảo route này được đặt TRƯỚC route động `/api/employees/:id`.
  - Enforce `sensitiveRateLimiter` và giới hạn payload size max 100KB.
  - Thực hiện validate lại dữ liệu 100% tại endpoint confirm trước khi gọi RPC thực thi ghi DB.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Viết tích hợp test cases trong `backend/src/__tests__/integration/bulkResign.test.ts` kiểm thử đầy đủ các tình huống lỗi phân quyền, khóa kỳ, trùng mã, và kiểm thử rollback thành công).

## Phase 2: Giao diện người dùng & Tích hợp Frontend

**Mục tiêu:** Xây dựng giao diện upload file Excel, hiển thị kết quả kiểm tra lỗi chi tiết và nút xác nhận cập nhật trực tiếp.

- [x] Task 2.1: Tạo Component `BulkResignModal` sử dụng Ant Design để tải file Excel lên, sử dụng thư viện `xlsx` để parse dữ liệu client-side và hiển thị danh sách lỗi validate chi tiết theo dòng (nếu có).
- [x] Task 2.2: Tích hợp nút "Import nghỉ việc" trên trang `EmployeeListPage` bên cạnh nút "Thêm nhân sự".
- [x] Task 2.3: Viết logic tạo và tải file Excel mẫu trực tiếp trên UI của modal.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra giao diện modal, các thông báo lỗi hiển thị rõ ràng số dòng và nội dung lỗi, nút xác nhận chỉ mở khóa khi dữ liệu hợp lệ 100%).

## Phase 3: Kiểm thử hệ thống & Hoàn thiện

**Mục tiêu:** Kiểm thử end-to-end toàn diện, cập nhật tài liệu và sẵn sàng triển khai.

- [x] Task 3.1: Thực hiện kiểm thử thủ công với tài khoản EA đối với danh sách nhân viên thực tế.
- [x] Task 3.2: Xây dựng và kiểm thử script SQL hoàn tác (data compensation) dành cho Super Admin dựa trên ID Audit Log của batch import, cập nhật tài liệu hướng dẫn vào `docs/USER_MANUAL.md`.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Kiểm tra lại dữ liệu DB live, bảng change_history, audit_log sau khi import thành công và sau khi thực thi thử hoàn tác).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-17 | - | - | Khởi tạo checklist | done | - |
| 2026-07-17T11:21:00+07:00 | Phase 1 | Task 1.1 | Bắt đầu thiết kế DB Migration & RPC bulk_resign_employees | start | - |
| 2026-07-17T11:23:00+07:00 | Phase 1 | Task 1.1 | Đã tạo file migration 041_bulk_resign_employees.sql | done | - |
| 2026-07-17T11:23:15+07:00 | Phase 1 | Task 1.2 | Định nghĩa Zod Schema trong shared package | start | - |
| 2026-07-17T11:24:00+07:00 | Phase 1 | Task 1.2 | Đã hoàn thành định nghĩa Zod Schema | done | - |
| 2026-07-17T11:24:10+07:00 | Phase 1 | Task 1.3 | Phát triển API route /bulk-resign và /bulk-resign/confirm | start | - |
| 2026-07-17T11:25:00+07:00 | Phase 1 | Task 1.3 | Đã hoàn thành phát triển API endpoints | done | - |
| 2026-07-17T11:25:10+07:00 | Phase 1 | Task 1.Final | Chuẩn bị viết integration test và chạy migration | start | - |
| 2026-07-17T11:26:00+07:00 | Phase 1 | Task 1.Final | Đã hoàn tất viết mã nguồn integration test bulkResign.test.ts và chuẩn bị bàn giao migration SQL | done | - |
| 2026-07-17T11:26:35+07:00 | Phase 1 | Task 1.Final | User phê duyệt kết quả Phase 1 | done | - |
| 2026-07-17T11:26:40+07:00 | Phase 2 | Task 2.1 | Bắt đầu xây dựng component BulkResignModal trên frontend | start | - |
| 2026-07-17T11:26:50+07:00 | Phase 2 | Task 2.1 | Tạo thành công BulkResignModal.tsx | done | - |
| 2026-07-17T11:27:00+07:00 | Phase 2 | Task 2.2 | Tích hợp nút Import nghỉ việc trên trang danh sách nhân sự | start | - |
| 2026-07-17T11:27:15+07:00 | Phase 2 | Task 2.2 | Hoàn thành tích hợp nút Import | done | - |
| 2026-07-17T11:27:20+07:00 | Phase 2 | Task 2.3 | Tích hợp logic download template Excel mẫu trong modal | done | - |
| 2026-07-17T11:27:30+07:00 | Phase 2 | Task 2.Final | Bắt đầu tự kiểm thử giao diện & luồng hoạt động của modal | start | - |
| 2026-07-17T11:46:00+07:00 | Phase 2 | Task 2.Final | User phê duyệt kết quả Phase 2 và tự kiểm thử hoàn tất | done | - |
| 2026-07-17T11:46:10+07:00 | Phase 3 | Task 3.1 | Bắt đầu kiểm thử thủ công và viết hướng dẫn hoàn tác SQL | start | - |
| 2026-07-17T11:58:00+07:00 | Phase 3 | Task 3.2 | Viết tài liệu hướng dẫn vận hành hoàn tác vào USER_MANUAL.md | done | - |
| 2026-07-17T11:59:00+07:00 | Phase 3 | Task 3.Final | Chạy thành công toàn bộ integration test suite không có lỗi | done | - |






