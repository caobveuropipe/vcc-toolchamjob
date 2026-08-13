## Round 1 - 2026-07-28T21:58:00+07:00
### Tổng kết
- EFR: 6 (accepted: 6, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `FEATURE_PLAN.md`
  - `FEATURE_TASKS.md`
  - `scripts/restore-local-db.ps1:1-76` (PowerShell syntax error verification)
  - `backend/src/services/employeeService.ts:694-760` (employeeService logic verification)
  - `backend/src/services/changeHistoryService.ts:28-56` (diff logic verification)
  - `backend/src/__tests__/integration/probationReviewer.test.ts:80-130` (test query check)
  - `backend/src/__tests__/integration/employee.test.ts:355-390` (pending room filter test verification)
  - `.gitignore:1-40` (unignored backup folder check)

### EFR Đã Chấp Nhận -> [EFR-01]: Thiết kế restore hiện tại không thực thi được và chưa fail-safe | Sửa: Cập nhật plan và tasks để sửa lỗi cú pháp PowerShell, thêm preflight check, kiểm tra exit code `$LASTEXITCODE`, sử dụng `docker cp` thay cho redirect `<` pipeline lỗi, và thêm verification kiểm tra kết quả sau restore.
### EFR Đã Chấp Nhận -> [EFR-02]: Backup dữ liệu thật chưa được bảo vệ khỏi commit và rò rỉ PII | Sửa: Thêm `.gitignore` rules để ignore thư mục `database_backups/` và định dạng `*.backup`, `*.sql` nhằm ngăn ngừa việc sơ suất commit dữ liệu PII của nhân sự. Bổ sung task preflight check fail-fast để cảnh báo nếu file backup bị Git tracking.
### EFR Đã Chấp Nhận -> [EFR-03]: Test lịch sử thay đổi không chứng minh AC “chỉ đúng một dòng” | Sửa: Thêm task viết lại test `probationReviewer.test.ts` để so sánh với baseline trước update và kiểm tra exact count của new history record bằng 1 (chỉ field `nguoi_nghiem_thu_thu_viec` được update).
### EFR Đã Chấp Nhận -> [EFR-04]: Test visibility hiện tại không bắt được regression từ frontend | Sửa: Thêm task cập nhật test `employee.test.ts` để assert sự tồn tại của fixture nhân sự cũ có `state_phong_cho = true`, đảm bảo kiểm thử không trả về mảng rỗng và pass false positive.
### EFR Đã Chấp Nhận -> [EFR-05]: Giải pháp `.select('*')` rộng hơn contract của route chuyên biệt | Sửa: Thêm task trong Phase 1 để lọc kết quả `diffEmployeeFields` chỉ lấy thay đổi của cột `nguoi_nghiem_thu_thu_viec`, giải quyết triệt để rủi ro ghi nhận sai do các trường đồng thời khác.
### EFR Đã Chấp Nhận -> [EFR-06]: Gate kiểm thử và rollback chưa khớp acceptance | Sửa: Cập nhật Acceptance Criteria và Test Strategy bắt buộc chạy toàn bộ backend suite (gồm cả unit tests và integration tests), đồng thời định nghĩa rollback DB local bằng `npx supabase db reset` và kiểm tra sức khỏe schema.

### EFR Đã Bác Bỏ -> Không có.
### EFR Chưa Kết Luận -> Không có.
### Phát Hiện Bổ Sung -> Không có.
### Vùng đã scan khi không có SFR -> `backend/src/services/employeeService.ts:694-760` (đã kiểm tra logic update và các permission), `frontend/src/pages/Employees/EmployeeListPage.tsx` (kiểm tra prop passing).

## Round 2 - 2026-07-28T22:08:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `FEATURE_PLAN.md`
  - `FEATURE_TASKS.md`
  - `frontend/package.json` (kiểm tra scripts test và dependencies)
  - `frontend/src/pages/Admin/tabs/ReviewerManagement.tsx:20-230` (kiểm tra options gán reviewer và autocomplete)

### EFR Đã Chấp Nhận -> [EFR-07]: Rule ignore `*.sql` toàn repo sẽ che mất migration mới | Sửa: Giới hạn phạm vi ignore trong `.gitignore` chỉ dành riêng cho thư mục backup `database_backups/` và các file dump/sql bên trong nó; không ignore `*.sql` toàn cục.
### EFR Đã Chấp Nhận -> [EFR-08]: Closure của regression frontend vẫn chỉ được kiểm tra ở backend | Sửa: Thêm task viết script kiểm tra tĩnh `scripts/verify-fe-parameters.js` để quét regex ngăn code frontend đưa vào `state_phong_cho={false}` hoặc `state_phong_cho: false`. Tích hợp check này vào script test/lint của dự án.
### EFR Đã Chấp Nhận -> [EFR-09]: Lệnh “toàn bộ suite” không chạy integration và restore-data không phải test harness deterministic | Sửa: Tách biệt rõ ràng 2 gate: test suite regression của backend (chạy `test` và `test:integration:fresh` để reset DB tự động và seed test data sạch của vitest harness) và verify script restore (chạy `smoke-check-restore.js` sau khi chạy `pnpm db:restore` để smoke test DB thật đã restore mà không reset/xóa DB).
### EFR Đã Chấp Nhận -> [EFR-10]: Reviewer Management vẫn chỉ tải 1.000 nhân sự dù plan tuyên bố lấy đầy đủ | Sửa: Chuyển đổi AutoComplete tìm kiếm nhân sự của màn hình `ReviewerManagement.tsx` sang gọi API autocomplete động trên server `/api/employees/autocomplete?q=...` khi người dùng gõ vào, loại bỏ giới hạn fetch cứng 1000 records trên client.

### EFR Đã Bác Bỏ -> Không có.
### EFR Chưa Kết Luận -> Không có.
### Phát Hiện Bổ Sung -> Không có.
### Vùng đã scan khi không có SFR -> `frontend/src/pages/Admin/tabs/ReviewerManagement.tsx:20-60` (xác minh options suggestions), `frontend/package.json:1-47` (xác minh test tools).

## Round 3 - 2026-07-28T22:13:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `FEATURE_PLAN.md`
  - `FEATURE_TASKS.md`
  - `.github/workflows/ci.yml:1-60` (kiểm tra steps chạy test/lint)

### EFR Đã Chấp Nhận -> [EFR-11]: Static frontend guard chưa được nối vào CI nên không thể “chặn commit” | Sửa: Thêm `.github/workflows/ci.yml` vào affected files/tasks và tích hợp bước chạy `pnpm test:fe-verify` vào pipeline CI chính.
### EFR Đã Chấp Nhận -> [EFR-12]: Autocomplete động sẽ ghi raw truy vấn nhân sự bằng `console.*` | Sửa: Thêm task Phase 1 loại bỏ toàn bộ debug log `console.*` trong hàm `searchAutocompleteEmployees` để tránh rò rỉ dữ liệu nhạy cảm nhân sự.
### EFR Đã Chấp Nhận -> [EFR-13]: Contract `.sql` chưa phân biệt data-only dump với full-schema dump | Sửa: Ràng buộc chỉ hỗ trợ restore SQL dạng data-only và thêm preflight check trong script restore để reject các file SQL có chứa lệnh DDL (CREATE TABLE, etc.).
### EFR Đã Chấp Nhận -> [EFR-14]: Smoke check chưa có tiêu chí chứng minh dữ liệu được restore “đầy đủ” | Sửa: Định nghĩa rõ các asserts của smoke check (đảm bảo records > 100, verify test sentinel, và kiểm tra triggers rollback về origin).

### EFR Đã Bác Bỏ -> Không có.
### EFR Chưa Kết Luận -> Không có.
### Phát Hiện Bổ Sung -> Không có.
### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-115`, `FEATURE_TASKS.md:1-55`.

## Round 4 - 2026-07-28T22:17:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `FEATURE_PLAN.md`
  - `FEATURE_TASKS.md`

### EFR Đã Chấp Nhận -> [EFR-15]: `FEATURE_PLAN.md` bị cắt hỏng giữa Section 3 và Section 5 | Sửa: Khôi phục đầy đủ nội dung Section 3 & Section 4 và sửa lại các heading ngăn nắp trong `FEATURE_PLAN.md`.
### EFR Đã Chấp Nhận -> [EFR-16]: Acceptance và affected files round 3 chưa được map xuống `FEATURE_TASKS.md` | Sửa: Thêm các task cụ thể cho `.github/workflows/ci.yml` (Task 2.6), loại bỏ log autocomplete (Task 1.3), quét DDL SQL (Task 3.1) và chi tiết hóa các asserts trong smoke check (Task 3.4).
### EFR Đã Chấp Nhận -> [EFR-17]: Điều kiện `employees > 100` vừa false-pass vừa false-fail cho completeness | Sửa: Chuyển đổi Acceptance và Task 3.4 từ cam kết completeness sang mức độ smoke-level sanity check để kiểm chứng các yếu tố quan trọng (connection, tables, role reset, sentinel data) một cách an toàn và hợp lý.

### EFR Đã Bác Bỏ -> Không có.
### EFR Chưa Kết Luận -> Không có.
### Phát Hiện Bổ Sung -> Không có.
### Vùng đã scan khi không có SFR -> `FEATURE_PLAN.md:1-115`, `FEATURE_TASKS.md:1-55`.
