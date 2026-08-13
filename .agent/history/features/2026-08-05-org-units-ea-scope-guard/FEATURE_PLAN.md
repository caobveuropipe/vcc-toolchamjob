# Feature Plan: Phân Quyền Scope-Based EA Cho Danh Mục Tổ Chức (Org Units EA Scope Guard)

<!-- Round 1 Annotations (EFR-01 -> EFR-08 Accepted) -->
<!-- Sửa theo EFR-01: Yêu cầu requireSuperAdmin (query trực tiếp DB superadmins) cho DELETE, execute-deactivate và reparent cross-Khối; không tin context cache/JWT metadata -->
<!-- Sửa theo EFR-02: Khóa PATCH status non-leaf node có descendants active đối với EA (chỉ cho PATCH leaf node; non-leaf phải dùng SA cascade deactivate) -->
<!-- Sửa theo EFR-03: Quy định POST type='khoi' và rename root Khối là SA-only để bảo vệ immutable scope key của user_permissions -->
<!-- Sửa theo EFR-04: Enforce DB-side scope resolver (không tin client input.khoi); derive khoi từ DB parent/target; 404 cho non-existent parent/target -->
<!-- Sửa theo EFR-05: Xây dựng dedicated orgUnitsScope.test.ts chạy trên Supabase Local Harness với bảng test matrix đầy đủ các roles × routes × scopes -->
<!-- Sửa theo EFR-06: Bổ sung Frontend UI Guard cho flow Create (canCreateOrgUnit), filter danh sách Khối/parent dropdown theo scope EA -->
<!-- Sửa theo EFR-07: Chuyển Rollback Plan sang cơ chế Fail-Closed Policy (khóa mutation về SA-only/maintenance mode khi có sự cố) -->
<!-- Sửa theo EFR-08: Chuẩn hóa Canonical Error Contract cho authorization: HTTP 403 { error: { code: 'FORBIDDEN', message: '...' } } -->

<!-- Round 2 Annotations (EFR-09 -> EFR-14 Accepted) -->
<!-- Sửa theo EFR-09: Sửa parameter name của rpc_preview_cascade_deactivate & rpc_execute_cascade_deactivate trong orgUnitService.ts từ p_root_node_id sang p_root_id -->
<!-- Sửa theo EFR-10: Bổ sung SQL migration 051_fix_cascade_array_order.sql thêm ORDER BY id cho array_agg trong preview & execute cascade để PREVIEW_STALE deterministic -->
<!-- Sửa theo EFR-11: Enforce status guard actor-agnostic: Mọi caller (kể cả SA) gọi PATCH status de-activate non-leaf node có con active đều nhận 409 CONFLICT và hướng sang cascade API -->
<!-- Sửa theo EFR-12: Thêm Form.Item parent_id trong Create Modal; bổ sung single-node status toggle action với guard leaf-node trên UI -->
<!-- Sửa theo EFR-13: Chuẩn hóa org-units authorization error response trong orgUnits.ts trả về HTTP 403 { error: { code: 'FORBIDDEN', message: '...' } } thống nhất -->
<!-- Sửa theo EFR-14: Triển khai cờ môi trường ORG_UNITS_MUTATION_MODE (normal|sa_only|disabled) cho Fail-Closed Rollback Strategy -->

<!-- Round 3 Annotations (EFR-15 -> EFR-19 Accepted) -->
<!-- Sửa theo EFR-15: Mở rộng migration 051 sửa rpc_update_org_unit dùng `p_actor_role IS DISTINCT FROM 'SA'` chống NULL fail-open, truyền trusted SA flag từ route qua service -->
<!-- Sửa theo EFR-16: Đưa ORG_UNITS_MUTATION_MODE vào backend/src/config/env.ts (Zod enum default 'normal') với truth table: normal (RBAC standard), sa_only (SA-only mutations), disabled (503 Service Unavailable cho 100% mutations) -->
<!-- Sửa theo EFR-17: Điều chỉnh Status UI Guard: Giới hạn non-leaf chốt ở DEACTIVATION (is_active=false -> 409); khi REACTIVATION (is_active=true) cho phép bật lại node theo luồng top-down khi parent active -->
<!-- Sửa theo EFR-18: Bổ sung QuickAddOrgUnitModal.tsx và OrgUnitCascadingSelect.tsx vào UI scope guard, bind parent_id và filter types/scope EA -->
<!-- Sửa theo EFR-19: Đặt database/migrations/051_fix_cascade_array_order.sql làm single source of truth, dùng node scripts/sync-migrations.cjs và verification qua `pnpm --filter backend test:integration:fresh` -->

<!-- Round 4 Annotations (EFR-20 Accepted) -->
<!-- Sửa theo EFR-20: Bổ sung 4 case đặc quyền vào Test Matrix: (1) EA vs Non-EA cho Line Global; (2) EA vs SA rename root khoi; (3) EA vs SA reparent cross-Khối; (4) DB RPC NULL/non-SA/SA role regression test -->

<!-- Round 5 Annotations (EFR-21 Accepted) -->
<!-- Sửa theo EFR-21: Mở rộng rpc_update_org_unit trong migration 051 xử lý SA reparent cross-Khối atomic: tự động cập nhật khoi của target node và toàn bộ descendants sang newParent.khoi, bypass hierarchy trigger fail và đảm bảo EA scope sau reparent authorize chuẩn xác -->

<!-- Round 6 Annotations (EFR-22 -> EFR-23 Accepted) -->
<!-- Sửa theo EFR-22: Chốt Invariant Root Khối Scope Key: org_units.code và org_units.khoi của type='khoi' là immutable machine key matching user_permissions.khoi; SA rename root Khối chỉ cập nhật display label name mà giữ nguyên code/khoi machine key bất biến -->
<!-- Sửa theo EFR-23: Nâng cấp trigger fn trg_org_units_invariants() trong migration 051: Trên UPDATE type='khoi', cưỡng chế NEW.khoi := OLD.khoi và NEW.code := OLD.code để tránh việc trigger cũ ghi đè NEW.khoi := NEW.name khi SA đổi tên display name -->

<!-- Round 9 Annotations (EFR-24 -> EFR-26 Accepted) -->
<!-- Sửa theo EFR-24: Cập nhật trg_org_units_invariants() cho INSERT type='khoi': NEW.khoi := COALESCE(NEW.code, NEW.khoi, NEW.name) đảm bảo machine key canonical trên INSERT -->
<!-- Sửa theo EFR-25: Refactor OrgUnitCascadingSelect.tsx resolve root node bằng u.khoi === selectedKey / id thay vì display u.name === selectedKhoi; đảm bảo khoi_id không bị null trong EmployeeForm khi SA đổi tên Root Khối -->
<!-- Sửa theo EFR-26: Đọc ORG_UNITS_MUTATION_MODE động theo từng request, đảm bảo harness integration test thay đổi cờ linh hoạt và assert HTTP 403/503 chuẩn xác -->

<!-- Round 10 Annotations (EFR-27 -> EFR-28 Accepted) -->
<!-- Sửa theo EFR-27: Dynamic ORG_UNITS_MUTATION_MODE reader dùng helper getOrgUnitsMutationMode() parse/validate bằng Zod enum per-request, fail-closed về 503 khi invalid value, restore env trong test afterEach -->
<!-- Sửa theo EFR-28: Phân định rõ phạm vi Test Harness: Backend integration suite (orgUnitsScope.test.ts) kiểm thử API/DB/triggers/RPC, Frontend component test verify OrgUnitCascadingSelect mapping khoi_id trong EmployeeForm -->

> **Trạng thái**: ✅ ĐỒNG Ý (Đã xử lý 28 EFRs qua 10 Vòng Expert Review)
> **Review gate**: Đã hoàn thành Expert Review Round 10 & Rebuttal.
> **Feature slug**: org-units-ea-scope-guard
> **Tạo bởi**: feature-plan (Updated via expert-rebuttal Round 10)
> **Ngày tạo**: 2026-08-05

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Vừa qua tính năng `org-units-management-hierarchy` đã triển khai cây danh mục tổ chức 5 tầng. Tuy nhiên, qua kiểm thử thực tế local với tài khoản `loi.admicro@gmail.com` (có quyền EA trên Khối `Admicro`), hệ thống vẫn cho phép tài khoản này cập nhật thành công các Đơn vị thuộc Khối khác (ví dụ Khối `KND`) do API route backend chưa kiểm tra scope `khoi` của user dựa trên matrix `user_permissions`. Đồng thời rà soát phát hiện các điểm rủi ro: `p_actor_role != 'SA'` bị NULL fail-open trong RPC, array ordering non-deterministic trong cascade deactivate, thiếu Zod validation cho cờ `ORG_UNITS_MUTATION_MODE`, deadlock khôi phục cây khi deactivate non-leaf, thiếu guard ở alternate Create path (`QuickAddOrgUnitModal`), rào cản SA reparent cross-Khối bị trigger exception do chưa đồng bộ `khoi` toàn bộ descendants subtree, rủi ro DB trigger cũ `trg_org_units_invariants` tự động ghi đè `NEW.khoi := NEW.name` khi SA đổi tên Root Khối, bug `khoi_id` bị null trong `OrgUnitCascadingSelect` khi display name khác machine key, và yêu cầu Zod-validate dynamic mutation-mode reader cùng việc phân định test harness rõ ràng.
- **Vấn đề cần giải quyết:** 
  1. API backend (`/api/org-units/*`) chưa mount `permissionMiddleware` và thiếu lớp helper kiểm tra scope Khối (`resolveAndValidateOrgUnitScope`) cho các thao tác mutation (`POST /`, `PUT /:id`, `PATCH /:id/status`, `DELETE /:id`).
  2. Các route đặc quyền SA-only (`DELETE`, `execute-deactivate`, reparent cross-Khối, tạo/đổi tên root Khối) phải query trực tiếp DB `superadmins` (authoritative), không nương theo context cache TTL 2h hay `user_metadata.role`.
  3. Sửa lỗi `orgUnitService.ts` gọi sai tên tham số RPC `p_root_node_id` sang `p_root_id`.
  4. Tạo migration `database/migrations/051_fix_cascade_array_order.sql` (dùng `sync-migrations.cjs` sync sang `supabase/migrations`):
     - Thêm `ORDER BY id` cho `array_agg` trong `rpc_preview_cascade_deactivate` & `rpc_execute_cascade_deactivate` để `PREVIEW_STALE` deterministic.
     - Sửa `p_actor_role IS DISTINCT FROM 'SA'` trong `rpc_update_org_unit` để triệt tiêu lỗ hổng NULL fail-open.
     - Bổ sung logic atomic subtree `khoi` update trong `rpc_update_org_unit`: Khi SA reparent cross-Khối, tự động tính `v_new_khoi` từ `p_parent_id`, cập nhật `khoi = v_new_khoi` cho target node và toàn bộ descendants subtree.
     - Nâng cấp `trg_org_units_invariants()` trigger function: Trên `INSERT` cho `type = 'khoi'`, gán `NEW.khoi := COALESCE(NEW.code, NEW.khoi, NEW.name)`. Trên `UPDATE` cho `type = 'khoi'`, cưỡng chế `NEW.khoi := OLD.khoi` và `NEW.code := OLD.code` (giữ nguyên machine keys bất biến ngay cả khi SA đổi tên display label `NEW.name`).
  5. Khóa generic `PATCH /:id/status` actor-agnostic khi DEACTIVATION (`is_active: false`): Mọi caller (kể cả SA) vô hiệu hóa node non-leaf có descendants active đều bị từ chối với HTTP 409 CONFLICT (bắt buộc dùng cascade flow). Khi REACTIVATION (`is_active: true`), cho phép bật lại node nếu parent đã active (top-down reactivation).
  6. Thêm cờ `ORG_UNITS_MUTATION_MODE` (`normal` | `sa_only` | `disabled`) vào `backend/src/config/env.ts` với Zod enum & default `normal`. Đọc cờ động per-request qua helper `getOrgUnitsMutationMode()` (validate bằng Zod enum, fail-closed về `disabled` / 503 nếu giá trị invalid):
     - `normal`: RBAC tiêu chuẩn.
     - `sa_only`: Chỉ DB-authoritative SA được mutation, non-SA nhận HTTP 403 / 503.
     - `disabled`: Chặn 100% callers (kể cả SA) khỏi mutation với HTTP 503 Service Unavailable (maintenance mode), read API giữ nguyên.
  7. UI frontend (`OrgUnitManagementPage.tsx`, `QuickAddOrgUnitModal.tsx`, `OrgUnitCascadingSelect.tsx`): 
     - Bổ sung control `parent_id` trong Create Modal & QuickAdd Modal, filter dropdown parent/Khối và toggle Status leaf/reactivation.
     - Refactor `OrgUnitCascadingSelect.tsx`: Resolve root node bằng `u.khoi === selectedKey` hoặc `u.id` thay vì so sánh `u.name === selectedKhoi`, đảm bảo `khoi_id` luôn được bind chính xác vào `EmployeeForm.tsx` khi SA đổi tên Root Khối.
- **Mục tiêu:** Đảm bảo triệt để mô hình phân quyền Defense-in-Depth và tính ổn định của hệ thống:
  - Tài khoản EA chỉ được phép Tạo / Sửa / Đổi trạng thái các Đơn vị Tổ chức thuộc Khối (`khoi`) mà mình được gán quyền trong `user_permissions`.
  - Mọi thao tác vi phạm scope của EA ở tầng API sẽ bị chặn cứng với lỗi HTTP 403 **`{ error: { code: 'FORBIDDEN', message: '...' } }`**.
  - SuperAdmin (SA) giữ toàn quyền trên 100% Khối và là người duy nhất có quyền Xóa (Delete), Cascade Deactivate, Reparent cross-Khối (với atomic subtree `khoi` update), và Tạo/Sửa tên Root Khối (`type = 'khoi'`).
  - `Line Nhân sự` (`type = 'line_nhan_su'`, `khoi = NULL`, `parent_id = NULL`) là danh mục Global: SA và EA có ít nhất 1 quyền EA được phép Tạo / Sửa / Đổi trạng thái.
- **Kết quả mong đợi:** 
  - Backend API từ chối HTTP 403 khi EA cố tình mutate node thuộc Khối khác.
  - Backend từ chối HTTP 409 CONFLICT cho 100% callers khi PATCH de-activate một node non-leaf có descendants active.
  - SA reparent cross-Khối thành công (HTTP 200 OK), `parent_id` và `khoi` của toàn bộ descendants subtree được cập nhật đồng bộ.
  - SA đổi tên Root Khối thành công (HTTP 200 OK), display label `name` thay đổi trong khi DB trigger giữ `code` và `khoi` machine key bất biến, `OrgUnitCascadingSelect` bind `khoi_id` cho nhân sự chính xác.
  - Cờ `ORG_UNITS_MUTATION_MODE` được validate bằng Zod enum per-request qua helper, test harness switch 3 modes và assert HTTP 403/503 chuẩn xác.
  - Phân định rõ harness testing: Backend API/DB/Triggers/RPCs verify bằng `pnpm --filter backend test:integration:fresh`, Frontend component verify logic mapping `OrgUnitCascadingSelect`.

---

## 2. Phạm vi

### In scope
- Mount `permissionMiddleware` và triển khai helper guard `resolveAndValidateOrgUnitScope` trên backend API (`backend/src/routes/orgUnits.ts`).
- Khai báo Zod enum `ORG_UNITS_MUTATION_MODE` in `backend/src/config/env.ts` và đọc động per-request qua helper `getOrgUnitsMutationMode()` (Zod-validated, fail-closed `disabled` 503 cho invalid value).
- Khớp named parameter `p_root_id` trong `backend/src/services/orgUnitService.ts`.
- Tạo migration `database/migrations/051_fix_cascade_array_order.sql` (chạy `sync-migrations.cjs` sang `supabase/migrations/`):
  - `array_agg(id ORDER BY id)` trong cascade RPCs.
  - `p_actor_role IS DISTINCT FROM 'SA'` trong `rpc_update_org_unit`.
  - Atomic subtree `khoi` update trong `rpc_update_org_unit` khi SA reparent cross-Khối.
  - Upgrade `trg_org_units_invariants()` trigger function: Trên INSERT `type = 'khoi'`, `NEW.khoi := COALESCE(NEW.code, NEW.khoi, NEW.name)`. Trên UPDATE `type = 'khoi'`, cưỡng chế `NEW.khoi := OLD.khoi` và `NEW.code := OLD.code`.
- Bảo vệ 5 mutation routes:
  1. `POST /api/org-units`:
     - Nếu `type === 'khoi'`: Bắt buộc SA (chỉ cho phép tạo `code` thuộc `KHOI_VALUES` chuẩn).
     - Nếu `type === 'line_nhan_su'`: Bắt buộc `parent_id = NULL` và user có ít nhất 1 quyền EA.
     - Nếu `type` khác: Load parent node từ DB để derive `khoi` authoritative (reject `input.khoi` mismatch, 404 nếu parent không tồn tại), sau đó verify EA scope của user trên `parent.khoi`.
  2. `PUT /api/org-units/:id`:
     - Load target node `{ id, type, khoi, parent_id }` từ DB (404 nếu target không tồn tại).
     - Nếu `target.type === 'khoi'` (đổi tên Root Khối): Bắt buộc SA (chỉ sửa display label `name`, DB trigger giữ `code`/`khoi` machine key bất biến).
     - Nếu `parent_id` mới thay đổi: Load parent mới từ DB. Nếu `newParent.khoi !== target.khoi` (Reparent cross-Khối) -> Bắt buộc SA (truyền trusted `'SA'` xuống RPC để trigger atomic subtree `khoi` update).
     - Verify EA scope của user trên `target.khoi` (và `newParent.khoi` nếu reparent cùng Khối).
  3. `PATCH /api/org-units/:id/status`:
     - Load target node từ DB (404 nếu không tồn tại).
     - Verify EA scope của user trên `target.khoi`.
     - Nếu `is_active === false` và node là non-leaf (có con/cháu active trong DB): Actor-agnostic block với HTTP 409 CONFLICT `{"error":{"code":"CONFLICT","message":"Node có đơn vị con đang hoạt động. Thao tác vô hiệu hóa toàn nhánh yêu cầu quy trình Cascade Deactivate."}}`.
     - Nếu `is_active === true`: Cho phép bật lại node nếu parent node đã active (top-down reactivation).
  4. `DELETE /api/org-units/:id`: Bắt buộc SA (query DB `superadmins` trực tiếp).
  5. `POST /api/org-units/:id/execute-deactivate`: Bắt buộc SA (query DB `superadmins` trực tiếp).
- Cập nhật UI Frontend:
  - `OrgUnitManagementPage.tsx`: Thêm `Form.Item name="parent_id"` trong Modal Create, filter danh sách Parent theo `type` và `khoi` được chọn. Bổ sung nút Status Toggle cho leaf nodes (khi deactivate) và non-leaf nodes (khi reactivate top-down) kèm `canEditOrgUnit` guard.
  - `QuickAddOrgUnitModal.tsx`: Bind `parent_id` từ selection, filter types và EA scope, disable Quick Add khi ngoài scope.
  - `OrgUnitCascadingSelect.tsx`: Refactor lookup root node bằng `u.khoi === selectedKey` / `u.id` thay vì so sánh `u.name === selectedKhoi`, đảm bảo `khoi_id` được truyền chính xác vào `EmployeeForm.tsx`.
- Bổ sung Integration Test Dedicated File `backend/src/__tests__/integration/orgUnitsScope.test.ts`.

### Out of scope
- Thay đổi cấu trúc bảng DB `org_units` trừ migration 051 nâng cấp RPC array ordering, NULL safety, atomic cross-Khối subtree `khoi` update & trigger root machine key immutability.
- Thay đổi logic Fuzzy Match OCR (`POST /api/org-units/fuzzy-match` - giữ nguyên read-only auth).

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - [2026-03-13] Hybrid Security (API middleware + RLS): Enforce authorization tại Hono API Layer.
  - [2026-03-19] Permission Cache Strategy: Nạp matrix từ Redis / DB (`permissionMiddleware`).
  - [NS-004 requireSuperAdmin] SA-only routes BẮT BUỘC query trực tiếp bảng `superadmins` trên DB, không tin context cache TTL 2h.
  - [Round 5 EFR-03 R5] RBAC Matrix cho Line Nhân sự Global & Hierarchy: Reparent cross-Khối là SA-only; EA chỉ được thao tác trong scope Khối được gán.
  - [Round 4 EFR-02 R4] org_units.code của type khoi là immutable machine key bất biến khớp user_permissions.khoi; chỉ cho phép sửa display_name (name).
- **"Cấm kỵ" cần tránh:** 
  - Không đọc `user.user_metadata.role` trực tiếp để quyết định scope; phải query DB `superadmins` cho SA và `permissionMatrix` cho EA.
  - Không tin `input.khoi` từ client gửi lên để check scope; phải derive từ DB `parent_id` hoặc target row.
  - Không cho phép BẤT KỲ caller nào (kể cả SA) generic PATCH de-activate một node non-leaf có descendants active.
  - Không để NULL `p_actor_role` pass qua RPC cross-Khối check (`IS DISTINCT FROM 'SA'`).
  - Không reparent cross-Khối mà chỉ đổi `parent_id` của node gốc mà không cập nhật `khoi` của toàn bộ descendants subtree.
  - Không để DB trigger cũ `trg_org_units_invariants` tự động ghi đè `NEW.khoi := NEW.name` khi SA rename Root Khối `type = 'khoi'`.
  - Không dùng display `u.name` để resolve root node trong `OrgUnitCascadingSelect.tsx`.
- **Ràng buộc kiến trúc liên quan:** 
  - API Hono Router: `orgUnitsRoutes.use('*', authMiddleware, permissionMiddleware)`.
  - Database Migration: `database/migrations` là Single Source of Truth, sync sang `supabase/migrations`.

---

## 4. Giả định và câu hỏi mở

### Giả định
1. SuperAdmin (`requireSuperAdmin`) có quyền quản lý 100% tất cả các Khối và Line Nhân sự Global.
2. User có quyền EA trên ít nhất 1 Khối được phép Tạo / Sửa Line Nhân sự Global (`type = 'line_nhan_su'`).
3. Khi tạo node con mới, Khối của node con sẽ được kế thừa từ Khối của node cha (`parent.khoi`), và EA phải có quyền trên Khối đó.
4. Mặc định `ORG_UNITS_MUTATION_MODE=normal`. Khi set sang `sa_only`, non-SA mutation bị chặn (403). Khi set `disabled`, 100% mutation bị chặn với 503 (Maintenance). Backend đọc cờ này động per-request qua Zod-parsed helper `getOrgUnitsMutationMode()`.

---

## 5. Acceptance Criteria

- [ ] `orgUnitsRoutes` được mount `permissionMiddleware` và guard `requireSuperAdmin` DB-authoritative.
- [ ] `ORG_UNITS_MUTATION_MODE` được validate bằng Zod schema in `env.ts` và đọc động per-request qua helper `getOrgUnitsMutationMode()` với truth table 3 modes (`normal`, `sa_only`, `disabled`), fail-closed về `disabled` / 503 khi invalid value.
- [ ] Service `orgUnitService.ts` gọi RPC preview/execute cascade với named argument `p_root_id` chính xác.
- [ ] Migration 051 trong `database/migrations` được sync sang `supabase/migrations`, `array_agg(id ORDER BY id)` giúp PREVIEW_STALE deterministic 100%, `p_actor_role IS DISTINCT FROM 'SA'` triệt tiêu NULL fail-open, `rpc_update_org_unit` tự động cập nhật `khoi` của toàn bộ descendants subtree khi SA reparent cross-Khối, và nâng cấp trigger `trg_org_units_invariants()` giữ nguyên `code`/`khoi` machine key khi SA đổi tên display label `name` của root Khối.
- [ ] SA preview và execute cascade deactivate thành công (HTTP 200 OK).
- [ ] SA reparent một node (có descendants) cross-Khối thành công (HTTP 200 OK); `parent_id` và `khoi` của toàn bộ descendants subtree được cập nhật đồng bộ sang Khối mới; EA của Khối cũ bị HTTP 403 và EA của Khối mới được phép thao tác.
- [ ] SA đổi tên Root Khối `type = 'khoi'` thành công (HTTP 200 OK); display `name` được đổi trong khi DB trigger giữ `code` và `khoi` machine key không bị biến đổi, `user_permissions` và `OrgUnitCascadingSelect` (`khoi_id` in `EmployeeForm`) giữ nguyên 100%.
- [ ] Mọi caller (kể cả SA) gửi `PATCH /api/org-units/:id/status` de-activate non-leaf node có con active nhận về **`HTTP 409 CONFLICT`**.
- [ ] Reactivation (`is_active: true`) qua PATCH status hoạt động khi parent node đã active.
- [ ] EA cố tình gửi `PUT /api/org-units/:id` hoặc `POST /api/org-units` ngoài scope nhận về **`HTTP 403 FORBIDDEN`** `{ error: { code: 'FORBIDDEN', message: '...' } }`.
- [ ] Target node hoặc parent node không tồn tại trả về **`HTTP 404 NOT FOUND`**.
- [ ] Non-SA gửi `DELETE /api/org-units/:id` hoặc `POST /api/org-units/:id/execute-deactivate` nhận về **`HTTP 403`**.
- [ ] Frontend UI (`OrgUnitManagementPage.tsx`, `QuickAddOrgUnitModal.tsx`, `OrgUnitCascadingSelect.tsx`) render đủ `parent_id` Select control, filter types/parent/Khối theo scope EA, và resolve `khoi_id` chính xác theo machine key.
- [ ] Cờ `ORG_UNITS_MUTATION_MODE` (`sa_only` & `disabled`) hoạt động chuẩn xác khi switch động trong test harness qua helper `getOrgUnitsMutationMode()`.
- [ ] Suite integration test dedicated (`orgUnitsScope.test.ts`) pass 100% khi chạy qua `pnpm --filter backend test:integration:fresh` trên Supabase Local Docker.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/routes/orgUnits.ts` | Sửa | Mount `permissionMiddleware` & SA guard, DB scope resolver, actor-agnostic status check, dynamic Zod-parsed mutation mode flag helper | 🔴 High (Security Guard) | Có |
| `backend/src/config/env.ts` | Sửa | Khai báo Zod enum validation cho `ORG_UNITS_MUTATION_MODE` | 🟡 Medium (Config) | Có |
| `backend/src/services/orgUnitService.ts` | Sửa | Sửa named parameter `p_root_node_id` sang `p_root_id`, truyền trusted SA flag | 🔴 High (RPC Contract) | Có |
| `database/migrations/051_fix_cascade_array_order.sql` | Tạo mới | Single Source of Truth: thêm `ORDER BY id` cho `array_agg`, `IS DISTINCT FROM 'SA'`, atomic subtree `khoi` update khi SA reparent cross-Khối, và nâng cấp trigger `trg_org_units_invariants()` cho root Khối machine key immutability (INSERT & UPDATE) | 🟡 Medium (DB Migration) | Có |
| `supabase/migrations/051_fix_cascade_array_order.sql` | Auto-sync | Generated mirror file migration cho Supabase Local CLI qua `sync-migrations.cjs` | 🟡 Medium (DB Migration) | Có |
| `frontend/src/pages/Admin/OrgUnitManagementPage.tsx` | Sửa | Thêm `parent_id` Form.Item, status toggle action, filter dropdown theo scope EA | 🟡 Medium (UI Permission) | Có |
| `frontend/src/components/common/QuickAddOrgUnitModal.tsx` | Sửa | Thêm Scope UI Guard và bind parent_id cho Quick Add Modal | 🟡 Medium (UI Permission) | Có |
| `frontend/src/components/common/OrgUnitCascadingSelect.tsx` | Sửa | Refactor root lookup bằng `u.khoi === selectedKey` / `u.id` thay vì `u.name === selectedKhoi`, disable Quick Add khi ngoài scope | 🟡 Medium (UI Permission) | Có |
| `backend/src/__tests__/integration/orgUnitsScope.test.ts` | Tạo mới | Dedicated Integration Test suite cho Org Units EA Scope Guard trên Supabase Local Docker | 🟢 Low (Test suite) | Có |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes (Đã hoàn thành Expert Review & Rebuttal Round 10)
- **Risk hotspots:** 
  - Migration 051 trong `database/migrations` (sync qua `sync-migrations.cjs`) xử lý `array_agg(ORDER BY id)`, `IS DISTINCT FROM 'SA'`, atomic subtree `khoi` update khi SA reparent cross-Khối, và nâng cấp trigger function `trg_org_units_invariants()` trên cả INSERT và UPDATE.
  - Helper `getOrgUnitsMutationMode()` đọc cờ `ORG_UNITS_MUTATION_MODE` động per-request và parse bằng Zod enum (fail closed `503` nếu invalid).
  - Service trusted SA flag propagation sang `rpc_update_org_unit`.
  - Refactor root lookup trong `OrgUnitCascadingSelect.tsx` để bảo toàn `khoi_id` khi display name khác machine key.
- **Review focus areas:**
  1. Cascade preview & execute thành công trơn tru cho SuperAdmin.
  2. SA reparent cross-Khối thành công và `khoi` của toàn bộ descendants subtree được cập nhật đồng bộ.
  3. SA đổi tên Root Khối `type = 'khoi'` đổi display label `name` thành công mà `code`/`khoi` machine key không bị DB trigger ghi đè, và `OrgUnitCascadingSelect` vẫn resolve đúng `khoi_id` cho nhân sự.
  4. Non-leaf status deactivation trả 409 CONFLICT thống nhất cho mọi caller; top-down reactivation hoạt động.
  5. Scope resolution DB-authoritative trả 404 cho non-existent và 403 `{ error: { code: 'FORBIDDEN', message: '...' } }`.
  6. Harness switch động 3 modes của `ORG_UNITS_MUTATION_MODE` qua helper `getOrgUnitsMutationMode()` và test `test:integration:fresh` thực thi thành công từ DB sạch.

---

## 8. Chiến lược triển khai

- **Phase strategy:** Chia 3 Phase
  - **Phase 1 (Backend DB Migration, Service Fix, Env Config & Scope Guard):** 
    - Khai báo `ORG_UNITS_MUTATION_MODE` in `env.ts` và triển khai helper `getOrgUnitsMutationMode()` (Zod per-request validation, fail-closed `disabled` 503) trong `orgUnits.ts`.
    - Tạo migration 051 trong `database/migrations/051_fix_cascade_array_order.sql` (chạy `sync-migrations.cjs`) xử lý `ORDER BY id`, `IS DISTINCT FROM 'SA'`, atomic subtree `khoi` update khi SA reparent cross-Khối, và nâng cấp trigger function `trg_org_units_invariants()`.
    - Sửa named parameter `p_root_id` trong `orgUnitService.ts` và truyền trusted SA flag.
    - Mount `permissionMiddleware` & SA guard, helper `resolveAndValidateOrgUnitScope` DB-authoritative, actor-agnostic status check 409, và mutation mode flag handler.
  - **Phase 2 (Frontend Main & Alternate UI Control & Guard):** 
    - Cập nhật `OrgUnitManagementPage.tsx` thêm `parent_id` Form.Item, status toggle (deactivate leaf / reactivate top-down), filter dropdown Khối/parent.
    - Cập nhật `QuickAddOrgUnitModal.tsx` & `OrgUnitCascadingSelect.tsx` cho alternate Create path & machine key root lookup fix.
  - **Phase 3 (Dedicated Testing, Fresh Harness & Rollback Verification):** 
    - Tạo mới dedicated integration test file `orgUnitsScope.test.ts` phủ 100% positive/negative cases cho SA và EA (bao gồm dynamic mutation mode switch với Zod validation & afterEach env restore, SA cross-Khối subtree `khoi` update, và Root Khối rename display label DB trigger verification).
    - Phân định test target: Backend integration test (`orgUnitsScope.test.ts`) kiểm thử API/DB contract, Frontend component test verify `OrgUnitCascadingSelect` `khoi_id` mapping.
    - Chạy `pnpm --filter backend test:integration:fresh` xác nhận pass 100% trên DB sạch.

---

## 9. Test Strategy

- **Automated tests:** Dedicated file `backend/src/__tests__/integration/orgUnitsScope.test.ts`:
  - **[EFR-20 Case 1 - Line Global]**: User có ít nhất 1 quyền EA create/update/status Line global thành công (HTTP 200); User VA/VI hoặc 0 quyền EA bị từ chối (HTTP 403 FORBIDDEN).
  - **[EFR-20/22/23/25 Case 2 - Root Khối Rename, DB Trigger & CascadingSelect Invariant]**: EA rename root `type = 'khoi'` nhận 403 FORBIDDEN; SA rename root `type = 'khoi'` thành công (HTTP 200 OK), verify trực tiếp trong DB rằng display `name` đổi thành công trong khi `code` và `khoi` machine key không bị DB trigger ghi đè, `user_permissions` giữ nguyên 100%, và `OrgUnitCascadingSelect` vẫn resolve đúng `khoi_id` cho nhân sự.
  - **[EFR-20/21 Case 3 - Reparent Cross-Khối Subtree Update]**: EA reparent cross-Khối bị từ chối (HTTP 403 FORBIDDEN); SA reparent cross-Khối một node (có descendants) thành công (HTTP 200 OK), verify `parent_id` và `khoi` của toàn bộ descendants subtree được cập nhật đồng bộ sang Khối mới, EA Khối cũ bị 403 và EA Khối mới được phép thao tác.
  - **[EFR-20 Case 4 - DB RPC NULL Regression]**: Chạy trực tiếp `rpc_update_org_unit` với `p_actor_role = NULL` hoặc `'EA'` khi cross-Khối bị SQL Exception chặn lại; với trusted `'SA'` thành công.
  - SA preview & execute cascade deactivate -> HTTP 200 OK.
  - SA & EA de-activate non-leaf node via PATCH status -> HTTP 409 CONFLICT.
  - Reactivate top-down node via PATCH status -> HTTP 200 OK.
  - EA Admicro sửa node Admicro -> HTTP 200 OK.
  - EA Admicro sửa node KND -> HTTP 403 FORBIDDEN.
  - EA Admicro tạo node con dưới parent KND -> HTTP 403 FORBIDDEN.
  - Non-SA xóa node hoặc execute-deactivate -> HTTP 403 FORBIDDEN.
  - Target/Parent node không tồn tại -> HTTP 404 NOT FOUND.
  - **[EFR-26/27 Dynamic Harness Test]**: Thay đổi `process.env.ORG_UNITS_MUTATION_MODE` động trong test suite và restore env trong `afterEach`: `sa_only` -> Non-SA mutation nhận HTTP 403; `disabled` -> 100% callers mutation nhận HTTP 503 Maintenance; invalid value (ví dụ `"invalid_mode"`) -> fail closed về HTTP 503 Maintenance.
  - Lệnh test: `pnpm --filter backend test:integration:fresh`.
- **Manual verification:** Đăng nhập `loi.admicro@gmail.com` và SA trên UI local:
  - SA preview và execute cascade deactivate thành công.
  - SA reparent cross-Khối thành công và subtree `khoi` cập nhật chuẩn xác.
  - SA đổi tên Root Khối display `name` thành công, `user_permissions` và `OrgUnitCascadingSelect` (`khoi_id` in `EmployeeForm`) giữ nguyên tác dụng.
  - EA chuyển sang Khối KND, kiểm tra các nút bấm Sửa/Vô hiệu hóa bị disable/ẩn đúng quy định.
  - Mở Modal Create (Main Page & Quick Add) kiểm tra dropdown Parent (`parent_id`) và Khối đã được render và lọc theo scope.

---

## 10. Rollback Plan

- **Operational Fail-Closed Flag:** 
  - Đặt `ORG_UNITS_MUTATION_MODE=sa_only`: Chỉ SA được mutation.
  - Đặt `ORG_UNITS_MUTATION_MODE=disabled`: Tạm ngưng 100% API mutations (HTTP 503 Maintenance Mode) mà không cần rollback code. Helper `getOrgUnitsMutationMode()` bảo đảm fail closed về `disabled` / 503 ngay cả khi cờ bị cấu hình sai.
- Frontend UI có thể rollback độc lập về commit trước đó nếu gặp sự cố hiển thị.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
