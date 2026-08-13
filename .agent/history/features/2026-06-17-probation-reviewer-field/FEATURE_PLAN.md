# Feature Plan: Bổ sung trường người nghiệm thu thử việc

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Khuyến nghị gọi `feature-review` để rà soát logic phân quyền và luồng cập nhật trực tiếp (Live update) trường `nguoi_nghiem_thu_thu_viec` của EA khối.
> **Feature slug**: `probation-reviewer-field`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-06-15

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại hệ thống đã có quy trình Đánh giá thử việc và có Người nghiệm thu (NNT) chính thức (được quản lý riêng bởi Super Admin trong bảng `employee_reviewers`). Tuy nhiên, trong thời gian thử việc, cần có một vị trí Người nghiệm thu thử việc riêng để theo dõi quá trình thử việc của nhân sự trước khi chính thức được duyệt chuyển trạng thái.
- **Vấn đề cần giải quyết:** Thiếu trường thông tin Người nghiệm thu thử việc (`nguoi_nghiem_thu_thu_viec`) của nhân sự trên form nhập liệu và màn hình chi tiết nhân sự. Việc gán/sửa NNT chính thức chỉ dành cho SA, trong khi NNT thử việc cần cho phép EA khối cập nhật trực tiếp (Live update) thay vì đẩy vào Phòng chờ duyệt.
- **Mục tiêu:** 
  - Bổ sung cột `nguoi_nghiem_thu_thu_viec` (email) vào bảng `employees`.
  - Hiển thị và cho phép nhập trường này khi tạo mới nhân sự (ở màn hình nhập nhân sự mới).
  - Hiển thị trên UI chi tiết nhân sự: nằm trong `ReviewerCard` (chia làm 2 khu vực: "Người Nghiệm Thu Thử Việc" và "Người Nghiệm Thu Chính Thức") và cho phép EA khối chỉnh sửa/cập nhật trực tiếp trường này tại Card.
  - Ghi lịch sử thay đổi thông tin (Change History) khi trường này được cập nhật.
- **Kết quả mong đợi:** Trường `nguoi_nghiem_thu_thu_viec` hoạt động đúng phân quyền EA khối, cập nhật trực tiếp và hiển thị đúng vị trí trên UI.

## 2. Phạm vi

### In scope
- **Database:** Thêm cột `nguoi_nghiem_thu_thu_viec` vào bảng `employees` và cập nhật các view liên quan (`employee_full`, `employee_info_only`). Thiết lập ràng buộc `CHECK (nguoi_nghiem_thu_thu_viec IS NULL OR nguoi_nghiem_thu_thu_viec ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')` trực tiếp ở DB để bảo vệ tính toàn vẹn dữ liệu. <!-- Sửa theo EFR-01 (Round 3): Ràng buộc DB email check -->
- **Zod Schema & Types:** Cập nhật các schemas `@vcc/shared` (`employeeSchema`, `createEmployeeSchema`). Loại trừ trường này ra khỏi `updateEmployeeSchema` để ngăn việc thay đổi qua route generic của employee. <!-- Sửa theo EFR-01 (Round 2): Loại trừ khỏi update schema -->
- **Backend API:**
  - Hỗ trợ trường này trong API tạo mới nhân sự (`POST /employees` và `/employees/onboard`). API chuẩn hóa email (trim và chuyển chữ thường) trước khi lưu. <!-- Sửa theo EFR-01 (Round 3): chuẩn hóa email -->
  - Chặn tuyệt đối việc cập nhật trường này thông qua các route generic `PUT /employees/:id` và `PUT /employees/:id/personnel-pending` (bằng cách kiểm tra và không đưa trường này vào schema cập nhật chung).
  - Tạo API cập nhật trực tiếp (Live Update) riêng cho trường này: `PUT /employees/:maNhanSu/probation-reviewer` cho phép EA khối hoặc SA cập nhật trực tiếp mà không đi qua Phòng chờ duyệt (Pending Room). Route này sử dụng `sensitiveRateLimiter` để phòng chống brute-force. <!-- Sửa theo EFR-02: live update & EFR-04: rate limiting -->
  - Sửa đổi backend route quản lý NNT chính thức `PUT /employees/:id/reviewers` và route gợi ý `GET /employees/:id/suggest-reviewers` để chỉ cho phép Super Admin thực thi (SA-only), đảm bảo tính nhất quán với nghiệp vụ. <!-- Sửa theo EFR-01 (Round 4 & Round 5): Route NNT chính thức SA-only -->
  - Cập nhật backend route submit `/employees/:id/submit` để chỉ thực hiện kiểm tra bắt buộc có NNT chính thức (hoặc flag `khong_co_nnt`) đối với tài khoản SA, bỏ qua kiểm tra này đối với tài khoản non-SA (EA) để tránh chặn luồng submit trực tiếp. <!-- Sửa theo EFR-01 (Round 8): Bỏ qua NNT check tại backend submit cho non-SA -->
- **Frontend UI/UX:**
  - **EmployeeForm:** Thêm trường nhập "Người nghiệm thu thử việc" (Email input) trên form khi tạo mới nhân sự.
  - **ReviewerCard:** Tái cấu trúc component để hiển thị thêm khu vực "Người Nghiệm Thu Thử Việc". Tách rõ 2 cờ phân quyền: `canManageOfficialReviewers` (chỉ SA thấy nút thêm/xóa/gợi ý và mismatch warning) và `canEditProbationReviewer` (SA hoặc EA khối sửa được). Đối với user không có quyền tương ứng, phần đó sẽ hiển thị ở chế độ Read-only. <!-- Sửa theo EFR-01 (Round 4 & Round 5): Phân quyền hiển thị nút mutate ở ReviewerCard -->
  - **EmployeeDetailPage:** Cho phép hiển thị ReviewerCard với chế độ chỉ đọc cho tất cả các user có quyền xem chi tiết, và chỉ hiển thị tính năng sửa cho SA hoặc EA khối. <!-- Sửa theo EFR-03: điều chỉnh quyền hiển thị ReviewerCard -->
  - **PendingRoomPage:** Điều chỉnh logic khi bấm Submit đối với tài khoản non-SA (ví dụ EA) để bỏ qua hoàn toàn NNT Wizard (tránh gọi các API `suggest-reviewers` và gán `reviewers` vốn đã được bảo vệ SA-only), thực hiện submit trực tiếp. NNT chính thức sẽ do SA bổ sung từ trang chi tiết sau khi duyệt. Đối với SA, giữ nguyên luồng Wizard như cũ. <!-- Sửa theo EFR-OPEN-01 (Round 7): Tránh lỗi 403 cho EA tại phòng chờ -->
- **Change History:** Đảm bảo khi thay đổi trường này (cả khi submit onboarding và khi cập nhật trực tiếp), hệ thống sẽ ghi nhận lịch sử thay đổi vào bảng `change_history`. Label tiếng Việt tương ứng cho key này sẽ là "Người nghiệm thu thử việc". <!-- Sửa theo EFR-02: ghi lịch sử -->

### Out of scope
- Tự động gợi ý (autocomplete) khi gõ email NNT thử việc (User yêu cầu nhập email thông thường, không cần autocomplete).
- Lưu thông tin này vào bảng chốt tháng `snapshot_employees` (User yêu cầu không cần).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - [2026-03-31] Tách biệt dữ liệu Employee (Thông tin) và Salary (Tiền lương). Trường mới này thuộc Employee nên sẽ nằm ở bảng `employees`.
  - [2026-03-13] Sử dụng Zod Schema là Single Source of Truth cho cả FE và BE.
- **"Cấm kỵ" cần tránh:**
  - Không được đưa trường này vào luồng xử lý Lương.
  - Tránh phá vỡ RLS policies bằng cách đảm bảo Backend dùng `service_role` khi truy vấn.
- **Ràng buộc kiến trúc liên quan:**
  - Mọi thay đổi cấu trúc bảng `employees` cần đi kèm tệp SQL migration tương ứng dưới `database/migrations/`.
  - Cần cập nhật cả 2 views: `employee_full` và `employee_info_only` để đảm bảo API trả về đầy đủ thông tin cho FE.

## 4. Giả định và câu hỏi mở

### Giả định
- Việc phân quyền "EA khối" được thực hiện bằng cách kiểm tra permission level `EA` của user đối với khối (`khoi`) của nhân sự đó bằng helper `hasPermission` có sẵn trong `@vcc/shared`.

### Câu hỏi mở
- Không còn câu hỏi mở nào do các thông tin chi tiết đã được làm rõ ở bước trước.

## 5. Acceptance Criteria

- [ ] Migration tạo thành công cột `nguoi_nghiem_thu_thu_viec` trong bảng `employees` với ràng buộc email check, cập nhật các view `employee_full`, `employee_info_only`. <!-- Sửa theo EFR-01 (Round 3) -->
- [ ] Schema Zod ở `@vcc/shared` được cập nhật đầy đủ validation định dạng email và hỗ trợ giá trị null/optional.
- [ ] Màn hình thêm mới nhân sự hiển thị trường nhập "Người nghiệm thu thử việc". Tạo mới nhân sự lưu đúng thông tin này vào DB.
- [ ] Tại trang chi tiết nhân sự, component `ReviewerCard` hiển thị 2 phần riêng biệt: "Người Nghiệm Thu Thử Việc" và "Người Nghiệm Thu Chính Thức".
- [ ] User là EA của khối đó (hoặc SA) có thể cập nhật trực tiếp email người nghiệm thu thử việc tại `ReviewerCard`, thông tin được lưu thẳng vào DB ngay lập tức và ghi nhận lịch sử thay đổi (`change_history`). Các user khác chỉ được xem, không được sửa.
- [ ] Chỉ Super Admin mới có quyền thêm/xóa/gợi ý Người Nghiệm Thu Chính Thức, các tài khoản khác chỉ xem. <!-- Sửa theo EFR-01 (Round 4 & Round 5) -->
- [ ] Việc cập nhật trực tiếp này không làm nhân sự bị đẩy vào trạng thái Phòng chờ (`state_phong_cho` vẫn giữ nguyên trạng thái hiện tại).
- [ ] Route generic `PUT /employees/:id` và route lưu nháp `PUT /employees/:id/personnel-pending` không cho phép cập nhật hoặc thay đổi giá trị của cột `nguoi_nghiem_thu_thu_viec`. <!-- Sửa theo EFR-01 (Round 2) -->
- [ ] Nhân sự được EA submit từ phòng chờ không bị hiển thị Wizard NNT và có thể hoàn thành submit thành công mà không gặp lỗi phân quyền (403) hay lỗi NNT validation (400). <!-- Sửa theo EFR-OPEN-01 (Round 7) & EFR-01 (Round 8) -->

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/` | Tạo mới | Thêm cột `nguoi_nghiem_thu_thu_viec` vào `employees` và ALTER VIEW `employee_full`, `employee_info_only` | 🟢 Thấp | Có |
| `packages/shared/src/schemas/employee.ts` | Sửa | Cập nhật validation schema của employee (employeeSchema, createEmployeeSchema) và loại bỏ khỏi updateEmployeeSchema | 🟢 Thấp | Có | <!-- Sửa theo EFR-01 (Round 2) -->
| `backend/src/services/employeeService.ts` | Sửa | Bổ sung API logic cập nhật trực tiếp `nguoi_nghiem_thu_thu_viec`, chuẩn hóa dữ liệu đầu vào và ghi history | 🟡 Trung bình | Có | <!-- Sửa theo EFR-01 (Round 3) -->
| `backend/src/services/changeHistoryService.ts` | Sửa | Thêm `nguoi_nghiem_thu_thu_viec` vào `diffEmployeeFields` để so sánh và ghi history | 🟢 Thấp | Có | <!-- Sửa theo EFR-02 -->
| `backend/src/routes/employees.ts` | Sửa | Khai báo endpoint cập nhật trực tiếp `PUT /employees/:maNhanSu/probation-reviewer` và siết lại các route NNT chính thức thành SA-only; Cập nhật route submit `/employees/:id/submit` để bỏ qua check NNT đối với non-SA | 🟡 Trung bình | Có | <!-- Sửa theo EFR-01 (Round 4 & 5 & 8) -->
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Thêm trường nhập "Người nghiệm thu thử việc" trên form tạo mới | 🟢 Thấp | Có |
| `frontend/src/components/ReviewerCard.tsx` | Sửa | Hiển thị 2 khu vực, phân quyền nút mutate cho cả NNT thử việc và NNT chính thức | 🟡 Trung bình | Có | <!-- Sửa theo EFR-01 (Round 4 & Round 5) -->
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Sửa | Cho phép hiển thị ReviewerCard cho Viewer dạng readonly | 🟢 Thấp | Có | <!-- Sửa theo EFR-03 -->
| `frontend/src/pages/Employees/components/ChangeHistoryTab.tsx` | Sửa | Bổ sung label mapping tiếng Việt cho `nguoi_nghiem_thu_thu_viec` | 🟢 Thấp | Có | <!-- Sửa theo EFR-02 -->
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Bỏ qua NNT Wizard cho tài khoản non-SA khi thực hiện Submit | 🟢 Thấp | Có | <!-- Sửa theo EFR-OPEN-01 (Round 7) -->

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  - Logic phân quyền kiểm tra EA khối tại Backend Route cần thực hiện chặt chẽ để tránh lỗ hổng bảo mật.
  - Logic cập nhật trực tiếp (Live update) không được đi qua RPC phòng chờ, tránh nhầm lẫn làm thay đổi `state_phong_cho`.
  - Đảm bảo route generic không vô tình cập nhật hoặc override cột `nguoi_nghiem_thu_thu_viec` nếu có payload rác truyền vào. <!-- Sửa theo EFR-01 (Round 2) -->
- **Review focus areas:**
  - Kiểm tra xem API mới `PUT /employees/:maNhanSu/probation-reviewer` đã check đúng quyền EA của khối hay chưa.
  - Đảm bảo ghi đúng lịch sử thay đổi (`change_history`) khi thay đổi trường này.
  - Xác nhận DB constraint được apply chính xác qua migration. <!-- Sửa theo EFR-01 (Round 3) -->
  - Rà soát chặt chẽ phân quyền SA-only ở các route liên quan đến NNT chính thức. <!-- Sửa theo EFR-01 (Round 4 & Round 5) -->
  - Đảm bảo logic rẽ nhánh phân quyền trong route submit hoạt động ổn định và chính xác. <!-- Sửa theo EFR-01 (Round 8) -->

- **Known pitfalls / historical issues:**
  - Quên build `@vcc/shared` sau khi cập nhật schema khiến Backend/Frontend bị lỗi compile.
- **Dependencies / rollout concerns:**
  - Migration cần được chạy thành công trước khi deploy code Backend mới.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1:** DB Schema Migration + Shared Package Update (Zod) + RPC updates. <!-- Sửa theo EFR-02 -->
  - **Phase 2:** Backend API implementation & generic/dedicated/official reviewers integration testing. <!-- Sửa theo EFR-01 (Round 2 & Round 4 & Round 5 & Round 8) & EFR-04 -->
  - **Phase 3:** Frontend UI Integration & Manual Verification.
- **Thứ tự triển khai:** DB/Shared -> Backend -> Frontend.
- **Điểm cần phối hợp:** Đảm bảo chạy `pnpm run build:shared` sau khi sửa schema ở shared.
- **Yêu cầu migration / config / deploy:** Cần chạy file migration SQL mới.

## 9. Test Strategy

- **Automated tests:**
  - Viết integration/route tests cho endpoint `PUT /employees/:maNhanSu/probation-reviewer` để xác minh phân quyền (SA thành công, EA cùng khối thành công, EA khác khối bị 403, VI/VA/reviewer bị 403), validation định dạng email, `state_phong_cho` không bị đổi, `change_history` được ghi nhận. <!-- Sửa theo EFR-04 -->
  - Xác minh `audit_log` được tạo chính xác sau khi gọi endpoint `PUT /employees/:maNhanSu/probation-reviewer` (kiểm tra actor_email, target_ma_nhan_su, action là `'update'`, module là `'NS-001'` và details thể hiện trường `nguoi_nghiem_thu_thu_viec`). <!-- Sửa theo EFR-02 (Round 5): Test audit_log -->
  - Viết negative integration tests để xác nhận các route generic `PUT /employees/:id` và `PUT /employees/:id/personnel-pending` không cho phép cập nhật/thay đổi trường `nguoi_nghiem_thu_thu_viec`. <!-- Sửa theo EFR-01 (Round 2) -->
  - Viết test case verify DB check constraint: thử lưu email không hợp lệ thông qua backend service (service_role) và xác minh câu lệnh INSERT/UPDATE bị DB reject. <!-- Sửa theo EFR-01 (Round 3) -->
  - Viết integration/route tests cho endpoint quản lý NNT chính thức `PUT /employees/:id/reviewers` và endpoint gợi ý `GET /employees/:id/suggest-reviewers`: verify SA gán/xóa/gợi ý thành công; EA/reviewer/VI/VA đều nhận mã lỗi 403. <!-- Sửa theo EFR-01 (Round 4 & Round 5): Integration test NNT chính thức SA-only -->
  - Viết integration/route tests cho endpoint submit `PUT /employees/:id/submit`: verify tài khoản EA submit thành công khi nhân sự chưa được gán NNT chính thức (không cần truyền `khong_co_nnt`); verify tài khoản SA submit không có NNT chính thức (và không gửi `khong_co_nnt`) thì nhận mã lỗi 400. <!-- Sửa theo EFR-01 (Round 8): Integration test NNT check khi submit -->
- **Manual verification:**
  - Login tài khoản EA của khối A: thử cập nhật NNT thử việc cho nhân sự khối A (thành công) và khối B (lỗi 403).
  - Tạo mới nhân sự, điền NNT thử việc và kiểm tra DB có lưu chính xác.
  - Kiểm tra tab Lịch sử thay đổi sau khi cập nhật xem có ghi nhận đúng hay không.
  - Verify trên giao diện detail: tài khoản EA hoặc Viewer không thể thấy nút gán/xóa/gợi ý NNT chính thức. <!-- Sửa theo EFR-01 (Round 4 & Round 5) -->
  - Dùng tài khoản EA thực hiện submit nhân sự trong Pending Room, verify tiến trình hoàn thành ngay lập tức mà không hiển thị Wizard NNT chính thức và không gặp lỗi 403 hay 400. <!-- Sửa theo EFR-OPEN-01 (Round 7) & EFR-01 (Round 8) -->

## 10. Rollback Plan

- Viết tệp migration rollback (nếu cần) hoặc chạy câu lệnh SQL ALTER TABLE DROP COLUMN để khôi phục cấu trúc DB cũ.
- Revert commit code FE và BE về phiên bản trước đó.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
