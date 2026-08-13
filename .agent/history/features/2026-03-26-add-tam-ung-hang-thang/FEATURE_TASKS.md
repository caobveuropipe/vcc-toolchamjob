# Feature Tasks: Thêm trường tạm ứng hàng tháng vào bảng salaries

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-03-25

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: DB Layer — Migration & Schema Docs

**Mục tiêu:** Thêm cột `tam_ung_hang_thang` vào DB thực tế (Supabase) và cập nhật schema docs.

- [x] Task 1.1: Tạo migration file `database/migrations/003_add_tam_ung_hang_thang.sql`
  - `ALTER TABLE salaries ADD COLUMN IF NOT EXISTS tam_ung_hang_thang NUMERIC(15,0) CHECK (tam_ung_hang_thang >= 0);`
  - `ALTER TABLE snapshot_employees ADD COLUMN IF NOT EXISTS tam_ung_hang_thang NUMERIC(15,0);`
  - `CREATE OR REPLACE VIEW employee_full AS ...` (thêm `s.tam_ung_hang_thang`)
  - `CREATE OR REPLACE FUNCTION create_monthly_snapshot(...)` (thêm cột mới vào cả INSERT column list và SELECT column list)
  - Migration phải idempotent (chạy lại được an toàn)
  - Cuối file: ghi sẵn khối `-- ROLLBACK:` chứa reverse SQL (đầy đủ DROP COLUMN, restore VIEW/FUNCTION bản cũ)

- [x] Task 1.2: Cập nhật `database/001_schema.sql` — source of truth documentation
  - Thêm cột `tam_ung_hang_thang` vào CREATE TABLE `salaries` (nhóm "Bộ Cơ chế — Base")
  - Thêm cột `tam_ung_hang_thang` vào CREATE TABLE `snapshot_employees` (nhóm "COPY SALARY FIELDS — Cơ chế")
  - Cập nhật VIEW `employee_full`: thêm `s.tam_ung_hang_thang`
  - Cập nhật FUNCTION `create_monthly_snapshot`: thêm cột vào INSERT + SELECT
  - Cập nhật comment count (24 → 25 salary fields) ở header và COMMENT ON TABLE
  - Cập nhật version trong header (v2.4.0 → v2.5.0)

- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Chạy migration trên Supabase SQL Editor
  - Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'salaries' AND column_name = 'tam_ung_hang_thang';` → 1 row
  - Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'snapshot_employees' AND column_name = 'tam_ung_hang_thang';` → 1 row
  - Verify: `SELECT * FROM employee_full LIMIT 1;` → cột `tam_ung_hang_thang` xuất hiện
  - Verify: `SELECT * FROM employee_info_only LIMIT 1;` → cột `tam_ung_hang_thang` KHÔNG xuất hiện
  - Verify: INSERT salary với `tam_ung_hang_thang = -1` → bị reject bởi CHECK constraint
  - Verify: Gọi `create_monthly_snapshot` → `snapshot_employees` có cột `tam_ung_hang_thang` đúng giá trị
  - **Verify idempotency:** Chạy lại migration lần 2 → không lỗi, không thêm cột trùng, view/function không đổi (FR-02)

## Phase 2: Code Layer — Zod Schema, Constants & Tests

**Mục tiêu:** Đồng bộ code layer với DB mới, đảm bảo CI sync tests pass.

- [x] Task 2.1: Cập nhật Zod schema — `packages/shared/src/schemas/salary.ts`
  - Thêm `tam_ung_hang_thang: salaryAmount` vào nhóm "Bộ Cơ chế — Base"
  - Cập nhật comment header: 24 → 25 fields

- [x] Task 2.2: Cập nhật constants — `packages/shared/src/constants/salary-fields.ts`
  - Thêm `'tam_ung_hang_thang'` vào `SALARY_FIELDS` array (nhóm Cơ chế — Base)
  - Cập nhật comment header reference

- [x] Task 2.3: Cập nhật CI sync test — `packages/shared/src/tests/schema-sync.test.ts`
  - Sửa expected count từ 24 → 25 ở dòng `expect(SALARY_FIELDS.length).toBe(24)`
  - Cập nhật test description nếu cần

- [x] Task 2.4: Rebuild `@vcc/shared` và verify
  - Chạy `pnpm run build:shared`
  - Verify build thành công, không có type errors

- [x] Task 2.5: Cập nhật business docs (FR-01)
  - `.agent/business/data/SCHEMA.md`: cập nhật count Cơ chế 18→19, salary 24→25, snapshot 48→49, PII 24→25, thêm `tam_ung_hang_thang` vào bảng 3a Base fields
  - `.agent/business/modules/NS-002_salary_crud.md`: cập nhật count 24→25 cột, Cơ chế 18→19 cột

- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - Chạy `pnpm --filter @vcc/shared test` → tất cả tests pass
  - Chạy `pnpm run typecheck` → không có type errors
  - Verify: `SALARY_FIELDS.length === 25`
  - Verify: `salarySchema.shape` chứa key `tam_ung_hang_thang`
  - Verify: `SCHEMA.md` đã ghi 25 salary fields, `NS-002_salary_crud.md` đã ghi 25 cột

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-03-25T21:49:00 | 1 | 1.1 | Bắt đầu tạo migration file | start | — |
| 2026-03-25T21:49:15 | 1 | 1.1 | Đã tạo migrate 003 | done | — |
| 2026-03-25T21:49:15 | 1 | 1.2 | Cập nhật 001_schema.sql | done | — |
| 2026-03-25T21:49:30 | 1 | 1.Final | Bắt đầu test Phase 1 | start | Đã cài Supabase CLI |
| 2026-03-25T22:18:00 | 1 | 1.Final | Hoàn tất AI self-test | waiting | Chờ User confirm |
| 2026-03-25T22:36:00 | 1 | 1.Final | User confirm Manual Test OK | done | Hoàn thành Phase 1 |
| 2026-03-25T23:10:00 | 2 | 2.1-2.5 | Cập nhật shared code layer và docs | done | Xong logic + docs |
| 2026-03-25T23:12:00 | 2 | 2.Final | AI self test (sync test + build) | waiting | Chờ User confirm phase 2 |
| 2026-03-25T23:14:00 | 2 | 2.Final | User confirm OK | done | Hoàn tất Phase 2 |
| 2026-03-25T23:14:00 | All | Feature | Hoàn thành feature add-tam-ung-hang-thang | done | Sẵn sàng tạo commit |
