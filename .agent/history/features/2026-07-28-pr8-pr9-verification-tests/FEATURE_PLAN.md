# Feature Plan: Kiểm thử xác minh tác động và an toàn của PR #8 & PR #9 (Snapshot Detail API)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: pr8-pr9-verification-tests
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-27 (Cập nhật theo Expert Review Round 6)

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** PR #8 và PR #9 đã được merge vào `origin/main`, bổ sung endpoint nội bộ `GET /api/snapshots/employees-detail` dùng header `x-api-key` (`INTERNAL_API_KEY`) để truy vấn chi tiết nhân sự kèm lương target (`luong_target_gt`, `luong_target_cc`) từ bảng `snapshot_employees` và `snapshots`.
- **Vấn đề cần giải quyết:** Cần thiết lập bộ kiểm thử toàn diện (Unit Test & Integration Test) để xác minh:
  1. API mới có làm ảnh hưởng tới hệ thống routing hay các 15 endpoints `snapshots.ts` hiện tại hay không (routing priority conflict).
  2. Rủi ro bảo mật (Security & API Key Leakage/Bypass): Khi không có `x-api-key`, gửi key sai hoặc key rỗng `""`, API có chặn triệt để (401 Unauthorized) để bảo vệ dữ liệu lương target nhạy cảm hay không.
  <!-- Sửa theo EFR-09, EFR-11: Regex tightening với đủ 2 capture groups -->
  3. Xử lý lỗi & Edge cases: Regex format `thang` (ví dụ `T6.2024`, `T06.2024`, `T13.2024`, `T001.2024`, `abc`), cho phép sửa nhẹ regex trong `snapshotService.ts` thành `^T(0?[1-9]|1[0-2])\.(\d{4})$` để vừa chặn over-padded month (`T001`) vừa giữ đủ 2 capture groups cho month (`match[1]`) và year (`match[2]`).
  <!-- Sửa theo EFR-01, EFR-08, EFR-14, EFR-15, EFR-16: Safety Guard strict URL, PowerShell env syntax, Monorepo seed script boundary -->
  4. Ràng buộc an toàn DB & Provisioning: 100% bài test động đến DB **bắt buộc có strict URL parser safety guard** (`new URL()`) kiểm tra origin thuộc `http://127.0.0.1:54321` hoặc `http://localhost:54321`, lập tức crash process nếu phát hiện URL Cloud Dev/Prod. Bước Local DB Provisioning (nạp schema `001_schema.sql` + migrations + seed dev accounts) **bắt buộc phải qua Local Safety Check TRƯỚC KHI thực thi seeder**, sử dụng lệnh chuẩn monorepo trên PowerShell: `$env:ALLOW_DEV_SEED='true'; pnpm seed` (định tuyến đúng CWD tới `backend/` để load `backend/.env.local`).
- **Mục tiêu:** Xây dựng bộ Unit & Integration Test bổ sung theo khoảng trống (gap matrix) cô lập hoàn toàn trên môi trường Local Docker để kiểm chứng toàn bộ PR #8 & PR #9, khẳng định rủi ro ở mức tối thiểu.
- **Kết quả mong đợi:** Tạo safety setup `vitest.integration.setup.ts`, unit test suite `backend/src/__tests__/unit/snapshotDetailService.test.ts` và integration test suite bổ sung `backend/src/__tests__/integration/snapshotsDetailApi.test.ts` đạt 100% pass trên Supabase Local CLI.

## 2. Phạm vi

### In scope
<!-- Sửa theo EFR-01, EFR-08, EFR-14, EFR-15, EFR-16: Safety guard strict URL, Monorepo CWD & Provisioning Safety Wrapper -->
- **Safety Guard & Monorepo CWD Safe Local DB Provisioning (EFR-01, EFR-08, EFR-14, EFR-15, EFR-16)**:
  - Setup file `backend/vitest.integration.setup.ts` dùng `new URL()` validate protocol (`http:`), hostname (`127.0.0.1` hoặc `localhost`) và port (`54321`). Throw error crash process nếu sai.
  - Viết unit test cho chính Safety Guard (test dương tính với local URL, test âm tính với Cloud URL, wrong port, deceptive hostname).
  - Mock Upstash Redis client (`@upstash/redis`) trong setup integration test để cô lập hoàn toàn khỏi external network.
  - Local Provisioning Safety Guard & Monorepo CWD Boundary: Seeder `seed_dev_users.ts` phải kiểm tra URL `127.0.0.1:54321` / `localhost:54321` TRƯỚC KHI tạo Supabase client. Cung cấp command monorepo chuẩn PowerShell: `$env:ALLOW_DEV_SEED='true'; pnpm seed` (thực thi thông qua `pnpm --filter backend exec tsx scripts/seed_dev_users.ts` để đọc đúng `backend/.env.local`).
- Unit test cho hàm `getSnapshotEmployeesDetail(thang)` trong `backend/src/services/snapshotService.ts`:
  <!-- Sửa theo EFR-07: Bỏ undefined khỏi unit test service contract vì route đã validate missing thang -->
  <!-- Sửa theo EFR-09, EFR-11: Thêm cases T001.2024, T012.2024 và cho phép fix regex với 2 capture groups -->
  - Ma trận test case theo branch (EFR-02, EFR-07, EFR-09, EFR-11): tháng hợp lệ (`T6.2024`, `T06.2024`), tháng không hợp lệ (`T0.2024`, `T13.2024`, `T001.2024`, `T012.2024`, `2024-06`, `abc`).
  - Phân tích mã lỗi `INVALID_FORMAT` (400 Bad Request).
  - Verify query builder gọi `.neq('snapshots.snapshot_status', 'deleted')` (EFR-04).
  - Remediation scope: Cập nhật regex `^T(0?[1-9]|1[0-2])\.(\d{4})$` trong `snapshotService.ts` nếu `T001.2024` bị lọt (đảm bảo `match[1]` là month, `match[2]` là year).
- Integration test bổ sung theo Gap Matrix (EFR-03) cho `GET /api/snapshots/employees-detail`:
  - Authentication gaps: `x-api-key` bị sai riêng biệt, `x-api-key` rỗng `""`.
  - Routing Priority & Precedence (EFR-05): Đảm bảo gọi `/api/snapshots/employees-detail` không bị rơi vào `/api/snapshots/:id`.
  - Data assertion: Kiểm tra chính xác các trường lương `luong_target_gt`, `luong_target_cc` của fixture test.
<!-- Sửa theo EFR-06, EFR-10, EFR-12, EFR-13: Helper getPeriodDates & Preflight + Postflight Cleanup -->
- Fixture Schema & Cleanup Contract (EFR-10, EFR-12, EFR-13): Chốt namespace `khoi = 'TEST_FIXTURE_KHOI'`, `month = '2099-12'`, tính `period_start` (`2099-11-26`) và `period_end` (`2099-12-25`) bằng helper `getPeriodDates('2099-12')` từ `@vcc/shared`, `snapshot_status = 'locked'`, `ma_nhan_su = 'TEST_EMP_9999'`. Thực hiện cleanup idempotent ở CẢ `beforeAll` (preflight) lẫn `afterAll` (postflight) bọc trong `try/finally` theo thứ tự FK.

### Out of scope
- Thay đổi logic ứng dụng hoặc refactor code sản xuất không liên quan (ngoại trừ sửa nhẹ regex `thang` nếu phát hiện lọt `T001.2024`).
- Chỉnh sửa DB Schema hoặc tạo SQL Migration mới.
- Thao tác hoặc kết nối tới Supabase Cloud Dev/Prod.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - *Bảo mật - Hybrid Security & Salary Isolation*: Dữ liệu lương target (`luong_target_gt`, `luong_target_cc`) là dữ liệu tài chính nhạy cảm. Route `/employees-detail` bypass `authMiddleware`, bắt buộc kiểm tra `x-api-key` đối chiếu `INTERNAL_API_KEY`.
  - *Supabase Local Docker CLI Harness Standard*: 100% Integration Tests phải thực thi trên Supabase Local Docker CLI (`npx supabase start` trỏ `127.0.0.1:54321`).
  - *Structure & Routing Invariants*: Route static (`/employees-detail`) bắt buộc khai báo TRƯỚC `snapshotsRoutes.use('*', authMiddleware)` và TRƯỚC dynamic routes `/:id`.
- **"Cấm kỵ" cần tránh:**
  - Tuyệt đối KHÔNG chạy test tích hợp hoặc seed data nếu chưa qua bước kiểm tra URL Local Docker.
  - Tuyệt đối KHÔNG bỏ qua test case 401 khi thiếu/sai/rỗng `x-api-key`.
- **Ràng buộc kiến trúc liên quan:**
  - Hono routing middleware chain.
  - Integration test config: `backend/vitest.integration.config.ts`.

## 4. Giả định và câu hỏi mở

### Giả định
- Supabase Local Docker CLI đã được cài đặt và có thể khởi chạy bằng `npx supabase start` trên môi trường local.
- Biến môi trường `INTERNAL_API_KEY` được định nghĩa trong file cấu hình test hoặc `.env.local` của backend.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

<!-- Sửa theo EFR-01, EFR-08, EFR-14, EFR-15, EFR-16: Safety Guard strict check, negative tests & monorepo CWD PowerShell local provisioning -->
- [ ] **Safety Guard & Safe Provisioning (EFR-01, EFR-08, EFR-14, EFR-15, EFR-16)**:
  - Test process và seeder process dừng ngay lập tức nếu `SUPABASE_URL` không đúng `http://127.0.0.1:54321` hoặc `http://localhost:54321`.
  - Có unit test cho Safety Guard xác nhận từ chối Cloud URL, wrong port, và hostname lừa đảo (như `127.0.0.1.attacker.com`).
  - Upstash Redis client được mock hoàn toàn trong test integration.
  - Quy trình bootstrap Local DB dùng lệnh monorepo chuẩn PowerShell (`$env:ALLOW_DEV_SEED='true'; pnpm seed`) đọc đúng `backend/.env.local` kèm safety URL check tích hợp trong seeder.
<!-- Sửa theo EFR-02, EFR-07, EFR-09, EFR-11: Unit Test Matrix -->
- [ ] **Unit Test Matrix (EFR-02, EFR-04, EFR-07, EFR-09, EFR-11)**:
  - Branch 1: `T6.2024` -> Parse thành `2024-06`, format output `T6.2024`.
  - Branch 2: `T06.2024` -> Parse thành `2024-06`, format output `T6.2024`.
  - Branch 3: Invalid string (`abc`, `2024-06`) -> Throw error `INVALID_FORMAT`.
  - Branch 4: Invalid month number (`T0.2024`, `T13.2024`) -> Throw error `INVALID_FORMAT`.
  - Branch 5: Over-padded month (`T001.2024`, `T012.2024`) -> Throw error `INVALID_FORMAT`.
  - Branch 6: Assert Supabase query builder gọi `.neq('snapshots.snapshot_status', 'deleted')`.
<!-- Sửa theo EFR-03, EFR-05, EFR-06, EFR-10, EFR-12, EFR-13: Gap Matrix, Helper Period & Idempotent Pre/Post Cleanup -->
- [ ] **Integration Test Gaps & Fixtures (EFR-03, EFR-05, EFR-06, EFR-10, EFR-12, EFR-13)**:
  - Gap 1: Header `x-api-key` sai -> 401 Unauthorized.
  - Gap 2: Header `x-api-key` rỗng `""` -> 401 Unauthorized.
  - Gap 3: Route anti-collision: `/api/snapshots/employees-detail` không đi vào route `/:id`.
  - Gap 4: Seed Fixture dùng `getPeriodDates('2099-12')` (`2099-11-26`..`2099-12-25`), đáp ứng đầy đủ NOT NULL columns (`khoi`, `snapshot_status`, `ma_nhan_su`) và assert trả đúng `luong_target_gt`, `luong_target_cc`.
  - Gap 5: Preflight cleanup ở `beforeAll` VÀ postflight cleanup ở `afterAll` bọc trong `try/finally` theo thứ tự FK (xóa `snapshot_employees` trước, `snapshots` sau), đảm bảo suite rerunnable 100% kể cả khi bị gián đoạn.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/vitest.integration.config.ts` | Sửa | Thêm `setupFiles: ['./vitest.integration.setup.ts']` | 🟢 Thấp | Có |
| `backend/vitest.integration.setup.ts` | Tạo mới | Guard ngắt process với `new URL()` validation + mock Redis (EFR-01, EFR-08) | 🟢 Thấp | Có |
| `backend/scripts/seed_dev_users.ts` | Sửa | Tích hợp Local URL Safety Check trước khi tạo Supabase client (EFR-15, EFR-16) | 🟢 Thấp | Có |
| `backend/src/__tests__/unit/safetyGuard.test.ts` | Tạo mới | Unit test riêng cho Safety Guard URL validation (EFR-08, EFR-15) | 🟢 Thấp | Có |
| `backend/src/__tests__/unit/snapshotDetailService.test.ts` | Tạo mới | Unit test theo Branch Matrix (EFR-02, EFR-04, EFR-07, EFR-09, EFR-11) | 🟢 Thấp | Có |
| `backend/src/__tests__/integration/snapshotsDetailApi.test.ts` | Tạo mới | Integration test theo Gap Matrix, `getPeriodDates` & Pre/Post Cleanup (EFR-03, EFR-05, EFR-06, EFR-10, EFR-12, EFR-13) | 🟢 Thấp | Có |
| `backend/src/services/snapshotService.ts` | Remediation / Read-only | Sửa regex `^T(0?[1-9]|1[0-2])\.(\d{4})$` nếu cần (EFR-09, EFR-11) | 🟢 Thấp | Có |
| `backend/src/routes/snapshots.ts` | Read-only check | Xác minh thứ tự khai báo route và security check | 🟢 Thấp | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  - Security Bypass Risk: Route `/employees-detail` nằm trước `authMiddleware`. Cần soi kỹ nếu `x-api-key` là `undefined` hoặc chuỗi rỗng (`""`), liệu `c.req.header('x-api-key') !== env.INTERNAL_API_KEY` có luôn evaluate chính xác thành `true` (chặn access) hay không.
  - Strict URL Safety: Guard `vitest.integration.setup.ts` và seeder `seed_dev_users.ts` phải parse URL chính xác bằng `new URL()` để ngắt ngay nếu không trỏ về local port 54321.
  - Fixture FK Constraint: Đảm bảo insert `snapshots` trước `snapshot_employees` và delete `snapshot_employees` trước `snapshots` cả ở `beforeAll` và `afterAll`.
- **Review focus areas:**
  - Đánh giá tính chặt chẽ của logic auth API Key.
  - Kiểm tra tính đầy đủ của bộ test cases theo Gap Matrix & Fixture Contract.
- **Dependencies / rollout concerns:**
  - Yêu cầu Supabase Local Docker CLI running (`npx supabase start`) trước khi chạy Integration Test.

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1: Local Safety Guard, Mock Redis & Unit Testing Matrix**: Tạo setup guard `vitest.integration.setup.ts` kèm unit test cho guard; viết Unit Tests theo Branch Matrix cho `getSnapshotEmployeesDetail` (sửa nhẹ regex trong `snapshotService.ts` thành `^T(0?[1-9]|1[0-2])\.(\d{4})$` nếu cần).
  - **Phase 2: Local DB Provisioning (Safety Protected), Integration Gap Testing & Security Verification**:
    - Bổ sung kiểm tra Local Safety URL vào `backend/scripts/seed_dev_users.ts`.
    - Thực hiện bootstrap Local DB nếu chạy từ trạng thái sạch: Nạp schema `database/001_schema.sql` + `database/migrations/`, chạy `$env:ALLOW_DEV_SEED='true'; pnpm seed` (sử dụng root package.json script để định tuyến đúng context CWD vào `backend/` load `backend/.env.local`) để nạp các tài khoản auth (EFR-14, EFR-15, EFR-16).
    - Viết Integration Tests theo Gap Matrix (Key rỗng, key sai, exact salary fields, route collision check) dùng fixture namespace `T12.2099` (dùng `getPeriodDates('2099-12')`) kèm preflight `beforeAll` & postflight `afterAll` cleanup theo FK order.
  - **Phase 3: Verification Run**: Chạy test suite `pnpm --filter backend test` & `pnpm --filter backend test:integration` xác nhận pass 100%.
- **Thứ tự triển khai:** Safety Guard -> Unit Test -> Local DB Provisioning Check -> Integration Test Local Docker -> Verification Run.
- **Yêu cầu migration / config / deploy:** Không có.

## 9. Test Strategy

- **Automated tests:**
  - Unit test với Vitest: `pnpm --filter backend test`
  - Integration test với Vitest + Local Safety Guard: `pnpm --filter backend test:integration`
- **Manual verification:**
  - Đảm bảo backend được khởi chạy (`pnpm run dev:be`) và Supabase local active (`npx supabase start`) trước khi dùng `curl` test thủ công.
- **Data / env chuẩn bị trước khi test:**
  - Supabase Local CLI (:54321) khởi chạy qua Docker.
  - Biến môi trường test `INTERNAL_API_KEY=test-internal-key-secret`.
  <!-- Sửa theo EFR-14, EFR-15, EFR-16: Local DB Provisioning Monorepo Command -->
  - Local DB Provisioning command (chuẩn monorepo root trên PowerShell): `$env:ALLOW_DEV_SEED='true'; pnpm seed` (sau khi nạp `database/001_schema.sql` + `database/migrations/*.sql` và kiểm tra Local URL Safety).

## 10. Rollback Plan

- Xóa các file test harness local mới tạo (`vitest.integration.setup.ts`, `safetyGuard.test.ts`, `snapshotDetailService.test.ts`, `snapshotsDetailApi.test.ts`). Revert sửa đổi regex trong `snapshotService.ts` và seeder `seed_dev_users.ts` nếu có.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
