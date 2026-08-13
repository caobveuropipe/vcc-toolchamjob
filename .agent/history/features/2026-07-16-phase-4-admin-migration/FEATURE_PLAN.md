# Feature Plan: Phase 4 — Admin & Migration

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã được Architect duyệt (User noted: Data hiện tại chỉ là Test Data).
> **Feature slug**: phase-4-admin-migration
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-07

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Phase 0–3 đã hoàn thành. Hệ thống có Auth, Permission Engine, Employee CRUD, Salary CRUD. Admin Dashboard (NS-004) đã có UI quản lý quyền, reviewers, bulk ops, audit logs, khối managers. Tuy nhiên chưa có công cụ import data hàng loạt để đưa ~4000 NS từ Google Sheets/Excel vào hệ thống.
- **Vấn đề cần giải quyết:**
  1. Admin Dashboard UI đã xây dựng nhưng chưa được kiểm tra E2E chính thức theo acceptance criteria Phase 4.
  2. Không có import script/tool để SA có thể nạp dữ liệu ban đầu 4000+ NS từ Sheets/Excel, cả employee info lẫn salary.
  3. Chưa có flow verify cho Reviewer Mismatch Dashboard.
- **Mục tiêu:** SA có bộ tools hoàn chỉnh: quản lý quyền + reviewer + import data + mismatch detection. Hệ thống sẵn sàng nạp data production.
- **Kết quả mong đợi:** Import 100+ NS mẫu OK, SA gán quyền + reviewer OK, mismatch detected OK.

## 2. Phạm vi

### In scope
- **4A. Admin UI Audit & Polish**: Rà soát Admin Dashboard hiện có (Permissions, Reviewers, Bulk Ops, Audit Log, Khối Managers), sửa bug nếu có, đảm bảo UX production-ready.
- **4B. Reviewer Mismatch Dashboard**: Verify/polish UI hiển thị cảnh báo reviewer mismatch khi NS đổi khối. Hiện `is_mismatch` flag đã có ở backend, cần verify UI dashboard view rõ ràng + filter theo mismatch.
- **4C. Data Migration Script**: Tạo script Node.js/TypeScript import employees + salaries từ file Excel/CSV. Hỗ trợ: dry-run mode, validation report, transactional upsert, audit log, progress tracking.
- **4D. Data Migration UI (SA)**: [Đã loại bỏ] Mọi thao tác Import chỉ thực hiện qua CLI Script. KHÔNG làm Web UI cho chức năng này để giảm thiểu rủi ro bảo mật và đơn giản hóa kiến trúc Phase 4.
- **4E. Verify Phase 4**: Test E2E toàn bộ flow.

### Out of scope
- Import từ Google Sheets API trực tiếp (defer — dùng export Excel từ Sheets rồi import)
- Hard Delete nâng cao (đã defer sang Phase 4/6 trong Master Plan)
- Rate limit tuning cho production (Phase 5)
- CI/CD pipeline cho deploy (Phase 5)
- Notification hệ thống (defer)

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - [2026-03-13] Hybrid Security: API middleware + RLS `USING(false)`. Import script phải dùng `service_role` key.
  - [2026-03-13] Email trùng: cho phép. Import script phải handle duplicate email gracefully.
  - [2026-03-13] `ma_nhan_su` immutable sau khi tạo. Import script nếu upsert phải dùng `ma_nhan_su` làm key.
  - [2026-03-19] Permission Cache: Redis key `perm:{email}`. Khi import gán quyền hàng loạt → invalidate cache.
  - [2026-04-07] Salary Pending Isolation: Salary data nằm ở bảng `salaries`. Import phải ghi cả 2 bảng (`employees` + `salaries`).
  - [2026-04-06] RLS Atomic Exemption: Nếu import cần transaction đa bảng, dùng `SECURITY DEFINER` SQL function.
  - [2026-03-13] Service-Layer Data Splitting: `employees` + `salaries` là 2 bảng vật lý.
- **"Cấm kỵ" cần tránh:**
  - KHÔNG import qua `supabase.from()` ở FE. Phải qua BE API hoặc script dùng `service_role`.
  - KHÔNG skip validation khi import — mỗi row phải qua Zod schema.
  - KHÔNG log secrets ra console trong script.
- **Ràng buộc kiến trúc liên quan:**
  - Mỗi employee phải có 1 salary row tương ứng (migration 013 đã backfill).
  - `state_phong_cho = false` cho data import (NS production, đã chính thức).
  - Audit log action: cần thêm action `import` vào enum constraint nếu chưa có.

## 4. Giả định và câu hỏi mở

### Giả định
- **G1**: Data import sẽ từ file Excel (.xlsx) đã export từ Google Sheets. Format chuẩn: 1 sheet = employees+salary, hoặc 2 sheets riêng.
- **G2**: Import script chạy thông qua Node.js CLI, KHÔNG liên quan tới BE endpoint hay web client.
- **G3**: Mỗi lần import, SA cung cấp file Excel. Script validate toàn bộ → report lỗi → SA confirm → execute.
- **G4**: Admin UI hiện tại (Permissions, Reviewers, Bulk Ops) đã hoạt động cơ bản — chỉ cần polish, không cần rebuild.
- **G5**: Import data sẽ set `state_phong_cho = false` (NS đã chính thức) và `trang_thai = 'dang_lam'` mặc định.
- **G6**: [Đã triệt tiêu] CLI Script do chạy cục bộ (one-off) nên không bị ràng buộc rate limit API, chỉ tập trung vào chia lô (chunk) để không OOM.

### Câu hỏi mở
- [Đã chốt] Web UI Import? → KHÔNG (FR-04). Chỉ làm CLI Script chạy một lần (One-off bulk load).
- [Non-blocking] Format Excel cụ thể (tên cột, sheet name)? → Sẽ tạo template mẫu trong script.
- [Đã chốt] Import `employee_reviewers` và `user_permissions`? → KHÔNG (FR-06). Import Script chỉ nạp Data Employees và Salaries. Quyền và Người nghiệm thu phân bổ thủ công theo luồng an toàn hiện tại trên Admin UI.

## 5. Acceptance Criteria

- [ ] AC-1: SA vào Admin Dashboard → quản lý quyền (thêm/sửa/xóa permission) hoạt động đúng, cache Redis bị invalidate.
- [ ] AC-2: SA gán/xóa Reviewer qua UI → audit log ghi đúng, mismatch flag hiển thị đúng.
- [ ] AC-3: Dashboard Reviewer hiển thị rõ "Mismatch" khi reviewer không có quyền trên khối của NS.
- [ ] AC-4: Import script chạy với file Excel mẫu (100+ NS) → employees + salaries tạo đúng trong DB.
- [ ] AC-5: Import script có dry-run mode → in ra validation report (lỗi format, trùng mã NS, thiếu field).
- [ ] AC-6: Import script ghi audit log action `import` cho mỗi batch.
- [ ] AC-7: Import script xử lý duplicate `ma_nhan_su` được SKIP mặc định và report rõ trong console/validation report.
- [ ] AC-8: Sau import, kiểm tra employees + salaries join đúng, `state_phong_cho = false`.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `scripts/import-data.ts` | Tạo mới | Script import chính | 🟡 | Chưa |
| `scripts/templates/import-template.xlsx` | Tạo mới | Template mẫu cho SA | 🟢 | Không |
| (Đã bỏ Web Import Endpoint) | | (FR-10) Các file backend API import không còn in-scope | ⚪ | Không |
| `database/migrations/016_import_audit_action.sql` | Tạo mới | Thêm `import` vào audit_log action enum | 🟡 | Có |
| `packages/shared/src/schemas/` | Sửa | Thêm schema chuẩn trị Zod riêng biệt cho lệnh Import | 🟢 | Có |
| `frontend/src/pages/Admin/tabs/ReviewerManagement.tsx` | Sửa | Polish mismatch UI, thêm filter | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes — **khuyến nghị mạnh** do chạm DB migration, data integrity, bulk write
- **Risk hotspots:**
  1. **Data Integrity khi Import**: Bulk insert employees + salaries phải atomic. Nếu salary insert fail → orphan employee record.
  2. **Audit Action Enum Migration**: Thêm giá trị vào CHECK constraint `audit_log.action`. Nếu sai → mọi audit log write fail.
  3. **Duplicate Handling**: `ma_nhan_su` UNIQUE constraint. Script phải handle conflict (ON CONFLICT DO UPDATE hoặc skip).
  4. **Permission Cache Invalidation**: [Đã triệt tiêu] Không còn rủi ro stale cache vì script không nạp quyền lượng lớn. Gán quyền thao tác bằng tay trên Admin UI sẽ được Admin Service tự động invalidate như cũ.
  5. **Memory cho import lớn**: 4000 rows × 50 fields — cần batch processing, không load toàn bộ vào RAM.
- **Review focus areas:**
  - Import script transaction boundary: 1 transaction cho tất cả hay batch per 100 rows?
  - Validation schema cho import: Zod reuse vs separate schema?
  - Error recovery: Nếu import fail giữa chừng, rollback toàn bộ hay commit phần đã OK?
- **Known pitfalls / historical issues:**
  - Migration 013 (`backfill_salary_rows.sql`) đã xử lý orphan employees không có salary. Import mới phải đảm bảo không tạo thêm orphan.
  - `state_phong_cho` phải đúng (false cho imported NS, true cho NS mới tạo qua UI).
- **Dependencies / rollout concerns:**
  - Migration SQL phải apply trước khi chạy import script.
  - Script cần `service_role` key → chạy trên server hoặc local với `.env.local`.

## 8. Chiến lược triển khai

- **Phase strategy:** 3 sub-phases:
  1. **Phase A (Admin Polish)**: Rà soát + sửa Admin UI hiện có. Verify mismatch dashboard.
  2. **Phase B (Import Engine)**: DB migration + import script/service + template Excel.
  3. **Phase C (Verify)**: Import 100 NS mẫu, E2E test toàn bộ Phase 4.
- **Thứ tự triển khai:**
  1. DB migration (thêm audit action enum)
  2. Admin UI polish
  3. Import script core (parse Excel, validate, dry-run)
  4. Import script execute (upsert employees + salaries, audit log)
  5. E2E test
- **Điểm cần phối hợp:** BE + DB migration + Script
- **Yêu cầu migration / config / deploy:**
  - Migration `016_import_audit_action.sql` phải apply trước
  - Package `xlsx` (SheetJS) đã có ở FE, cần verify có ở BE/scripts

## 9. Test Strategy

- **Automated tests:**
  - Unit test: Import validation logic (Zod schema, duplicate check, field mapping)
  - Unit test: Batch processing (memory, error handling)
- **Manual verification:**
  - SA login → Admin Dashboard → thao tác Permissions, Reviewers, Bulk Ops
  - Import 100 NS mẫu → verify DB data
  - Mismatch dashboard → verify warning hiển thị đúng
  - Dry-run mode → verify report lỗi
- **Data / env chuẩn bị trước khi test:**
  - File Excel mẫu 100+ NS (employees + salary fields)
  - SA account đã có trong `superadmins`
  - Local dev environment chạy OK (`pnpm run dev`)

## 10. Rollback Plan

- **DB migration**: Migration chỉ thêm enum value → rollback bằng migration ngược (bỏ value, nhưng cần xóa audit logs có action đó trước).
- **Import data**: Script hỗ trợ dry-run trước. Do DB đích chỉ chứa dữ liệu test, nếu hệ thống execute sai thông tin, chuyên viên sẽ truncate/reset DB Test và chạy lại lệnh. KHÔNG build rollback nhọc nhằn theo batch.
- **Admin UI**: Chỉ polish, không thay đổi logic core → rollback git revert.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## 12. Review Notes

- **FR-01 [Blocker đã xử lý]**: Bắt buộc tạo PostrgeSQL Function (RPC) `import_employee_batch(jsonb)` để đảm bảo Atomicity đa bảng (employees + salaries + audit_log) trong 1 Transaction SQL thuần. KHÔNG dùng Supabase JS để insert nhiều bảng tuần tự trong Node script nhằm tránh rủi ro orphan records.
- **FR-02**: Chủ động bỏ qua ghi logs vào bảng `change_history` cho luồng Import. Chỉ ghi duy nhất vào `audit_log` toàn bộ batch để tiết kiệm dung lượng DB.
- **FR-03**: Khi migration cập nhật `audit_log.action`, cần dùng syntax đúng (DROP và ADD CONSTRAINT) vì Postgres không hỗ trợ `ALTER CONSTRAINT ... ADD VALUE` trực tiếp cho lệnh `CHECK()`.
- **Note**: User nhắc "DB là dữ liệu test", do đó các operation như xoá trắng hay làm rối ID không tạo hậu quả thảm hoạ, tuy nhiên script vẫn phải chuẩn production quality.
- **FR-04**: Chốt dứt điểm Phase 4 KHÔNG BAO GỒM Web UI cho chức năng import. Công cụ là CLI Script. Tránh overthinking scope.
- **FR-05**: Bắt buộc tạo `importEmployeeSchema` và `importSalarySchema` riêng cho Import Script. Tránh dùng lại raw schema của BE/FE dẫn tới áp dụng sai default values (như `trang_thai`, `state_phong_cho`) và field ownership mờ nhạt (vd: `tam_ung_hang_thang` nằm ở cả 2 nơi).
- **FR-06**: Chốt loại trừ User Permissions và Employee Reviewers khỏi phạm vi Import để bảo toàn Security Invariants. Quản lý quyền sẽ thao tác trên UI.
- **FR-07**: Function `import_employee_batch` phải có Security hardening cơ bản (`SET search_path = public`).
- **FR-08**: Do DB là dữ liệu Test, Duplicate Policy sẽ dùng rule đơn giản mạnh nhất (SKIP trên duplicate) và chỉ cần Console Output log để xác minh mà không cần xây dựng cơ chế Rollback phức tạp vượt quá mức cần thiết của Test-data script.
