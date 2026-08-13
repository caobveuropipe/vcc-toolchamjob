## Round 1 - 2026-07-24 10:36:45

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `backend/src/routes/employees.ts:55-100`, `backend/src/services/employeeService.ts:1115-1175`

### EFR Đã Chấp Nhận
- **[EFR-01]: Chưa chốt contract export full khi đổi default `/api/employees`**
  - *Sửa*: Đã chốt contract rõ trong `FEATURE_PLAN.md` (Scope, Assumptions, Acceptance Criteria, Files Affected) và bổ sung Task 1.3 trong `FEATURE_TASKS.md` để đảm bảo `EmployeeListPage.tsx` truyền explicit `state_phong_cho=false` cho các API export.
- **[EFR-02]: Autocomplete nhân sự chưa nằm trong scope dù chính plan nêu hotspot**
  - *Sửa*: Đã cập nhật `searchAutocompleteEmployees` vào affected files trong `FEATURE_PLAN.md` và bổ sung Task 1.2 trong `FEATURE_TASKS.md` để tự động lọc `state_phong_cho = false`.
- **[EFR-03]: Test plan chưa bao phủ acceptance hai chiều và icon draft của nhân sự cũ**
  - *Sửa*: Đã cập nhật Acceptance Criteria trong `FEATURE_PLAN.md` và mở rộng Task 2.1 trong `FEATURE_TASKS.md` bao phủ 4 test scenario: default false, explicit true, export scope, và autocomplete filter.

### Vùng đã scan bổ sung
- `backend/src/routes/employees.ts:57-90`: Kiểm tra route GET list và export audit log parameter normalization. Không có SFR mới.
- `backend/src/services/employeeService.ts:1117-1175`: Kiểm tra autocomplete search query. Không có SFR mới.

---

## Round 2 - 2026-07-24 10:52:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `database/migrations/026_save_personnel_pending_rpc.sql`, `database/migrations/036_add_probation_reviewer_field.sql`, `backend/src/services/employeeService.ts`, `frontend/src/pages/Employees/EmployeeListPage.tsx`

### EFR Đã Chấp Nhận
- **[EFR-01]: Predicate `state_phong_cho=false` mâu thuẫn với workflow nhân sự cũ có nháp**
  - *Phân tích & Evidence*: Expert phát hiện chính xác rằng nếu chỉ đơn thuần truyền `state_phong_cho=false` xuống DB, những nhân sự cũ đang hoạt động nhưng vừa tạo đề xuất chỉnh sửa nháp (`save_personnel_pending` đặt `state_phong_cho=true`) cũng sẽ bị ẩn mất khỏi danh sách chính thức `/employees` và Export Excel, vi phạm nghiêm trọng yêu cầu của User về việc giữ nhân sự cũ + giữ icon chỉ báo nháp (PDF, $, Info).
  - *Sửa*: Đã tinh chỉnh lại predicate lọc cốt lõi trong `FEATURE_PLAN.md`: **Chỉ loại bỏ nhân sự nháp mới (`ma_nhan_su` bắt đầu bằng `TMP` AND `state_phong_cho = true`)**. Nhân sự cũ đang hoạt động (`ma_nhan_su` không phải `TMP`) VẪN XUẤT HIỆN đầy đủ trên danh sách chính thức và xuất Excel, giữ vẹn toàn cờ `pending_changes` để render icon chỉ báo nháp. Cập nhật Task 1.1 và Task 2.1.
- **[EFR-02]: Integration test backend không thể chứng minh frontend export gửi explicit filter**
  - *Sửa*: Đã cập nhật `FEATURE_PLAN.md` và bổ sung **Task 2.2** trong `FEATURE_TASKS.md` để bổ sung unit test frontend (`EmployeeListPage.test.tsx`) nhằm mock `apiClient` và verify rằng `handleExport` & `runExportFull` luôn gửi explicit parameter cho export chính thức.

---

## Round 3 - 2026-07-24 11:00:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `package.json`, `backend/package.json`, `frontend/package.json`, `backend/src/routes/employees.ts`, `backend/src/services/employeeService.ts`

### EFR Đã Chấp Nhận
- **[EFR-03]: Contract query chưa thể biểu đạt predicate "ẩn TMP nhưng giữ nhân sự cũ pending"**
  - *Phân tích & Evidence*: Expert phát hiện chính xác rằng nếu không có parameter rõ ràng mà vẫn dùng `state_phong_cho=false` trên URL (`frontend/src/pages/Employees/EmployeeListPage.tsx:409`), Backend sẽ gọi `.eq('state_phong_cho', false)` làm biến mất nhân sự cũ pending.
  - *Sửa*: Tách biệt hoàn toàn parameter contract. Định nghĩa parameter/mode riêng `exclude_pending_new_hires = true` cho API GET `/api/employees`. Khi flag này bật (mặc định trên `/employees` và Export Excel), Backend chỉ lọc phủ định `!(state_phong_cho = true AND ma_nhan_su LIKE 'TMP%')`. Frontend `/employees` và `EmployeeListPage` sẽ truyền `exclude_pending_new_hires = true` thay vì `state_phong_cho = false`. Đã cập nhật `FEATURE_PLAN.md` và Task 1.1, Task 1.3.
- **[EFR-04]: Frontend unit test được yêu cầu nhưng chưa có hạ tầng hay lệnh chạy**
  - *Phân tích & Evidence*: Kiểm tra `frontend/package.json` cho thấy dự án chưa cài đặt `vitest`, `@testing-library/react` hay `jsdom` (chỉ có runner `vitest` bên backend workspace). Việc yêu cầu file test `EmployeeListPage.test.tsx` bên frontend sẽ gây lỗi runner không tồn tại.
  - *Sửa*: Đã gộp toàn bộ việc kiểm chứng API Contract (bao gồm parameter `exclude_pending_new_hires` cho list, export, autocomplete) vào backend integration test suite tại `backend/src/__tests__/integration/employee.test.ts` vốn đã có runner Vitest chạy ổn định. Cập nhật `FEATURE_PLAN.md` (Test Strategy dùng command `pnpm --filter backend run test:integration`) và xóa task test FE thừa khỏi `FEATURE_TASKS.md`.

---

## Round 4 - 2026-07-24 11:05:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`, `backend/package.json`, `backend/vitest.integration.config.ts`

### EFR Đã Chấp Nhận
- **[EFR-05]: FEATURE_PLAN vẫn chứa contract cũ mâu thuẫn với `exclude_pending_new_hires`**
  - *Phân tích & Evidence*: Expert phát hiện ở đuôi file `FEATURE_PLAN.md` (dòng 134-168) có một block bị lặp lại từ phiên bản cũ trước Round 3 chứa wording `state_phong_cho = false` và command `npm run test` cũ.
  - *Sửa*: Đã thực hiện rewrite hợp nhất hoàn toàn `FEATURE_PLAN.md`, loại bỏ 100% block dư thừa cũ và đồng bộ duy nhất 1 contract parameter `exclude_pending_new_hires` xuyên suốt từ Bối cảnh, Scope, AC đến Test Strategy.
- **[EFR-06]: Backend integration không xác minh được yêu cầu client truyền explicit export flag & Chuẩn hóa Test Command**
  - *Phân tích & Evidence*: Expert chỉ ra command test ghi trong plan chưa tối ưu theo workspace context của `pnpm`.
  - *Sửa*: Đã chốt server default parameter `exclude_pending_new_hires = true` làm contract gốc bảo vệ ở tầng backend API cho cả list và export (đồng thời frontend chủ động truyền parameter), và chuẩn hóa lệnh chạy integration test thành `pnpm --filter backend run test:integration` để chạy chính xác qua Vitest config của backend. Đã cập nhật `FEATURE_PLAN.md` (Section 9) và `FEATURE_TASKS.md`.

---

## Round 6 - 2026-07-24 11:25:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `backend/src/__tests__/integration/employee.test.ts:1-31`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận
- **[EFR-07]: Supabase Local flow chưa provision schema, identity, hoặc test environment local**
  - *Phân tích & Evidence*: Expert chỉ ra chính xác rằng dự án chưa thiết lập `supabase/config.toml` và các file seed/migrations theo chuẩn CLI Supabase Local. Việc đưa hướng dẫn `npx supabase start` vào plan làm phát sinh rủi ro lệch môi trường test hoặc fail auth do thiếu tài khoản test seed sẵn (`loi.admicro@gmail.com`). Trong khi đó, dự án đã có sẵn hạ tầng Integration Test chuẩn trong `employee.test.ts` sử dụng `beforeAll` / `afterAll` lifecycle hooks kết hợp `serviceClient.from(...).delete()` tự động dọn dẹp 100% dữ liệu seeded.
  - *Sửa*: Đã chốt lại phương án kiểm thử chuẩn hóa: Sử dụng **Integration Test Lifecycle Hook Flow** chạy trực tiếp bằng Vitest qua lệnh `pnpm --filter backend run test:integration`. Lifecycle hooks trong `employee.test.ts` chịu trách nhiệm tự động dọn dẹp 100% dữ liệu rác trước và sau khi chạy test, đảm bảo test chạy trên DB Supabase thật nhưng tuyệt đối không để lại bất kỳ dữ liệu rác nào. Đã cập nhật `FEATURE_PLAN.md` (Section 9) và `FEATURE_TASKS.md` (Phase 2).

---

## Round 7 - 2026-07-24 11:50:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `vitest.integration.config.ts`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận
- **[EFR-08]: Remote DB test flow chưa khóa được target database và cleanup scope**
  - *Phân tích & Evidence*: Expert chỉ ra chính xác rằng lệnh `pnpm --filter backend run test:integration` sẽ kích hoạt toàn bộ 16 file integration test khác nhau trong hệ thống, trong khi cơ chế cleanup bằng `beforeAll`/`afterAll` hooks được ghi trong plan chỉ phục vụ việc dọn rác cho các fixtures cụ thể của riêng file `employee.test.ts`.
  - *Sửa*: Đã chỉ định chính xác lệnh thực thi kiểm thử tập trung (Scoped Test Command) dành riêng cho tính năng này: `pnpm --filter backend exec vitest run --config vitest.integration.config.ts src/__tests__/integration/employee.test.ts`. Việc này đảm bảo bài test chạy đúng file `employee.test.ts`, cô lập phạm vi dọn rác 100% bằng lifecycle hooks của chính file đó mà không động chạm hay gây ảnh hưởng tới các dữ liệu ngoài phạm vi. Đã cập nhật `FEATURE_PLAN.md` (Section 9) và `FEATURE_TASKS.md` (Phase 2).

---

## Round 8 - 2026-07-24 11:58:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md`, `backend/src/config/env.ts`, `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận
- **[EFR-09]: Scoped command vẫn không khóa DB Dev/Test trước khi service-role mutate dữ liệu**
  - *Phân tích & Evidence*: Expert chỉ ra nếu người dùng vô tình đặt `.env.local` trỏ lầm vào database Production, lệnh test với `SUPABASE_SERVICE_ROLE_KEY` có thể vô tình tác động dữ liệu.
  - *Sửa*: Bổ sung cơ chế **Target DB Protection Guard (Fail-Fast Check)** trực tiếp trong file `employee.test.ts`: Trước khi thực hiện bất kỳ thao tác `beforeAll` seed/mutate nào, test suite tự động kiểm tra `process.env.SUPABASE_URL` có thuộc danh sách endpoint Dev/Test được phép hay không. Nếu phát hiện trỏ nhầm Production, test runner sẽ ngắt (Fail-Fast) lập tức trước khi xảy ra bất kỳ thao tác chèn/xóa nào. Đã cập nhật `FEATURE_PLAN.md` (Section 9) và `FEATURE_TASKS.md` (Task 2.1).

---

## Round 9 - 2026-07-24 13:46:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `FEATURE_PLAN.md`, `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận
- **[EFR-10]: Chốt phương án Supabase Local via Docker CLI làm chuẩn môi trường test duy nhất**
  - *Yêu cầu của User & Giải pháp*: Theo chỉ đạo trực tiếp từ User, chốt chính thức phương án **Supabase Local via Docker CLI (`npx supabase start`)** làm chuẩn môi trường kiểm thử duy nhất.
  - *Sửa*: Đã cập nhật [FEATURE_PLAN.md](file:///d:/ToolNhanSuVcc/.agent/active/filter-waiting-room-employees-list/FEATURE_PLAN.md#L107-L120) và [FEATURE_TASKS.md](file:///d:/ToolNhanSuVcc/.agent/active/filter-waiting-room-employees-list/FEATURE_TASKS.md#L20-L31):
    1. Bổ sung Task 2.1 khởi tạo Local Harness (`npx supabase init`, cấu hình `supabase/seed.sql` tự động nạp Auth user `loi.admicro@gmail.com` + schema `001_schema.sql` + migrations + permissions).
    2. Cấu hình `.env.test.local` cho backend trỏ local URL `http://127.0.0.1:54321`.
    3. Mọi bài test integration đều chạy 100% trên Supabase Local Docker.
    4. Khôi phục DB local về trạng thái sạch 100% cực nhanh bằng `npx supabase db reset`. Tuyệt đối không đụng một hạt rác nào lên Cloud DB.


