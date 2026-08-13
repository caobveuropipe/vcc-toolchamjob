---
source: expert-rebuttal
feature: org-units-ea-scope-guard
round: 10
timestamp: 2026-08-05T20:47:30+07:00
verdict: ✅ HỘI TỤ
---

# Expert Review: org-units-ea-scope-guard

## Findings

### EFR Rejected
Không có. (Toàn bộ 2 EFRs mới EFR-27, EFR-28 từ Codex Desktop Round 10 đã được CHẤP NHẬN và cập nhật trực tiếp vào FEATURE_PLAN.md & FEATURE_TASKS.md).

### EFR Inconclusive
Không có.

### SFR Mới (Hotspot Scan)
Không có.

---

## Ghi chú hội tụ
- **Tất cả 28 EFRs (EFR-01 -> EFR-28 qua các vòng review) đã được CHẤP NHẬN 100%:**
  - Round 1 (EFR-01 -> EFR-08): SA-Only authoritative check, PATCH status guard, Root Khối protection, DB-side scope resolver, Dedicated test suite, Frontend Create guard, Fail-Closed Rollback, Canonical Error Contract.
  - Round 2 (EFR-09 -> EFR-14): Fix named parameter `p_root_id`, Migration 051 `ORDER BY id` cho PREVIEW_STALE, Actor-agnostic non-leaf deactivation guard 409, Frontend `parent_id` Select control & status toggle, Error code `FORBIDDEN` consistency, Operational Fail-Closed flag.
  - Round 3 (EFR-15 -> EFR-19): Fix NULL fail-open trong `rpc_update_org_unit` (`IS DISTINCT FROM 'SA'`), Zod enum `ORG_UNITS_MUTATION_MODE` in `env.ts`, Top-down reactivation flow, Alternate Create path UI guard (`QuickAddOrgUnitModal.tsx`), `database/migrations` Single Source of Truth & `test:integration:fresh` harness.
  - Round 4 (EFR-20): Bổ sung 4 case đặc quyền vào Test Matrix (Line Global EA vs Non-EA, SA vs EA root khoi rename, SA vs EA reparent cross-Khối, DB RPC NULL/non-SA/SA regression).
  - Round 5 (EFR-21): Atomic subtree `khoi` update trong `rpc_update_org_unit` cho SA reparent cross-Khối.
  - Round 6 (EFR-22): Root Khối Machine Key Immutability invariant (`code` & `khoi` của `type = 'khoi'` không đổi khi rename `name`).
  - Round 7 (EFR-23): Nâng cấp DB trigger function `trg_org_units_invariants()` cho UPDATE `type = 'khoi'`.
  - Round 9 (EFR-24 -> EFR-26): Trigger INSERT root machine key canonical, refactor `OrgUnitCascadingSelect.tsx` resolve root node bằng `u.khoi === selectedKey`, dynamic mutation mode reader.
  - Round 10 (EFR-27 -> EFR-28):
    27. `EFR-27`: Triển khai helper `getOrgUnitsMutationMode()` parse/validate per-request bằng Zod enum, fail closed về `disabled` (503) khi invalid value, restore env trong test `afterEach`.
    28. `EFR-28`: Phân định rõ phạm vi Test Harness: Backend integration suite (`orgUnitsScope.test.ts`) verify API/DB/triggers/RPCs, Frontend component verify `OrgUnitCascadingSelect` mapping `khoi_id`.
- Plan & Tasks đã được nâng lên trạng thái **`✅ ĐỒNG Ý`** và sẵn sàng triển khai qua `feature-coordinator`.
