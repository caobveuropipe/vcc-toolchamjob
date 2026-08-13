# Feature Plan: Luồng Điều chỉnh lương (WF-EMP-03) — Entry Points & UX

> **Trạng thái**: ✅ ĐÃ DUYỆT (Scope mở rộng: thêm Upload + OCR)
> **Review gate**: 🟢 Cleared — Đã thông qua review hội đồng, có thể triển khai.
> **Feature slug**: `dieu-chinh-luong-workflow`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-04

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Phase 3 (`phase-3-salary-crud`) đã triển khai thành công Backend API + UI cho quản lý lương. Tuy nhiên, luồng **Điều chỉnh lương** (WF-EMP-03) trong tài liệu nghiệp vụ `docs/business-flows/03-dieu-chinh-luong.md` yêu cầu user EA/SA có thể thực hiện "Chọn NS → Sửa lương → Lưu phòng chờ → Submit" **từ danh sách nhân sự hoặc trang chi tiết nhân sự**, chứ không chỉ từ menu "Quản lý lương" riêng biệt. Hiện tại:
  1. **Trang danh sách nhân sự (`/employees`)**: Không có nút/entry point nào dẫn đến điều chỉnh lương.
  2. **Trang chi tiết nhân sự (`/employees/:id`)**: Đã có `SalaryEditModal` nhưng chỉ hiển thị khi nhân sự **đã có pending salary** (card "Tiền lương thay đổi chờ duyệt"). Thiếu nút "Điều chỉnh lương" ở thanh công cụ để EA chủ động khởi tạo luồng.
  3. **SalaryEditModal**: Thiếu tích hợp upload giấy tờ minh chứng + OCR đọc tự động (bước 3 của WF-EMP-03). `DocumentUpload` hiện hardcode `document_type='tuyen_moi'` và title "Tài liệu tuyển dụng" — cần refactor thành configurable.
  4. **SalaryEditModal**: Thiếu các trường `bac_luong`, `ty_le_luong_tv`, `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc` (5 fields cuối trong `SALARY_FIELDS` — 30 fields, không phải 25). Modal hiện chỉ render 25/30 fields.
  5. **Trang Quản lý lương (`/salaries`)**: Đã có đầy đủ table + nút sửa, nhưng đây là entry point phụ, không phải primary flow theo WF-EMP-03.

- **Vấn đề cần giải quyết:** Thiếu điểm kích hoạt (Entry Points) rõ ràng và hoàn chỉnh cho luồng WF-EMP-03 trên frontend, dẫn đến EA/SA không thể thực hiện đầy đủ quy trình điều chỉnh lương theo đúng tài liệu nghiệp vụ.

- **Mục tiêu:** Bổ sung các entry points và hoàn thiện SalaryEditModal để luồng WF-EMP-03 khép kín từ đầu đến cuối trên frontend.

- **Kết quả mong đợi:** EA/SA có thể: (1) Khởi tạo điều chỉnh lương từ danh sách nhân sự hoặc chi tiết nhân sự, (2) Upload giấy tờ minh chứng + AI OCR đọc tự động điền lương, (3) Sửa đầy đủ 30 fields lương, (4) Lưu vào phòng chờ, (5) Submit từ phòng chờ.

## 2. Phạm vi

### In scope
1. **FE — Entry Points**: Thêm tính năng "Điều chỉnh lương":
   - Cột hành động trong `EmployeeTable.tsx`: Thay thế nút "Sửa" bằng một Dropdown (icon `...`) gom nhóm các hành động: "Sửa hồ sơ" và "Điều chỉnh lương"
   - Thanh công cụ trong `EmployeeDetailPage.tsx`
2. **FE — SalaryEditModal Enhancement**: 
   - Bổ sung section "Thông tin hồ sơ" (Mã NS, Họ tên, Khối, Phòng ban...) ở trạng thái **disabled** để hiển thị ngữ cảnh (đáp ứng yêu cầu UX "disable các thông tin khác").
   - Bổ sung 5 fields lương còn thiếu: `bac_luong`, `ty_le_luong_tv`, `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`
   - Cập nhật `SalaryListItem`/`SalaryDetail` TypeScript types cho 5 fields mới (FR-01)
3. **FE — DocumentUpload Refactor + OCR Integration**:
   - Refactor `DocumentUpload` component: parameterize `document_type`, `title`, để reuse cho luồng điều chỉnh lương
   - Tích hợp vào `SalaryEditModal`: upload giấy tờ → AI OCR đọc → auto-fill salary fields vào form
   - Bind document vào NS qua `temp_uuid` mechanism (đã có sẵn trong `useSalaryUpdate`)
4. **FE — Phân biệt UI**: Đổi label "Sửa thông tin" → "Sửa hồ sơ" ở EmployeeDetailPage để tách bạch 2 luồng
4. **FE — Permission Guard**: Nút "Điều chỉnh lương" chỉ hiển thị cho EA (khối đúng) / SA / Reviewer (NS được gán). VA chỉ xem, VI không thấy gì.
5. **FE — On-demand Salary Fetch (FR-02)**: Khi mở modal từ EmployeeTable, gọi `getSalaryDetail(ma_nhan_su)` trước → loading state → handle error → mở modal với data đúng.

### Out of scope
- Thay đổi Backend API (đã hoạt động đúng từ Phase 3)
- Thay đổi SQL Function `submit_employee_pending` (đã atomic)
- Thay đổi logic phòng chờ / submit flow
- Thêm validation deadline ngày 27 (tài liệu ghi rõ: không chặn kỹ thuật)
- Thay đổi trang `/salaries` (SalaryListPage — đã hoạt động đúng)
- Thay đổi backend `documentService.ts` hoặc `documents.ts` route (đã có `dieu_chinh_luong` trong whitelist)

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-04-01] Salary Data Isolation`: Lương KHÔNG được thay đổi qua luồng Hồ sơ → entry point phải mở SalaryEditModal riêng, KHÔNG nhúng vào EmployeeForm
  - `[2026-04-07] Salary Pending Isolation`: Pending salary lưu tại `salaries.pending_changes`, KHÔNG phải `employees.pending_changes` → Modal phải gọi API `PUT /api/salaries/:ma_nhan_su`
  - `[2026-04-06] State-driven Visibility Isolation`: NS đang ở phòng chờ (`state_phong_cho = true`) ẩn khỏi danh sách điều chỉnh lương → Nút "Điều chỉnh lương" trong EmployeeTable phải ẩn khi `state_phong_cho = true`
  - `[2026-03-13] UI Architecture`: Ant Design v6 + Theme Tokens. Cấm Tailwind
  - `[2026-04-07] Atomic Submit RPC`: Submit qua SQL Function → không thay đổi gì ở backend

- **"Cấm kỵ" cần tránh:**
  - KHÔNG nhúng salary fields vào EmployeeForm (vi phạm Salary Data Isolation)
  - KHÔNG cho VI thấy nút "Điều chỉnh lương" hay bất kỳ salary UI nào
  - KHÔNG dùng Tailwind

- **Ràng buộc kiến trúc liên quan:**
  - `SalaryEditModal` đã là reusable component (dùng ở cả `SalaryListPage` và `EmployeeDetailPage`)
  - `DocumentUpload` component đã tồn tại nhưng hardcode `document_type='tuyen_moi'` và title — cần refactor thành configurable
  - `useSalaryDetail` hook đã có sẵn với `enabled` option — hỗ trợ on-demand fetch
  - `useSalaryUpdate` đã nhận `tempUuid` parameter — hỗ trợ bind document vào NS
  - `SALARY_FIELDS` constant có 30 items (không phải 25 như doc cũ ghi)
  - `useSalaryUpdate` hook đã hoạt động đúng

## 4. Giả định và câu hỏi mở

### Giả định
1. Backend API `PUT /api/salaries/:ma_nhan_su` đã hoạt động đúng và sẽ không cần thay đổi
2. 5 fields cuối (`bac_luong`, `ty_le_luong_tv`, `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc`) đã có trong bảng DB `salaries` và backend đã chấp nhận qua `SALARY_FIELDS`
3. `bac_luong` là `string | null` (không phải number), các fields còn lại là `number | null`
4. `DocumentUpload` có thể được refactor bằng cách thêm props `documentType`, `title` mà không phá contract hiện tại (luồng tạo mới vẫn truyền `document_type='tuyen_moi'`)
5. OCR result từ backend đã trả về các salary fields (`luong_target_gt`, `lcd_gt`, `nhuan_but_cc`, ...) — `onFillFields` sẽ map vào form salary
4. Nút "Điều chỉnh lương" trong `EmployeeTable` cần fetch salary data trước khi mở modal → sử dụng `useSalaryDetail` on-demand

### Câu hỏi mở
- [Non-blocking] Có cần hiển thị ngày deadline (ngày 27) dưới dạng warning trên modal khi ngày hiện tại > 27? Giả định: Không hiển thị warning ở lần đầu, có thể thêm sau.

## 5. Acceptance Criteria

- [ ] AC-01: EA thấy menu "Điều chỉnh lương" khi click vào dấu `...` ở cột hành động trong danh sách nhân sự (ẩn/hiện tuỳ vào `has_pending_info` và `has_pending_salary` nếu ở phòng chờ).
- [ ] AC-02: EA thấy nút "Điều chỉnh lương" ở thanh công cụ trang chi tiết nhân sự (ẩn/hiện tuỳ ngữ cảnh phòng chờ).
- [ ] AC-03: Click nút "Điều chỉnh lương" mở `SalaryEditModal` với đầy đủ 30 fields
- [ ] AC-04: Click nút "Điều chỉnh lương" từ EmployeeTable → loading → modal mở với salary data đúng. Nếu API lỗi (403/500) → hiện thông báo lỗi, không mở modal rỗng (FR-02)
- [ ] AC-05: VI không thấy nút "Điều chỉnh lương" ở bất kỳ trang nào
- [ ] AC-06: VA không thấy nút "Điều chỉnh lương" (chỉ xem, không sửa)
- [ ] AC-07: SalaryEditModal có tích hợp DocumentUpload (optional, `document_type='dieu_chinh_luong'`)
- [ ] AC-08: Upload giấy tờ → bấm "AI Đọc Giấy Tờ" → OCR auto-fill salary fields vào form
- [ ] AC-09: Lưu thay đổi lương → API `PUT /api/salaries/:ma_nhan_su` kèm `temp_uuid` → hiện message "Đã lưu vào phòng chờ"
- [ ] AC-10: Sau lưu, NS xuất hiện ở Phòng chờ với tag "Lương"
- [ ] AC-11: Label "Sửa thông tin" → "Sửa hồ sơ" trên EmployeeDetailPage

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `frontend/src/components/EmployeeTable.tsx` | **Sửa** | Gom nhóm các hành động thành Dropdown `...` + tích hợp SalaryEditModal | 🟡 | Có (EmployeeTableProps) |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | **Sửa** | Thêm nút "Điều chỉnh lương" ở thanh công cụ + đổi label "Sửa hồ sơ" | 🟢 | Có (đã có SalaryEditModal import) |
| `frontend/src/pages/Salaries/SalaryEditModal.tsx` | **Sửa** | Bổ sung 5 fields + tích hợp DocumentUpload + OCR auto-fill | 🟡 | Có (SalaryEditModalProps) |
| `frontend/src/services/salaryService.ts` | **Sửa** | Cập nhật `SalaryListItem`/`SalaryDetail` type thêm 5 fields (FR-01) | 🟢 | Có |
| `frontend/src/components/DocumentUpload.tsx` | **Sửa** | Refactor: parameterize `document_type` và `title` props | 🟡 | Có (file-contract) |

## 7. Risk Triage và Review Focus

- **Review required:** Khuyến nghị — feature chạm permission logic và UX flow nhạy cảm
- **Risk hotspots:**
  1. **Permission check trên nút "Điều chỉnh lương"**: Cần verify logic `can_edit` vs role-based → đảm bảo với VA/VI thì không tạo DOM tính năng này luôn.
  2. **Visibility logic trong Phòng chờ**: Dựa theo `has_pending_info` và `has_pending_salary` để ẩn/hiện đúng option trong menu `...`, tránh nhầm lẫn luồng:
     - Thêm mới (`has_pending_info = false`, `has_pending_salary = false`): Hiện cả "Sửa hồ sơ" và "Điều chỉnh lương".
     - Đang Sửa hồ sơ (`has_pending_info = true`): Chỉ hiện "Sửa hồ sơ".
     - Đang Sửa lương (`has_pending_salary = true`): Chỉ hiện "Điều chỉnh lương".
  3. **On-demand salary data fetch (FR-02)**: Khi mở modal từ EmployeeTable, data salary chưa được fetch sẵn → cần gọi `getSalaryDetail`
  4. **SalaryEditModal reuse**: Cần đảm bảo props interface nhất quán khi dùng ở 3 nơi.
- **Review focus areas:**
  - Logic ẩn/hiện menu Dropdown trong `EmployeeTable.tsx` dựa trên state phòng chờ và pending flags.
  - SalaryEditModal nhận đúng data khi mở từ EmployeeTable (salary detail phải được fetch trước)
- **Known pitfalls / historical issues:**
  - Phase 3 đã từng thiếu fields cuối trong UI → giống vấn đề hiện tại với 5 fields còn thiếu
  - Quyết định thay đổi: Bỏ quy tắc "ẩn tuyệt đối nút điều chỉnh lương ở phòng chờ", thay bằng logic hiển thị theo ngữ cảnh luồng.
- **Dependencies / rollout concerns:**
  - Không cần migration DB (bảng và fields đã có)
  - Không cần deploy backend mới (API đã có)
  - Chỉ cần deploy frontend mới

## 8. Chiến lược triển khai

- **Phase strategy:** Chia thành **2 phases** nhỏ:
  - **Phase 1 — Entry Points + Label**: Thêm nút "Điều chỉnh lương" vào EmployeeTable và EmployeeDetailPage, đổi label
  - **Phase 2 — Modal Enhancement**: Cập nhật TypeScript types + Bổ sung 5 fields thiếu vào modal + pending card
  - **Phase 3 — DocumentUpload + OCR**: Refactor DocumentUpload → tích hợp vào SalaryEditModal → OCR auto-fill salary fields

- **Thứ tự triển khai:**
  1. Phase 1 trước (entry points — giá trị cao nhất, ít rủi ro)
  2. Phase 2 sau (type fix + 5 fields)
  3. Phase 3 cuối (upload + OCR — phức tạp nhất, cần verify OCR field mapping)

- **Điểm cần phối hợp:**
  - Chỉ frontend, không cần phối hợp backend

- **Yêu cầu migration / config / deploy:**
  - Không cần migration DB
  - Không cần deploy backend mới

## 9. Test Strategy

- **Automated tests:** Không bắt buộc (feature chủ yếu là UI entry points)
- **Manual verification:**
  - EA đăng nhập → vào Danh sách nhân sự → thấy nút 💵 → click → SalaryEditModal mở với đúng data salary
  - EA đăng nhập → vào Chi tiết nhân sự → thấy nút "Điều chỉnh lương" → click → modal mở
  - VI đăng nhập → KHÔNG thấy nút 💵 ở bất kỳ trang nào
  - VA đăng nhập → KHÔNG thấy nút 💵 (chỉ xem)
  - SA đăng nhập → thấy nút ở tất cả nhân sự
  - NS `nghi_viec` → EA KHÔNG thấy nút (SA vẫn thấy)
  - NS `state_phong_cho = true` → KHÔNG thấy nút điều chỉnh lương
  - SalaryEditModal: 30 fields render đầy đủ, lưu thành công
  - Verify label "Sửa hồ sơ" thay vì "Sửa thông tin"
- **Data / env chuẩn bị trước khi test:**
  - Seed accounts EA, VA, VI, SA (đã có)
  - Ít nhất 1 NS với salary data, 1 NS `nghi_viec`, 1 NS `state_phong_cho = true`

## 10. Rollback Plan

- Revert các file FE đã sửa (3-4 files) → nút "Điều chỉnh lương" biến mất, hệ thống quay về trạng thái trước
- Không ảnh hưởng backend hay database

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## Review Notes

- **Review lần 1 (2026-05-04)**: ⚠️ CẦN SỬA — 5 findings. User xác nhận upload/OCR OUT OF SCOPE.
- **Re-review (2026-05-04)**: ĐÃ SỬA — 3 findings (FR-01 type, FR-02 fetch, FR-03 scope). Gate cleared.
- **Scope mở rộng (2026-05-04)**: User yêu cầu bổ sung lại upload giấy tờ + OCR đọc bắt buộc. Thêm Phase 3. Cần review lại.
- **Review lần cuối (2026-05-04)**: ✅ ĐỒNG Ý — Các phương án refactor DocumentUpload và phân quyền trong Phase 3 đã được đánh giá an toàn. Không có blocker. Gate cleared. Sẵn sàng handoff sang `feature-coordinator`.
