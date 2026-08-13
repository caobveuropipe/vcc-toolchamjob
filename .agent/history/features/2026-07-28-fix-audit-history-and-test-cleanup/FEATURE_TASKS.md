# Feature Tasks: Sửa lỗi ghi log lịch sử và sửa lỗi hiển thị danh sách nhân sự

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-28

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Backend Bug Fix & Protection

**Mục tiêu:** Khắc phục lỗi ghi log rác khi cập nhật Người nghiệm thu thử việc và bảo vệ dữ liệu PII đúng cách.

- [x] Task 1.1: Cấu hình `.gitignore` để bỏ qua thư mục `database_backups/` và các định dạng backup nhị phân/SQL nằm trong đó, tuyệt đối không dùng rule `*.sql` toàn cục gây che mất migration mới. <!-- Sửa theo EFR-07 -->
- [x] Task 1.2: Sửa logic select của `oldRow` thành `.select('*')` trong hàm `updateProbationReviewer` tại [employeeService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/employeeService.ts), đồng thời lọc `diffEmployeeFields` kết quả chỉ giữ lại thay đổi của trường `nguoi_nghiem_thu_thu_viec`. <!-- Sửa theo EFR-05 -->
- [x] Task 1.3: Loại bỏ toàn bộ log debug `console.log`/`console.error` và raw query PII logging trong hàm `searchAutocompleteEmployees` tại [employeeService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/employeeService.ts). <!-- Sửa theo EFR-12 -->
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy test local pass `probationReviewer.test.ts`)

## Phase 2: Frontend Visibility, Autocomplete & Test Updates

**Mục tiêu:** Cập nhật frontend để hiển thị song song, tích hợp autocomplete động, và ngăn ngừa regression bằng các test tự động/kiểm tra tĩnh.

- [x] Task 2.1: Sửa [EmployeeListPage.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Employees/EmployeeListPage.tsx#L411) để bỏ `state_phong_cho={false}` truyền vào `EmployeeTable`.
- [x] Task 2.2: Sửa [ReviewerManagement.tsx](file:///d:/ToolNhanSuVcc/frontend/src/pages/Admin/tabs/ReviewerManagement.tsx#L36) để bỏ `state_phong_cho: false` trong hook query, đồng thời nâng cấp ô tìm kiếm AutoComplete sử dụng API autocomplete động `/api/employees/autocomplete?q=...` từ server khi gõ thay vì load tĩnh 1000 bản ghi. <!-- Sửa theo EFR-10 -->
- [x] Task 2.3: Sửa test `probationReviewer.test.ts` để kiểm chứng chỉ có chính xác 1 dòng change history được ghi nhận cho trường `nguoi_nghiem_thu_thu_viec` (lấy baseline trước, assert exact diff = 1). <!-- Sửa theo EFR-03 -->
- [x] Task 2.4: Sửa test `employee.test.ts` để assert chắc chắn fixture nhân viên cũ với `state_phong_cho = true` tồn tại trong database trước khi assert xuất hiện ở danh sách. <!-- Sửa theo EFR-04 -->
- [x] Task 2.5: Viết script kiểm tra tĩnh `scripts/verify-fe-parameters.js` và tích hợp vào test script của package.json để chặn đứng việc commit code có chứa `state_phong_cho={false}` / `state_phong_cho: false` ở frontend. <!-- Sửa theo EFR-08 -->
- [x] Task 2.6: Tích hợp bước chạy `pnpm test:fe-verify` vào pipeline CI chính tại [.github/workflows/ci.yml](file:///d:/ToolNhanSuVcc/.github/workflows/ci.yml). <!-- Sửa theo EFR-11 -->
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Chạy `node scripts/verify-fe-parameters.js`, kiểm tra hiển thị song song và autocomplete trên web, chạy các file test backend)

## Phase 3: DB Local Restore Setup & Smoke Verify

**Mục tiêu:** Tạo script tự động hóa khôi phục database local từ file backup và chạy smoke test độc lập.

- [x] Task 3.1: Tạo script PowerShell [restore-local-db.ps1](file:///d:/ToolNhanSuVcc/scripts/restore-local-db.ps1) trong thư mục gốc với cơ chế `docker cp` (không dùng redirect `<`), kiểm tra exit code `$LASTEXITCODE` sau mỗi lệnh native, preflight check docker/container/backup, và quét tìm/reject file SQL chứa DDL tạo cấu trúc bảng (CREATE TABLE, etc.). <!-- Sửa theo EFR-01 & EFR-13 -->
- [x] Task 3.2: Tích hợp script vào mục scripts của [package.json](file:///d:/ToolNhanSuVcc/package.json).
- [x] Task 3.3: Thêm preflight check fail-fast để cảnh báo nếu file backup nằm trong vùng Git track chưa được ignore. <!-- Sửa theo EFR-02 -->
- [x] Task 3.4: Tạo script smoke-check `scripts/smoke-check-restore.js` để thực hiện smoke-level sanity check (kiểm tra kết nối DB, kiểm tra các bảng chính như employees không rỗng, kiểm tra triggers và session_replication_role được hoàn tác về origin, và verify sự tồn tại của sentinel test data thay vì check completeness tuyệt đối). <!-- Sửa theo EFR-09, EFR-14 & EFR-17 -->
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Chạy `pnpm db:restore` thành công, kiểm tra dữ liệu thật qua `node scripts/smoke-check-restore.js`, chạy toàn bộ unit tests và integration tests qua `test:integration:fresh` độc lập) <!-- Sửa theo EFR-06 & EFR-09 -->

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-28 21:35 | Phase 1-3 | Khởi tạo | Loại bỏ phần test cleanup theo yêu cầu của user | done | |
| 2026-07-28 21:58 | Phase 1-3 | Cập nhật theo EFR | Thêm các task bảo mật, sửa cú pháp script, kiểm thử regression và rollback | done | |
| 2026-07-28 22:08 | Phase 1-3 | Cập nhật theo EFR R2 | Sửa ignore path, thêm static check FE, smoke check restore độc lập và autocomplete động | done | |
| 2026-07-28 22:13 | Phase 1-3 | Cập nhật theo EFR R3 | Thêm CI workflow check, gỡ console.* trong autocomplete, lọc DDL và check data completeness | done | |
| 2026-07-28 22:25 | Phase 1 | Task 1.1 | Bắt đầu cấu hình `.gitignore` cho database_backups | start | |
| 2026-07-28 22:26 | Phase 1 | Task 1.1 | Hoàn tất cấu hình `.gitignore` | done | |
| 2026-07-28 22:26 | Phase 1 | Task 1.2 | Bắt đầu sửa hàm `updateProbationReviewer` trong `employeeService.ts` | start | |
| 2026-07-28 22:27 | Phase 1 | Task 1.2 | Hoàn thành sửa logic select và lọc changes | done | |
| 2026-07-28 22:27 | Phase 1 | Task 1.3 | Hoàn thành xóa debug log trong `searchAutocompleteEmployees` | done | |
| 2026-07-28 22:27 | Phase 1 | Task 1.Final | Bắt đầu chạy test local để verify Phase 1 | start | |
| 2026-07-28 22:35 | Phase 1 | Task 1.Final | Chạy test integration thành công (12/12 passed) | done | |
| 2026-07-28 22:36 | Phase 1 | Task 1.Final | User xác nhận OK, đóng Phase 1 | done | |
| 2026-07-28 22:36 | Phase 2 | Task 2.1 | Bắt đầu sửa `EmployeeListPage.tsx` loại bỏ `state_phong_cho={false}` | start | |
| 2026-07-28 22:37 | Phase 2 | Task 2.1 | Hoàn thành sửa `EmployeeListPage.tsx` | done | |
| 2026-07-28 22:37 | Phase 2 | Task 2.2 | Bắt đầu sửa `ReviewerManagement.tsx` | start | |
| 2026-07-28 22:38 | Phase 2 | Task 2.2 | Hoàn thành sửa `ReviewerManagement.tsx` | done | |
| 2026-07-28 22:38 | Phase 2 | Task 2.3 | Bắt đầu sửa test `probationReviewer.test.ts` | start | |
| 2026-07-28 22:38 | Phase 2 | Task 2.3 | Hoàn thành sửa test `probationReviewer.test.ts` | done | |
| 2026-07-28 22:38 | Phase 2 | Task 2.4 | Bắt đầu sửa test `employee.test.ts` | start | |
| 2026-07-28 22:39 | Phase 2 | Task 2.4 | Hoàn thành sửa test `employee.test.ts` | done | |
| 2026-07-28 22:39 | Phase 2 | Task 2.5 | Bắt đầu viết script kiểm tra tĩnh `verify-fe-parameters.js` | start | |
| 2026-07-28 22:39 | Phase 2 | Task 2.5 | Hoàn thành viết và cấu hình script kiểm tra tĩnh | done | |
| 2026-07-28 22:39 | Phase 2 | Task 2.6 | Hoàn thành tích hợp verify-fe-parameters vào CI | done | |
| 2026-07-28 22:39 | Phase 2 | Task 2.Final | Bắt đầu chạy test local verify Phase 2 | start | |
| 2026-07-28 22:43 | Phase 2 | Task 2.Final | Chạy test integration employee & probationReviewer thành công (31/31 passed) | done | |
| 2026-07-28 22:44 | Phase 2 | Task 2.Final | User xác nhận OK, đóng Phase 2 | done | |
| 2026-07-28 22:44 | Phase 3 | Task 3.1 | Bắt đầu viết/cập nhật script `restore-local-db.ps1` | start | |
| 2026-07-28 22:44 | Phase 3 | Task 3.1 | Hoàn thành viết script `restore-local-db.ps1` với DDL/git checks | done | |
| 2026-07-28 22:44 | Phase 3 | Task 3.2 | Tích hợp script restore vào package.json đã có sẵn | done | |
| 2026-07-28 22:44 | Phase 3 | Task 3.3 | Hoàn thành preflight check git-ignore trong script | done | |
| 2026-07-28 22:44 | Phase 3 | Task 3.4 | Bắt đầu tạo script `smoke-check-restore.js` | start | |
| 2026-07-28 22:45 | Phase 3 | Task 3.4 | Hoàn thành viết script `smoke-check-restore.js` | done | |
| 2026-07-28 22:45 | Phase 3 | Task 3.Final | Bắt đầu chạy verify Phase 3 | start | |
| 2026-07-28 22:46 | Phase 3 | Task 3.Final | Chạy db:restore và smoke check thành công, verify 143/143 integration tests passed | done | |
| 2026-07-28 22:50 | Phase 3 | Task 3.Final | Hoàn tất feature `fix-audit-history-and-test-cleanup` | done | |
