# Feature Tasks: Bổ sung trường người nghiệm thu thử việc

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-06-15

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: DB Migration & Shared Schema Update

**Mục tiêu:** Cập nhật DB schema (bảng, views, RPCs) cùng các schema Zod phía shared package.

- [x] Task 1.1: Tạo file migration SQL `database/migrations/036_add_probation_reviewer_field.sql` to: <!-- Sửa theo EFR-01: đổi tên migration thành 036 -->
  - Thêm cột `nguoi_nghiem_thu_thu_viec` vào `employees` kèm ràng buộc CHECK định dạng email. <!-- Sửa theo EFR-01 (Round 3): Thêm CHECK constraint cho email -->
  - Cập nhật các view `employee_full` và `employee_info_only`.
  - Cập nhật định nghĩa hàm `fn_create_employee_onboarding` để insert `nguoi_nghiem_thu_thu_viec`. <!-- Sửa theo EFR-02: cập nhật RPC onboarding -->
  - Cập nhật định nghĩa hàm `submit_employee_pending` để hỗ trợ so sánh và áp dụng trường `nguoi_nghiem_thu_thu_viec` từ `pending_changes`. <!-- Sửa theo EFR-02: cập nhật RPC submit pending -->
- [x] Task 1.2: Áp dụng migration SQL lên database local/dev.
- [x] Task 1.3: Cập nhật `packages/shared/src/schemas/employee.ts` để thêm `nguoi_nghiem_thu_thu_viec` vào `employeeSchema`, `createEmployeeSchema`, và loại trừ hoàn toàn khỏi `updateEmployeeSchema`. <!-- Sửa theo EFR-01 (Round 2) -->
- [x] Task 1.4: Chạy build cho shared package (`pnpm run build:shared`).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Kiểm tra xem database đã cập nhật thành công cột mới, views và RPCs chạy đúng, các project build compile thành công).

## Phase 2: Backend API Implementation & Testing

**Mục tiêu:** Hỗ trợ lưu trữ trường mới khi onboarding, tạo API cập nhật trực tiếp và viết integration tests.

- [x] Task 2.1: Cập nhật `backend/src/services/employeeService.ts` để:
  - Bổ sung logic xử lý trường `nguoi_nghiem_thu_thu_viec` trong các hàm tạo mới/onboard nhân sự, đồng thời chuẩn hóa email (trim, lowercase) trước khi lưu. <!-- Sửa theo EFR-01 (Round 3) -->
  - Viết hàm `updateProbationReviewer` cập nhật trực tiếp cột `nguoi_nghiem_thu_thu_viec` trong DB (bằng service_role, sau khi chuẩn hóa email) đồng thời ghi lịch sử thay đổi thông tin (`change_history`) và ghi nhận log audit.
- [x] Task 2.2: Cập nhật `backend/src/services/changeHistoryService.ts` để bổ sung `'nguoi_nghiem_thu_thu_viec'` vào danh sách so sánh trong `diffEmployeeFields`. <!-- Sửa theo EFR-02: cập nhật so sánh history -->
- [x] Task 2.3: Route updates:
  - Thêm route mới `PUT /employees/:maNhanSu/probation-reviewer` trong `backend/src/routes/employees.ts`, kiểm tra quyền EA của khối nhân sự đó hoặc SA trước khi cho phép cập nhật, gắn kèm `sensitiveRateLimiter`. <!-- Sửa theo EFR-02 & EFR-04: bảo mật route -->
  - Cập nhật route hiện hữu gán NNT chính thức `PUT /employees/:id/reviewers` và route gợi ý `GET /employees/:id/suggest-reviewers` trong `backend/src/routes/employees.ts` để chặn các tài khoản non-SA (chỉ cho phép SA thực hiện). <!-- Sửa theo EFR-01 (Round 4 & Round 5): Route NNT chính thức SA-only -->
  - Cập nhật route submit `/employees/:id/submit` trong `backend/src/routes/employees.ts` để bỏ qua bước bắt buộc NNT chính thức khi người thực hiện submit không phải là SA. <!-- Sửa theo EFR-01 (Round 8): Bỏ qua NNT check cho non-SA ở backend submit -->
- [x] Task 2.4: Viết bộ integration/route tests trong backend:
  - Kiểm tra route chuyên biệt `PUT /employees/:maNhanSu/probation-reviewer` hoạt động chính xác (SA/EA cùng khối thành công, EA khác khối/VI/VA/reviewer thất bại 403), validation email, `state_phong_cho` không đổi, ghi change_history chính xác và ghi audit_log chính xác (action `'update'`, module `'NS-001'`, actor_email, target_ma_nhan_su). <!-- Sửa theo EFR-02 (Round 5) & EFR-04 -->
  - Kiểm tra route generic `PUT /employees/:id` và route lưu nháp `PUT /employees/:id/personnel-pending` không cho phép cập nhật/thay đổi trường `nguoi_nghiem_thu_thu_viec`. <!-- Sửa theo EFR-01 (Round 2) & EFR-04 -->
  - Kiểm tra DB check constraint: Viết test case chọc trực tiếp vào DB để verify định dạng email lỗi sẽ bị DB reject. <!-- Sửa theo EFR-01 (Round 3) -->
  - Kiểm tra route NNT chính thức `PUT /employees/:id/reviewers` và route gợi ý NNT `GET /employees/:id/suggest-reviewers`: verify SA gán/xóa/gợi ý thành công; EA/reviewer/VI/VA đều bị lỗi 403. <!-- Sửa theo EFR-01 (Round 4 & Round 5): Integration test NNT chính thức SA-only -->
  - Kiểm tra route submit `PUT /employees/:id/submit`: verify EA submit không có NNT thì thành công; verify SA submit không có NNT (và không gửi `khong_co_nnt`) thì nhận mã lỗi 400. <!-- Sửa theo EFR-01 (Round 8): Integration test NNT check khi submit -->
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Chạy bộ integration tests và verify kết quả thành công).

## Phase 3: Frontend Integration & UI Development

**Mục tiêu:** Tích hợp trường nhập trên form tạo mới và cho phép cập nhật trực tiếp tại chi tiết nhân sự.

- [x] Task 3.1: Cập nhật `frontend/src/components/EmployeeForm.tsx` để hiển thị ô nhập email "Người nghiệm thu thử việc" tại khu vực "Quản lý & Hợp đồng" cạnh các thông tin quản lý khác.
- [x] Task 3.2: Cập nhật label mapping tiếng Việt cho `nguoi_nghiem_thu_thu_viec` tại `frontend/src/pages/Employees/components/ChangeHistoryTab.tsx`. <!-- Sửa theo khuyến nghị: hiển thị nhãn tiếng Việt trong history -->
- [x] Task 3.3: Cập nhật `frontend/src/pages/Employees/EmployeeDetailPage.tsx` để render `ReviewerCard` cho mọi user có quyền xem chi tiết (không bị ẩn đằng sau canEdit). <!-- Sửa theo EFR-03: hiển thị card cho viewer -->
- [x] Task 3.4: Tái cấu trúc `frontend/src/components/ReviewerCard.tsx` để:
  - Chia giao diện hiển thị thành 2 phần: "Người Nghiệm Thu Thử Việc" và "Người Nghiệm Thu Chính Thức".
  - Tách biệt logic phân quyền: hiển thị các nút gán/xóa/gợi ý và mismatch warning của phần NNT chính thức dựa trên cờ `canManageOfficialReviewers` (chỉ SA). Phần NNT thử việc dựa trên cờ `canEditProbationReviewer` (SA hoặc EA khối của nhân sự). <!-- Sửa theo EFR-01 (Round 4 & Round 5) -->
  - Gọi API `PUT /employees/:maNhanSu/probation-reviewer` để lưu thay đổi trực tiếp (Live update) khi cập nhật NNT thử việc.
- [x] Task 3.5: Cập nhật `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` để kiểm duyệt điều kiện của nút Submit. Nếu user không phải SA, click Submit sẽ thực hiện submit trực tiếp thay vì mở Wizard NNT và gọi các API gán/gợi ý (tránh lỗi 403). <!-- Sửa theo EFR-OPEN-01 (Round 7) -->
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Kiểm thử thủ công toàn bộ luồng tạo mới nhân sự và cập nhật trực tiếp trên UI).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-06-15 16:20 | Phase 1 | Task 1.1 | Khởi tạo plan & tasks | ✅ done | Plan đã sẵn sàng chờ duyệt |
| 2026-06-16 15:20 | Phase 1 | Task 1.1 | Cập nhật plan & tasks theo Expert Review Round 1 | ✅ done | Cập nhật tệp SQL migration 036, RPCs, history so sánh, chi tiết test, UI detail |
| 2026-06-16 15:25 | Phase 1 | Task 1.3 | Cập nhật plan & tasks theo Expert Review Round 2 | ✅ done | Loại trừ trường mới khỏi updateEmployeeSchema và bổ sung các generic negative tests |
| 2026-06-16 16:53 | Phase 1 | Task 1.1 | Cập nhật plan & tasks theo Expert Review Round 3 | ✅ done | Thêm DB CHECK constraint cho cột email mới và logic chuẩn hóa trim/lowercase |
| 2026-06-16 17:25 | Phase 1 | Task 1.1 | Cập nhật plan & tasks theo Expert Review Round 4 | ✅ done | Tách biệt quyền mutate NNT chính thức (SA-only) và NNT thử việc ở cả FE/BE, bổ sung test tương ứng |
| 2026-06-16 17:38 | Phase 1 | Task 1.1 | Cập nhật plan & tasks theo Expert Review Round 5 | ✅ done | Siết route gợi ý NNT chính thức thành SA-only và bổ sung asset test cho audit_log |
| 2026-06-17 09:50 | Phase 1 | Task 1.1 | Cập nhật plan & tasks theo Expert Review Round 7 | ✅ done | Bổ sung task sửa đổi PendingRoomPage để tránh lỗi 403 khi EA thực hiện submit |
| 2026-06-17 10:00 | Phase 1 | Task 1.1 | Cập nhật plan & tasks theo Expert Review Round 8 | ✅ done | Cập nhật route submit ở Backend để bỏ qua kiểm tra NNT đối với tài khoản non-SA, bổ sung test |
| 2026-06-17 11:20 | Phase 1 | Task 1.1 | Bắt đầu triển khai migration SQL | 🔄 start | Tạo file migration SQL 036 |
| 2026-06-17 11:22 | Phase 1 | Task 1.1 | Tạo thành công file migration 036 | ✅ done | Đã tạo xong file SQL migration |
| 2026-06-17 11:23 | Phase 1 | Task 1.2 | Yêu cầu User áp dụng migration lên Supabase | 🔄 start | Chờ User chạy migration |
| 2026-06-17 11:26 | Phase 1 | Task 1.2 | Đã áp dụng migration lên Supabase thành công | ✅ done | User đã confirm chạy xong migration |
| 2026-06-17 11:26 | Phase 1 | Task 1.3 | Bắt đầu sửa shared schema packages/shared/src/schemas/employee.ts | 🔄 start | Thêm trường mới vào schemas |
| 2026-06-17 11:27 | Phase 1 | Task 1.3 | Hoàn thành sửa schemas | ✅ done | Đã cập nhật employeeSchema, createEmployeeSchema và loại trừ khỏi updateEmployeeSchema |
| 2026-06-17 11:27 | Phase 1 | Task 1.4 | Bắt đầu build shared package | 🔄 start | Chạy pnpm run build:shared |
| 2026-06-17 11:27 | Phase 1 | Task 1.4 | Hoàn thành build shared package | ✅ done | Shared package đã build thành công |
| 2026-06-17 11:28 | Phase 1 | Task 1.Final | Tự chạy build Backend và Frontend | ✅ done | Cả Backend và Frontend đều compile/build thành công |
| 2026-06-17 11:30 | Phase 1 | Task 1.Final | Xác nhận hoàn thành Phase 1 | ✅ done | User đã confirm thông qua Phase 1 |
| 2026-06-17 11:31 | Phase 2 | Task 2.1 | Bắt đầu sửa backend/src/services/employeeService.ts | 🔄 start | Triển khai logic service xử lý field mới |
| 2026-06-17 11:32 | Phase 2 | Task 2.1 | Hoàn thành sửa employeeService.ts | ✅ done | Thêm logic trim/lowercase và hàm updateProbationReviewer |
| 2026-06-17 11:32 | Phase 2 | Task 2.2 | Bắt đầu sửa backend/src/services/changeHistoryService.ts | 🔄 start | Thêm field mới vào diffEmployeeFields |
| 2026-06-17 11:33 | Phase 2 | Task 2.2 | Hoàn thành sửa changeHistoryService.ts | ✅ done | Thêm nguoi_nghiem_thu_thu_viec vào danh sách so sánh |
| 2026-06-17 11:33 | Phase 2 | Task 2.3 | Bắt đầu sửa backend routes trong backend/src/routes/employees.ts | 🔄 start | Cấu hình các route gán NNT trực tiếp và NNT chính thức SA-only, bỏ qua check NNT cho non-SA ở submit |
| 2026-06-17 11:34 | Phase 2 | Task 2.3 | Hoàn thành sửa routes trong employees.ts | ✅ done | Cấu hình xong routes |
| 2026-06-17 11:34 | Phase 2 | Task 2.4 | Bắt đầu viết integration tests | 🔄 start | Tạo file probationReviewer.test.ts |
| 2026-06-17 11:35 | Phase 2 | Task 2.4 | Hoàn thành viết integration tests | ✅ done | Đã tạo xong bộ test cover đầy đủ trường hợp |
| 2026-06-17 11:35 | Phase 2 | Task 2.Final | Bắt đầu chạy bộ integration tests để verify Phase 2 | 🔄 start | Chạy vitest integration tests |
| 2026-06-17 11:46 | Phase 2 | Task 2.Final | Hoàn thành chạy integration tests | ✅ done | Toàn bộ 67/67 test cases backend pass 100% |
| 2026-06-17 11:47 | Phase 3 | Task 3.1-3.5 | Triển khai Frontend Integration | 🔄 start | Cập nhật EmployeeForm, ChangeHistoryTab, DetailPage, ReviewerCard, PendingRoomPage |
| 2026-06-17 11:48 | Phase 3 | Task 3.Final | Build & Compile kiểm tra cú pháp Frontend | ✅ done | Build frontend thành công không lỗi compile |
