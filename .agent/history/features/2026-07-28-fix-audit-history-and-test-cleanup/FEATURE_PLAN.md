# Feature Plan: Sửa lỗi ghi log lịch sử và sửa lỗi hiển thị danh sách nhân sự

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Đã hội tụ qua 4 vòng expert-rebuttal.
> **Feature slug**: fix-audit-history-and-test-cleanup
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-28

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** 
  - Hệ thống ghi nhận lịch sử thay đổi thông tin nhân viên (`change_history`) bị ghi rác diện rộng (15+ cột thay đổi từ `null` sang giá trị hiện tại) mỗi khi cập nhật Người nghiệm thu thử việc trực tiếp ở màn hình chính.
  - Phát hiện thêm lỗi Frontend đang ép lọc cứng `state_phong_cho = false` tại màn hình Danh sách chính, dẫn đến nhân sự cũ đang chờ duyệt bị ẩn khỏi màn hình chính (trái với cam kết hiển thị song song của commit [81dc90c](file:///d:/ToolNhanSuVcc#81dc90c)).
  - Cần một giải pháp chính quy, an toàn để nạp dữ liệu thật vào Supabase Docker Local phục vụ kiểm thử và debug lỗi phát sinh mà không đụng chạm đến database Cloud.
- **Vấn đề cần giải quyết:**
  - Hàm `updateProbationReviewer` query bản ghi cũ (`oldRow`) nhưng giới hạn select 5 trường, dẫn đến so sánh lệch với `newRow` (lấy tất cả trường) trong hàm `diffEmployeeFields`.
  - Frontend `EmployeeListPage.tsx` và `ReviewerManagement.tsx` đang truyền cứng `state_phong_cho={false}` / `state_phong_cho: false`, triệt tiêu tính năng tự động lọc thông minh `exclude_pending_new_hires` của Backend.
  - Việc restore dữ liệu thật thủ công dễ bị chặn bởi Triggers, RLS, và khóa ngoại (Foreign Key).
- **Mục tiêu:**
  - Sửa lỗi ghi log rác trong `updateProbationReviewer`.
  - Sửa Frontend để khôi phục cơ chế hiển thị song song (nhân sự cũ đang pending vẫn hiển thị ở danh sách chính thức).
  - Tự động hóa quy trình dọn sạch và nạp lại dữ liệu thật từ bản backup mới nhất (hoặc bản được chỉ định) vào database local Docker chỉ bằng 1 lệnh duy nhất.
- **Kết quả mong đợi:**
  - Chỉ ghi nhận đúng thay đổi của trường `nguoi_nghiem_thu_thu_viec` trong `change_history` khi cập nhật qua route trực tiếp.
  - Nhân sự cũ đang pending (như `111320`) hiển thị song song ở cả hai màn hình chính và phòng chờ.
  - Chạy `pnpm db:restore` tự động quét tìm bản backup (.backup / .sql) mới nhất trong thư mục `database_backups` để khôi phục sạch sẽ trên môi trường local.


## 2. Phạm vi

### In scope
- Sửa hàm `updateProbationReviewer` trong [employeeService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/employeeService.ts).
- Sửa `EmployeeListPage.tsx` và `ReviewerManagement.tsx` để bỏ ép lọc cứng `state_phong_cho={false}`.
- Tạo script PowerShell tự động hóa khôi phục database local [restore-local-db.ps1](file:///d:/ToolNhanSuVcc/scripts/restore-local-db.ps1) và tích hợp vào [package.json](file:///d:/ToolNhanSuVcc/package.json).
- Chạy integration tests để xác minh tính đúng đắn.

### Out of scope
- Cập nhật thủ công database production (đã do Admin chạy tay bằng SQL).
- Thay đổi cấu trúc hay cơ chế của hàm so sánh `diffEmployeeFields`.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** 
  - *Salary Isolation*: Giữ nguyên cơ chế cách ly lương và các PII fields.
  - *Exclude Pending New Hires*: Sử dụng lại cơ chế `exclude_pending_new_hires = true` của Backend để lọc tự động nhân viên `TMP` (dựa trên mã `TMP%`), đồng bộ logic với phân loại bằng `document_type = 'tuyen_moi'` ở tầng Database chốt Snapshot.
- **"Cấm kỵ" cần tránh:** 
  - Không được phép sửa file schema gốc hay viết thêm database migration mới cho việc sửa lỗi logic code này.
  - Không chạy lệnh test trực tiếp trên Cloud (sử dụng local Docker harness).

## 4. Giả định và câu hỏi mở

### Giả định
- Việc select toàn bộ các trường của `employees` ở hàm `updateProbationReviewer` không gây bottleneck hiệu năng vì truy vấn theo primary key (`ma_nhan_su` độc bản) trả về 1 dòng duy nhất.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Khi cập nhật Người nghiệm thu thử việc trực tiếp qua API, bảng `change_history` chỉ sinh tối đa 1 dòng thay đổi cho cột `nguoi_nghiem_thu_thu_viec`. <!-- Sửa theo EFR-03 & EFR-05: Lọc history chính xác và bổ sung test assert 1 row, không ghi rác -->
- [ ] Nhân sự cũ đang có pending changes (như `111320` có `state_phong_cho = true`) xuất hiện đồng thời ở cả màn hình Danh sách chính và màn hình Phòng chờ. <!-- Sửa theo EFR-04: Bổ sung assert fixture tồn tại để test không bị pass rỗng -->
- [ ] Lệnh `pnpm db:restore` tự động dọn sạch database local, nạp lại migration mới nhất và khôi phục thành công dữ liệu từ file backup mà không ném lỗi trigger/khóa ngoại. <!-- Sửa theo EFR-01: Sửa lỗi cú pháp PowerShell, thêm preflight check, kiểm tra exit code và kiểm chứng sau restore -->
- [ ] Bất kỳ nhân viên nào trong database (kể cả vượt quá 1000 bản ghi) đều có thể được tìm thấy và gán trong selector Reviewer Management thông qua API Autocomplete động. <!-- Sửa theo EFR-10: Chuyển sang Autocomplete động trên Server -->
- [ ] Kiểm thử tự động (Static/AST Check) ở Frontend được chạy tự động trong CI workflow (`ci.yml`) để ngăn ngừa việc đưa lại `state_phong_cho=false` vào mã nguồn. <!-- Sửa theo EFR-08 & EFR-11: Tích hợp static check vào CI workflow -->
- [ ] API Autocomplete không log raw query PII và không sử dụng `console.*` (tuân thủ logging contract của dự án). <!-- Sửa theo EFR-12: Loại bỏ debug log thô -->
- [ ] Script restore chỉ hỗ trợ file backup SQL dạng data-only (không chứa DDL cấu trúc), và tự động chặn (reject) các file SQL có chứa lệnh tạo cấu trúc. <!-- Sửa theo EFR-13: Chốt DDL preflight check -->
- [ ] Script `smoke-check-restore.js` chạy sau restore để thực hiện smoke test kiểm chứng cơ bản (kiểm tra kết nối DB, kiểm tra schema và đảm bảo các bảng chính như `employees` không trống, kiểm tra trạng thái session_replication_role trở lại `origin`, và check tồn tại của dữ liệu mẫu/test sentinel thay vì cam kết completeness). <!-- Sửa theo EFR-14 & EFR-17: Đổi thành smoke-level sanity check -->
- [ ] 100% test suite trong `backend` chạy pass thành công trên local, chạy integration trên Fresh test harness riêng, và restore DB được verify bằng smoke-test độc lập. <!-- Sửa theo EFR-06 & EFR-09 -->

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/services/employeeService.ts` | Sửa | Nâng cấp câu lệnh `.select(...)` của `oldRow` thành `.select('*')` trong hàm `updateProbationReviewer` và lọc diff kết quả chỉ lấy `nguoi_nghiem_thu_thu_viec` (EFR-05). Đồng thời xóa bỏ toàn bộ `console.*` và raw query logging trong `searchAutocompleteEmployees` (EFR-12). | 🟢 Thấp | Có |
| `frontend/src/pages/Employees/EmployeeListPage.tsx` | Sửa | Bỏ `state_phong_cho={false}` truyền vào `EmployeeTable` để API sử dụng cơ chế `exclude_pending_new_hires` mặc định của BE. | 🟢 Thấp | Không |
| `frontend/src/pages/Admin/tabs/ReviewerManagement.tsx` | Sửa | Bỏ `state_phong_cho: false` khi gọi `useEmployeeList` và chuyển ô tìm kiếm AutoComplete sang gọi API autocomplete động `/api/employees/autocomplete` trên server. <!-- Sửa theo EFR-10 --> | 🟢 Thấp | Không |
| `scripts/restore-local-db.ps1` | [NEW] | Tạo script tự động hóa khôi phục database local từ file backup nhị phân hoặc SQL. Hỗ trợ kiểm tra preflight DDL để reject full-schema dump. <!-- Sửa theo EFR-01 & EFR-13 --> | 🟢 Thấp | Không |
| `scripts/verify-fe-parameters.js` | [NEW] | Tạo script kiểm tra tĩnh (Static RegEx/AST Check) ngăn ngừa `state_phong_cho=false` ở frontend. <!-- Sửa theo EFR-08 --> | 🟢 Thấp | Không |
| `scripts/smoke-check-restore.js` | [NEW] | Tạo script chạy smoke-test xác minh dữ liệu đã restore đầy đủ (counts, sentinels, roles) mà không làm reset DB. <!-- Sửa theo EFR-09 & EFR-14 --> | 🟢 Thấp | Không |
| `package.json` | Sửa | Khai báo shortcut lệnh `"db:restore"`, `"test:fe-verify"`. | 🟢 Thấp | Không |
| `.gitignore` | Sửa | Ignore thư mục `database_backups/` và định dạng `*.backup`, và các file SQL chỉ bên trong `database_backups/` để chống rò rỉ dữ liệu PII mà không làm che mất migration mới. <!-- Sửa theo EFR-07 --> | 🟢 Thấp | Không |
| `.github/workflows/ci.yml` | Sửa | Tích hợp bước chạy `pnpm test:fe-verify` vào pipeline CI chính để bảo đảm chặn commit lỗi frontend. <!-- Sửa theo EFR-11 --> | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Rủi ro lộ dữ liệu nhạy cảm qua backup (EFR-02) và rủi ro script restore gây lỗi môi trường local (EFR-01).
- **Review focus areas:** Đảm bảo các test case hoạt động trên Fresh harness và smoke check DB được restore chạy thành công.
- **Known pitfalls / historical issues:** Tránh việc dùng wildcard hoặc lọc diện rộng trên Supabase client khi bypass RLS.
- **Dependencies / rollout concerns:** Không yêu cầu migration hay biến môi trường mới.

## 8. Chiến lược triển khai

- **Phase strategy:** Triển khai theo 3 phase nhỏ:
  - **Phase 1 (Backend Bug Fix & Protection)**: Sửa log rác và xóa `console.*` trong `employeeService.ts` (EFR-05 & EFR-12), bảo vệ dữ liệu backup bằng `.gitignore` đúng phạm vi (EFR-07), tích hợp static check FE vào CI `ci.yml` (EFR-11).
  - **Phase 2 (Frontend Visibility, Autocomplete & Tests)**: Khôi phục hiển thị song song ở FE, tích hợp API autocomplete động cho Reviewer Management (EFR-10), viết các script verify tĩnh FE (EFR-08) và cập nhật các file test.
  - **Phase 3 (DB Local Restore Setup & Smoke Verify)**: Xây dựng công cụ nạp dữ liệu thật cho môi trường test local (chỉ hỗ trợ data-only dump) và script smoke check chi tiết (EFR-09, EFR-13, EFR-14).
- **Thứ tự triển khai:**
  1. Thêm cấu hình ignore backup vào `.gitignore`.
  2. Cập nhật Backend service `employeeService.ts` (sửa log rác & dọn `console.*`).
  3. Cập nhật cấu hình CI `.github/workflows/ci.yml`.
  4. Cập nhật Frontend files (`EmployeeListPage.tsx`, `ReviewerManagement.tsx`).
  5. Tạo script `scripts/verify-fe-parameters.js` và cấu hình test script.
  6. Cập nhật các file test `probationReviewer.test.ts` và `employee.test.ts`.
  7. Tạo script `restore-local-db.ps1` (có check DDL) và `scripts/smoke-check-restore.js` (kiểm tra rows, sentinels, roles).
  8. Chạy test suite và smoke check verify.

## 9. Test Strategy

- **Automated tests:** 
  - Chạy `pnpm --filter backend test` để chạy backend unit tests.
  - Chạy `pnpm --filter backend test:integration:fresh` để chạy backend integration tests trên Fresh Database harness riêng (EFR-09).
  - Chạy `node scripts/verify-fe-parameters.js` để kiểm tra tĩnh code frontend (EFR-08).
- **Manual verification & Smoke test:**
  - Chạy `pnpm db:restore` xem dữ liệu thật được nạp đầy đủ vào local DB.
  - Chạy `node scripts/smoke-check-restore.js` để kiểm chứng dữ liệu đã được khôi phục thành công và đầy đủ (EFR-09 & EFR-14).

## 10. Rollback Plan

- Hoàn tác mã nguồn thông qua `git checkout`.
- Trong trường hợp restore DB local bị lỗi giữa chừng, thực hiện reset DB local về trạng thái ban đầu sạch sẽ bằng lệnh `npx supabase db reset` và xác minh health/schema (EFR-06).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
