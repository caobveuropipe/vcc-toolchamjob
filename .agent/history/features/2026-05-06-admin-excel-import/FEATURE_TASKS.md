# Feature Tasks: Migrate Dữ liệu (Nhân sự, Tiền lương & Người soát xét)

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Phê duyệt**: Review Vòng 11 (Template Source Generator, Mapping Silent Drop Logic, FormData Content-Type Header)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Shared Core & Lõi DB Transaction (Type, Constants & Script Template Source)

**Mục tiêu:** Cài đặt cơ sở dữ liệu xử lý Atomic Transaction an toàn cho việc Insert hàng loạt, sửa nội dung file cấu hình Template Hướng dẫn cũ.

- [x] Task 1.1: Sửa nội dung Script sinh File Excel ở `scripts/create_employee_import_template.mjs` và `scripts/create_reviewer_import_template.mjs`.
  - Thay đổi các đoạn mô tả Text Hướng Dẫn cho User ở sheet `HuongDan`: Xóa bỏ dòng chữ "ghi đè khi người dùng xác nhận".
  - Sửa lại Policy diễn giải cho Nhân Sự & Reviewer thành: "Import theo cơ chế THÊM MỚI (INSERT ONLY). Nếu hệ thống phát hiện trùng mã nhân sự có sẵn, dòng dữ liệu đó sẽ bị tự động bỏ qua (Skip Duplicate) và KHÔNG ghi đè".
- [x] Task 1.2: Tạo migration `database/migrations/018_bulk_import_rpc_and_audit.sql`.
  - ALTER constraint `audit_log.action` bổ sung `'bulk_import'`. 
  - Tạo FUNCTION `bulk_import_block_1(p_data JSONB) RETURNS UUID[]` sử dụng `SECURITY DEFINER`. Wrap Insert Transaction `ON CONFLICT DO NOTHING`. Explicit Property `state_phong_cho = false`.
- [x] Task 1.3: Cập nhật Constant Constants, Type Literal `@vcc/shared/src/schemas/admin.ts`.
  - Khai báo `'bulk_import'` vào hằng số cấu hình mảng `ADMIN_AUDIT_ACTIONS`.
  - Định nghĩa Schema Zod API Mảng `ExcelMigrationValidationRow`.
- [x] Task 1.4: Cập nhật Cross-Enum Literal tại `@vcc/shared/src/schemas/snapshot.ts` (nếu liên đới). Bổ sung enum action.
- [x] Task 1.5: Đồng bộ Enum Type Literal tại `packages/shared/src/types/admin.ts`.
  - Gắn item `'bulk_import'` vào list Union type `AdminAuditAction`. 
- [x] Task 1.6: Mở API Inner Export tại thùng chứa `packages/shared/src/schemas/index.ts` và `packages/shared/src/types/index.ts`.
- [x] Task 1.7: Sync Type tại list action của hàm Backend Helper `backend/src/services/auditService.ts`.
- [x] Task 1.Final: 🧪 Test Build `@vcc/shared` + Chạy lại script sinh ra 2 template mjs có chứa nội dung giải thích mới nhét đầy thư mục /docs/templates/.

## Phase 2: Mở rộng Backend Multi Template Processor

**Mục tiêu:** Parse Sheet, Mapping Check Tồn tại, Resolve Null Drop Error.

- [x] Task 2.1: Bổ sung Libraries trong `backend/package.json` (`xlsx`, `@hono/body-limit`).
- [x] Task 2.2: Khởi tạo file dịch vụ `backend/src/services/adminImportService.ts`.
  - **ZipGuard Logic:** Chặn Uncompressed_size > 50MB.
  - **Parser Pipeline Sheet Filter:** Đọc xlsx, bỏ qua các sheet Hướng dẫn, lấy đúng data list (`NhanSu`, `Luong`, `ReviewerEmployee`).
  - **Check Validation (Silent Drop Catching):** Thực thi lệnh lấy DB mapping theo list `ma_nhan_su`. Với những record Reviewer nhập mã số Nhân sự vớ vẩn / Không tìm thấy ID DB mapping trả về `null` -> Lập cập cờ Báo Lỗi Error (Validation Errors) và ném thông tin Row đó vào Mảng trả về JSON của API Preview để chặn Frontend lại. Không được nấp nhẹm ngó lơ các ID này vì nó sẽ khiến Reviewer không tồn tại Data. Các field không tìm thấy không được phép Build DataBlock Submit.
- [x] Task 2.3: Viết logic Action `commitMigrationData`:
  - Supabase RPC `bulk_import_block_1`.
  - Lệnh Upsert Reviewer sử dụng strict full flag contract: `supabase.from('employee_reviewers').upsert(dataBlock2, { onConflict: 'employee_id,reviewer_email', ignoreDuplicates: true }).select('id')` lấy mảng gán biến `inserted_reviewer_ids`.
  - Ghi Audit Logs Record Detail { Employee_ids vs Reviewer_ids }.
- [x] Task 2.4: Mở Route HTTP Body Limit 5MB tại Router Import `admin.ts`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2.

## Phase 3: Setup Vite Static Build Asset & UI Fetch React

**Mục tiêu:** Cấu trúc FormData Header Bypass Fetch, Config Vite Build Container Asset.

- [x] Task 3.1: Config Web Container Build (`frontend`).
  - Khai báo Dev Dependences `vite-plugin-static-copy` ở `frontend/package.json`.
  - Setup Frontend Dockerfile Image chạy Command `COPY docs/templates/ ./docs/templates/` build stage layer.
  - Setup Vite Plugin Array Rule tự động hút `docs/templates/` chuyển sang root Static lúc Dev/Build Application.
- [x] Task 3.2: Khai báo Service method `uploadMultipart` cho Fetch utils `frontend/src/services/api.ts`.
  - **Bẫy Header:** Trong logic hàm API call chung của file này, config Request Object sử dụng `FormData`. Đồng thời PHẢI có đoạn code `delete customized_headers['Content-Type']` (Trường Default của hệ thống setup ngầm là application/json). Việc gỡ bỏ header Content-Type này giúp trình duyệt tự động sinh mã unique `boundary=xxxx` chuẩn native cho Multipart payload. Nếu không API Server Hono sẽ báo lỗi ParseBody Failed.
- [x] Task 3.3: Khởi tạo Component Màn UI `ExcelImportTab.tsx`. Link tải tĩnh /templates/ 2 templates. Check DOM validate size. Màn Form render Table xanh đỏ Validation Error.
- [x] Task 3.4: Function Endpoint `/admin/migrate-bulk/...` trigger call function `uploadMultipart` vừa tạo trong `ExcelImportTab`. Bắt buộc gửi FormData key `mode` là `'insert_only'` cho route commit.
- [x] Task 3.5: Cắm tab Item Component vào menu luồng User của trang đích `AdminDashboard.tsx`.
- [/] Task 3.Final: 🧪 Test dev SPA Browser upload Fetch Header tự sinh chuẩn xác Boundary Multipart. Template tải chứa câu String Guide Insert Only. Màn Review báo đỏ với Mã Nhân Sự Tào lao không resolve được.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-22 15:52 | Phase 1 | Task 1.1 | Bắt đầu Phase 1 — sửa text hướng dẫn trong scripts template | start | Feature bắt đầu triển khai |
| 2026-04-22 16:05 | Phase 1 | Task 1.1–1.7 | Hoàn thành tất cả task thường Phase 1 | done | Scripts, migration, shared types/schemas, barrel exports, auditService |
| 2026-04-22 16:05 | Phase 1 | Task 1.Final | Self-test: tsc --noEmit pass (no admin/import errors), 2 mjs scripts pass | done | Chờ User confirm |
| 2026-04-22 16:07 | Phase 1 | Task 1.Final | User confirm pass. Fix bonus: khôi phục enum khoi.ts (dang_lam→chinh_thuc) | done | Phase 1 hoàn thành |
| 2026-04-22 16:08 | Phase 2 | Task 2.1 | Bắt đầu Phase 2 — install dependencies backend | start | |
| 2026-04-22 16:15 | Phase 2 | Task 2.1–2.4 | Hoàn thành: xlsx install, adminImportService.ts, commit logic, routes | done | |
| 2026-04-22 16:15 | Phase 2 | Task 2.Final | Self-test: backend tsc --noEmit 0 errors | done | Chờ User confirm |
| 2026-04-22 16:21 | Phase 2 | Task 2.Final | User deferred manual test to E2E Phase 3 | done | Phase 2 hoàn thành |
| 2026-04-22 16:22 | Phase 3 | Task 3.1 | Bắt đầu Phase 3 — Frontend UI & Vite config | start | |
| 2026-04-22 16:30 | Phase 3 | Task 3.1–3.5 | Hoàn thành: vite-static-copy, uploadMultipart, ExcelImportTab, AdminDashboard tab | done | |
| 2026-04-22 16:30 | Phase 3 | Task 3.Final | Self-test: frontend tsc --noEmit 0 errors, backend tsc 0 errors | done | Chờ User E2E test |
| 2026-04-22 16:51 | Phase 2 | Task 2.Final | Bổ sung và chạy run Vitest integration test (adminImport.test.ts) | done | 4/4 pass, covers DB constraints & Insert Only policy |
| 2026-04-23 09:45 | Phase 3 | Task 3.3 | Bổ sung Filtering/Sorting cho cột Trạng thái UI | done | Theo yêu cầu User |
| 2026-04-23 09:46 | Phase 1 | Task 1.2 | Tạo migration 019 & Cập nhật RPC map 'ghi_chu' | done | Hỗ trợ thông tin liên hệ phụ |
| 2026-04-23 09:47 | Phase 1 | Task 1.1 | Cập nhật script template thêm cột Ghi chú | done | |


