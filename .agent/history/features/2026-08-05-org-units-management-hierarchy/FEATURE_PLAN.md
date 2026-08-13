# Feature Plan: Quản Lý Danh Mục Tổ Chức Phân Cấp & Danh Mục Line Nhân Sự Độc Lập

<!-- Round 1 Annotations (EFR-01 -> EFR-08 R1 Accepted) -->
<!-- Sửa theo EFR-01 R1: Đổi số migration thành 048_create_org_units.sql -->
<!-- Sửa theo EFR-02 R1: Bổ sung chiến lược dual-write/dual-read, giữ tính bất biến snapshot và cập nhật Zod/RPCs -->
<!-- Sửa theo EFR-03 R1: Khóa DB invariants cây phân cấp, chặn inactive parent có con active, SA cascade-deactivate kèm preview & audit -->
<!-- Sửa theo EFR-04 R1: Chuẩn hóa actor RBAC (SA & EA user_permissions), server-side khoi derivation -->
<!-- Sửa theo EFR-05 R1: Bắt buộc ghi audit_log bền vững cho mọi thao tác mutation danh mục -->
<!-- Sửa theo EFR-06 R1: Quy định cụ thể threshold Fuzzy Match OCR (>=95% auto-select, 75-94% confirm, <75% manual) -->
<!-- Sửa theo EFR-07 R1: Sửa CORS PATCH/PUT, route mounting tại backend/src/index.ts, đúng path frontend/src/pages/Admin/ -->
<!-- Sửa theo EFR-08 R1: Chuẩn hóa chiến lược Rollback an toàn cho dữ liệu sống (additive deployment) -->

<!-- Round 2 Annotations (EFR-01 -> EFR-07 R2 Accepted) -->
<!-- Sửa theo EFR-01 R2: Thêm task cụ thể cập nhật RPC onboarding/pending/submit, views và backfill script với log reconciliation -->
<!-- Sửa theo EFR-02 R2: Bổ sung DB trigger validate chuỗi tổ chức 4-5 ID và server-side derive text labels -->
<!-- Sửa theo EFR-03 R2: Chuyển toàn bộ CRUD mutation sang SQL RPCs (SECURITY DEFINER) đảm bảo mutation + audit_log chạy atomic cùng 1 SQL transaction -->
<!-- Sửa theo EFR-04 R2: Thêm khoi & type context làm mandatory parameters cho Fuzzy Match DTO & query -->
<!-- Sửa theo EFR-05 R2: Bổ sung pg_trgm unaccent normalized_name phục vụ Fuzzy Match tiếng Việt -->
<!-- Sửa theo EFR-06 R2: DB invariant chặn triệt để Create/Move/Reactivate node dưới bất kỳ ancestor nào đang inactive -->
<!-- Sửa theo EFR-07 R2: Tách Preview RPC (read-only) và Execute RPC (nhận expected_node_ids/version) -->

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
<!-- Sửa theo EFR-01 R5: Staged Rollout Strategy (Stage 1: Trigger non-blocking; Stage 2: Dual-write & Seed; Stage 3: Backfill; Stage 4: Strict enforcement) -->
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
<!-- Bổ sung: Tự động trích xuất file Excel "Chuẩn hóa phòng ban BP.xlsx" sang canonical_org_units.json & ưu tiên auto-map 100% theo bảng ánh xạ trong Excel trước khi Fuzzy Match -->

> **Trạng thái**: ✅ ĐỒNG Ý (Đã xử lý xong 9 vòng Expert Review & Tích hợp File Excel Danh mục Chuẩn)
> **Review gate**: Đã hoàn thành Expert Review & Rebuttal Round 9.
> **Feature slug**: org-units-management-hierarchy
> **Tạo bởi**: feature-plan (Updated with Excel Auto-Ingestion Pipeline)
> **Ngày cập nhật**: 2026-08-04

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại dữ liệu các cấp tổ chức (`Khối`, `BU`, `Phòng ban`, `Bộ phận`, `Nhóm team`) và `Line Nhân sự` đang bị lưu dưới dạng `TEXT` tự do hoặc nhập không đồng nhất. Người dùng đã có file Excel chuẩn hóa danh mục: **`Chuẩn hóa phòng ban BP.xlsx`**.
- **Mục tiêu:** 
  1. Mô hình bảng danh mục tổ chức `org_units` phân cấp 5 tầng đầy đủ: **`Khối` ➔ `BU` ➔ `Phòng ban` ➔ `Bộ phận` ➔ `Nhóm team`** dùng UUID cố định (`org_units.code` của `type = 'khoi'` là machine key bất biến đồng bộ với danh sách 11 Khối chuẩn `KHOI_VALUES`).
     <!-- Sửa theo EFR-01 (Round 11): Hỗ trợ Cấu trúc Cây Thưa (Sparse Tree Semantics) toàn diện: DB level-mismatch trigger cho phép node skip-level (ví dụ phong_ban kết nối trực tiếp khoi khi bu IS NULL); employee prefix-chain trigger & Post-Deploy Gate 050 cho phép FK intermediate level (như bu_id) NULL nếu org_units hierarchy của nhánh đó không có cấp BU; Cascading UI tự động bỏ qua dropdown cấp rỗng. -->
     <!-- Sửa theo EFR-02 (Round 11): Quy định Nguồn Dữ Liệu Phân Tầng (Hierarchical Sources): KHOI_VALUES (11 Khối) là authoritative cho 11 root Khối; Parser 1.0b khởi tạo/merge đủ 11 root Khối (bao gồm Vccorp) vào canonical JSON trước khi attach các node con từ Excel. -->
  2. Bổ sung Danh mục **`Line Nhân sự`** (`type = 'line_nhan_su'`, `parent_id = NULL`, `khoi` NULL) **Global Độc lập**.
  3. RBAC Matrix: Read: All Roles; SA + EA: Quick-Add/Thêm/Sửa/Inactive; SA: Hard Delete & Reparent cross-Khối.
  4. Cascading Dropdown (có **Search Box** tìm kiếm nhanh). Dual-write lưu cả UUIDs và Text Labels tự động derive từ DB.
  5. **Excel Auto-Ingestion Pipeline:** 
     - Đầu vào: `Chuẩn hóa phòng ban BP.xlsx` tại repo root (hỗ trợ copy/fallback `data/Chuẩn hóa phòng ban BP.xlsx`).
       <!-- Sửa theo EFR-05: Khóa input contract fail-safe cho parser: đọc file root/data, sheet 'Phòng ban' (header row 1) và sheet 'Line' (headerless từ row 1), trim/blank handling, fail-fast và log duplicate paths. -->
     - Script `scripts/parse_excel_canonical_org_units.ts`: Tự động trích xuất file Excel sang `packages/shared/src/constants/canonical_org_units.json`.
       <!-- Sửa theo EFR-03 (Round 11): Deduplication policy deterministic: Các row có identical normalized full path được dedupe thành 1 canonical node (log cảnh báo row numbers); nếu trùng path nhưng khác payload ➔ parser fail non-zero exit code. -->
       <!-- Sửa theo EFR-04: Sinh deterministic identity (UUIDv5 bằng fixed namespace + normalized path + type) và canonical code path-derived ổn định; CI regenerate & drift check. -->
     - Generator script `scripts/generate-org-unit-seed.cjs`: Biên dịch JSON sang SQL migration `049_seed_and_update_workflow_rpcs.sql`.
     - Script `scripts/backfill_employee_org_units.ts`: **Consume trực tiếp từ `canonical_org_units.json`** (single source of truth cho parser, seed 049, dev users và backfill) để exact-match 100% canonical path trước khi Fuzzy Match.
       <!-- Sửa theo EFR-02 (Round 12): Tuyên bố Single Canonical JSON Artifact (`canonical_org_units.json`) làm nguồn duy nhất cho backfill script, loại bỏ pipeline parsing Excel song song tránh lệch UUIDv5/path. -->
       <!-- Sửa theo EFR-03: Đọc đúng cấu trúc workbook (Phòng ban & Line); bỏ tuyên bố Alias sheet và làm rõ Bước 1 exact-match canonical path trước khi fuzzy match. -->
  6. **Dev Users Dual-Write Seed:** Cập nhật `seed_dev_users.ts` gán sẵn UUIDs từ `canonical_org_units.json` cho dev users.
  7. **Post-Deploy Tooling & Staged Migration Isolation:**
     - Tách `database/post_deploy/050_enforce_strict_org_units.sql` ra khỏi initial migrations.
     - Cập nhật `backend/scripts/sync-migrations.cjs` chỉ sync initial migrations `001-049`.
     - Bổ sung npm script `pnpm test:integration:staged` và `pnpm deploy:post-gate` để kiểm thử và triển khai chuẩn 4 Stages.
  8. **Complete Rollback & Forward Recovery Lifecycle:** RPC `rpc_disable_strict_org_unit_enforcement()` và `rpc_enable_strict_org_unit_enforcement()` (Hardened, Audit, No API route).
  9. **Inactive Enforcement:** DB Trigger cấm gán MỚI hoặc SỬA SANG FK `org_unit` / `line_nhan_su` đang `is_active = false`.
  10. DB Trigger `BEFORE INSERT OR UPDATE` duy trì `normalized_name = unaccent(lower(trim(NEW.name)))`.
  11. 6 SQL RPCs mutation/cascade chạy `SECURITY DEFINER` với `SET search_path = public`, `REVOKE ALL FROM PUBLIC/anon/authenticated`, `GRANT EXECUTE TO service_role`.
  12. RPC Cascade Deactivate cho SA: Tách `rpc_preview_cascade_deactivate` (read-only) và `rpc_execute_cascade_deactivate` (raise SQL error `PREVIEW_STALE` ➔ Hono API trả **HTTP 409 PREVIEW_STALE**).
  13. Fuzzy Matching tiếng Việt: Trả DTO `FuzzyMatchResponse` chứa status (`matched`, `ambiguous`, `no_match`), `score`, `margin`, `selectedCandidate?`, `candidates[]` (mỗi candidate include `id`, `code`, `type`, `name`, `khoi`, full path & ancestor FK/text maps với `null` cho skipped levels). Auto-select tag "AI đã chọn" khi matched, 75-94% confirm candidate list, < 75% manual.
      <!-- Sửa theo EFR-03 (Round 12): Khóa DTO Fuzzy Match chứa candidate ID/code/ancestors/skipped level map để OCR & UI dual-write chính xác FK IDs và text labels. -->
  14. Frontend UI Cascading Dropdown: Hỗ trợ Traversal Cây Thưa (Sparse UI Traversal). Khi chọn parent, nếu cấp kế tiếp không có con nhưng cấp sâu hơn có node, UI tự động skip dropdown trống và nạp trực tiếp options của cấp kế tiếp có dữ liệu (ví dụ `KND (Khối)` ➔ nhảy trực tiếp `Phòng ban` bỏ qua `BU`). Dual-write form payload ghi `bu_id = null` và `bu = null`.
      <!-- Sửa theo EFR-01 (Round 12): Khóa UI contract traversal cho sparse hierarchy trong Cascading Dropdown và Form dual-write. -->

## 2. Phạm vi

### In scope
- **Excel Ingestion Pipeline:**
  - File Nguồn: `Chuẩn hóa phòng ban BP.xlsx` (repo root / `data/`)
  - Parser Script: `scripts/parse_excel_canonical_org_units.ts`
  - Output Artifact: `packages/shared/src/constants/canonical_org_units.json`
  - Seed Generator: `scripts/generate-org-unit-seed.cjs` ➔ `database/migrations/049_seed_and_update_workflow_rpcs.sql`.
- **Tooling & Post-Deploy Isolation (`sync-migrations.cjs` & `package.json`):**
  - Cập nhật `backend/scripts/sync-migrations.cjs` và `backend/package.json`.
- **Rollback & Forward Recovery RPCs:** `rpc_disable_strict_org_unit_enforcement()` và `rpc_enable_strict_org_unit_enforcement()`.
- **Khóa Machine-Keys 11 Khối đồng bộ (`KHOI_VALUES`):** 11 Khối chuẩn.
- **Cấu trúc Cây 5 Tầng & Line Global:** `Khối`, `BU`, `Phòng ban`, `Bộ phận`, `Nhóm team`, `Line Nhân sự` (global).
- **Frontend UI & OCR Integration:** Searchable Cascading Dropdown, Searchable Line Select, Quick-Add Modal "+", Trang `OrgUnitManagementPage.tsx`, OCR prompt.

### Out of scope
- Không làm thay đổi quy tắc tính lương.

## 3. Đối chiếu Knowledge Base

- **Security Hardening & Machine Keys:** 11 Khối machine keys bất biến. 100% RPC `SECURITY DEFINER` khóa `search_path = public`.
- **Excel Ingestion & Data Accuracy:** Đọc trực tiếp từ file Excel chuẩn hóa do người dùng cung cấp làm Single Source of Truth.
- **Post-Deploy Tooling & Staged Rollout Isolation:** Phân định rõ 4 Stages deployment.
- **Supabase Local Docker CLI Harness Standard:** Chạy `pnpm --filter backend test:integration:fresh` và `pnpm --filter backend test:integration:staged`.

## 4. Acceptance Criteria

- [ ] [Excel] Script `scripts/parse_excel_canonical_org_units.ts` đọc file `Chuẩn hóa phòng ban BP.xlsx` (repo root hoặc `data/`), xử lý sparse hierarchy, sinh deterministic UUIDv5 & unique code paths, tự động trích xuất cấu trúc cây & Danh mục Line nhân sự (sheet `Line` headerless từ A1) sang `canonical_org_units.json`.
- [ ] [Tooling] Generator script `scripts/generate-org-unit-seed.cjs` biên dịch `canonical_org_units.json` sang migration `049` SQL; CI drift test kiểm tra regenerate checksum.
- [ ] [Tooling] `sync-migrations.cjs` & `package.json` phân lập `database/post_deploy/050_enforce_strict_org_units.sql` khỏi initial migration set; lệnh `pnpm --filter backend test:integration:staged` chạy thành công chuỗi 4 Stages.
- [ ] [DB] `scripts/backfill_employee_org_units.ts` ưu tiên exact match 100% theo canonical path trong file Excel trước khi chạy Fuzzy Match.
- [ ] [DB] Migration `048` & `049` tạo `org_units`, `unaccent`, trigger `normalized_name`, unique indexes, DB triggers, FK UUIDs, auto-derived text labels, và Static Seed từ Excel.
- [ ] [DB] Migration `050` (Post-deploy gate) chứa Multi-field Pre-condition Guard (chỉ apply thành công khi 100% các cột text có FK UUID tương ứng valid).
- [ ] [DB] RPC `rpc_disable_strict_org_unit_enforcement` và `rpc_enable_strict_org_unit_enforcement` (Hardened + Audit, no API route) khôi phục và phục hồi an toàn trigger.
- [ ] [DB] Hardened RPCs với `SET search_path = public`, `REVOKE ALL FROM PUBLIC/anon/authenticated`, `GRANT TO service_role`. Reparent cross-Khối cấm EA, chỉ cho SA.
- [ ] [RPC] Mutation RPCs atomic với `audit_log`. `rpc_execute_cascade_deactivate` trả **HTTP 409 PREVIEW_STALE** khi expected IDs lệch.
- [ ] [API] API Fuzzy Match (bắt buộc `type`, `khoi` nếu không phải Line), trả score, margin, status theo threshold 95%/75%.
- [ ] [UI] Searchable Cascading Dropdown, Searchable Line Select, Nút "+", Tag "AI đã chọn", Trang `OrgUnitManagementPage.tsx`.
- [ ] [Test] 100% Integration Tests vượt qua khi chạy `pnpm --filter backend test:integration:fresh` và `test:integration:staged` trên **Supabase Local Docker CLI**.

## 5. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `Chuẩn hóa phòng ban BP.xlsx` | [NEW] | File Excel Nguồn Dữ Liệu Danh Mục Chuẩn Hóa của User (đặt tại repo root hoặc `data/`) | 🟢 Low | Có |
| `scripts/parse_excel_canonical_org_units.ts` | [NEW] | Parser script tự động trích xuất file Excel (xử lý sparse rows, deterministic UUIDv5/codes, fail-safe sheet reader) sang JSON canonical artifact | 🟡 Medium | Có |
| `packages/shared/src/constants/canonical_org_units.json` | [NEW] | Authoritative Canonical Seed Artifact (sinh tự động từ Excel) | 🟢 Low | Có |
| `scripts/generate-org-unit-seed.cjs` | [NEW] | Generator script biên dịch JSON artifact sang SQL migration 049 | 🟡 Medium | Có |
| `backend/scripts/sync-migrations.cjs` | Sửa | Exclude post_deploy folder khỏi initial migration sync | 🟡 Medium | Có |
| `backend/package.json` | Sửa | Thêm scripts test:integration:staged & deploy:post-gate | 🟡 Medium | Có |
| `packages/shared/src/constants/khoi.ts` | Sửa | Chuẩn hóa 11 Khối machine keys (`KHOI_VALUES`) | 🟡 Medium | Có |
| `database/migrations/048_create_org_units.sql` | [NEW] | Tạo `org_units`, extensions, normalized_name trigger, triggers (Stage 1 non-blocking chain check, inactive check, rollback text-reset semantics), RPCs atomic audit + hardening | 🔴 High | Có |
| `database/migrations/049_seed_and_update_workflow_rpcs.sql` | [NEW] | Static Seed từ generator script, cập nhật Onboarding RPC, Pending RPC, Submit RPC, Views | 🔴 High | Có |
| `backend/scripts/seed_dev_users.ts` | Sửa | Dual-write UUIDs cho dev users test trên fresh DB setup | 🟡 Medium | Có |
| `scripts/backfill_employee_org_units.ts` | [NEW] | Script backfill dữ liệu text cũ sang UUID ưu tiên map theo Excel | 🟡 Medium | Có |
| `database/post_deploy/050_enforce_strict_org_units.sql` | [NEW] | Post-deploy gate migration chứa Multi-field Guard & RPC disable/enable strict enforcement | 🔴 High | Có |
| `packages/shared/src/schemas/orgUnit.ts` | [NEW] | Zod schema & types cho Org Units, Line & Fuzzy Match DTO | 🟢 Low | Có |
| `backend/src/services/orgUnitService.ts` | [NEW] | Service wrapper gọi SQL RPCs & Hono 409 error mapping & Fuzzy Match logic | 🟡 Medium | Có |
| `backend/src/routes/orgUnits.ts` | [NEW] | API Routes cho `/api/org-units` | 🟡 Medium | Có |
| `backend/src/index.ts` | Sửa | CORS origins update (`PATCH`/`PUT`) & router mount | 🟡 Medium | Có |
| `backend/src/services/ocrService.ts` | Sửa | OCR prompt & call fuzzy search với khoi/type context | 🟡 Medium | Có |
| `frontend/src/services/orgUnitApi.ts` | [NEW] | Client API cho frontend | 🟢 Low | Có |
| `frontend/src/components/common/OrgUnitCascadingSelect.tsx` | [NEW] | Reusable Searchable Dropdown Nối tầng Cây 5 tầng & Select Line Nhân sự Độc lập (hỗ trợ Traversal Cây Thưa / Sparse UI Traversal) | 🟢 Low | Có |
| `frontend/src/components/common/QuickAddOrgUnitModal.tsx` | [NEW] | Modal Thêm nhanh đơn vị / Line mới | 🟢 Low | Có |
| `frontend/src/components/DocumentUpload.tsx` | Sửa | Tích hợp candidate DTO từ Fuzzy Match, hiển thị ô xác nhận candidates / tag "AI đã chọn", nạp ancestor FK/text maps vào `onFillFields`, và gỡ bỏ logic `delete payload.khoi` | 🟡 Medium | Có |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Render `OrgUnitCascadingSelect` và tiếp nhận dual-write payload từ `DocumentUpload.tsx` | 🟡 Medium | Có |
| `frontend/src/pages/Admin/OrgUnitManagementPage.tsx` | [NEW] | Trang Quản lý Cây Tổ chức & Danh mục Line Nhân sự | 🟡 Medium | Có |
| `frontend/src/App.tsx` | Sửa | Đăng ký route `/admin/org-units` | 🟢 Low | Có |
| `frontend/src/components/MainLayout.tsx` | Sửa | Đăng ký Navigation Menu cho SA/EA | 🟢 Low | Có |
| `backend/src/__tests__/unit/orgUnitService.test.ts` | [NEW] | Unit tests | 🟢 Low | Có |
| `backend/src/__tests__/integration/orgUnitsApi.test.ts` | [NEW] | Integration tests (Chạy `pnpm --filter backend test:integration:fresh` và `test:integration:staged` trên Supabase Local Docker CLI `:54321`) | 🟡 Medium | Có |

## 6. Test Strategy & Verification

- **Môi trường Test Bắt buộc:** Chạy `pnpm --filter backend test:integration:fresh` và `pnpm --filter backend test:integration:staged` trên **Supabase Local Docker CLI Harness** (`127.0.0.1:54321`).
- **Automated Tests:** Excel Parser test, Staged Rollout 4 Stages, Multi-field Precondition Guard 050, RPC Rollback & Forward Recovery Lifecycle, Generator Script Checksum, CRUD API, Line global RBAC, Reparent cross-Khối SA-only, RPC Hardening, Atomic Audit, Prefix Chain Integrity, Inactive Enforcement, 409 Stale, Fuzzy Match threshold.
- **Manual Verification:** Smoke test UI Dropdown, Search Box, Quick-Add "+", Tab Cây & Tab Line.

## 7. Rollback Plan

- **Additive Rollback Strategy & Complete Forward Recovery Lifecycle:**
  - Mọi thay đổi DB đều dạng bổ sung (additive nullable FK columns).
  - **Khi Rollback App:** Thực thi `SELECT rpc_disable_strict_org_unit_enforcement()`.
  - **Khi Re-deploy App mới:** Re-deploy dual-write app ➔ Chạy lại `scripts/backfill_employee_org_units.ts` ➔ Thực thi `SELECT rpc_enable_strict_org_unit_enforcement()`.

## 8. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
