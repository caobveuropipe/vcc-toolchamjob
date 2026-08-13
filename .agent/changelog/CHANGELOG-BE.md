# Changelog BE - Tool Nhân Sự VCC

> Phạm vi: Backend, API, service, worker, integration, auth logic, validation phía server
> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> Ngôn ngữ: Tiếng Việt

## [2026-08-13] v8.1.0 - Refactor backend GAS client API Snapshot nhân sự & lương

- **Backend Integration (`client/pg_general_1.js`)**:
  - Tích hợp endpoint API `GET /api/snapshots/employees-detail` lấy danh sách nhân sự snapshot thay cho dữ liệu mảng 2D legacy.
  - Bổ sung Strict Preflight Check (`APP_ENV` ScriptProperties): Bắt buộc kiểm tra môi trường production fail-closed (yêu cầu `API_BASE_URL` và `INTERNAL_API_KEY`), chỉ fallback dev URL khi `APP_ENV = 'development'` tường minh.
  - Tích hợp `CacheService.getScriptCache()` với TTL 600s tối ưu tốc độ phản hồi backend.
  - Xử lý ngoại lệ HTTP an toàn: Throw Exception khi HTTP non-200 / timeout / auth fail để trigger `withFailureHandler` phía client, phân biệt rõ với mảng rỗng `[]` khi API thành công nhưng không có nhân sự.
- **PowerShell Deployment Scripts (`push-all.ps1`, `deploy-all.ps1`)**:
  - Loại bỏ module `doget` không tồn tại, cập nhật danh sách module thực tế `@("client", "doPost")`.
  - Bổ sung kiểm tra exit code của từng lệnh `clasp push` / `clasp deploy` giúp dừng script ngay khi có lỗi.

## [2026-08-08] v8.0.0 - Authoritative 12-Org-Field Validation & Strict Onboard Schema Flex

- **Backend API & Employee Service (`backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`)**:
  - Hỗ trợ xử lý payload 12 trường tổ chức (bao gồm 6 tên text + 6 UUID FKs: `khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`).
  - Đảm bảo kiểm tra phân quyền Target EA Scope linh hoạt khi submit hoặc duyệt điều chuyển phòng chờ (`PUT /api/employees/:id/submit`).
- **Gói Shared Schema (`packages/shared/src/schemas/employee.ts`)**:
  - Loại bỏ cờ `.strict()` dư thừa tại `createEmployeeOnboardSchema` giúp xử lý linh hoạt payload onboarding gộp giữa `personnel`, `salary` và `temp_uuid` mà không bị từ chối `400 Bad Request`.

## [2026-08-05] v7.9.0 - Scope-Based EA Permission Guard & Machine Key Invariants

- **Quản lý Đơn vị Tổ chức (`backend/src/routes/orgUnits.ts`, `backend/src/services/orgUnitService.ts`)**:
  - Đóng gói middleware `permissionMiddleware` và dynamic config reader `getOrgUnitsMutationMode()` đọc biến môi trường `ORG_UNITS_MUTATION_MODE` (`normal` | `sa_only` | `disabled`). Fail-closed về HTTP 503 Maintenance nếu cấu hình không hợp lệ.
  - Áp dụng DB-authoritative SA Check `checkIsSuperAdmin` querying `superadmins` table trực tiếp.
  - Phân quyền Scope Guard cho các API POST/PUT/PATCH/DELETE: User EA chỉ được thao tác trên các đơn vị thuộc Khối trong phạm vi `user_permissions`; Non-SA bị chặn HTTP 403 FORBIDDEN khi sửa Root Khối, Reparent cross-Khối hoặc xóa node.
  - Bổ sung Guard 409 CONFLICT chặn vô hiệu hóa non-leaf node đang có con/cháu hoạt động.
- **Integration Test Suite (`backend/src/__tests__/integration/orgUnitsScope.test.ts`)**:
  - Tạo bộ test suite mới bao phủ 7 kịch bản: Line Global management, Root Khối rename & machine key invariant, Reparent cross-Khối subtree update, DB RPC NULL role regression test, Non-leaf status 409 conflict, EA Scope Enforcement và Dynamic Env Harness mode switching.


- **Atomic Onboarding Service (`backend/src/services/employeeService.ts`)**:
  - Luồng `createEmployee` và `createEmployeeWithSalary` đồng bộ invoke SQL RPC `fn_create_employee_onboarding` qua service-role client (`supabase`).
  - Map các lỗi domain validation của RPC (claim document thất bại, sai `document_type`, chưa `ready`, replay attack, concurrent claim lock) sang HTTP 400 hoặc 409 thay vì generic HTTP 500.
- **Backend Integration Test Suite (`backend/src/__tests__/integration/employee.test.ts`)**:
  - Bổ sung test cases bao phủ: Direct RPC call rejection (42501 cho `anon` & `authenticated`), Clean DB rollback khi đính kèm file `reserved`, Mixed-session evidence binding, Concurrent double-submit lock (winner HTTP 201 Created, loser HTTP 409/400), Replay attack rejection, và `state_pending` contract.

## [2026-07-29] v7.7.0 - Hiển thị và quản lý chứng từ đính kèm trong Phòng chờ & Chi tiết nhân sự

- **Cơ sở dữ liệu & Migrations (`database/migrations/045_...`, `046_...`)**:
  - Thêm các cột `upload_status`, `expires_at`, `client_attempt_id`, `r2_cleanup_failed` vào `employee_documents` kèm script backfill 100% dữ liệu lịch sử thành `'ready'`.
  - Khai báo partial unique index `idx_employee_docs_attempt` trên `(created_by, client_attempt_id)` và SQL RPC `reserve_document_upload` (khóa `pg_advisory_xact_lock` chống race condition).
  - Khai báo các bảng dọn dẹp mồ côi `r2_cleanup_queue`, `cleanup_state` và các SQL RPCs `fn_try_claim_cleanup_sweep`, `fn_cleanup_expired_documents_batch`, `fn_cleanup_outbox_queue_batch`, `fn_acknowledge_cleanup_results`.
  - Cập nhật các SQL RPCs gán chứng từ trong CÙNG 1 TRANSACTION DUY NHẤT (`save_personnel_pending`, `fn_evaluate_probation`, `save_salary_pending_with_docs`) với security grants chuẩn `service_role`.
- **Presign & Finalize Metadata APIs (`backend/src/routes/documents.ts`, `backend/src/services/documentService.ts`)**:
  - Presign API (`POST /api/documents/presign`): Zod validation bắt buộc `document_type`, tích hợp `clientAttemptId` cho presign retry idempotent.
  - Finalize API (`POST /api/documents`): Phân tách luồng nhận `documentId`, áp dụng Row-Derived Authorization FIRST, xác minh S3 `HeadObject` (giới hạn <= 5MB & khớp `size_bytes` đăng ký), Lazy Sweep dọn dẹp R2 mồ côi ngầm và Idempotent 200 OK Finalize Retry đối với file đã `'ready'`.
  - Xóa tài liệu (`DELETE /api/documents/:id`): Chạy SQL RPC `delete_document_and_audit` thực thi DB-first delete fail-closed atomic và ghi `recordAuditLogStrict` trước khi dọn R2.
  - Read-only GET API (`GET /api/employees/:id/pending-documents`): Đảm bảo 100% Read-only & Idempotent tuyệt đối, lọc `upload_status = 'ready'` và hỗ trợ `document_type` comma-separated filter.

## [2026-07-28] v7.6.6 - Loại bỏ khối Vccorp khỏi cấu hình dùng chung

- **Danh sách Khối văn phòng (`packages/shared/src/constants/khoi.ts`)**:
  - Loại bỏ khối `'Vccorp'` khỏi hằng số dùng chung `KHOI_VALUES` dùng cho validation schemas và database check constraints.

## [2026-07-28] v7.6.5 - Sửa lỗi ghi log lịch sử và hoàn tất bộ công cụ restore DB local

- **Sửa logic ghi log trong `updateProbationReviewer` (`backend/src/services/employeeService.ts`)**: Cải tiến câu lệnh `.select('*')` và thêm filter thay đổi duy nhất cho cột `nguoi_nghiem_thu_thu_viec` trước khi ghi nhận vào `change_history` để chặn đứng ghi nhận log rác (15+ cột null sang giá trị hiện tại).
- **Dọn dẹp debug logs (`backend/src/services/employeeService.ts`)**: Gỡ bỏ hoàn toàn các log console dư thừa và log query thô chứa thông tin PII nhạy cảm trong API `searchAutocompleteEmployees`.
- **Tạo Script khôi phục và kiểm thử DB local (`scripts/restore-local-db.ps1`, `scripts/smoke-check-restore.js`)**:
  - Viết script `restore-local-db.ps1` thực hiện reset và khôi phục dữ liệu qua cơ chế `docker cp` an toàn (không dùng redirect `<` trên PowerShell Windows), preflight check git-ignore để chống rò rỉ dữ liệu PII và preflight DDL reject đối với file SQL.
  - Viết script `smoke-check-restore.js` tự động kiểm tra sức khỏe cơ sở dữ liệu local (replication role, records count, triggers, sentinel data), hỗ trợ parse cả định dạng mảng JSON thô và đối tượng bọc `.rows` trả về từ Supabase CLI.
- **Tích hợp Package Commands (`package.json`, `.gitignore`)**:
  - Bổ sung lệnh `pnpm db:restore` tự động hóa việc gọi script restore local database.
  - Bổ sung `/database_backups/` vào `.gitignore` để loại bỏ hoàn toàn thư mục sao lưu nhạy cảm khỏi git tracking.
- **Cập nhật Test suite (`backend/src/__tests__/`)**:
  - Cập nhật `probationReviewer.test.ts` đo baseline change history trước để assert chính xác mức tăng `exact diff = 1`.
  - Cập nhật `employee.test.ts` tự động chèn/xóa fixture nhân sự cũ pending (`TESTPENDING1`) để đảm bảo test `exclude_pending_new_hires` luôn có dữ liệu thật.

## [2026-07-28] v7.6.4 - Chặn Triệt Để Test Tác Động Vào DB Cloud

- **Cô lập và bảo vệ database chạy test (`backend/vitest.integration.setup.ts`, `backend/src/utils/safetyGuard.ts`)**:
  - Tách hàm validate local Supabase URL ra tệp `safetyGuard.ts` độc lập để tăng tính tái sử dụng và tránh side-effects khi import.
  - Cập nhật `vitest.integration.setup.ts` để tự động nạp môi trường từ `.env.test` (và `.env.test.local` nếu có) bằng `dotenv` trước, rồi chạy `validateLocalSupabaseUrl()` vô điều kiện.
  - Ngăn không cho `backend/src/config/env.ts` nạp tệp `.env.local` khi `process.env.NODE_ENV === 'test'` để tránh việc đè URL Cloud.
- **Tự động hóa môi trường kiểm thử local (`backend/scripts/sync-migrations.cjs`, `backend/scripts/seed_dev_users.ts`)**:
  - Viết script `sync-migrations.cjs` tự động đồng bộ tệp migrations sang local Supabase và tự động vá assertions (row counts của migration 039/040 về 0) khi chạy trên local.
  - Cập nhật script `seed_dev_users.ts` hỗ trợ cờ `--test` để nạp đúng file cấu hình test với `override: true` và tự động cho phép seed trên local test.
  - Chuyển cấu hình `auto_expose_new_tables = true` trong `supabase/config.toml` nhằm tự động phân quyền truy cập DB cho `service_role` của local Supabase container.
- **Dọn dẹp và cách ly test files (`backend/src/__tests__/`)**:
  - Loại bỏ hoàn toàn các lệnh `dotenv.config(...)` dư thừa trong tất cả 15 tệp integration test.
  - Bổ sung chốt chặn kiểm tra an toàn URL không cho phép chạy các tệp `scratch_*` nếu trỏ tới URL non-local.
  - Thêm unit test kiểm tra tính năng fail-fast bằng child-process trong `safetyGuard.test.ts`.

## [2026-07-28] v7.6.3 - Kiểm Thử Xác Minh Tác Động và An Toàn PR #8 & PR #9 (Snapshot Detail API)

- **Local Safety Harness & DB Protection (`backend/vitest.integration.setup.ts`, `backend/scripts/seed_dev_users.ts`)**:
  - Thiết lập strict URL parser (`new URL()`) kiểm tra protocol (`http:`), hostname (`127.0.0.1`/`localhost`), và port (`54321`). Lập tức ngắt process nếu trỏ sang Supabase Cloud/Prod DB.
  - Tích hợp Local Safety Check vào script `seed_dev_users.ts` đảm bảo an toàn tuyệt đối khi seed tài khoản dev.
  - Mock toàn cục `@upstash/redis` client cho suite integration test.
  - Thêm File-level Contract header quy định invariant bảo vệ môi trường DB.
- **Remediation & Regex Tightening (`backend/src/services/snapshotService.ts`)**:
  - Cập nhật regex parse tháng thành `^T(0?[1-9]|1[0-2])\.(\d{4})$` để vừa chặn over-padded month (`T001.2024`, `T012.2024`), vừa giữ đủ 2 capture groups cho month (`match[1]`) và year (`match[2]`).
- **Unit & Integration Test Matrix (`backend/src/__tests__/`)**:
  - Thêm suite unit test `safetyGuard.test.ts` (7 tests pass 100%) kiểm tra âm tính/dương tính với các loại URL lừa đảo.
  - Thêm suite unit test `snapshotDetailService.test.ts` (10 tests pass 100%) kiểm tra toàn bộ Branch Matrix của `getSnapshotEmployeesDetail` và query builder parameters.
  - Thêm suite integration test `snapshotsDetailApi.test.ts` (7 tests pass 100% trên Supabase Local Docker CLI) kiểm chứng Security Authentication (`x-api-key`), Route Anti-Collision, và Data Assertions.

## [2026-07-25] v7.6.2 - NS-003: API Backend Lấy Snapshot Chi Tiết Nhân Sự và Lương Target

- **API Router (`backend/src/routes/snapshots.ts`)**:
  - Thêm endpoint static route GET `/api/snapshots/employees-detail` trả về danh sách chi tiết nhân sự đã chốt snapshot hàng tháng.
  - Bảo mật bằng `x-api-key` khớp với `env.INTERNAL_API_KEY` (không đi qua session authMiddleware thông thường).
  - Lọc bỏ các snapshot có trạng thái `snapshot_status = 'deleted'`.
  - Tự động chuẩn hóa query parameter `thang` (nhận dạng `Tx.YYYY` hoặc `T0x.YYYY`) và map kết quả `thang` trả về dạng `Tx.YYYY`.
  - Hỗ trợ trả về `{ data: [] }` với HTTP status 200 thay vì 404 khi không tìm thấy dữ liệu.
  - Ghi log audit `logger.info({path, ip, thang})` khi gọi API thành công.
  - Cập nhật Contract header mô tả 16 HTTP endpoints của module snapshots.
- **Snapshot Service (`backend/src/services/snapshotService.ts`)**:
  - Thêm hàm `getSnapshotEmployeesDetail(thang)` để query dữ liệu snapshot từ bảng `snapshot_employees` kết hợp lọc `snapshots!inner`.
  - Bổ sung guard check `monthNum` trong khoảng `[1, 12]`, ném lỗi `INVALID_FORMAT` nếu vượt quá giới hạn.
  - Map đúng cấu trúc JSON gồm 12 trường dữ liệu: `thang`, `ma_nhan_su`, `ho_va_ten`, `email`, `khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su`, `luong_target_gt`, `luong_target_cc`.
- **Integration Tests (`backend/src/__tests__/integration/snapshots.test.ts`)**:
  - Bổ sung bộ 5 integration test cases kiểm chứng endpoint `/employees-detail` bao phủ các kịch bản: gọi thành công trả về đúng 12 trường, thiếu/sai key (401), query param sai định dạng (400), tháng không tồn tại trong DB (200 rỗng), và lọc bỏ snapshot có trạng thái deleted (200 rỗng).
- **Vitest Config (`backend/vitest.integration.config.ts`)**:
  - Bổ sung custom `onLog` hook trả về `undefined` để tránh crash lỗi binding Native Rolldown khi chạy test suite.

## [2026-07-24] v7.6.1 - Chuẩn hóa thông điệp lỗi Submit Phòng Chờ (HTTP 400)

- **Employee Service (`backend/src/services/employeeService.ts`)**:
  - Chuyển đổi xử lý ngoại lệ từ SQL RPC `submit_employee_pending` tại hàm `submitFromPending` từ HTTP 500 (`Internal Server Error`) sang HTTP 400 (`Bad Request`).
  - Bóc tách làm sạch các tiền tố Postgres error (`P0001:`, `ERROR:`) để Frontend nhận được thông điệp lỗi nghiệp vụ nguyên bản và hiển thị Toast chính xác (ví dụ: thông báo yêu cầu chốt Snapshot kỳ trước).

## [2026-07-24] v7.6.0 - Hỗ trợ exclude_pending_new_hires tự động lọc nhân sự nháp mới TMP khỏi API danh sách chính thức và Autocomplete

- **API Router (`backend/src/routes/employees.ts`)**:
  - Hỗ trợ query parameter `exclude_pending_new_hires`. Khi xem danh sách chính thức hoặc xuất Excel không truyền parameter này, mặc định kích hoạt `exclude_pending_new_hires = true`; khi gọi từ Phòng chờ (`state_phong_cho = true`), mặc định là `false`.
- **Employee Service (`backend/src/services/employeeService.ts`)**:
  - Cập nhật `listEmployees` hỗ trợ tham số `excludePendingNewHires` áp dụng PostgREST filter `state_phong_cho.eq.false,ma_nhan_su.not.ilike.TMP%` (lọc bỏ nhân sự nháp mới `TMP...` chưa duyệt, giữ nguyên nhân sự cũ đang hoạt động có pending data).
  - Cập nhật `searchAutocompleteEmployees` tự động áp dụng bộ lọc loại trừ nhân sự nháp mới `TMP...`.
- **Integration Tests (`backend/src/__tests__/integration/employee.test.ts`)**:
  - Bổ sung 4 integration test cases kiểm chứng bộ lọc `exclude_pending_new_hires` và autocomplete với 100% tỷ lệ pass.

## [2026-07-20] v7.5.0 - Sửa lỗi viết tắt khối và chuẩn hóa tháng đối chiếu active-keys

- **Dịch vụ Snapshot (`backend/src/services/snapshotService.ts`)**:
  - Cập nhật hàm `khoisAbbreviation` để bảo toàn tên đầy đủ cho các khối sử dụng tên đầy đủ tại hệ thống cũ (`BIZFLY CLOUD`, `SOHAGAME`, `BIZFLY MARTECH & SALE TECH`, `KND`, `MY SOHA`, `VCCORP`, `VIVA`, `NANDA`, `CNND`, và bổ sung thêm `SUPPORT`) nhằm tránh việc cắt cụt ký tự không hợp lệ.
  - Chuẩn hóa tiền tố `prefix` trong `getActiveKeys` sử dụng `T${monthNum}.${yearNum}` để tự động loại bỏ zero-padding ở tháng (ví dụ: `T06.2026` -> `T6.2026`).
- **Integration Tests (`backend/src/__tests__/integration/snapshots.test.ts`)**:
  - Bổ sung các integration tests dạng table-driven kiểm chứng quy tắc viết tắt/giữ nguyên tên đầy đủ của toàn bộ các khối mới, khối đặc thù cũ, và khối `SUPPORT`, cũng như kiểm tra tính chính xác của cơ chế tự động loại bỏ zero-padding của tháng.

## [2026-07-18] v7.4.0 - Bổ sung integration tests và cô lập trạng thái snapshot trong bộ test

- **Integration Tests (`backend/src/__tests__/integration/snapshots.test.ts`):**
  - Bổ sung 4 ca kiểm thử tích hợp bao phủ luật chặn duyệt mới (chặn khi chưa chốt kỳ trước, cho phép khi đã chốt, test biên ngày 25/26, và fallback ngày điều chỉnh lương của profile chính thức).
  - Tự động dọn dẹp (cleanup) các test record trong phòng chờ của khối `Admicro` ở `beforeAll` để tránh ô nhiễm dữ liệu kiểm thử (test pollution).
- **Integration Tests (`backend/src/__tests__/integration/salary.test.ts`):**
  - Khắc phục xung đột chạy kiểm thử song song bằng cách thiết lập snapshot `'2026-06'` ban đầu ở trạng thái `'draft'` và tự động chuyển đổi sang `'locked'` ngay trước Case 5b, cho phép các kiểm thử độc lập chạy đồng thời và ổn định 100%.

## [2026-07-17] v7.3.0 - Tinh chỉnh cơ chế chốt snapshot phòng chờ và đổi chu kỳ sang 26-25

- **Shared Package Utils (`packages/shared/src/utils/date.ts`):**
  - Cập nhật chu kỳ tính lương từ ngày 26 tháng trước đến ngày 25 tháng hiện tại trong hàm `getPeriodDates`.
- **Backend API Router (`backend/src/routes/snapshots.ts`):**
  - Cập nhật endpoint `/check-block` để đồng bộ logic phòng chờ: chặn chốt đối với nhân sự mới chưa duyệt (có chứng từ `tuyen_moi` pending) vướng ngày bắt đầu trong kỳ, chặn chốt đối với nhân sự cũ có thay đổi hiệu lực trong kỳ, và cho phép copy nhân sự cũ phòng chờ không vướng ngày hiệu lực bằng dữ liệu live.
- **Integration Tests (`backend/src/__tests__/integration/snapshots.test.ts` & `isPeriodLocked.test.ts`):**
  - Cập nhật các mock/boundary dates từ 27-26 sang 26-25.
  - Bổ sung 4 integration test cases bao phủ các kịch bản chặn/cho phép chốt của phòng chờ và nhân sự mới.

## [2026-07-17] v7.2.0 - Tích hợp API và Schema nghỉ việc hàng loạt

- **Shared Package Schema (`packages/shared/src/schemas/employee.ts` & `index.ts`):**
  - Khai báo `bulkResignSchema` và `bulkResignRecordSchema` validate tối đa 200 dòng, bắt buộc mã nhân sự và ngày nghỉ việc.
- **Backend Service (`backend/src/services/employeeService.ts`):**
  - Thêm hàm `bulkResignEmployees` gọi RPC cơ sở dữ liệu `bulk_resign_employees`.
- **Backend API Router (`backend/src/routes/employees.ts`):**
  - Thêm các route endpoints `POST /api/employees/bulk-resign` (validate) và `POST /api/employees/bulk-resign/confirm` (thực thi) đặt trước router động `/:id`.
  - Tích hợp rate limiter và kiểm soát giới hạn payload kích thước tối đa 100KB.
  - Sửa đổi ép kiểu `as [number, number, number]` trong helper `normalizeDate` sửa lỗi typing TypeScript.
- **Integration Tests (`backend/src/__tests__/integration/bulkResign.test.ts`):**
  - Tạo mới bộ test cases kiểm thử hoàn chỉnh cho API import nghỉ việc hàng loạt (permission, payload size, lock period, duplicate code) và ép kiểu `as any` trên response.

## [2026-07-16] v7.1.1 - Đồng bộ header Excel Snapshot và sửa logic mapping loop

- **API Router `/api/snapshots`** (`backend/src/routes/snapshots.ts`):
  - Đổi tên header template Excel cho cột hiệu suất cơ chế từ `"Thưởng hiệu suất/chấm job/nhuận CC"` thành `"Thưởng hiệu suất chấm job CC"`.
- **Dịch vụ Snapshot (`backend/src/services/snapshotService.ts`)**:
  - Đổi tên cột xuất Excel snapshot thành `"Thưởng hiệu suất chấm job CC"`.
  - Bổ sung alias `"Thưởng hiệu suất chấm job CC"` trỏ về `thuong_hieu_suat_cham_job_nhuan` trong `RESTORE_COLUMN_MAPPING` để tương thích ngược.
  - Sửa đổi logic vòng lặp map cột, chỉ gán giá trị `null` nếu trường đó chưa được gán giá trị trước đó (tránh việc alias vắng mặt ghi đè `null` lên trường đã map thành công).
- **Integration Tests (`backend/src/__tests__/integration/snapshots.test.ts`)**:
  - Bổ sung 2 automated test cases độc lập kiểm thử việc khôi phục snapshot thành công từ file Excel với header cũ và header mới.

## [2026-07-16] v7.1.0 - Cập nhật logic kiểm thực lương Cơ chế

- **Kiểm thực Lương (`packages/shared/src/utils/salary-validation.ts`)**:
  - Cập nhật hàm `validateSalaryTarget` gộp thêm trường `nhuan_but_cc` vào biểu thức tính tổng kiểm tra `ccTargetSum = luong_cb + nhuan_but_cc + thuong_okr_m1 + ...`.
- **Unit Tests (`packages/shared/src/tests/salary-validation.test.ts`)**:
  - Bổ sung thêm các ca kiểm thử chi tiết kiểm chứng tính hợp lệ khi có và không có `nhuan_but_cc`. Xác nhận test suite chạy pass 100%.

## [2026-07-14] v7.0.0 - NS-003: Tính năng chốt dữ liệu nhân sự hàng tháng

- **API Router `/api/snapshots`** (`backend/src/routes/snapshots.ts`) — 15 endpoints, static routes khai báo trước dynamic:
  - `GET /active-keys` — đối chiếu khóa chốt; bảo vệ bằng header `x-api-key` (INTERNAL_API_KEY)
  - `GET /template` — tải file Excel mẫu để khôi phục snapshot
  - `GET /` — danh sách snapshots; SA toàn bộ, EA/VA chỉ thấy khối mình quản lý
  - `GET /:id` — chi tiết snapshot kèm danh sách nhân sự bổ sung
  - `POST /create` — tạo snapshot mới qua SQL RPC `create_monthly_snapshot` (5 params)
  - `PUT /:id/lock` — khóa snapshot; ghi `locked_at` và `locked_by` (SA-only)
  - `PUT /:id/unlock` — mở khóa; xóa `locked_at` và `locked_by` (SA-only)
  - `GET /:id/export-before-delete` — xuất Excel watermark; trả header `X-Snapshot-Updated-At`
  - `DELETE /:id` — soft-delete; dọn sạch `snapshot_employees`; bảo toàn bảng tạm pending
  - `POST /:id/supplemental/preview` — parse Excel bổ sung (zip-bomb guard: MAX_ROWS 5000, MAX_UNCOMPRESSED 50MB)
  - `POST /:id/commit` — lưu vào `snapshot_supplemental_pending` với upsert + re-validate
  - `POST /:id/approve` — duyệt bổ sung (SA); SQL RPC atomic với SELECT FOR UPDATE; ép zero SUPPLEMENTAL_ZERO_FIELDS
  - `POST /:id/reject` — từ chối bản ghi pending
  - `POST /:id/revoke` — thu hồi bản ghi approved (SA); xóa khỏi snapshot_employees, tính lại count
  - `POST /:id/restore/preview` — parse Excel khôi phục đầy đủ với whitelist column
  - `POST /:id/restore` — khôi phục từ Excel; gọi RPC `restore_snapshot_from_excel`
  - `POST /:id/restore-live` — khôi phục từ Live Master; gọi lại RPC `create_monthly_snapshot`
- **Anti-drift Guard** (`backend/src/utils/lockCheck.ts`): tích hợp vào `PUT /api/employees/:id`, `PUT /:id/state`, `DELETE /:id`; gọi DB helper `is_period_locked(date, khoi)`; trả HTTP 423 khi bị khoá
- **snapshotService.ts**: parse Excel bằng exceljs với whitelist column RESTORE_COLUMN_MAPPING; chống zip-bomb; xuất Excel watermark; gán cứng `is_supplemental = false` trong Full Restore
- **Config**: `INTERNAL_API_KEY` (Zod ≥8 ký tự) vào `env.ts`; `exceljs` vào `backend/package.json`
- **Shared**: `snapshot.ts` — thêm `deleted` enum, `supplemental_employees_count`, `locked_by`, `period_start`, `period_end`; `packages/shared/src/utils/date.ts` — hàm `getPeriodDates(month)` tính khoảng 27-26
- **Tests**: 108/108 integration tests pass; thêm `snapshots.test.ts` (20 tests) và `isPeriodLocked.test.ts` (7 tests)
- Files: `backend/src/routes/snapshots.ts`, `backend/src/services/snapshotService.ts`, `backend/src/utils/lockCheck.ts`, `backend/src/config/env.ts`, `backend/src/index.ts`, `backend/src/routes/employees.ts`, `packages/shared/src/schemas/snapshot.ts`, `packages/shared/src/utils/date.ts`

## [2026-07-01] v6.4.0 - Tích hợp đọc PDF native và dynamic model validation cho AI OCR
- **Configuration & Registry**:
  - Tạo mới file config `backend/src/config/ocrModels.ts` định nghĩa Registry/Allowlist của model OCR và mặc định là `gemini-3.5-flash`.
- **API Route**:
  - Cập nhật route `documents.ts` hỗ trợ an toàn validate tham số `model` truyền từ client, kiểm tra cache key matching theo cả model và prompt version.
- **OCR Service**:
  - Hỗ trợ gửi PDF dạng native base64 qua API Vision tương thích OpenAI.
  - Tích hợp PDF Guardrails: đếm trang tối đa 5 trang sử dụng `pdf-parse`, kiểm tra magic bytes `%PDF-`, thêm timeout `AbortController` 30s.
  - Thiết lập `max_tokens: 8192` và bộ lọc làm sạch JSON markdown backticks để hỗ trợ trơn tru các reasoning model (gemini-3.5-flash) không bị cắt cụt stream.
  - Bảo mật: Redact base64 và thông tin nhạy cảm trong logger khi gặp lỗi từ nhà cung cấp dịch vụ AI.
- Files: `backend/src/config/ocrModels.ts`, `backend/src/routes/documents.ts`, `backend/src/services/ocrService.ts`, `backend/package.json`.

## [2026-06-24] v6.3.0 - Hỗ trợ truyền thông điệp lỗi Client (4xx) chi tiết ở Production
- **Middleware**:
  - Phân loại lỗi Client Error (HTTP status < 500) và Server Error (HTTP status >= 500).
  - Cho phép giữ nguyên thông điệp lỗi gốc của Client Error trong môi trường Production để giúp frontend hiển thị thông tin lỗi chính xác (như lỗi trùng mã nhân sự `409`).
- Files: `backend/src/middleware/errorHandler.ts`.

## [2026-06-23] v6.2.0 - Bổ sung bộ lọc Người nghiệm thu thử việc và tùy chọn xuất Excel nghỉ việc
- **Route / Service**:
  - Cập nhật hàm `getUniqueFieldValues` và whitelist `allowedFields` cho phép trường `'nguoi_nghiem_thu_thu_viec'` được gọi lấy các giá trị duy nhất (tránh lỗi 400).
  - Nâng cấp API danh sách nhân sự và hàm `listEmployees` để tiếp nhận, xử lý tham số lọc `nguoi_nghiem_thu_thu_viec` trong query database Supabase.
- Files: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`.

## [2026-06-23] v6.1.0 - Cho phép sửa Người nghiệm thu thử việc và hỗ trợ mã tạm phòng chờ
- **Zod Schema**:
  - Nâng cấp `updateEmployeeSchema` cho phép trường `nguoi_nghiem_thu_thu_viec` được cập nhật qua API chung.
  - Gỡ bỏ `refine` check chặn mã tạm (`TMP...`) và email tạm (`@vcc.tmp`) khỏi `updateEmployeeSchema` nhằm hỗ trợ lưu nháp thông tin nhân sự trong phòng chờ. Các ràng buộc này vẫn được kiểm tra chặt chẽ khi submit gởi duyệt chính thức (`submitEmployeeSchema`).
- **Integration Testing**:
  - Cập nhật test suite `probationReviewer.test.ts` để kiểm tra cập nhật thành công (200 OK) thay vì chặn lỗi 400.
- Files: `packages/shared/src/schemas/employee.ts`, `backend/src/__tests__/integration/probationReviewer.test.ts`.

## [2026-06-19] v6.0.0 - Xuất Excel full danh sách nhân sự (excel-full-export)
- **Route / Service**:
  - Hỗ trợ tham số query `include_salaries=true` cho API `GET /api/employees` để lấy thông tin salaries kèm hồ sơ nhân viên.
  - Phân quyền: Enforce check `canViewSalary` cho từng employee; tự động điền `null` (masking) cho cả 31 trường lương đối với vai trò `VI` (Viewer).
  - Rate limit & Audit Log: Áp dụng `exportRateLimiter` (5 lần/phút) và ghi nhận `audit_log` với `export_type: "employee_full_with_salary"` cho tất cả request chứa `include_salaries=true`.
  - Hiệu năng: Enforce giới hạn cứng `EXPORT_LIMIT = 5000` dòng và trả về cờ `truncated: true` trong meta payload nếu vượt quá giới hạn.
- **Integration Testing**:
  - Viết và chạy thành công integration test suite `excel_full_export.test.ts` kiểm thử đầy đủ phân quyền xem lương, ẩn lương và rate limiter.
- Files: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`, `backend/src/__tests__/integration/excel_full_export.test.ts`.

## [2026-06-18] v5.9.0 - Tích hợp Người nghiệm thu chính thức vào Form & Sửa hồ sơ
- **Route / Service**:
  - Triển khai route gợi ý `GET /api/employees/reviewer-options` hỗ trợ autocomplete email người dùng cho SA/EA kèm validation `q.trim().length >= 2`.
  - Nâng cấp `employeeService.ts` tự động load danh sách `reviewer_emails` của nhân viên; loại bỏ (strip) trường này trước khi update/create trực tiếp trên bảng `employees` tránh lỗi DB.
  - Thêm field-level guard chặn thay đổi `reviewer_emails` đối với tài khoản không phải SA hoặc EA cùng Khối; hỗ trợ cơ chế scrub no-op khi email gửi lên trùng khớp với live/pending DB.
  - Cập nhật route lưu nháp để sử dụng danh sách `saved_fields` thực tế phục vụ ghi nhận audit logs chính xác.
  - Điều chỉnh logic pre-check tính toán danh sách "effective reviewers" (ưu tiên pending trước live) để tránh block nhầm khi duyệt hồ sơ.
- **Integration Testing**:
  - Bổ sung integration test suite `employeeReviewerField.test.ts` (11/11 pass).
- Files: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`, `backend/src/__tests__/integration/employeeReviewerField.test.ts`, `packages/shared/src/schemas/employee.ts`.

## [2026-06-17] v5.8.0 - Bổ sung Người nghiệm thu thử việc
- **Route / Service**:
  - Triển khai route Live Update `PUT /api/employees/:maNhanSu/probation-reviewer` cho phép SA hoặc EA cùng khối cập nhật trực tiếp NNT thử việc không qua phòng chờ.
  - Sửa đổi route submit `PUT /api/employees/:id/submit` bỏ qua kiểm tra NNT đối với tài khoản non-SA.
  - Siết route gợi ý `GET /api/employees/:id/suggest-reviewers` và gán NNT chính thức `PUT /api/employees/:id/reviewers` thành SA-only.
  - Bổ sung logic chuẩn hóa email (trim, lowercase) và so sánh ghi history tự động cho trường mới.
- **Integration Testing**:
  - Tạo mới bộ integration test `probationReviewer.test.ts` (12 tests) bao phủ toàn bộ các kịch bản phân quyền, email validation, DB constraint và rẽ nhánh route submit.
  - Cấu hình lại `permission.test.ts` sửa lỗi chèn trường `updated_by` không tồn tại.
- Files: `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`, `backend/src/services/changeHistoryService.ts`, `backend/src/__tests__/integration/probationReviewer.test.ts`, `backend/src/__tests__/integration/permission.test.ts`.

## [2026-06-15] v5.7.1 - Đổi tên API Key cấu hình OCR thành TOOL_HRVCC_OCR_API_KEY
- **Configuration**: Đổi tên biến môi trường `OCR_API_KEY` thành `TOOL_HRVCC_OCR_API_KEY` trong file env, các config local/test/example, logic logging/redact, setup hạ tầng GCP, và script sync secret (`sync.js`).
- **CI/CD**: Cập nhật workflow `deploy-be.yml` để mount secret `TOOL_HRVCC_OCR_API_KEY` mới cho Cloud Run và thực hiện xóa/dọn dẹp ánh xạ secret cũ `OCR_API_KEY`.
- Files: `backend/src/config/env.ts`, `backend/src/lib/logger.ts`, `backend/src/services/ocrService.ts`, `scripts/sync.js`, `scripts/setup-gcp-infra.sh`, `.github/workflows/deploy-be.yml`.

## [2026-05-28] v5.7.0 - Gộp lịch sử thay đổi thông tin và lương thành một (merge-grouped-change-history)
- **Security/Authz**: Cập nhật logic trong `documentService.ts` phân tách rạch ròi quyền xem (`read`) và xóa (`write`), cho phép VA tải giấy tờ lịch sử mà vẫn bị chặn xóa hoặc chặn chạy OCR.
- **Route/Service**: Khắc phục lỗi `isDocAccessAllowed` trong route `/change-history` bỏ sót vai trò VA, đảm bảo VA thấy được nút xem tài liệu.
- **Integration Testing**: Sửa một loạt lỗi dữ liệu giả (mock data) trong `salary.test.ts` (như `document_type`, `temp_uuid`, `reason = null`) giúp test case Scenario 5 pass ổn định.

## [2026-05-26] v5.6.0 - Xuất danh sách làm thưởng KD (kèm lương)
- **Salary Route / Service**:
    - Triển khai endpoint `GET /api/salaries/export-probation` xuất danh sách làm thưởng kinh doanh.
    - Áp dụng kiểm soát IDOR an toàn: Chỉ cho phép Super Admin (SA) truy cập toàn bộ dữ liệu, và quản lý Khối (EA) truy cập dữ liệu thuộc khối quản lý (thông qua `accessibleKhoi` từ permissions). Bật lỗi `403 Forbidden` đối với các vai trò không hợp lệ (VA/VI/Reviewer).
    - Tự động tính toán chu kỳ từ ngày 26 tháng trước đến 25 tháng này (UTC+7) làm phạm vi ngày vào công ty (`ngay_vao_cong_ty`) mặc định nếu người dùng không chọn ngày.
    - Thiết lập giới hạn tối đa `5000` dòng tại API backend thay vì giới hạn 1000 dòng mặc định của PostgREST.
    - Tích hợp rate limiter (5 lần/phút) và ghi Audit Log với `action = 'export'` và `module = 'NS-002'`.
- Files: `backend/src/routes/salary.ts`, `backend/src/services/salaryService.ts`

## [2026-05-25] v5.5.1 - Sửa lỗi Autocomplete Người bị thay thế
- **Employee Service**:
    - Khắc phục lỗi truy vấn autocomplete bị trả về rỗng đối với tài khoản cấp Khối (EA/VA/VI) do định dạng chuỗi filter `khoi` bị sai cú pháp `query.filter('khoi', 'in', ...)`.
    - Chuyển sang sử dụng phương thức native `.in('khoi', accessibleKhoi)` của Supabase SDK giúp parse mảng khối an toàn và chính xác.
    - Bổ sung các console log debug (`[DEBUG Autocomplete]`) hỗ trợ giám sát đầu vào, bộ lọc áp dụng, lỗi truy vấn và số lượng kết quả trả về.
- Files: `backend/src/services/employeeService.ts`

## [2026-05-25] v5.5.0 - Thêm Cột Bộ Phận và Tối Ưu Hiển Thị Phòng Chờ
- **Employee Service**:
    - Cập nhật hàm `listEmployees` tại phần gán dữ liệu nâng cao `enhancedData` để trích xuất và expose thêm hai trường `pending_bo_phan` và `has_pending_bo_phan` ra danh sách API một cách bảo mật dựa trên payload `pending_changes`.
- Files: `backend/src/services/employeeService.ts`, `packages/shared/src/types/api.ts`

## [2026-05-25] v5.4.0 - Gợi ý Người nghiệm thu (NNT) v2 & Fix lỗi UI phòng chờ
- **NNT Service**:
    - Nâng cấp `suggestReviewers` trong `nntService.ts` chuyển đổi từ in-memory filter sang gọi RPC `fn_suggest_reviewers` trực tiếp từ Database.
    - Bổ sung validation sớm tại backend: Nếu thông tin `khoi` hoặc `line_nhan_su` bị thiếu, trả về danh sách rỗng sớm kèm cảnh báo thay vì gọi RPC.
- **Integration Testing**:
    - Bổ sung file test `backend/src/__tests__/integration/suggestReviewers.test.ts` kiểm thử toàn vẹn logic NNT: Fallback chain, Deduplication, Null/Undefined fields, Large dataset (>1000 assignments), và kiểm tra bảo mật chặn cuộc gọi RPC trực tiếp từ client không có quyền.
- Files: `backend/src/services/nntService.ts`, `backend/src/__tests__/integration/suggestReviewers.test.ts`

## [2026-05-18] v5.2.0 - Scoped RPC for NNT Filter (Bypass 414 URL-too-long)
- **Employee Service**:
    - Nâng cấp `employeeService.listEmployees` chuyển sang gọi RPC `get_employee_info_scoped` làm base query thay vì `.from('employee_info_only')`.
    - Triển khai thuật toán **Batch-Chunking** `chunkArray` (size 200) tại `listEmployees` khi truy vấn trạng thái lương chờ duyệt, thay đổi nháp, và mapping NNT. Tránh triệt để lỗi `414 URI Too Long` khi xuất Excel toàn bộ hoặc Reviewer quản lý lượng lớn nhân sự.
    - Cập nhật `employeeService.getUniqueFieldValues` để hỗ trợ lấy danh sách NNT (`field === 'nnt'`) thông qua việc truy vấn trực tiếp bảng `employee_reviewers` scoped theo phân quyền của user.
- **API (Hono Routes)**:
    - Cập nhật route `/employees` để tiếp nhận tham số `nnt` dạng chuỗi (comma-separated), phân tách thành mảng chuỗi truyền xuống Service layer.
    - Cập nhật schema validation endpoint `unique-values` hỗ trợ lấy unique NNT.
- Files: `backend/src/services/employeeService.ts`, `backend/src/routes/employees.ts`, `packages/shared/src/types/api.ts`

## [2026-05-13]
- **Employee Search**: Nâng cấp `employeeService.listEmployees` hỗ trợ tham số `khoi` dưới dạng mảng (Array) hoặc chuỗi phân tách dấu phẩy để phục vụ lọc đa chọn (Multi-select).
- **fix**: xử lý lỗi import Excel 878 NS và đồng bộ DB constraint
- **Import Validation**:
    - Nâng cấp `adminImportService` để bóc tách lỗi chi tiết từ RPC (`details`, `hint`).
    - Bổ sung validation chặt chẽ cho `ma_nhan_su` (regex), `khoi`, `khu_vuc`, `ky_nghiem_thu` trong bước Preview.
    - Tự động sanitize chuỗi rỗng thành `null` cho các trường optional (`ky_nghiem_thu`, `nguoi_bi_thay_the`, `khu_vuc`, `loai_hop_dong`, `trang_thai`) để tránh lỗi Check Constraint.
- **Service Enhancement**: Thêm khối **'Support'** vào danh sách Khối hợp lệ, đồng bộ từ shared constants.
- **API**: Cập nhật route `/migrate-bulk/commit` và `/preview` để trả về chi tiết lỗi phục vụ debug.
- Files: `backend/src/services/adminImportService.ts`, `backend/src/routes/admin.ts`

## [2026-05-13] v5.1.0 - Admin Cleanup Dashboard
- **Admin Cleanup**:
    - Triển khai `adminCleanupService.listCleanupEmployees()`: Hỗ trợ truy vấn nhân sự rác theo các pattern (MOCK, TEST, TMP) và hiển thị toàn bộ data cho tab "Tất cả".
    - Triển khai `adminCleanupService.bulkHardDeleteEmployeesAdmin()`: 
        - Gọi RPC `fn_bulk_hard_delete_employees` thực hiện xóa vật lý (Hard Delete) nguyên tử.
        - Tự động thu thập và dọn dẹp các tệp tin đính kèm trên Cloudflare R2 (best-effort).
        - Ghi Audit Log chi tiết cho các thao tác xóa và log lỗi R2 nếu phát sinh.
    - Đăng ký endpoints `GET /api/admin/cleanup/employees` và `POST /api/admin/cleanup/employees/bulk-hard-delete` với lớp bảo vệ `requireSuperAdmin`.
- **Testing**:
    - Bổ sung `adminCleanup.test.ts` (4 kịch bản): Verify trọn vẹn luồng xóa hàng loạt, dọn dẹp R2 và Audit Log.


## [2026-05-13] v5.1.0 - Admin Cleanup Dashboard UI
- **Admin Cleanup Dashboard**:
    - Triển khai tab **"DỌN DẸP"** (`CleanupTab.tsx`) trong trang Quản trị, dành riêng cho Super Admin.
    - **Filtering**: Hỗ trợ lọc nhanh nhân sự theo 4 danh mục: Tất cả, MOCK, Onboard Test, Mã TMP.
    - **Bulk Actions**: 
        - Cho phép chọn nhiều nhân sự và thực hiện xóa vĩnh viễn (Hard Delete) đồng thời.
        - Tích hợp Modal xác nhận bảo mật: Yêu cầu người dùng nhập chính xác chuỗi `"XÓA VĨNH VIỄN"` để kích hoạt nút xóa.
    - **Feedback**: Hiển thị thông báo kết quả chi tiết, bao gồm số lượng bản ghi đã xóa thành công và các mã lỗi nếu có.
- **Fix**: Sửa lỗi tham số truy vấn API trong `CleanupTab.tsx` bằng cách sử dụng `URLSearchParams`, đảm bảo đồng bộ dữ liệu chính xác giữa Frontend và Backend.

## [2026-05-13] v5.0.0 - Probation Evaluation & Integration Testing
- **Probation Evaluation**:
    - Triển khai `employeeService.evaluateProbation()`: Gọi RPC nguyên tử `fn_evaluate_probation` để cập nhật trạng thái nhân sự và lương chờ duyệt đồng thời (Atomic Transaction).
    - Đăng ký endpoint `POST /api/employees/:id/evaluate-probation` kèm IDOR check khối.
- **Service**: 
    - Nâng cấp `adminService.getAuditLogs()`: Hỗ trợ tham số `target_ma_nhan_su` để truy vết lịch sử thay đổi của từng nhân viên cụ thể trong Phòng chờ.
    - Cập nhật `employeeService.getEmployeeById()`: Bổ sung cờ `is_probation_eval` từ payload `pending_changes` phục vụ hiển thị Tag ĐGTV trên UI.
- **Testing**:
    - **Infrastructure**: Thiết lập `vitest.integration.config.ts` riêng biệt với `testTimeout: 30000ms` và `fileParallelism: false` để đảm bảo tính ổn định khi chạy test với DB thực tế.
    - **Integration Suite**: Bổ sung `probation.test.ts` (4 kịch bản) verify trọn vẹn luồng Đánh giá thử việc nguyên tử.
    - **Fixes**: Khắc phục lỗi test data pollution trong `permission.test.ts` và `phase-d-flow.test.ts` bằng cơ chế dọn dẹp SA role và invalidate cache tự động.
- **CI/CD**: Cập nhật `package.json` script `test:integration` sử dụng config mới.

## [2026-05-07]
### feat(infra): cấu hình an toàn cho biến môi trường và thiết lập CORS
- **DevOps**: Di dời 4 biến cấu hình (`OCR_API_URL`, `OCR_PROVIDER`, `TELEGRAM_DEFAULT_CHAT_ID`, `FRONTEND_URL`) từ GCP Secret Manager sang Github Repository Variables để tối ưu chi phí.
- **Security**: Tách biệt `DEV_FRONTEND_URL` và `PROD_FRONTEND_URL`, đảm bảo môi trường Production loại bỏ hoàn toàn khả năng bị chọc CORS từ `localhost`.
- **CI/CD**: Khắc phục lỗi `gcloud run deploy` tự động cắt chuỗi khi biến môi trường chứa dấu phẩy bằng bash script escape character (`\,`).

## [2026-05-07]
### perf(search): bổ sung escape string xử lý lỗi PostgREST
- **Service**: Thêm hàm `escapeSearchString` (`escapeSearch.ts`) xử lý triệt để ký tự đặc biệt (%, _, ngoặc, phẩy) trước khi truyền vào PostgREST `.ilike()` filter. Ngăn chặn lỗi HTTP 400 và chống Query Injection qua Supabase API.
- **Testing**: Bổ sung integration test tại `employee.test.ts` đảm bảo API `listEmployees` và `searchAutocompleteEmployees` vẫn trả về mảng kết quả bình thường thay vì crash khi gửi ký tự đặc biệt.

## [2026-05-07] v4.7.0 - Transfer Workflow Integration
- **NNT Service**: Nâng cấp `suggestReviewers` hỗ trợ gợi ý dựa trên `pending_changes` (tổ chức mục tiêu).
- **Employee Service**: 
    - Triển khai `savePersonnelToPending` hỗ trợ lưu nháp hồ sơ và gộp dữ liệu.
    - Cập nhật `submitFromPending` để truy vết `_temp_uuid` từ cả Personnel và Salary pending tables.
- **API**: Thêm tham số `use_pending=true` cho route `suggest-reviewers`.

## [2026-05-07] v4.6.0 - Reject Pending Changes
- **Service**: Thêm `employeeService.rejectPendingChanges(id, actorEmail, permission)`:
    - Thực thi IDOR check (EA Khối, SA, hoặc Reviewer được gán).
    - Gọi RPC `fn_reject_employee_pending` để reset dữ liệu atomic.
- **Route**: Đăng ký endpoint `POST /api/employees/:id/reject`:
    - Áp dụng `sensitiveRateLimiter` để bảo vệ tài nguyên.
    - Tích hợp pipeline Permission để đảm bảo người dùng chỉ được thao tác trên nhân sự thuộc phạm vi quản lý.


## [2026-05-06]
### feat(history): liên kết giấy tờ vào lịch sử thay đổi nhân sự
- **Service**: Cập nhật `salaryService.saveSalaryToPending` để lưu trữ `_temp_uuid` vào JSON `pending_changes`.
- **Service**: Cập nhật `employeeService.submitFromPending` để trích xuất `temp_uuid` và chuyển vào RPC `submit_employee_pending`.
- **Service**: Cập nhật logic Duyệt lương để bóc tách và persist `ngay_dieu_chinh_luong` từ JSON payload vào bảng `employees`.
- **Security**: Đảm bảo VI user vẫn xem được lịch sử "Ngày điều chỉnh lương" nhưng không xem được số tiền/bậc lương chi tiết (FR-03).

### Fixed
- **Employee/Salary**: Sửa lỗi không tìm kiếm được nhân sự theo mã nhân sự. Đã bổ sung `ma_nhan_su` và `email` vào điều kiện lọc `OR` cho cả danh sách nhân sự (`listEmployees`) và danh sách lương (`getSalaryList`), đảm bảo tính nhất quán của tính năng tìm kiếm trên toàn hệ thống.
- **History**: Sửa lỗi phân trang cho vai trò VI (chỉ xem hồ sơ) trong API `/api/change-history/:ma_nhan_su`. Chuyển logic lọc `SALARY_FIELDS_SET` trực tiếp vào query Supabase thay vì lọc tại ứng dụng, đảm bảo `total` count và kết quả trả về chính xác theo trang.
- **Salary**: Khôi phục 3 trường lương (`nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`) bị thiếu trong `SALARY_FIELDS`, bảo vệ Salary Isolation cho role VI.
- **Integration**: Bổ sung integration test `salary.test.ts` verify trọn vẹn luồng submit với các trường mới của migration 023.

## [2026-05-05]
### fix(ocr): chặn định dạng PDF vì giới hạn của AI provider
- **API**: Cập nhật logic tại route `POST /api/documents/:id/ocr` để kiểm tra `content_type`. Nếu là `application/pdf`, API sẽ tự động từ chối bằng lỗi 400 và yêu cầu người dùng sử dụng định dạng ảnh để tương thích với OpenAI Vision API.

## [2026-04-24]
### feat(employee): backend hỗ trợ chuẩn hoá Người Bị Thay Thế sang Autocomplete (nguoi-bi-thay-the-autocomplete)
- **Schema**: Bổ sung cờ validation cho trường `nguoi_bi_thay_the` trong `employeeSchema.ts` (chỉ chấp nhận alphanumeric, giới hạn 20 ký tự).
- **Service**: Thêm hàm `searchAutocompleteEmployees` giới hạn query an toàn trên view `employee_info_only`.
- **API**: Mở API `GET /api/employees/autocomplete`, áp dụng IDOR (cô lập nhân sự nội khối của EA, VA, VI). Chặn đứng truy cập từ Reviewer bằng lỗi HTTP 403.
- **Validation**: Validate max-length & regex tại `previewMigration` thuộc pipeline Admin Import Hàng Loạt.

## [2026-04-22]
### feat(admin): hoàn thiện backend tích hợp Excel Import cho di cư dữ liệu (admin-excel-import)
- **Service**: Triển khai `adminImportService.ts` hỗ trợ parse Excel (3 sheets: NhanSu, Luong, ReviewerEmployee), áp dụng logic validation nghiêm ngặt (Email Regex, Phone digit check, Enum mapping).
- **Service**: Khắc phục lỗi `parse_date_code` của thư viện XLSX bằng thuật toán tính ngày thủ công, đảm bảo tương thích môi trường ESM.
- **Service**: Bổ sung cơ chế Sanitization cho dữ liệu số (xóa dấu chấm/phẩy/khoảng trắng) và dữ liệu cờ Boolean (quy đổi Yes/No/Có/1 về true/false) trước khi ném vào DB.
- **API**: Thêm route `POST /api/admin/migrate-bulk/preview` để kiểm tra dữ liệu trước khi import.
- **API**: Thêm route `POST /api/admin/migrate-bulk/commit` thực hiện import nguyên tử (Atomic commit).
- **Logic**: Áp dụng chính sách "Insert Only" (bỏ qua trùng lặp `ma_nhan_su`) và cơ chế lọc tự động các dòng lỗi (màu đỏ trên UI) trước khi commit để đảm bảo 100% dữ liệu vào DB là sạch.
- **Testing**: Bổ sung integration test `adminImport.test.ts` (vitest) cover 4 kịch bản trọng yếu: Preview, Commit, Error Handling, và Skip Duplicate.

### feat(ocr): cập nhật AI đọc Người bị thay thế, bỏ email và đổi định dạng ngày sang DD/MM/YYYY
- **Service**: Cập nhật prompt trong `ocrService.ts` để trích xuất trường `nguoi_bi_thay_the` từ mục I của phiếu tuyển dụng (trường 'Tên nhân viên nghỉ việc' khi có dấu tích "Thay thế").
- **Service**: Loại bỏ yêu cầu trích xuất `email` ra khỏi prompt AI để tránh nhiễu dữ liệu.
- **Service**: Enforce AI trả về các trường ngày tháng (`ngay_sinh`, `ngay_vao_cong_ty`) theo định dạng `DD/MM/YYYY`.
- **Mockup**: Đồng bộ lại dữ liệu mẫu của các provider dự phòng (Claude, Vision) theo định dạng mới.

## [2026-04-17]
### feat(onboard): tích hợp lương vào luồng tạo mới nhân sự — Atomic Onboarding (ea-personnel-salary-integration)
- **API**: Thêm route `POST /api/employees/onboard` nhận payload wrapper `{ personnel, salary, temp_uuid }`, validate bằng `createEmployeeOnboardSchema`, áp dụng `sensitiveRateLimiter` và IDOR check khối.
- **Service**: Thêm `employeeService.createEmployeeWithSalary()` gọi RPC `fn_create_employee_onboarding` — atomic insert Employee + Salary + Bind Documents trong một transaction.
- **Security**: Route cũ `POST /api/employees` và `PUT /api/employees/:id` chặn 403 nếu body chứa key `pending_changes` (SEC-REV-03 hardening).
- **DTO**: Filter `has_pending_salary` khỏi response khi user role = VI. Sửa logic `has_pending_info` check trực tiếp từ bảng `employees` thay vì view `employee_info_only`.
- **OCR**: Nâng prompt `ocrService.ts` từ 7 lên 36 fields structured JSON output. Loại bỏ `logger.error({ fullContent })` — chỉ log `{ error: 'AI_PARSE_ERROR', documentId }` (Zero-Trust PII). Loại bỏ yêu cầu trích xuất trường `khoi` do đặc thù tài liệu không chứa thông tin này, ngăn chặn AI suy đoán hoặc gán nhầm giá trị.
- **Testing**: Thêm integration test `salary_onboarding.test.ts` verify atomic onboard flow và ownership guard `temp_uuid`.

## [2026-04-15]
### fix(ocr): khắc phục lỗi proxy không trả về nội dung (content: null)
- **Service**: Chuyển đổi cơ chế gọi OpenAI API của `ocrService.ts` sang **Streaming mode** (`stream: true`). Triển khai bộ thu thập chunk dữ liệu (text collector) để tái cấu trúc lại JSON phản hồi hoàn chỉnh.
- **Service**: Cố định model `gpt-5.4` cho OpenAI provider để tương thích với Proxy hiện tại.
- **Testing**: Bổ sung integration test `backend/src/__tests__/ocr.test.ts` (vitest) để kiểm thử luồng streaming và xử lý lỗi cấu hình.
- **Refactor**: Cấu trúc lại phương thức đọc stream bằng `response.text()` split lines để tối ưu độ tin cậy khi parse dữ liệu từ proxy.

## [2026-04-13]
### fix(document): nới lỏng permission cho draft upload tuyển mới (403 Forbidden)
- **Security**: Cho phép EA thực hiện presign upload và lưu metadata cho loại tài liệu `tuyen_moi` mà không yêu cầu mã `khoi` (draft state). Quyền được xác thực dựa trên việc user có ít nhất một entry `EA` bất kỳ để hỗ trợ luồng tạo mới nhân sự trên UI.
- **API**: Cập nhật route `POST /documents/presign` hỗ trợ trường `document_type` (zod optional) phục vụ backward compatibility.
- **Testing**: Bổ sung bộ unit tests (13 tests) cover 100% các kịch bản permission nới lỏng cho EA, Reviewer, SuperAdmin và các kịch bản chặn (VI, loại tài liệu khác).

## [2026-04-09]
### fix(security): hoàn thiện hạ tầng bảo mật production (CORS, XFF, PII Log leak, Sync Drift)
- **Security**: Loại bỏ hoàn toàn Regex bypass trong CORS config, cưỡng chế Strict Match 100% dựa vào danh sách whitelist từ env (`backend/src/index.ts`).
- **Security**: Khắc phục lỗ hổng IP Spoofing qua header `x-forwarded-for`. Tách module `getClientIp` dựa vào cơ chế proxy của Cloud Run để bắt chính xác IP thực của client cho RateLimiter và chuỗi Audit Log (`backend/src/utils/ip.ts`, `employees.ts`, `salary.ts`).
- **Log**: Áp dụng cơ chế (Zero-Trust) cho Exception Pipeline. Trực tiếp cắt bỏ biến `payload` tại `errorHandler.ts` khi môi trường là `production` thay vì phụ thuộc Regex Redaction, triệt tiêu 100% rủi ro rò rỉ dữ liệu cá nhân (PII) trên Google Cloud Logging.
- **DevOps**: Cải tổ công cụ CLI `scripts/sync.js`. Script từ nay không còn dùng string ảo, tự động trích xuất định danh `GCP_PROJECT_ID` ngay trong lòng biến môi trường của Repo để chống trôi dạt (Drift) cấu hình lúc Developer sync secret.
- **DevOps**: Tách dòng cấu hình Secret DEV/PROD tường minh bên trong workflow Actions `deploy-fe.yml` và `deploy-be.yml`, sử dụng vars/secrets định danh cho từng loại nhánh.

## [Phase 5] Production Polish, Demo & Go-live (2026-04-08)
### feat: DevOps CI/CD & Security Hardening
- **DevOps**: Tích hợp GitHub Actions deployments đa môi trường (`main` auto-deploy tới Dev, tags `v*` trigger tới Production) trên Google Cloud Run.
- **Security**: Cấu hình phân quyền Workload Identity Federation gắn với `github-actions` Service Account thay vì sử dụng JSON keys thủ công.
- **Security**: Triển khai OWASP headers qua Middleware `securityHeaders.ts` (Helmet, HSTS, NoSniff, X-Frame-Options).
- **Security**: Ngăn chặn DoS Export Excel qua endpoint `limit=all` và `limit>100`.
- **Audit**: Nâng cấp module Audit Log API để truy vết cụ thể `old_state`, `new_state`, và danh sách `changed_fields` trong body của chi tiết JSONB.
- **Log**: Chuẩn hóa toàn bộ hệ thống Log bằng công cụ `pino` tập trung `logger.ts`, đảm bảo tự động redact thông tin mật (keys, passwords, tokens) tại runtime.
- **Cache**: Đổi tiền tố cache quyền hạn sang `v5:perm:` phục vụ cưỡng bức dọn dẹp cache đồng loạt trên Upstash Redis khi triển khai version lớn.

## [2026-04-07]
### feat: rà soát Admin Dashboard và chuẩn hóa HTTP Error (Phase 4A)
- **API**: Cập nhật `admin.ts` routes, bọc try/catch cho các thao tác `grantPermission`, `addSuperAdmin`, `assignReviewer`.
- **Security**: Chuyển đổi lỗi logic định danh (Conflict/NotFound) từ Exception 500 sang HTTP 400 (Bad Request) có kèm lý do lỗi cụ thể, giúp frontend hiển thị Toast thông báo tường minh.
- **Refactor**: Dọn dẹp các script test trung gian dùng trong quá trình audit Phase A.

## [2026-04-07]
### feat: hoàn thiện Salary CRUD và cách ly dữ liệu chờ duyệt (salary-pending-isolation)
- **API**: Triển khai trọn bộ RESTful API cho phân hệ Lương: `GET /api/salaries` (list), `GET /api/salaries/:id` (detail), `PUT /api/salaries/:id` (update/save pending).
- **Security**: Thực thi triệt để Data Isolation — Dữ liệu lương chờ duyệt được bóc tách hoàn toàn khỏi bảng `employees`. API `getEmployeeById` tự động strip mọi thông tin lương khỏi payload `pending_changes`.
- **Service**: Nâng cấp `salaryService.ts` hỗ trợ lưu biến động lương vào `salaries.pending_changes` thay vì bảng nhân sự.
- **DTO**: Cập nhật `EmployeeListItem` trả về 2 cờ boolean độc lập `has_pending_info` và `has_pending_salary` giúp frontend hiển thị tag chính xác mà không cần parse JSON.

## [2026-04-06]
### feat: siết chặt IDOR Quản lý Lương và mở rộng query lọc trạng thái
- **API**: Nâng cấp hàm `getSalaryList` hỗ trợ tham số danh sách trạng thái ghép cách nhau bởi dấu phẩy, hỗ trợ lọc mảng hiệu quả ở backend.
- **Security**: Cập nhật hàm `getSalaryList` và `getSalaryByMaNhanSu`, trả về cờ `can_edit = false` cho nhân sự "Nghỉ việc" nếu user không phải là Super Admin, siết chặt bảo mật thông tin ngay từ bước trả Data Fetch.

## [2026-04-07]
### feat: isolate Salary Pending và Atomic Submit (salary-pending-isolation)
- **Migration**: Chạy `013_backfill_salary_rows.sql` đảm bảo 100% nhân sự có bản ghi lương tương ứng.
- **Migration**: Chạy `014_submit_employee_pending_function.sql` cập nhật logic submit atomic.
- **Migration**: Chạy `015_salary_pending_isolation.sql` thêm cột `pending_changes` và `state_pending` vào bảng `salaries`, đồng thời migrate dữ liệu lương chờ duyệt từ bảng `employees` sang `salaries`.
- **RPC**: Triển khai `save_salary_pending` hỗ trợ lưu lương chờ duyệt an toàn với cơ chế transaction và lock bản ghi nhân sự.

## [2026-04-05]
### feat: hoàn thiện Pending Room Telegram Warning và Manager Routes (pending-room-audit-fixes)
- **API**: Triển khai `POST /api/admin/trigger-pending-warnings` hỗ trợ kiểm thủ bằng tay gửi Telegram alert (Phase 5).
- **Service**: Triển khai `telegramService.ts` lấy danh sách nhân sự chờ duyệt quá 3 ngày và route gửi tin nhắn dựa theo `khoi_managers` hoặc `TELEGRAM_DEFAULT_CHAT_ID`.
- **Service**: Bổ sung `khoiManagerService.ts` và `nntService.ts` phục vụ gợi ý NNT thông minh và thiết lập quản lý phụ trách mảng.
- **Service**: Cập nhật `ocrService.ts` bóc tách thêm trường `ngay_vao_cong_ty` và thời gian thử việc.
- **Service**: Cập nhật `employeeService.ts` đổi enum `dang_lam` -> `chinh_thuc` và áp dụng bypass submit với cờ `khong_co_nnt`.
- **Config**: Cấu hình thêm biến môi trường `TELEGRAM_BOT_TOKEN`, `TELEGRAM_DEFAULT_CHAT_ID`.

### feat: bổ sung cơ chế xóa vĩnh viễn (hard delete) và dọn dẹp vật lý R2
- **API**: Thuộc route `employees`, triển khai `DELETE /api/employees/:id/hard` được bọc riêng bằng `Permission.is_superadmin`.
- **Service**: Dọn dẹp thủ thuật drop bảng vụn vặt; giao phó rác dữ liệu liên đới như lương, reviewers trực tiếp cho trigger `ON DELETE CASCADE` chuẩn của Postgres xử lý. Riêng bảng `change_history` rớt vào `ON DELETE SET NULL`.
- **Storage**: Cưỡng chế cơ chế kiểm soát lỗi S3 - Bốc `r2_object_key` đưa xuống `DeleteObjectCommand`, bắt cấu hình Cloudflare ném lỗi 500 ngay lập tức nếu bước xóa thực thể Cloud gặp hỏng hóc, tránh 100% ghost records.
- **Testing**: Bổ sung tham số `khong_co_nnt: true` chèn luồng giả lập tại `phase-d-flow.test.ts` giúp backend pass xanh xanh rule NNT khi Submit.

# Backend Changelog

## [Phase 3] NS-002: Salary Management & Pending Isolation (2026-04-07)
### Added
- Thêm `salaryService.ts` quản lý CRUD lương với IDOR protection.
- Thêm `salary.ts` route (GET list/detail, PUT pending).
- Thêm `changeHistory.ts` route hỗ trợ masking lương cho vai trò VI (FR-03).
- Thêm SQL RPC `save_salary_pending` phục vụ lưu lương nháp an toàn (Isolation).
### Changed
- Sửa `employeeService.ts`: Tích hợp cờ `has_pending_info`, `has_pending_salary`, và `can_view_salary_detail`.
- Sửa `submitFromPending`: Chuyển sang dùng Atomic SQL Function `submit_employee_pending`.
- Sửa `documentService.ts`: Mở rộng quyền upload cho Reviewer của nhân sự được gán.

## [Phase 2] NS-004: Admin Dashboard & Permission Management (2026-04-04)

## [2026-04-01]
### feat: hoàn thiện hệ thống AI OCR và quản lý tài liệu (Phase E)
- **Infrastructure**: Thiết lập Cloudflare R2 Client và khai báo biến môi trường (`R2_*`, `OCR_*`). Đã đồng bộ `.env.example`.
- **API**: Triển khai `POST /api/documents/presign` (Signed URL 3 min) và `POST /api/documents` (Confirm metadata).
- **Service**: Triển khai `ocrService.ts` tích hợp OpenAI Vision (GPT-5/4o) hỗ trợ Base64 payload và JSON schema bóc tách hồ sơ.
- **Service**: Nâng cấp `employeeService.ts` hỗ trợ tự động liên kết (bind) tài liệu từ `temp_uuid` khi khởi tạo nhân sự mới.
- **Service**: Triển khai cơ chế Cache OCR kết quả vào DB để tối ưu chi phí API.
- **Ops**: Triển khai worker script `cron_cleanup_orphan.ts` tự động dọn dẹp objects mồ côi trên R2 và DB metadata sau 24h.
- **Validation**: Enforce quyền uploader cho tài liệu ở trạng thái nháp (Draft) và quyền khối/reviewer cho tài liệu đã liên kết (Bound).
- **Refactor**: Tách rời tài liệu Phase E sang thư mục Modular `.agent/active/phase-2-taskE/` để tối ưu quản lý.
- **API**: Triển khai `GET /api/admin/users/search` hỗ trợ autocomplete tập trung cho email.
- **Service**: Nâng cấp `searchUserEmails` hỗ trợ gộp kết quả từ 4 nguồn (Employees, Permissions, Reviewers, SAs) với giới hạn 1000 bản ghi mỗi bảng để phục vụ local filtering.
- **Service**: Bổ sung `console.log` chi tiết tại Backend để theo dõi hiệu năng query autocomplete.
- **Audit**: Đồng bộ audit log cho thao tác `bulk_update_reviewers` (Migration 007).

### fix: thắt chặt Data Isolation (chặn 403 thay vì silent strip)
- **Security**: Thay đổi cơ chế "âm thầm lọc bỏ" sang "từ chối request (403)" khi payload chứa trường lương (`tam_ung_hang_thang` hoặc `ngay_dieu_chinh_luong`).
- **Security**: Cập nhật `createEmployeeSchema` và `updateEmployeeSchema` sang chế độ `.strict()`, đảm bảo chặn mọi field không mong muốn ngay khi parse.
- **Validation**: Sửa lỗi `createEmployeeSchema` thiếu `ngay_dieu_chinh_luong` trong danh sách `omit`, đảm bảo đồng bộ rule cách ly giữa Create và Update.
- **Auth**: Sửa lỗi logic `getReviewerEmployeeIds` so sánh UUID với `ma_nhan_su` gây lỗi 403 khi Reviewer truy cập nhân sự được gán.
- **Testing**: Bổ sung 2 test case integration kiểm tra việc chặn 403 cho lương. Sửa `rateLimit.ts` hỗ trợ cờ `TEST_RATE_LIMIT`.
- Files: `backend/src/services/employeeService.ts`, `backend/src/routes/employees.ts`, `packages/shared/src/schemas/employee.ts`, `backend/src/__tests__/integration/employee.test.ts`.

## [2026-03-31]
### feat: hoàn thiện phase D
- **API**: Triển khai route `PUT /api/employees/:id/state` hỗ trợ chuyển đổi trạng thái nhân sự theo State Machine.
- **API**: Hỗ trợ route `PUT /api/employees/:id/pending` để đưa nhân sự từ danh sách chính quay lại phòng chờ.
- **Infrastructure**: Sửa lỗi `__dirname` trong `backend/src/config/env.ts` để tương thích hoàn toàn với môi trường ES Modules.
- **Audit**: Cập nhật logic Audit Log ghi nhận hành động `export` và `change_state` kèm metadata chi tiết.
- Files: `backend/src/routes/employees.ts`, `backend/src/config/env.ts`, `backend/src/services/employeeService.ts`.

### feat: hỗ trợ đa bảng (employees + salaries) trong Employee Service
- **Service**: Nâng cấp `getEmployeeById` tự động JOIN bảng `salaries` và Flatten dữ liệu trước khi trả về.
- **Service**: Hoàn thiện logic `createEmployee` và `updateEmployee` để tự động phân tách (Split) dữ liệu nhân sự và dữ liệu lương bằng `SALARY_FIELDS`.
- **Infrastructure**: Triển khai `upsert` trên bảng `salaries` theo `employee_id` để duy trì quan hệ 1-1.
- Files: `backend/src/services/employeeService.ts`.

### feat: nâng cấp Error Logging và hoàn thiện Employee Service
- **Logging**: Cập nhật `errorHandler.ts` để in chi tiết Request Method, URL và Payload (Body) khi xảy ra lỗi Server 500, giúp debug nhanh từ terminal.
- **Service**: Sửa lỗi logic `recordChangeHistory` trong `employeeService.ts` để sử dụng `ma_nhan_su` mới thay vì ID cũ khi cập nhật, tránh vi phạm FK.
- **Route**: Đồng bộ Audit Log để ghi nhận cả mã nhân sự cũ và mới trong hành động cập nhật.
- Files: `backend/src/middleware/errorHandler.ts`, `backend/src/services/employeeService.ts`, `backend/src/routes/employees.ts`.

### fix: xử lý nợ kỹ thuật test và cấu hình script Phase 1
- **Testing**: Tách biệt script `test:integration` tại backend để chỉ chạy thư mục `integration/` thay vì chạy lẫn với unit test.
- **Testing**: Bổ sung Scenario 3 (Mixed-Permission: EA Admicro + VI KND) vào `permission.test.ts` để verify logic đa khối đa quyền thực tế.
- **Seeder**: Cập nhật `seed_dev_users.ts` hỗ trợ account Mixed-Permission và dùng `onConflict` SQL để cho phép chạy seed lặp lại an toàn.
- **DX**: Thêm lệnh `pnpm seed` tại root monorepo để nạp dữ liệu mẫu nhanh từ bất kỳ đâu.
- **Fix**: Cập nhật route `/reviewers/bulk-preview` và service `getBulkReviewerPreview` cho phép target rỗng.
- **Dependencies**: Cài đặt bổ sung `@hono/zod-validator` sửa lỗi typecheck cho admin routes.
- Files: `backend/package.json`, `backend/scripts/seed_dev_users.ts`, `backend/src/__tests__/integration/permission.test.ts`, `package.json`.

## [2026-03-26]

### refactor: dòn dẹp nợ kỹ thuật và hardening bảo mật Phase 1
- **Security**: Hardening Rate Limit bằng cách lấy IP Client từ hop đầu tiên của `X-Forwarded-For` (chống IP Spoofing).
- **Security**: Thêm Webhook Secret Auth cho endpoint invalidation cache để tránh bị DoS Cache.
- **Auth**: Bổ sung hàm `invalidatePermissionCache` và route Webhook `/api/users/webhook/permissions` để đồng bộ quyền tức thì.
- **Config**: Cập nhật `env.ts` sử dụng Zod để validate `WEBHOOK_SECRET` (Fail-fast strategy).
- **Testing**: Chuyển Integration Test sang sử dụng `app.request` (in-memory) giúp chạy được trên môi trường CI không có Live Server.
- **Testing**: Cập nhật `.github/workflows/ci.yml` bao gồm bước test backend.
- **Refactor**: Sửa lỗi Typecheck cho toàn bộ Middleware và Routes (Return paths, optional chaining).
- Files: `backend/src/middleware/rateLimit.ts`, `backend/src/middleware/permission.ts`, `backend/src/routes/users.ts`, `backend/src/config/env.ts`, `backend/src/index.ts`, `.github/workflows/ci.yml`.

---

*Cập nhật tự động bởi update-docs*
