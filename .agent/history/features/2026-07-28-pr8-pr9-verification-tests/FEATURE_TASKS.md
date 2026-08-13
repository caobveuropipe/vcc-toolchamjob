# Feature Tasks: Kiểm thử xác minh tác động và an toàn của PR #8 & PR #9 (Snapshot Detail API)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-27 (Cập nhật theo Expert Review Round 6)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Local Safety Guard, Mock Redis & Unit Testing Matrix

**Mục tiêu:** Tạo chốt chặn an toàn Local DB dùng `new URL()` & Mock Upstash Redis (EFR-01, EFR-08, EFR-15), kiểm tra toàn bộ branch matrix của service `getSnapshotEmployeesDetail` (EFR-02, EFR-04, EFR-07, EFR-09, EFR-11).

<!-- Sửa theo EFR-01, EFR-08, EFR-15: Strict Safety guard & Mock Redis & Seeder safety check -->
- [x] Task 1.1: Tạo file setup `backend/vitest.integration.setup.ts` kiểm tra `new URL(SUPABASE_URL)` (protocol `http:`, hostname `127.0.0.1`/`localhost`, port `54321`) và mock `@upstash/redis` client. Thêm vào `vitest.integration.config.ts`.
- [x] Task 1.2: Bổ sung kiểm tra Local URL Safety Check vào đầu `backend/scripts/seed_dev_users.ts` để chặn chạy seeder nếu `SUPABASE_URL` không phải `127.0.0.1:54321` (EFR-15).
- [x] Task 1.3: Tạo unit test `backend/src/__tests__/unit/safetyGuard.test.ts` kiểm tra chính Safety Guard (test âm tính với Cloud URL, wrong port, deceptive hostname).
- [x] Task 1.4: Tạo file unit test `backend/src/__tests__/unit/snapshotDetailService.test.ts`.
<!-- Sửa theo EFR-02, EFR-07, EFR-09, EFR-11: Unit test theo Branch Matrix -->
- [x] Task 1.5: Viết test cases Branch Matrix cho month parsing: `T6.2024` -> `2024-06`, `T06.2024` -> `2024-06`, `T12.2024` -> `2024-12`.
- [x] Task 1.6: Viết test cases Branch Matrix cho invalid formats: `T0.2024`, `T13.2024`, `T001.2024`, `T012.2024`, `2024-06`, `abc` -> Đảm bảo throw `INVALID_FORMAT` (bỏ `undefined` vì đã được route layer chặn - EFR-07).
<!-- Sửa theo EFR-09, EFR-11: Remediation regex tightening nếu T001 lọt với đủ 2 capture groups -->
- [x] Task 1.7: Nếu test `T001.2024` lọt qua regex cũ, cập nhật regex trong `backend/src/services/snapshotService.ts` thành `^T(0?[1-9]|1[0-2])\.(\d{4})$` (giữ đủ 2 capture groups: month = `match[1]`, year = `match[2]`).
<!-- Sửa theo EFR-04: Assert query builder .neq() -->
- [x] Task 1.8: Viết test cases cho query builder parameters: Mock Supabase client và assert `.neq('snapshots.snapshot_status', 'deleted')` được gọi đúng.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy `pnpm --filter backend test` đảm bảo Unit Tests pass 100%).

## Phase 2: Local DB Provisioning (Safety Protected), Integration Gap Testing & Security Audit trên Supabase Local Docker CLI

**Mục tiêu:** Khởi tạo/kiểm tra provisioning môi trường Local DB an toàn (EFR-14, EFR-15, EFR-16) và kiểm tra thực tế endpoint `GET /api/snapshots/employees-detail` trên Supabase Local Docker CLI DB theo Gap Matrix, Helper Period Dates & Idempotent Pre/Post Cleanup (EFR-03, EFR-05, EFR-06, EFR-10, EFR-12, EFR-13).

<!-- Sửa theo EFR-14, EFR-15, EFR-16: Safe Local DB Provisioning & Monorepo CWD PowerShell env syntax -->
- [x] Task 2.1: Xác minh/Thực thi Local DB Provisioning (trường hợp fresh Supabase local): Khởi chạy `npx supabase start`, nạp `database/001_schema.sql` + `database/migrations/`, chạy lệnh monorepo root trên PowerShell `$env:ALLOW_DEV_SEED='true'; pnpm seed` (thực thi thông qua `pnpm --filter backend exec tsx scripts/seed_dev_users.ts` để đọc đúng `backend/.env.local` đã qua Local URL Safety Check) để nạp các tài khoản auth `admin.dev@vccorp.vn` và `loi.admicro@gmail.com`.
- [x] Task 2.2: Tạo file integration test `backend/src/__tests__/integration/snapshotsDetailApi.test.ts`.
<!-- Sửa theo EFR-03: Focus vào Auth Gaps -->
- [x] Task 2.3: Viết test cases kiểm tra Security Authentication gaps:
  - Gửi request thiếu header `x-api-key` -> HTTP 401.
  - Gửi request với `x-api-key` sai -> HTTP 401.
  - Gửi request với `x-api-key` rỗng `""` -> HTTP 401.
- [x] Task 2.4: Viết test cases kiểm tra Query Parameters Validation & Error Handling:
  - Missing query `thang` -> HTTP 400.
  - `thang` sai format (`T15.2024`) -> HTTP 400.
<!-- Sửa theo EFR-05, EFR-06, EFR-10, EFR-12, EFR-13: Fixture schema, getPeriodDates & Preflight + Postflight cleanup -->
- [x] Task 2.5: Viết test cases với Fixture Namespace `T12.2099` (dùng `getPeriodDates('2099-12')`):
  - Viết helper function `cleanupFixture()` thực hiện xóa `snapshot_employees` trước, `snapshots` sau theo namespace `2099-12` / `TEST_FIXTURE_KHOI`.
  - Gọi `cleanupFixture()` trong `beforeAll` (preflight cleanup - EFR-13).
  - Seed fixture `snapshots` với `month = '2099-12'`, `khoi = 'TEST_FIXTURE_KHOI'`, `period_start` (`2099-11-26`) và `period_end` (`2099-12-25`) tính từ `getPeriodDates('2099-12')` (EFR-12), `snapshot_status = 'locked'`, `snapshot_by = 'system'`.
  - Seed fixture `snapshot_employees` gắn FK với snapshot vừa tạo, `ma_nhan_su = 'TEST_EMP_9999'`.
  - Assert HTTP 200 trả đúng dữ liệu `luong_target_gt`, `luong_target_cc`.
  - Gọi `cleanupFixture()` trong `afterAll` bọc trong block `finally` (postflight cleanup).
- [x] Task 2.6: Viết test case Route Anti-collision:
  - Đảm bảo gọi `/api/snapshots/employees-detail` không khớp vào `/api/snapshots/:id`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Chạy `pnpm --filter backend test:integration` trên Supabase Local Docker CLI qua Safety Guard).

## Phase 3: Regression Testing & Safety Verification

**Mục tiêu:** Kiểm tra tổng thể toàn bộ hệ thống test của backend để khẳng định tính an toàn.

- [x] Task 3.1: Chạy typecheck và linter toàn bộ workspace (`pnpm run typecheck` & `pnpm run lint`).
- [x] Task 3.2: Chạy toàn bộ backend test suite (`pnpm --filter backend test` & `pnpm --filter backend test:integration`).
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Xác nhận 100% test pass, Safety Guard pass).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| [2026-07-27 13:55] | - | - | Khởi tạo FEATURE_PLAN.md và FEATURE_TASKS.md | done | Chờ review kế hoạch |
| [2026-07-27 15:55] | - | - | Cập nhật plan & tasks theo EFR-01 đến EFR-06 từ Expert Review Round 1 | done | Chấp nhận 6 EFR |
| [2026-07-27 16:05] | - | - | Cập nhật plan & tasks theo EFR-07 đến EFR-10 từ Expert Review Round 2 | done | Chấp nhận 4 EFR Round 2 |
| [2026-07-27 16:11] | - | - | Cập nhật plan & tasks theo EFR-11 đến EFR-13 từ Expert Review Round 3 | done | Chấp nhận 3 EFR Round 3 |
| [2026-07-27 16:16] | - | - | Cập nhật plan & tasks theo EFR-14 từ Expert Review Round 4 | done | Chấp nhận EFR-14 |
| [2026-07-27 17:51] | - | - | Cập nhật plan & tasks theo EFR-15 từ Expert Review Round 5 | done | Chấp nhận EFR-15 |
| [2026-07-27 17:55] | - | - | Cập nhật plan & tasks theo EFR-16 từ Expert Review Round 6 | done | Chấp nhận EFR-16 |
| [2026-07-27 18:00] | Phase 1 | Task 1.1 | Khởi chạy Phase 1: Tạo Local Safety Guard & Vitest integration setup | start | Đang triển khai Task 1.1 |
| [2026-07-27 18:02] | Phase 1 | Task 1.Final | Hoàn thành Phase 1: Tất cả Unit Tests & Safety Guard tests pass 100% | done | 54/54 tests pass |
| [2026-07-27 18:03] | Phase 2 | Task 2.1 | Khởi chạy Phase 2: Xác minh Local DB Provisioning & Integration Test | start | Đang triển khai Task 2.1 |
| [2026-07-27 18:07] | Phase 2 | Task 2.Final | Hoàn thành Integration Test Gap Matrix cho snapshotsDetailApi | done | 7/7 integration tests pass |
| [2026-07-28 09:01] | Phase 3 | Task 3.1 | Khởi chạy Phase 3: Regression testing, typecheck & linting toàn workspace | start | Đang thực thi Task 3.1 & 3.2 |
| [2026-07-28 09:04] | Phase 3 | Task 3.Final | Hoàn thành Phase 3: Typecheck, Linter và tất cả Unit & Integration tests pass | done | Feature pr8-pr9-verification-tests hoàn tất 100% |
