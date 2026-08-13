# Feature Tasks: Lọc ẩn nhân sự phòng chờ chưa duyệt khỏi Danh sách nhân sự chính thức

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-24

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Cập nhật Backend & Frontend Filter Logic

**Mục tiêu:** Áp dụng parameter `exclude_pending_new_hires = true` (ẩn nhân sự mới nháp `TMP...`) cho API danh sách nhân sự chính thức, Export Excel và Autocomplete.

- [x] Task 1.1: Cập nhật Backend `listEmployees` / `employees.ts` để hỗ trợ parameter `exclude_pending_new_hires = true` (lọc bỏ nhân sự nháp mới `TMP...` nhưng giữ nhân sự cũ đang hoạt động có pending data).
- [x] Task 1.2: Cập nhật Backend `searchAutocompleteEmployees` trong `employeeService.ts` để tự động lọc bỏ nhân sự nháp mới `TMP...`.
- [x] Task 1.3: Cập nhật Frontend `useEmployees.ts` và `EmployeeListPage.tsx` để truyền parameter `exclude_pending_new_hires = true` chuẩn xác khi query danh sách chính thức và export Excel (`handleExport`, `runExportFull`).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)

## Phase 2: Integration Test Verification (Supabase Local Docker Flow)

**Mục tiêu:** Đảm bảo test suite backend bao phủ hai chiều và xác nhận trên môi trường Supabase Local Docker cô lập 100%.

- [x] Task 2.1: Khởi tạo Supabase Local Harness (`npx supabase init`, cấu hình `supabase/seed.sql` nạp Auth user test `loi.admicro@gmail.com` + baseline schema, tạo `backend/.env.test.local` trỏ `127.0.0.1:54321`).
- [x] Task 2.2: Bổ sung integration test backend trong `employee.test.ts` (chạy trên Supabase Local Docker `npx supabase start` / reset sạch qua `npx supabase db reset`) để verify: (1) khi truyền `exclude_pending_new_hires=true` (hoặc default list) nhân sự `TMP` bị ẩn; (2) nhân sự cũ pending VẪN HIỂN THỊ trên main list và có icon/pending flags; (3) truyền `state_phong_cho=true` trả về đủ nháp phòng chờ; (4) autocomplete chỉ trả nhân sự chính thức.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc - Chạy `pnpm --filter backend run test:integration`)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-24 13:49 | Phase 1 | Task 1.1 | Chuyển task sang in-progress, chuẩn bị cập nhật backend listEmployees / employees.ts | start | Khởi tạo execution flow |
| 2026-07-24 13:50 | Phase 1 | Task 1.1-1.3 | Hoàn tất code Backend (listEmployees, autocomplete) & Frontend (useEmployees, EmployeeListPage) | done | Chuyển sang Task 1.Final self-test |
| 2026-07-24 13:54 | Phase 1 | Task 1.Final | User confirm OK cho Phase 1, chốt Task 1.Final | done | Chuyển sang Phase 2 |
| 2026-07-24 13:55 | Phase 2 | Task 2.1-2.2 | Tạo .env.test.local và bổ sung 4 test cases cho exclude_pending_new_hires & autocomplete | done | Bắt đầu Task 2.Final run test:integration |
| 2026-07-24 14:10 | Phase 2 | Task 2.Final | Chạy vitest integration test suite với Supabase Local Docker Harness (19/19 passed) | done | User confirm archive & complete feature |
