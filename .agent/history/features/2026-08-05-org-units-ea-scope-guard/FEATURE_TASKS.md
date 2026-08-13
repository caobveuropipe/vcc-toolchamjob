# Feature Tasks: Phân Quyền Scope-Based EA Cho Danh Mục Tổ Chức (Org Units EA Scope Guard)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-08-05

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Backend DB Migration, Service RPC Fix, Env Config & Scope Guard Enforcement

**Mục tiêu:** Tạo migration 051 trong `database/migrations` (dùng `sync-migrations.cjs`) xử lý array ordering, `IS DISTINCT FROM 'SA'`, atomic subtree `khoi` update khi SA reparent cross-Khối, và nâng cấp trigger `trg_org_units_invariants()` (INSERT & UPDATE); fix named parameter `p_root_id` và trusted SA flag trong `orgUnitService.ts`, thêm `ORG_UNITS_MUTATION_MODE` in `env.ts` (đọc qua helper `getOrgUnitsMutationMode()` Zod-parsed per-request), mount `permissionMiddleware` & SA guard, và enforce DB-authoritative scope check cho 100% mutation routes.

- [x] Task 1.1: Khai báo `ORG_UNITS_MUTATION_MODE` Zod enum (`normal`, `sa_only`, `disabled`) với default `'normal'` trong `backend/src/config/env.ts` và `.env.example`.
- [x] Task 1.2: Tạo migration `database/migrations/051_fix_cascade_array_order.sql` bổ sung:
  - `ORDER BY id` cho `array_agg` trong cascade RPCs.
  - `p_actor_role IS DISTINCT FROM 'SA'` trong `rpc_update_org_unit`.
  - Atomic subtree `khoi` update trong `rpc_update_org_unit` khi SA reparent cross-Khối (cập nhật `khoi` của target node và toàn bộ descendants subtree sang `newParent.khoi`).
  - Nâng cấp `trg_org_units_invariants()` trigger function: Trên INSERT `type = 'khoi'`, `NEW.khoi := COALESCE(NEW.code, NEW.khoi, NEW.name)`. Trên UPDATE `type = 'khoi'`, cưỡng chế `NEW.khoi := OLD.khoi` và `NEW.code := OLD.code` giữ nguyên machine keys bất biến khi SA rename display `name`.
  - Chạy `node scripts/sync-migrations.cjs` để sinh mirror file `supabase/migrations/051_fix_cascade_array_order.sql`.
- [x] Task 1.3: Sửa `backend/src/services/orgUnitService.ts` đổi named parameter `p_root_node_id` thành `p_root_id` cho cascade RPCs và nhận trusted `actorRole` ('SA' | 'NON_SA') truyền xuống `rpc_update_org_unit`.
- [x] Task 1.4: Mount `permissionMiddleware` và bổ sung helper function `getOrgUnitsMutationMode()` (parse/validate qua Zod enum per-request, fail closed về `disabled` / 503 nếu invalid value) kiểm tra `ORG_UNITS_MUTATION_MODE` truth table (`normal`, `sa_only`, `disabled`) trong `backend/src/routes/orgUnits.ts`.
- [x] Task 1.5: Viết helper function `resolveAndValidateOrgUnitScope(c, targetId, parentId, type)` trong `backend/src/routes/orgUnits.ts`:
  - Load target/parent node từ DB (trả HTTP 404 NOT FOUND nếu không tồn tại).
  - Phân loại: SA (`requireSuperAdmin`), `type === 'khoi'` (SA-only), `type === 'line_nhan_su'` (cần có ít nhất 1 quyền EA), và node chuẩn (derive `khoi` từ DB target/parent).
  - Trả HTTP 403 FORBIDDEN `{ error: { code: 'FORBIDDEN', message: '...' } }` nếu EA không có quyền trên `target.khoi` / `parent.khoi`.
- [x] Task 1.6: Áp dụng guard cho `POST /api/org-units` (chặn EA tạo root Khối, derive `khoi` từ parent DB node, reject `input.khoi` mismatch).
- [x] Task 1.7: Áp dụng guard cho `PUT /api/org-units/:id` (chặn EA đổi tên root Khối, chặn EA reparent cross-Khối trừ SA, check EA scope trên target/parent DB node, truyền trusted `'SA'` khi SA).
- [x] Task 1.8: Áp dụng guard cho `PATCH /api/org-units/:id/status` (chặn 100% callers kể cả SA de-activate non-leaf node có child active với HTTP 409 CONFLICT; cho phép reactivate top-down khi parent node active).
- [x] Task 1.9: Mount `requireSuperAdmin` (query DB `superadmins` trực tiếp) cho `DELETE /api/org-units/:id` và `POST /api/org-units/:id/execute-deactivate`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

---

## Phase 2: Frontend Main & Alternate UI Control & Scope Guard

**Mục tiêu:** Cập nhật giao diện `OrgUnitManagementPage.tsx`, `QuickAddOrgUnitModal.tsx` và `OrgUnitCascadingSelect.tsx` bổ sung control `parent_id` trong Create Modal, nút Status toggle cho leaf node / reactivation, filter dropdown parent/Khối theo scope EA, và refactor root lookup trong `OrgUnitCascadingSelect.tsx` bảo vệ `khoi_id` in `EmployeeForm.tsx`.

- [x] Task 2.1: Thêm `Form.Item name="parent_id"` trong Modal Create (`OrgUnitManagementPage.tsx`), render Select dropdown động phụ thuộc `watchType` và lọc theo EA scope.
- [x] Task 2.2: Bổ sung Status toggle action button cho leaf nodes (deactivation) và top-down reactivation trên Cascading view và Table view kèm `canEditOrgUnit` guard.
- [x] Task 2.3: Thêm helper `canEditOrgUnit(unit, permissionMatrix)` và `canCreateOrgUnit(type, parentId, permissionMatrix)` trong `OrgUnitManagementPage.tsx`, ẩn `type = 'khoi'` đối với non-SA.
- [x] Task 2.4: Cập nhật `QuickAddOrgUnitModal.tsx` & `OrgUnitCascadingSelect.tsx`:
  - Quick Add Modal: bind `parent_id` từ selection, filter types và EA scope, disable Quick Add khi ngoài scope.
  - Cascading Select: refactor root node lookup bằng `u.khoi === selectedKey` hoặc `u.id` thay vì so sánh `u.name === selectedKhoi`, bảo đảm `khoi_id` được truyền chuẩn xác vào `EmployeeForm.tsx` khi SA đổi tên Root Khối.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)

---

## Phase 3: Dedicated Integration Testing & Fresh Harness Verification

**Mục tiêu:** Viết file integration test dedicated `orgUnitsScope.test.ts` và chạy `pnpm --filter backend test:integration:fresh` xác nhận 100% pass trên Supabase Local Docker Harness.

- [x] Task 3.1: Tạo mới `backend/src/__tests__/integration/orgUnitsScope.test.ts` với setup/teardown idempotent và test matrix đầy đủ bao gồm các case đặc quyền (EFR-20/21/22/23/24/25/26/27/28):
  - **Case 1 (Line Global)**: User có ít nhất 1 quyền EA create/update/status Line global thành công; User VA/VI hoặc 0 quyền EA nhận 403 FORBIDDEN.
  - **Case 2 (Root Khối Rename, DB Trigger & CascadingSelect Invariant)**: EA rename root `type = 'khoi'` nhận 403 FORBIDDEN; SA rename root `type = 'khoi'` thành công (HTTP 200 OK), verify trực tiếp trong DB rằng display `name` đổi thành công trong khi `code` và `khoi` machine key không bị DB trigger ghi đè, `user_permissions` giữ nguyên 100%, và `OrgUnitCascadingSelect` vẫn resolve đúng `khoi_id` cho nhân sự.
  - **Case 3 (Reparent Cross-Khối Subtree Update)**: EA reparent cross-Khối nhận 403 FORBIDDEN; SA reparent cross-Khối một node (có descendants) thành công (HTTP 200 OK), verify `parent_id` và `khoi` của toàn bộ descendants subtree được cập nhật đồng bộ sang Khối mới, EA Khối cũ bị 403 và EA Khối mới được phép thao tác.
  - **Case 4 (DB RPC NULL Regression)**: Chạy trực tiếp `rpc_update_org_unit` với `p_actor_role = NULL` hoặc `'EA'` khi cross-Khối bị SQL Exception chặn lại; với trusted `'SA'` thành công.
  - SA preview & execute cascade deactivate -> HTTP 200 OK.
  - SA & EA de-activate non-leaf node via PATCH status -> HTTP 409 CONFLICT.
  - Reactivate top-down node via PATCH status -> HTTP 200 OK.
  - EA Admicro sửa node Admicro -> HTTP 200 OK.
  - EA Admicro sửa node KND -> HTTP 403 FORBIDDEN.
  - EA Admicro tạo node con dưới parent KND -> HTTP 403 FORBIDDEN.
  - Non-SA xóa node hoặc execute-deactivate -> HTTP 403 FORBIDDEN.
  - Target/Parent node không tồn tại -> HTTP 404 NOT FOUND.
  - **[EFR-26/27 Dynamic Harness Test]**: Thay đổi `process.env.ORG_UNITS_MUTATION_MODE` động trong test suite qua helper `getOrgUnitsMutationMode()` và restore env trong `afterEach`: `sa_only` -> Non-SA mutation nhận HTTP 403; `disabled` -> 100% callers mutation nhận HTTP 503 Maintenance; invalid value (ví dụ `"invalid_mode"`) -> fail closed về HTTP 503 Maintenance.
- [x] Task 3.2: Chạy `pnpm --filter backend test:integration:fresh` xác nhận tất cả integration tests pass 100% từ DB sạch.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-05 17:48 | Phase 1-3 | All | Tạo mới kế hoạch feature tasks | pending | Khởi tạo từ feature-plan |
| 2026-08-05 17:58 | Phase 1-3 | All | Cập nhật tasks theo 8 EFR Accepted từ Expert Review R1 | pending | expert-rebuttal R1 |
| 2026-08-05 18:07 | Phase 1-3 | All | Cập nhật tasks theo 6 EFR Accepted từ Expert Review R2 (EFR-09 -> EFR-14) | pending | expert-rebuttal R2 |
| 2026-08-05 18:17 | Phase 1-3 | All | Cập nhật tasks theo 5 EFR Accepted từ Expert Review R3 (EFR-15 -> EFR-19) | pending | expert-rebuttal R3 |
| 2026-08-05 18:40 | Phase 1-3 | All | Cập nhật Task 3.1 bổ sung 4 test cases đặc quyền RBAC (EFR-20) | pending | expert-rebuttal R4 |
| 2026-08-05 20:16 | Phase 1-3 | All | Cập nhật Task 1.2 & Task 3.1 cho atomic cross-Khối subtree khoi update (EFR-21) | pending | expert-rebuttal R5 |
| 2026-08-05 20:19 | Phase 1-3 | All | Cập nhật Task 1.2 & Task 3.1 cho Root Khối Machine Key Immutability invariant (EFR-22) | pending | expert-rebuttal R6 |
| 2026-08-05 20:22 | Phase 1-3 | All | Cập nhật Task 1.2 cho nâng cấp DB trigger fn trg_org_units_invariants() (EFR-23) | pending | expert-rebuttal R7 |
| 2026-08-05 20:35 | Phase 1-3 | All | Cập nhật Task 1.2, 1.4, 2.4, 3.1 cho Round 9 (EFR-24 -> EFR-26) | pending | expert-rebuttal R9 |
| 2026-08-05 20:47 | Phase 1-3 | All | Cập nhật Task 1.4 & Task 3.1 cho Round 10 (EFR-27 -> EFR-28) | pending | expert-rebuttal R10 |
| 2026-08-05 20:53 | Phase 1 | Task 1.1 | Chuyển trạng thái feature sang 🔄 Đang thực hiện, bắt đầu Task 1.1 | start | Bắt đầu triển khai Phase 1 |
| 2026-08-05 20:54 | Phase 1 | Task 1.1 | Thêm ORG_UNITS_MUTATION_MODE vào env.ts & .env.example | done | Hoàn thành Task 1.1 |
| 2026-08-05 21:02 | Phase 1 | Task 1.2 | Tạo migration 051 và sync sang supabase/migrations | done | Hoàn thành Task 1.2 |
| 2026-08-05 21:03 | Phase 1 | Task 1.3 | Sửa named parameter p_root_id cho RPCs trong orgUnitService.ts | done | Hoàn thành Task 1.3 |
| 2026-08-05 21:05 | Phase 1 | Task 1.4-1.9 | Triển khai Scope Guard, Mutation Mode, Actor-agnostic Conflict & SA Check trong orgUnits.ts | done | Hoàn thành Task 1.4-1.9 |
| 2026-08-05 21:06 | Phase 1 | Task 1.Final | Self-test typecheck pass, User confirm OK Phase 1 | done | Hoàn thành Phase 1 |
| 2026-08-05 21:06 | Phase 2 | Task 2.1 | Bắt đầu triển khai Frontend UI Guard & Controls (Phase 2) | start | Bắt đầu Task 2.1 |
| 2026-08-05 21:08 | Phase 2 | Task 2.1-2.4 | Hoàn thành parent_id Form.Item, status toggle guard, QuickAddModal & OrgUnitCascadingSelect EFR-25 fix | done | Hoàn thành Task 2.1-2.4 |
| 2026-08-05 21:09 | Phase 2 | Task 2.Final | Self-test typecheck pass, User confirm OK Phase 2 | done | Hoàn thành Phase 2 |
| 2026-08-05 21:09 | Phase 3 | Task 3.1 | Bắt đầu viết dedicated integration test suite orgUnitsScope.test.ts (Phase 3) | start | Bắt đầu Task 3.1 |
| 2026-08-05 21:18 | Phase 3 | Task 3.1-3.2 | Tạo orgUnitsScope.test.ts và chạy test suite pass 100% (7/7 cases pass) | done | Hoàn thành Phase 3 & Feature |

