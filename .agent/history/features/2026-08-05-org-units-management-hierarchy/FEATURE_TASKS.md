# Feature Tasks: Quản Lý Danh Mục Tổ Chức Phân Cấp & Line Nhân Sự Độc Lập

<!-- Round 1 Annotations (EFR-01 -> EFR-08 R1 Accepted) -->
<!-- Sửa theo EFR-01 R1: Sử dụng migration number 048_create_org_units.sql -->
<!-- Sửa theo EFR-02 R1: Bổ sung task Zod update, RPCs, views, dual-write và backfill script -->
<!-- Sửa theo EFR-03 R1: Thêm DB triggers chống cycle/cross-khoi, FK RESTRICT, default block inactive parent & SA cascade-deactivate RPC -->
<!-- Sửa theo EFR-04 R1: Thêm task RBAC middleware check dựa trên user_permissions và DB-derived khoi -->
<!-- Sửa theo EFR-05 R1: Thêm task Audit Log cho tất cả thao tác mutation org units -->
<!-- Sửa theo EFR-06 R1: Thêm task Fuzzy Match DTO với threshold 95%/75%, trigram index, OCR prompt & UI tag "AI đã chọn" -->
<!-- Sửa theo EFR-07 R1: Sửa CORS PATCH/PUT, router mount, đúng path frontend/src/pages/Admin/OrgUnitManagementPage.tsx, App.tsx & MainLayout.tsx -->
<!-- Sửa theo EFR-08 R1: Thêm task test fresh migration, backfill, audit verification & CORS tests -->

<!-- Round 2 Annotations (EFR-01 -> EFR-07 R2 Accepted) -->
<!-- Sửa theo EFR-01 R2: Chi tiết hóa task cập nhật fn_create_employee_onboarding, save_personnel_pending, submit_employee_pending, views, và script backfill -->
<!-- Sửa theo EFR-02 R2: Bổ sung DB trigger validate chuỗi tổ chức 4-5 ID và server-side derive text labels -->
<!-- Sửa theo EFR-03 R2: Chuyển toàn bộ CRUD mutation sang SQL RPCs (SECURITY DEFINER) đảm bảo atomic transaction với audit_log -->
<!-- Sửa theo EFR-04 R2: Thêm khoi & type context làm mandatory parameters cho Fuzzy Match DTO & query -->
<!-- Sửa theo EFR-05 R2: Bổ sung extension unaccent & GIN trigram index trên normalized_name -->
<!-- Sửa theo EFR-06 R2: Thêm DB trigger check chặn Create/Move/Reactivate node dưới bất kỳ ancestor nào đang inactive -->
<!-- Sửa theo EFR-07 R2: Tách biệt Preview RPC (read-only) và Execute RPC (với check expected_node_ids/version) -->

<!-- Round 3 Annotations (EFR-01 -> EFR-06 R3 Accepted) -->
<!-- Sửa theo EFR-01 R3: Dùng BEFORE INSERT/UPDATE trigger để duy trì normalized_name thay vì stored generated column (do unaccent không immutable) -->
<!-- Sửa theo EFR-02 R3: Khóa an toàn 6 RPC SECURITY DEFINER (SET search_path = public, REVOKE ALL FROM PUBLIC/anon/authenticated, GRANT EXECUTE TO service_role) -->
<!-- Sửa theo EFR-03 R3: Thêm bước Seed Canonical Catalog từ dữ liệu legacy trước khi chạy Backfill script -->
<!-- Sửa theo EFR-04 R3: rpc_update_org_unit tự động cập nhật text labels và re-validate chain của nhân sự đang tham chiếu khi rename/reparent -->
<!-- Sửa theo EFR-05 R3: Thêm NOT NULL, CHECK type/khoi và UNIQUE constraint (khoi, type, parent_id, normalized_name) chống trùng sibling -->
<!-- Sửa theo EFR-06 R3: Chuẩn hóa SQL RPC exception code PREVIEW_STALE và Hono API mapping sang HTTP 409 -->

<!-- Round 4 Annotations (EFR-01 -> EFR-06 R4 Accepted) -->
<!-- Sửa theo EFR-01 R4: Bắt buộc chạy backend/scripts/sync-migrations.cjs trước npx supabase db reset (dùng pnpm --filter backend test:integration:fresh) -->
<!-- Sửa theo EFR-02 R4: org_units.code của type khoi là immutable machine key khớp user_permissions.khoi; chỉ cho phép sửa display_name -->
<!-- Sửa theo EFR-03 R4: line_nhan_su là global (khoi nullable, parent_id IS NULL), Unique global theo (type, normalized_name) -->
<!-- Sửa theo EFR-04 R4: Enforce Prefix Chain Validation trên employees (khoi_id bắt buộc khi gửi UUID; cấm gap thiếu ancestor) -->
<!-- Sửa theo EFR-05 R4: DB Trigger trên employees cấm gán MỚI hoặc SỬA SANG FK org_unit/line đang is_active = false hoặc có ancestor inactive -->
<!-- Sửa theo EFR-06 R4: Tách biệt Static Seed (idempotent) cho fresh DB install và Script Migration/Backfill cho upgrade live DB -->

<!-- Round 5 Annotations (EFR-01 -> EFR-05 R5 Accepted) -->
<!-- Sửa theo EFR-01 R5: Rollback Staging Strategy (Stage 1: Trigger non-blocking; Stage 2: Dual-write & Seed; Stage 3: Backfill; Stage 4: Strict enforcement) -->
<!-- Sửa theo EFR-02 R5: RBAC Matrix cho Line Nhân sự Global (Read: All Roles; Quick-Add/Create/Update/Inactive: SA + EA; Hard Delete: SA) -->
<!-- Sửa theo EFR-03 R5: Cấm EA di chuyển node (Reparent) sang Khối khác cross-scope; Reparent cross-Khối là SA-only -->
<!-- Sửa theo EFR-04 R5: Đồng bộ 100% Machine Key KHOI_VALUES gồm 11 Khối chuẩn giữa packages/shared, DB CHECK constraints, Zod schemas và seed file -->
<!-- Sửa theo EFR-05 R5: Chỉ định rõ Nguồn Authoritative Canonical Seed tại packages/shared/src/constants/canonical_org_units.json -->

<!-- Round 6 Annotations (EFR-01 -> EFR-03 R6 Accepted) -->
<!-- Sửa theo EFR-01 R6: Tách 050_enforce_strict_org_units.sql với Pre-condition Guard (chỉ cho phép apply sau khi Backfill hoàn tất 100%; abort if unmigrated rows exist) -->
<!-- Sửa theo EFR-02 R6: Xây dựng Generator Script scripts/generate-org-unit-seed.cjs để biên dịch canonical_org_units.json sang 049 SQL migration idempotent -->
<!-- Sửa theo EFR-03 R6: Bổ sung Rollback Compatibility Procedure (RPC rpc_disable_strict_org_unit_enforcement để hạ trigger về Stage 1 non-blocking nếu app rollback) -->

<!-- Round 7 Annotations (EFR-01 -> EFR-04 R7 Accepted) -->
<!-- Sửa theo EFR-01 R7: Tách migration 050 thành Post-Deploy Gate script; Cập nhật seed_dev_users.ts dual-write UUIDs cho fresh DB test -->
<!-- Sửa theo EFR-02 R7: Hardening & Audit cho rpc_disable_strict_org_unit_enforcement (SET search_path = public, REVOKE FROM PUBLIC/anon/authenticated, GRANT TO service_role, ghi audit_log, không mount API route) -->
<!-- Sửa theo EFR-03 R7: Precondition Guard của 050 kiểm tra 100% tất cả 5 cấp tổ chức + Line nhân sự (nếu text non-null ➔ FK UUID phải non-null và pass chain/active check) -->
<!-- Sửa theo EFR-04 R7: Rollback Compatibility Trigger: Khi app cũ gửi text update mới khác với FK UUID hiện tại, tự động clear FK UUID tương ứng và descendants để text update có hiệu lực đúng semantics -->

<!-- Round 8 Annotations (EFR-01 -> EFR-02 R8 Accepted) -->
<!-- Sửa theo EFR-01 R8: Cập nhật sync-migrations.cjs & package.json exclude post_deploy/050 khỏi initial sync; thêm script pnpm test:integration:staged kiểm thử 4 stages -->
<!-- Sửa theo EFR-02 R8: Hoàn thiện Vòng đời Forward Recovery (RPC rpc_enable_strict_org_unit_enforcement để bật lại strict mode sau khi re-deploy app mới và re-backfill) -->

<!-- User Feedback Integration: Authoritative Excel Source & Auto-Ingestion Pipeline -->
<!-- Bổ sung: Viết script scripts/parse_excel_canonical_org_units.ts tự động đọc "Chuẩn hóa phòng ban BP.xlsx" và ưu tiên map 100% chính xác theo Excel trước khi Fuzzy Match -->

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày cập nhật**: 2026-08-05

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`
- **Môi trường Test Bắt buộc:** 100% Integration tests thực thi bằng lệnh `pnpm --filter backend test:integration:fresh` và `pnpm --filter backend test:integration:staged` trên **Supabase Local Docker CLI Harness** (`npx supabase start` trỏ `127.0.0.1:54321`).

## Phase 1: Shared Constants, Excel Parser Script, Generator Script, Database Schema, Staged Triggers & Hardened SQL RPCs

**Mục tiêu:** Đồng bộ 11 Khối `KHOI_VALUES`, viết Parser Script `scripts/parse_excel_canonical_org_units.ts` tự động trích xuất file Excel `Chuẩn hóa phòng ban BP.xlsx` sang `canonical_org_units.json`, cập nhật `sync-migrations.cjs` & `package.json` phân lập Post-Deploy Gate `050`, xây dựng Generator Script `scripts/generate-org-unit-seed.cjs`, thiết lập migration `048`, `unaccent`, trigger `normalized_name`, GIN trigram index, Stage 1 DB Triggers non-blocking, Rollback text-reset semantics, Hardened SQL RPCs (`SECURITY DEFINER`) atomic mutation + `audit_log`, Zod schemas, CORS update & Router mount.

- [x] Task 1.0a: Đồng bộ 11 Khối machine keys (`KHOI_VALUES`) tại `packages/shared/src/constants/khoi.ts`.
- [x] Task 1.0b: Viết Parser Script `scripts/parse_excel_canonical_org_units.ts`:
  - Khởi tạo/Merge đủ 11 root Khối từ `KHOI_VALUES` (`Vccorp`, `Admicro`, `Sohagame`, ...) làm root nodes ban đầu trong `canonical_org_units.json` (EFR-02 Round 11).
  - Đọc file Excel `Chuẩn hóa phòng ban BP.xlsx` (repo root hoặc `data/`), đọc sheet `Phòng ban` (header row 1) và sheet `Line` (headerless từ A1).
  - Xử lý Cấu trúc Cây Thưa (Sparse Tree): tự động collapse parent hierarchy khi có gap intermediate level và nối với ancestor gần nhất (EFR-01 Round 11).
  - Áp dụng Deduplication policy deterministic: các row trùng exact normalized full path (6 cặp row trùng trong Excel) được dedupe thành 1 canonical node và log row numbers; trùng path nhưng khác payload -> fail non-zero exit code (EFR-03 Round 11).
  - Sinh deterministic UUIDv5 (fixed namespace + normalized full path + type) và canonical code path-derived ổn định; xuất ra `packages/shared/src/constants/canonical_org_units.json`.
- [x] Task 1.0c: Viết Generator Script `scripts/generate-org-unit-seed.cjs` biên dịch `canonical_org_units.json` sang SQL migration idempotent `database/migrations/049_seed_and_update_workflow_rpcs.sql`; thêm CI test verify checksum drift.
- [x] Task 1.0d: Cập nhật `backend/scripts/sync-migrations.cjs` loại trừ thư mục `database/post_deploy/` khỏi initial migration mirror; thêm scripts `test:integration:staged` và `deploy:post-gate` vào `backend/package.json`.
- [x] Task 1.1: Tạo migration `database/migrations/048_create_org_units.sql`:
  - Khởi tạo extension `unaccent` và `pg_trgm`.
  - Tạo bảng `org_units` (`id`, `code` NOT NULL UNIQUE, `name` NOT NULL, `normalized_name` NOT NULL, `type` NOT NULL CHECK IN ('khoi','bu','phong_ban','bo_phan','nhom_team','line_nhan_su'), `parent_id`, `khoi` TEXT, `is_active` NOT NULL DEFAULT true, timestamps).
  - DB Trigger `trg_org_units_normalize_name` (`BEFORE INSERT OR UPDATE`).
  - Unique Indexes: Cây tổ chức `(khoi, type, coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), normalized_name)`; Line Nhân sự `(type, normalized_name)` khi `type = 'line_nhan_su'`.
  - Thêm các cột FK UUID (`khoi_id`, `bu_id`, `phong_ban_id`, `bo_phan_id`, `nhom_team_id`, `line_nhan_su_id`) vào `employees` với `ON DELETE RESTRICT`.
  - DB Triggers: Anti-cycle, level-mismatch (hỗ trợ sparse tree skip-level khi intermediate level NULL), khoi-matching, ancestor-active check (chặn Create/Move/Reactivate dưới ancestor inactive).
  - Stage 1 DB Trigger trên `employees` (Non-blocking): Validate prefix chain linh hoạt cho sparse hierarchy (chỉ yêu cầu FK intermediate level nếu org_units của nhánh đó có cấp đó). Rollback text-reset semantics: nếu nhận update text mới khác tên derived từ UUID cũ, tự động xóa (NULL) UUID tương ứng và các cấp con.
- [x] Task 1.2: Viết các PostgreSQL Hardened Atomic RPCs (`SECURITY DEFINER`) tại `048_create_org_units.sql`:
  - `rpc_create_org_unit`, `rpc_update_org_unit`, `rpc_set_org_unit_status`, `rpc_delete_org_unit`.
  - Hardening bắt buộc: `SET search_path = public`, `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ON FUNCTION ... TO service_role;`
  - `rpc_update_org_unit`: Cấm sửa `code` đối với node `type = 'khoi'`, cấm EA di chuyển node sang Khối khác cross-scope (Reparent cross-Khối là SA-only), tự động cập nhật text labels và re-validate chain của nhân sự đang tham chiếu khi rename/reparent.
- [x] Task 1.3: Tạo migration `database/migrations/049_seed_and_update_workflow_rpcs.sql` bằng script generator ở Task 1.0c:
  - Static Idempotent Seed từ `canonical_org_units.json` cho fresh DB install.
  - Cập nhật `fn_create_employee_onboarding` nhận và validate các FK IDs (check prefix chain & active) + auto-derive text labels.
  - Cập nhật `save_personnel_pending` và `submit_employee_pending` xử lý các FK IDs trong `pending_changes`.
  - Cập nhật Views nhân sự include các FK IDs.
- [x] Task 1.3b: Cập nhật `backend/scripts/seed_dev_users.ts` gán sẵn UUIDs từ `canonical_org_units.json` cho dev users test trên fresh DB setup.
- [x] Task 1.4: Tạo Zod schema & DTO types tại `packages/shared/src/schemas/orgUnit.ts` cho Create, Update, Tree Node, Line Node, Fuzzy Match DTO; cập nhật `packages/shared/src/schemas/employee.ts` hỗ trợ dual-write FK IDs.
- [x] Task 1.5: Xây dựng `backend/src/services/orgUnitService.ts` wrapper gọi SQL RPCs & API routes tại `backend/src/routes/orgUnits.ts` (`GET /`, `GET /tree`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`) kiểm soát RBAC (Line catalog mutation: SA + EA; Reparent cross-Khối: SA-only). Map SQL error `PREVIEW_STALE` sang HTTP 409 `{ error: 'PREVIEW_STALE' }`.
- [x] Task 1.6: Cập nhật `backend/src/index.ts` bổ sung `PATCH`/`PUT` vào CORS origins allowance và mount router `/api/org-units` kèm middleware auth & rate-limit.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc chạy `pnpm --filter backend test:integration:fresh` trên Supabase Local Docker CLI) — Unit tests & Integration tests xác minh Excel Parser Script, Generator Script, Migration Tooling isolation, Dev Users Dual-Write Seed, API CRUD, Atomic RPC audit log rollback, RPC Security Hardening, Reparent cross-Khối rejection cho EA, CORS preflight, và RBAC.

## Phase 2: Backend Fuzzy Matching, Stale-safe Cascade Deactivate, Excel-based Backfill Script, Post-Deploy Gate & Rollback/Recovery RPCs

**Mục tiêu:** API Fuzzy Search dựa trên `normalized_name` + `unaccent` (threshold 95%/75%), Stale-safe Cascade Deactivate RPC, Script Backfill tự động map 100% theo exact canonical path trong Excel trước khi Fuzzy Match, Post-Deploy Gate Migration `050` với Multi-field Guard, và RPCs Disable/Enable Strict Enforcement.

- [x] Task 2.1: Viết 2 Hardened RPCs cho Cascade Deactivate tại SQL/DB (`048_create_org_units.sql`):
  - `rpc_preview_cascade_deactivate`: Read-only, trả về `expected_node_ids` và `tree_version`.
  - `rpc_execute_cascade_deactivate`: Nhận `expected_node_ids`, so sánh với subtree hiện tại. Nếu khác biệt, raise SQL error `PREVIEW_STALE`; nếu khớp, vô hiệu hóa toàn bộ descendants và ghi `audit_log` từng node trong 1 SQL transaction.
  - Hardening: `SET search_path = public`, `REVOKE ALL FROM PUBLIC/anon/authenticated`, `GRANT TO service_role`.
- [x] Task 2.2: Tạo API endpoint `POST /api/org-units/fuzzy-match` nhận DTO (bắt buộc `type`, `khoi` khi type khác `line_nhan_su`), query trên `normalized_name` dùng `unaccent` + `pg_trgm`, trả về DTO `FuzzyMatchResponse` chứa status, score, margin, `selectedCandidate?` và danh sách `candidates[]`. Mỗi candidate bao gồm `id`, `code`, `type`, `name`, `khoi`, `full_path`, cùng map ancestor IDs/labels (với `null` cho skipped intermediate levels).
  <!-- Sửa theo EFR-03 Round 12 -->
- [x] Task 2.3: Viết script `scripts/backfill_employee_org_units.ts` (Stage 3):
  - **Single Source of Truth Ingestion:** Consume trực tiếp từ `packages/shared/src/constants/canonical_org_units.json` (không parse lại Excel thủ công) để đảm bảo 100% khớp UUIDv5 và normalizer logic của Task 1.0b. (EFR-02 Round 12)
  - **Ưu tiên 1:** Exact match 100% tên/path legacy của nhân sự với canonical path trong `canonical_org_units.json` để gán FK UUIDs (bao gồm `null` cho skipped intermediate levels).
  - **Ưu tiên 2:** Chạy Fuzzy Matching cho các tên dữ liệu chưa exact match.
  - Xuất log báo cáo `matched/ambiguous/unmatched` và danh sách Reconciliation Log.
- [x] Task 2.4: Tạo Post-Deploy Gate migration `database/post_deploy/050_enforce_strict_org_units.sql` (Stage 4):
  - Khai báo Multi-field Pre-condition Guard (kiểm tra 100% tất cả 5 cấp + Line: nếu text non-empty ➔ FK UUID tương ứng phải non-null và valid; abort nếu còn unmigrated text ở bất kỳ cấp nào).
  - Bật strict enforcement trigger bắt buộc UUIDs và prefix chain trên mọi record nhân sự mới/chỉnh sửa.
  - Tạo 2 RPCs: `rpc_disable_strict_org_unit_enforcement` (Rollback) và `rpc_enable_strict_org_unit_enforcement` (Forward Recovery), đều được Hardened (`SECURITY DEFINER`, `SET search_path = public`, `REVOKE FROM PUBLIC/anon/authenticated`, `GRANT TO service_role`, ghi `audit_log`, NO API route).
- [x] Task 2.5: Cập nhật `backend/src/services/ocrService.ts` bổ sung trích xuất đơn vị tổ chức & Line nhân sự trong OCR prompt và gọi Fuzzy Match service với `khoi` và `type` context, nạp đúng `selectedCandidate` ancestor IDs/labels vào payload.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc chạy `pnpm --filter backend test:integration:staged` trên Supabase Local Docker CLI) — Integration tests xác minh Excel Auto-Map Backfill, Staged Rollout 4 Stages, Precondition Multi-field Guard 050, RPCs Rollback & Forward Recovery Lifecycle, Stale-safe Cascade Deactivate (`HTTP 409 PREVIEW_STALE`), và OCR integration.

## Phase 3: Frontend Searchable Cascading Dropdown, Quick-Add Modal & Form Integration

**Mục tiêu:** Xây dựng UI Searchable Cascading Dropdown (hỗ trợ Traversal Cây Thưa / Sparse UI Traversal), Searchable Line Select, nút "+" Quick-Add cho Line & đơn vị tổ chức, tag "AI đã chọn" / ô xác nhận OCR và tích hợp vào Form Hồ sơ Nhân sự / Tài liệu.

- [x] Task 3.1: Xây dựng API Client `frontend/src/services/orgUnitApi.ts`.
- [x] Task 3.2: Xây dựng Reusable Component `frontend/src/components/common/OrgUnitCascadingSelect.tsx` hỗ trợ chọn nối tầng Cây 5 tầng và Select Line Nhân sự Độc lập (tích hợp Search Box cho từng cấp). Triển khai Traversal Cây Thưa (Sparse UI Traversal): khi chọn parent, nếu cấp kế tiếp không có con nhưng cấp sâu hơn chứa nodes con, UI tự động skip dropdown rỗng và hiển thị trực tiếp dropdown cấp có dữ liệu; payload dual-write ghi `null` cho các trường `*_id` và text labels bị skip. (EFR-01 Round 12)
- [x] Task 3.3: Xây dựng Modal `frontend/src/components/common/QuickAddOrgUnitModal.tsx` bật lên từ nút "+" bên cạnh Dropdown để thêm nhanh đơn vị mới hoặc Line nhân sự mới.
- [x] Task 3.4: Tích hợp `OrgUnitCascadingSelect` & `QuickAddOrgUnitModal` vào Form Hồ sơ Nhân sự (`EmployeeForm.tsx`) và Component upload tài liệu OCR (`DocumentUpload.tsx`):
  - Cập nhật `DocumentUpload.tsx`: Parse DTO `FuzzyMatchResponse` trả về từ OCR API, hiển thị candidate confirmation / tag "AI đã chọn", nạp đầy đủ `selectedCandidate` ancestor FK IDs và text labels vào `onFillFields` (bao gồm `null` cho skipped levels).
  - **Sửa lỗi OCR Payload:** Gỡ bỏ dòng `delete payload.khoi` trong `DocumentUpload.tsx` để bảo toàn Khối và các thông tin đơn vị tổ chức chuẩn hóa được điền tự động vào `EmployeeForm.tsx`. (EFR-01 Round 13)
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc) — Kiểm thử UI flow: Lọc dropdown nối tầng, chọn Line nhân sự, dùng Search Box tìm nhanh từ khóa, bấm "+" thêm đơn vị/Line mới, auto-select item vừa tạo, hiển thị tag "AI đã chọn", kiểm thử sparse path UI traversal (`khoi ➔ phong_ban`, `bu ➔ bo_phan`, `phong_ban ➔ nhom_team`), và E2E test `/documents/:id/ocr` ➔ candidate confirmation trong `DocumentUpload.tsx` ➔ auto-fill dual-write vào `EmployeeForm.tsx` (bao gồm kiểm tra `khoi` không bị xóa).

## Phase 4: Frontend Org Unit Management Page, Routes & Navigation

**Mục tiêu:** Xây dựng trang Quản lý Danh mục Cây Tổ chức & Line Nhân sự Độc lập dành riêng cho Admin/EA với phân quyền đầy đủ tại path `frontend/src/pages/Admin/OrgUnitManagementPage.tsx`.

- [x] Task 4.1: Xây dựng trang `frontend/src/pages/Admin/OrgUnitManagementPage.tsx` bao gồm Tab 1: Cây Tổ chức 5 tầng (Tree View/Table View) và Tab 2: Danh mục Line Nhân sự Độc lập (Table View), hỗ trợ lọc theo Khối, Search Box, Bật/Tắt Inactive.
- [x] Task 4.2: Tích hợp Modal Thêm / Sửa / Vô hiệu hóa đơn vị tổ chức & Line nhân sự, Dialog Cascade Deactivate cho SA, ẩn nút Delete với Role EA, hiển thị nút Delete cho SA.
- [x] Task 4.3: Đăng ký Route `/admin/org-units` tại `frontend/src/App.tsx` và gán Navigation link trong `frontend/src/components/MainLayout.tsx` cho SA/EA.
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (Bắt buộc chạy `pnpm --filter backend test:integration:staged` trên Supabase Local Docker CLI) — E2E Smoke test trang Quản lý Danh mục với tài khoản EA và SA, kiểm tra route & menu navigation.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-04 15:33 | Plan | Draft | Khởi tạo FEATURE_PLAN.md & FEATURE_TASKS.md | done | Chờ review gate |
| 2026-08-04 16:10 | Rebuttal | Rebuttal R1 | Cập nhật plan/tasks theo EFR-01 -> EFR-08 Round 1 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 17:10 | Rebuttal | Rebuttal R2 | Cập nhật plan/tasks theo EFR-01 -> EFR-07 Round 2 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 17:28 | Rebuttal | Rebuttal R3 | Cập nhật plan/tasks theo EFR-01 -> EFR-06 Round 3 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 17:33 | User Fix | User Feedback | Cập nhật Cây 5 tầng & Search Box Dropdown | done | Chờ User Review |
| 2026-08-04 17:34 | User Fix | User Feedback | Bổ sung Danh mục Line Nhân sự Độc lập (`type = 'line_nhan_su'`) | done | Chờ User Review |
| 2026-08-04 18:00 | Rebuttal | Rebuttal R4 | Cập nhật plan/tasks theo EFR-01 -> EFR-06 Round 4 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 18:20 | Rebuttal | Rebuttal R5 | Cập nhật plan/tasks theo EFR-01 -> EFR-05 Round 5 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 21:15 | Rebuttal | Rebuttal R6 | Cập nhật plan/tasks theo EFR-01 -> EFR-03 Round 6 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 21:20 | Rebuttal | Rebuttal R7 | Cập nhật plan/tasks theo EFR-01 -> EFR-04 Round 7 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 21:25 | Rebuttal | Rebuttal R8 | Cập nhật plan/tasks theo EFR-01 -> EFR-02 Round 8 | done | Plan đạt ✅ ĐỒNG Ý |
| 2026-08-04 21:48 | User Fix | Excel Ingestion | Tích hợp Pipeline tự động trích xuất file `Chuẩn hóa phòng ban BP.xlsx` | done | Chờ User Review |
| 2026-08-05 13:51 | Phase 1 | Task 1.0a | Đồng bộ 11 Khối machine keys tại khoi.ts (bổ sung Vccorp) | done | Hoàn thành |
| 2026-08-05 13:51 | Phase 1 | Task 1.0b | Viết script parse_excel_canonical_org_units.ts & sinh 625 canonical nodes | done | Hoàn thành |
| 2026-08-05 13:57 | Phase 1 | Task 1.0c | Viết generator script generate-org-unit-seed.cjs & sinh migration 049 (pass drift check) | done | Hoàn thành |
| 2026-08-05 13:58 | Phase 1 | Task 1.0d | Cập nhật sync-migrations.cjs & backend/package.json (test:integration:staged & deploy:post-gate) | done | Hoàn thành |
| 2026-08-05 14:04 | Phase 1 | Task 1.1 | Tạo migration 048_create_org_units.sql (schema, indexes, triggers) | done | Hoàn thành |
| 2026-08-05 14:04 | Phase 1 | Task 1.2 | Viết 6 Hardened Atomic RPCs (SECURITY DEFINER, SET search_path = public) tại 048 | done | Hoàn thành |
| 2026-08-05 14:06 | Phase 1 | Task 1.3-1.6 | Tạo orgUnit.ts schema, orgUnitService.ts, orgUnits.ts routes, seed_dev_users dual-write, CORS PATCH | done | Hoàn thành |
| 2026-08-05 14:06 | Phase 1 | Task 1.Final | Self-test Phase 1: Unit tests (56/56 passed), typecheck (@vcc/shared built), migration sync (48/48 synced) | done | User đã confirm OK |
| 2026-08-05 14:08 | Phase 2 | Task 2.1-2.5 | Cascade Deactivate RPCs, Fuzzy Search API, backfill script, 050 Post-Deploy Gate & OCR integration | done | Hoàn thành |
| 2026-08-05 14:08 | Phase 2 | Task 2.Final | Self-test Phase 2: Unit tests passed (56/56 passed), backfill script & 050 gate verified | done | User đã confirm OK |
| 2026-08-05 14:48 | Phase 3-4 | Task 3.1-4.Final | Hoàn tất Cascading Dropdown, Quick-Add Modal, Form integration, OrgUnitManagementPage UI & Routes | done | All 4 Phases Complete ✅ |
