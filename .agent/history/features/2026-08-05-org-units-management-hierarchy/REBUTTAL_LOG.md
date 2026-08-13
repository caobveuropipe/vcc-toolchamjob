# Rebuttal Log: org-units-management-hierarchy

## Round 1 - 2026-08-04T16:10:00+07:00

### Tổng kết
- EFR: 8 (accepted: 8, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-83`, `database/migrations/046_update_workflow_binding_rpcs.sql:1-5`, `packages/shared/src/schemas/employee.ts:56-61`, `backend/src/index.ts:31-88`

### EFR Đã Chấp Nhận -> [EFR-01]: Trùng số migration `046` | Sửa: Đổi sang `048_create_org_units.sql` trong plan và tasks.
### EFR Đã Chấp Nhận -> [EFR-02]: Chưa có chiến lược chuyển đổi end-to-end từ text sang UUID | Sửa: Bổ sung dual-write (`*_id` + text string), giữ nhãn text bất biến trong snapshots, cập nhật Zod/RPCs/views.
### EFR Đã Chấp Nhận -> [EFR-03]: Schema chưa khóa các invariant của cây phân cấp | Sửa: Thêm DB CHECK constraints, Triggers chống cycle/level mismatch, default block inactive parent có con active, SA cascade-deactivate RPC kèm preview & audit.
### EFR Đã Chấp Nhận -> [EFR-04]: Mô hình actor “EA / Khối Manager / Khối Admin” không khớp permission contract | Sửa: Thống nhất dùng SA và EA từ `user_permissions`, derive `khoi` tại server-side từ DB, cấm cross-khoi.
### EFR Đã Chấp Nhận -> [EFR-05]: Thiếu audit trail cho CRUD, inactive và hard delete danh mục | Sửa: Bổ sung yêu cầu ghi `audit_log` cho 100% mutation thao tác danh mục trong cùng transaction SQL / RPC.
### EFR Đã Chấp Nhận -> [EFR-06]: Contract fuzzy matching/OCR chưa đủ để đạt acceptance | Sửa: Quy định cụ thể threshold (≥95% + margin ≥10% auto-select với tag "AI đã chọn"; 75-94% confirm; <75% manual; không bao giờ tự tạo node mới), trigram index.
### EFR Đã Chấp Nhận -> [EFR-07]: API/UI delivery plan bỏ sót contract bắt buộc (CORS, router mount, frontend path) | Sửa: Bổ sung `PATCH` / `PUT` vào CORS origins, mount router tại `backend/src/index.ts`, sửa path `frontend/src/pages/Admin/OrgUnitManagementPage.tsx`, đăng ký route tại `App.tsx` và menu tại `MainLayout.tsx`.
### EFR Đã Chấp Nhận -> [EFR-08]: Rollback và verification chưa an toàn cho migration có dữ liệu sống | Sửa: Đổi sang chiến lược Rollback Additive không drop data/schema cũ, bổ sung integration tests cho fresh migration & upgrade.

---

## Round 2 - 2026-08-04T17:10:00+07:00

### Tổng kết
- EFR: 7 (accepted: 7, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-69`, `FEATURE_PLAN.md:1-150`, `FEATURE_TASKS.md:1-85`

### EFR Đã Chấp Nhận -> [EFR-01]: Task breakdown thiếu owner cho RPC/view/backfill của dual-write | Sửa: Thêm Task 1.3 cập nhật Onboarding/Pending/Submit RPCs & views; thêm Task 2.3 viết script backfill với báo cáo reconciliation.
### EFR Đã Chấp Nhận -> [EFR-02]: 4 FK độc lập không đảm bảo thuộc cùng một chuỗi tổ chức | Sửa: Thêm DB Trigger trên `employees` validate 4 FK IDs nối liền theo cây tổ chức và auto-derive 4 field text từ `org_units`.
### EFR Đã Chấp Nhận -> [EFR-03]: "Audit cùng transaction" chưa có cơ chế thực thi cho CRUD thường | Sửa: Chuyển toàn bộ 100% mutation CRUD sang PostgreSQL Atomic RPCs (`SECURITY DEFINER`) thực thi mutation và `audit_log` trong 1 SQL transaction.
### EFR Đã Chấp Nhận -> [EFR-04]: Fuzzy Match thiếu scope `khoi/type/parent` | Sửa: Ép buộc DTO Fuzzy Match phải chứa mandatory parameters `khoi` & `type`, query chỉ thực thi trong phạm vi scope chỉ định.
### EFR Đã Chấp Nhận -> [EFR-05]: Trigram trên raw `name` không xử lý mất dấu tiếng Việt | Sửa: Thêm extension `unaccent` và STORED column `normalized_name = unaccent(lower(trim(name)))` kèm GIN trigram index.
### EFR Đã Chấp Nhận -> [EFR-06]: Active-state invariant chưa chặn Create/Move/Reactivate dưới ancestor inactive | Sửa: Bổ sung DB Trigger ancestor-active check chặn triệt để mọi thao tác tạo, di chuyển hoặc kích hoạt node có bất kỳ ancestor nào đang inactive.
### EFR Đã Chấp Nhận -> [EFR-07]: Preview & execute Cascade Deactivate chưa có contract chống preview stale | Sửa: Tách `rpc_preview_cascade_deactivate` (read-only) và `rpc_execute_cascade_deactivate` (nhận `expected_node_ids`, trả `409 PREVIEW_STALE` nếu subtree thay đổi).

---

## Round 3 - 2026-08-04T17:28:00+07:00

### Tổng kết
- EFR: 6 (accepted: 6, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-72`, `FEATURE_PLAN.md:1-160`, `FEATURE_TASKS.md:1-120`

### EFR Đã Chấp Nhận -> [EFR-01]: Generated column dùng `unaccent()` sẽ làm migration thất bại | Sửa: Dùng `BEFORE INSERT OR UPDATE` trigger `trg_org_units_normalize_name` duy trì `normalized_name` thay vì stored generated column.
### EFR Đã Chấp Nhận -> [EFR-02]: Các RPC `SECURITY DEFINER` chưa được khóa quyền gọi trực tiếp | Sửa: Khóa an toàn 100% RPCs bằng `SET search_path = public`, `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role`.
### EFR Đã Chấp Nhận -> [EFR-03]: Backfill chưa có bước tạo danh mục chuẩn để map vào | Sửa: Bổ sung bước Seed Canonical Catalog trong migration `049` từ dữ liệu legacy trước khi chạy script backfill ở Phase 2.
### EFR Đã Chấp Nhận -> [EFR-04]: Rename/reparent node có thể làm dữ liệu nhân sự bị stale hoặc sai chain | Sửa: `rpc_update_org_unit` tự động cập nhật text labels và re-validate chain của nhân sự đang tham chiếu trong cùng transaction khi rename/reparent.
### EFR Đã Chấp Nhận -> [EFR-05]: Constraint catalog chưa đủ để ngăn dữ liệu không hợp lệ/trùng nghĩa | Sửa: Thêm `NOT NULL`, `CHECK (type IN (...))` và UNIQUE index trên `(khoi, type, coalesce(parent_id, ...), normalized_name)` chống trùng sibling.
### EFR Đã Chấp Nhận -> [EFR-06]: SQL RPC không thể tự "trả HTTP 409" nếu chưa có mapping ở API | Sửa: RPC raise SQL error `PREVIEW_STALE`, Hono API Service catch và map sang HTTP 409 `{ error: 'PREVIEW_STALE' }`.

---

## Round 4 - 2026-08-04T18:00:00+07:00

### Tổng kết
- EFR: 6 (accepted: 6, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-72`, `FEATURE_PLAN.md:1-165`, `FEATURE_TASKS.md:1-125`

### EFR Đã Chấp Nhận -> [EFR-01]: Lệnh verification bỏ qua bước đồng bộ migration vào Supabase Local | Sửa: Bắt buộc dùng `pnpm --filter backend test:integration:fresh` (tự động chạy `sync-migrations.cjs` mirror sang `supabase/migrations/` và reset local DB).
### EFR Đã Chấp Nhận -> [EFR-02]: Rename node `Khối` xung đột với khóa phân quyền dạng text hiện tại | Sửa: Quy định `org_units.code` của `type = 'khoi'` là machine key bất biến khớp `user_permissions.khoi`; cấm đổi `code` khi update Khối, chỉ cho sửa `name` (display_name).
### EFR Đã Chấp Nhận -> [EFR-03]: `Line Nhân sự` được gọi là global nhưng schema/API vẫn bắt buộc `khoi` | Sửa: Khai báo `khoi` NULLABLE cho `line_nhan_su`, Unique global theo `(type, normalized_name)`, Fuzzy search không yêu cầu context `khoi`.
### EFR Đã Chấp Nhận -> [EFR-04]: Contract chain 5 tầng không tương thích dữ liệu hiện tại cho phép thiếu cấp dưới | Sửa: Enforce Prefix Chain Validation trên `employees`: `khoi_id` bắt buộc; các cấp sau optional nhưng cấm gap thiếu ancestor trước đó.
### EFR Đã Chấp Nhận -> [EFR-05]: Inactive node vẫn có thể được gán mới cho nhân sự qua backend/RPC | Sửa: DB Trigger trên `employees` cấm gán MỚI hoặc SỬA SANG FK org_unit/line đang is_active = false hoặc có ancestor inactive.
### EFR Đã Chấp Nhận -> [EFR-06]: Seed catalog từ legacy không chạy được theo đúng thứ tự của fresh local harness | Sửa: Tách biệt Static Seed Idempotent trong migration `049` cho fresh DB install và Script `backfill_employee_org_units.ts` cho legacy upgrade.

---

## Round 5 - 2026-08-04T18:20:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-66`, `FEATURE_PLAN.md:1-170`, `FEATURE_TASKS.md:1-135`

### EFR Đã Chấp Nhận -> [EFR-01]: Bật strict `khoi_id` trigger trước backfill sẽ làm vỡ live writes | Sửa: Triển khai Staged Rollout (Stage 1: trigger non-blocking chỉ validate khi UUIDs !== NULL; Stage 2: Code & Seed; Stage 3: Backfill; Stage 4: Migration `050` Strict Enforcement).
### EFR Đã Chấp Nhận -> [EFR-02]: RBAC mutation cho `Line Nhân sự` global vẫn chưa được quyết định | Sửa: Chốt RBAC Matrix cho Line Nhân sự (Read: All Roles; Quick-Add/Create/Update/Inactive: SA + EA; Hard Delete: SA).
### EFR Đã Chấp Nhận -> [EFR-03]: Reparent qua Khối khác chưa kiểm tra quyền ở cả source và destination | Sửa: Quy định cấm EA di chuyển node (Reparent) sang Khối khác cross-scope; Reparent cross-Khối là SA-Only.
### EFR Đã Chấp Nhận -> [EFR-04]: Domain Khối giữa DB và shared constants vẫn không đồng nhất | Sửa: Đồng bộ 100% danh sách 11 Khối machine-keys `KHOI_VALUES` giữa `packages/shared/src/constants/khoi.ts`, DB check constraints, Zod schemas và seed file.
### EFR Đã Chấp Nhận -> [EFR-05]: "Static Canonical Seed" chưa có nguồn dữ liệu authoritative | Sửa: Chỉ định Authoritative Canonical Seed Artifact tại `packages/shared/src/constants/canonical_org_units.json`.

---

## Round 6 - 2026-08-04T21:15:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-52`, `FEATURE_PLAN.md:1-180`, `FEATURE_TASKS.md:1-145`

### EFR Đã Chấp Nhận -> [EFR-01]: Migration `050` sẽ được apply trước Stage 3 backfill trong chính test/deploy flow | Sửa: Khai báo Pre-condition Guard trong migration `050_enforce_strict_org_units.sql` (kiểm tra `count(unmigrated_employees) == 0`, abort nâng cao nếu còn rác chưa backfill).
### EFR Đã Chấp Nhận -> [EFR-02]: SQL migration `049` không có cơ chế đọc `canonical_org_units.json` | Sửa: Xây dựng Generator Script `scripts/generate-org-unit-seed.cjs` biên dịch `canonical_org_units.json` thành migration SQL idempotent `049_seed_and_update_workflow_rpcs.sql`.
### EFR Đã Chấp Nhận -> [EFR-03]: Rollback app sau Stage 4 không còn tương thích với strict trigger | Sửa: Tạo RPC `rpc_disable_strict_org_unit_enforcement` khôi phục trigger về Stage 1 non-blocking nếu phải rollback application về phiên bản cũ.

---

## Round 7 - 2026-08-04T21:20:00+07:00

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-59`, `FEATURE_PLAN.md:1-190`, `FEATURE_TASKS.md:1-155`

### EFR Đã Chấp Nhận -> [EFR-01]: Guard của `050` vẫn bật strict quá sớm trên fresh DB | Sửa: Tách `050` thành Post-Deploy Gate script; Cập nhật `seed_dev_users.ts` gán sẵn UUIDs từ canonical seed cho dev users test trên fresh DB setup.
### EFR Đã Chấp Nhận -> [EFR-02]: RPC tắt strict enforcement chưa có security hardening và audit riêng | Sửa: Bổ sung hardening `SECURITY DEFINER`, `SET search_path = public`, `REVOKE FROM PUBLIC/anon/authenticated`, `GRANT TO service_role`, ghi `audit_log`, cấm mount API route cho `rpc_disable_strict_org_unit_enforcement`.
### EFR Đã Chấp Nhận -> [EFR-03]: Guard chỉ kiểm tra `khoi_id` nên vẫn cho phép cutover khi các cấp dưới chưa map | Sửa: Nâng cấp Multi-field Guard trong `050`: kiểm tra 100% tất cả 5 cấp + Line (nếu text non-null ➔ FK UUID phải non-null và valid; abort nếu còn unmigrated text ở bất kỳ cấp nào).
### EFR Đã Chấp Nhận -> [EFR-04]: Rollback trigger “non-blocking” không bảo toàn text-only hierarchy updates | Sửa: Xây dựng Rollback Text-Reset Semantics cho trigger: khi app cũ gửi text update mới khác tên derived từ UUID cũ, tự động clear (NULL) FK UUID tương ứng và các cấp con để text update có hiệu lực đúng chuẩn legacy semantics.

---

## Round 8 - 2026-08-04T21:25:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-45`, `FEATURE_PLAN.md:1-200`, `FEATURE_TASKS.md:1-165`

### EFR Đã Chấp Nhận -> [EFR-01]: “Post-Deploy Gate” chưa có cơ chế tooling để loại/apply `050` riêng | Sửa: Đặt `050` vào `database/post_deploy/`, cập nhật `sync-migrations.cjs` loại trừ folder này khỏi initial sync, thêm script `pnpm test:integration:staged` và `pnpm deploy:post-gate` vào `package.json`.
### EFR Đã Chấp Nhận -> [EFR-02]: Không có quy trình bật strict trở lại sau rollback làm UUID bị clear | Sửa: Hoàn thiện Vòng đời Forward Recovery: Bổ sung RPC `rpc_enable_strict_org_unit_enforcement` (Hardened + Audit, no API route) để re-validate Multi-field Guard và bật lại Stage 4 strict mode sau khi re-deploy app mới và re-backfill.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-200`, `FEATURE_TASKS.md:1-165` (Đã xác minh 100% EFRs Round 8 được khắc phục triệt để).

---

## Round 10 - 2026-08-04T22:38:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-64`, `FEATURE_PLAN.md:70-169`, `FEATURE_TASKS.md:75-130`, `Chuẩn hóa phòng ban BP.xlsx` (zip inspection)

### EFR Đã Chấp Nhận -> [EFR-01]: Excel nguồn chứa sparse rows (bỏ trống cấp trung gian) | Sửa: Cập nhật plan và Task 1.0b cho phép sparse hierarchy rows trong Excel input; parser tự động collapse parent hierarchy mà không tạo placeholder hay vi phạm level mismatch, kèm log reconciliation.
### EFR Đã Chấp Nhận -> [EFR-02]: Excel chỉ chứa 10 Khối, thiếu `Vccorp` | Sửa: Quy định source precedence rõ ràng trong plan: `KHOI_VALUES` (11 Khối) là authoritative cho root Khối; Excel cung cấp hierarchy cho các Khối xuất hiện trong file mà không fail validation.
### EFR Đã Chấp Nhận -> [EFR-03]: Workbook không có sheet Alias/Mapping | Sửa: Bỏ tuyên bố Alias sheet trong plan/tasks; làm rõ Bước 1 của backfill script là Exact Match 100% theo canonical path trong Excel trước khi Fuzzy Match.
### EFR Đã Chấp Nhận -> [EFR-04]: Thiếu identity algorithm deterministic cho UUID và unique code | Sửa: Chốt canonical identity algorithm trong Task 1.0b sử dụng UUIDv5 (fixed namespace + normalized full path + type) và canonical code path-derived ổn định; bổ sung CI test verify checksum drift đối với generated JSON/SQL.
### EFR Đã Chấp Nhận -> [EFR-05]: Input contract parser chưa fail-safe cho workbook hiện tại | Sửa: Khóa input contract fail-safe trong Task 1.0b: chấp nhận path repo root hoặc `data/`, đọc sheet `Phòng ban` (header row 1) và sheet `Line` (headerless từ A1), xử lý trim/blank và fail-fast logging.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:70-169`, `FEATURE_TASKS.md:75-130` (Xác minh không có lỗ hổng logic hay rủi ro mới phát sinh từ các annotation EFR-01..05).

---

## Round 11 - 2026-08-04T22:50:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-51`, `FEATURE_PLAN.md:70-174`, `FEATURE_TASKS.md:77-130`

### EFR Đã Chấp Nhận -> [EFR-01]: Collapse sparse hierarchy xung đột với level-mismatch trigger và employee prefix-chain | Sửa: Khóa Cấu trúc Cây Thưa (Sparse Tree Semantics) toàn hệ thống: sửa DB level-mismatch trigger cho phép node skip-level (như phong_ban nối khoi khi bu IS NULL); sửa employee prefix-chain trigger & Post-Deploy Gate 050 cho phép FK intermediate level NULL nếu org_units của nhánh đó không có cấp BU; Cascading UI tự động bỏ qua dropdown cấp rỗng.
### EFR Đã Chấp Nhận -> [EFR-02]: KHOI_VALUES authoritative chưa được merge vào canonical JSON/SQL seed | Sửa: Quy định Nguồn Dữ Liệu Phân Tầng: Task 1.0b phải khởi tạo/merge đủ 11 root Khối từ KHOI_VALUES (bao gồm Vccorp) vào canonical JSON trước khi attach các node con từ Excel.
### EFR Đã Chấp Nhận -> [EFR-03]: Duplicate full paths trong Excel chưa có disposition policy | Sửa: Quy định Deduplication Policy deterministic: Các row trùng exact normalized full path (6 cặp row trùng trong Excel) được dedupe thành 1 canonical node và log row numbers; nếu trùng path nhưng khác payload ➔ parser fail non-zero exit code.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:70-174`, `FEATURE_TASKS.md:77-130` (Đã kiểm tra tính nhất quán giữa Sparse Tree DB Triggers, Employee Chain Validation, Seed Generator và Cascading Dropdown UI).

---

## Round 12 - 2026-08-04T22:54:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-51`, `FEATURE_PLAN.md:70-175`, `FEATURE_TASKS.md:77-151`

### EFR Đã Chấp Nhận -> [EFR-01]: Sparse UI behavior chỉ mới nằm trong annotation, chưa có task/test thực thi | Sửa: Khóa Sparse UI Traversal trong Task 3.2, Task 3.4 và Task 3.Final: UI tự động skip dropdown của intermediate level rỗng khi parent chọn, populate dual-write `null` cho các trường FK/text bị skip, và bổ sung test cases cho các nhánh thưa (`khoi ➔ phong_ban`, `bu ➔ bo_phan`, `phong_ban ➔ nhom_team`).
### EFR Đã Chấp Nhận -> [EFR-02]: Backfill reparses raw Excel tạo hai nguồn parsing/identity | Sửa: Quy định Single Canonical JSON Artifact (`canonical_org_units.json`) làm nguồn duy nhất cho script backfill trong Task 2.3; loại bỏ pipeline parse Excel song song trong backfill để đảm bảo 100% đồng nhất UUIDv5 và path normalizer.
### EFR Đã Chấp Nhận -> [EFR-03]: Fuzzy-match response thiếu candidate identity & ancestor path | Sửa: Khóa DTO response `FuzzyMatchResponse` trong Task 2.2 chứa `status`, `score`, `margin`, `selectedCandidate?` và `candidates[]` (mỗi candidate bao gồm `id`, `code`, `type`, `name`, `khoi`, `full_path`, cùng map ancestor IDs/labels với `null` cho skipped levels).

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:70-175`, `FEATURE_TASKS.md:77-151` (Đã kiểm tra toàn bộ luồng từ Parser ➔ JSON Artifact ➔ Seed 049 & Backfill ➔ Fuzzy Match DTO ➔ OCR & Cascading Dropdown UI Dual-write).

---

## Round 13 - 2026-08-04T22:59:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: Có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-37`, `FEATURE_PLAN.md:155-180`, `FEATURE_TASKS.md:135-155`, `frontend/src/components/DocumentUpload.tsx:585-605`

### EFR Đã Chấp Nhận -> [EFR-01]: OCR frontend task nhắm vào component không tồn tại (`DocumentBindingModal.tsx`) và bỏ sót nơi đang xóa `khoi` | Sửa: Đã cập nhật bảng files affected và Task 3.4/3.Final nhắm chính xác vào `frontend/src/components/DocumentUpload.tsx` và `frontend/src/components/EmployeeForm.tsx`. Quy định `DocumentUpload` parse `FuzzyMatchResponse`, hiển thị candidate confirmation / tag "AI đã chọn", truyền ancestor FK IDs & labels map vào `onFillFields`, và gỡ bỏ dòng `delete payload.khoi` để Khối và đơn vị tổ chức chuẩn hóa tự động auto-fill vào form nhân sự.

### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:155-180`, `FEATURE_TASKS.md:135-155`, `frontend/src/components/DocumentUpload.tsx:585-605` (Xác minh loại bỏ rủi ro payload `khoi` bị strip và đảm bảo luồng OCR -> Form auto-fill dual-write hoạt động chính xác trên codebase thực tế).




