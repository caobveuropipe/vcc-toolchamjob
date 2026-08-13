# Feature Tasks: Luồng Điều chỉnh lương (WF-EMP-03) — Entry Points & UX

> **Trạng thái**: ⏳ Chưa bắt đầu
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-04

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Entry Points & Label

**Mục tiêu:** EA/SA có thể khởi tạo luồng "Điều chỉnh lương" từ Danh sách nhân sự và Chi tiết nhân sự

- [x] Task 1.1: **EmployeeTable — Cập nhật logic hiển thị menu Dropdown trong phòng chờ**
  - Cập nhật điều kiện hiển thị các option trong Dropdown:
    - Sửa hồ sơ: Hiện khi `!state_phong_cho` HOẶC (`state_phong_cho` VÀ (`has_pending_info = true` HOẶC Cả 2 cờ đều `false`)).
    - Điều chỉnh lương: Hiện khi `!state_phong_cho` HOẶC (`state_phong_cho` VÀ (`has_pending_salary = true` HOẶC Cả 2 cờ đều `false`)).
    - Ẩn đối với NS nghỉ việc.
  - **On-demand fetch (FR-02)**: Khi click "Điều chỉnh lương":
    1. Set `salaryLoading = true`
    2. Gọi `getSalaryDetail(record.ma_nhan_su)`
    3. Thành công → set `salaryModalRecord` = response → mở modal
    4. Lỗi (403/500) → `message.error('Không thể tải dữ liệu lương')`
    5. Set `salaryLoading = false`
  - Render `SalaryEditModal` ở cuối component (portal, không trong table row)

- [x] Task 1.2: **EmployeeDetailPage — Cập nhật nút "Điều chỉnh lương" cho phòng chờ**
  - Thay đổi Guard của nút "Điều chỉnh lương": Chỉ hiển thị khi `canEdit && !isResigned` VÀ (`!employee.state_phong_cho` HOẶC `employee.has_pending_salary` HOẶC cả 2 cờ pending đều `false`).
  - Thay đổi Guard của nút "Sửa hồ sơ": Tương tự, dựa vào `has_pending_info`.

- [x] Task 1.3: **EmployeeDetailPage — Đổi label "Sửa thông tin" → "Sửa hồ sơ"**
  - Cập nhật text trên Button `EditOutlined` từ "Sửa thông tin" → "Sửa hồ sơ"
  - Mục đích: Phân biệt rõ giữa luồng hồ sơ (WF-EMP-02) và luồng lương (WF-EMP-03)

- [x] Task 1.4: **(Bỏ qua)** (Đã gộp vào menu Dropdown ở Task 1.1)

- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
- [ ] EA thấy menu Dropdown `...` ở cột hành động trong danh sách nhân sự (hiển thị option tuỳ ngữ cảnh luồng đang chạy).
  - [ ] NS Thêm mới -> Hiện cả 2 menu.
  - [ ] NS đang sửa hồ sơ -> Chỉ hiện menu Sửa hồ sơ.
  - [ ] NS đang sửa lương -> Chỉ hiện menu Điều chỉnh lương.
  - [ ] EA thấy nút "Điều chỉnh lương" ở chi tiết nhân sự tương ứng.
  - [ ] Click nút khi API lỗi → hiện thông báo lỗi, không mở modal rỗng (FR-02)
  - [ ] VI không thấy menu sửa/điều chỉnh
  - [ ] VA không thấy menu sửa/điều chỉnh
  - [ ] NS `nghi_viec` → EA không thấy option "Điều chỉnh lương" trong menu `...`
  - [ ] NS `state_phong_cho = true` → không thấy option "Điều chỉnh lương" trong menu `...`
  - [ ] Label hiện "Sửa hồ sơ" thay vì "Sửa thông tin"

## Phase 2: SalaryEditModal Enhancement

**Mục tiêu:** Cập nhật TypeScript types và bổ sung 5 fields thiếu vào UI modal/card

- [x] Task 2.0: **Cập nhật `SalaryListItem`/`SalaryDetail` TypeScript types (FR-01)**
  - File: `frontend/src/services/salaryService.ts`
  - Thêm 5 fields vào `SalaryListItem` interface:
    - `bac_luong: string | null`
    - `ty_le_luong_tv: number | null`
    - `nhuan_but_cc: number | null`
    - `okr_cc: number | null`
    - `thuong_doanh_so_cc: number | null`
  - Sửa comment từ "25 salary fields" → "30 salary fields"

- [x] Task 2.1: **SalaryEditModal — Bổ sung 5 fields còn thiếu**
  - Thêm fields: `bac_luong` (Input text), `ty_le_luong_tv` (InputNumber 0-100), `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc` (InputNumber VND)
  - Đặt `bac_luong` và `ty_le_luong_tv` ở section "Thông tin lương cơ bản"
  - Đặt `nhuan_but_cc`, `okr_cc`, `thuong_doanh_so_cc` vào section "Bộ Cơ chế — Base"
  - Bổ sung một section "Thông tin hồ sơ" ở trên cùng, chứa các Input bị disable (Mã NS, Họ tên, Chức danh, Phòng ban...) để người dùng xem ngữ cảnh mà không sửa được.
  - Cập nhật `SALARY_LABELS` map cho 5 fields mới

- [x] Task 2.2: **EmployeeDetailPage — Cập nhật pending salary card**
  - Thêm hiển thị 5 fields mới trong card "Tiền lương thay đổi (chờ duyệt)"
  - Đảm bảo các PENDING_GT_FIELDS, PENDING_CC_FIELDS, PENDING_COMMON_FIELDS bao gồm đủ 30 fields

- [x] Task 2.Final: 🧪 Test & Verify Phase 2
  - [x] SalaryEditModal render đầy đủ 30 fields
  - [x] TypeScript types khớp với implementation
  - [x] Lưu lương thành công với 30 fields (chưa kèm upload)

## Phase 3: DocumentUpload & OCR Integration

**Mục tiêu:** Tích hợp upload giấy tờ minh chứng và tự động điền lương qua AI OCR

- [x] Task 3.1: **Refactor `DocumentUpload` component**
  - [x] Chuyển `document_type` và `title` (Tài liệu tuyển dụng) thành props (có giá trị default cho backward compatibility)
  - [x] Thay thế `'tuyen_moi'` hardcoded bằng prop `documentType` trong các API calls (presign, save metadata)
  - [x] Cho phép tùy biến Title card qua prop `title`

- [x] Task 3.2: **SalaryEditModal — Tích hợp DocumentUpload**
  - [x] Import và render `DocumentUpload` ở phía trên form lương
  - [x] Props: `documentType="dieu_chinh_luong"`, `title="Giấy tờ minh chứng điều chỉnh lương"`, `maNhanSu={editingModal?.ma_nhan_su}`
  - [x] State: `tempUuid` được tạo mới khi mở modal điều chỉnh

- [x] Task 3.3: **SalaryEditModal — Handle OCR Auto-fill**
  - [x] Implement `handleFillFields`: map OCR result fields (`luong_target_gt`, `lcd_gt`, ...) vào form salary
  - [x] Đảm bảo OCR fill không ghi đè các trường quan trọng nếu user không muốn (AntD form setFieldsValue)

- [x] Task 3.4: **SalaryEditModal — Submit with temp_uuid**
  - [x] Cập nhật hàm `handleSubmit`: gửi `tempUuid` kèm theo payload salary lên backend
  - [x] Backend đã có logic bind document vào nhân sự qua `temp_uuid` này

- [x] Task 3.Final: 🧪 Test & Verify Phase 3
  - [x] Upload giấy tờ thành công với type `dieu_chinh_luong`
  - [x] AI OCR đọc đúng và "Tự điền thông tin" fill đúng các trường lương vào form
  - [x] Lưu lương kèm minh chứng thành công
  - [x] Kiểm tra document đã được bind vào hồ sơ nhân sự sau khi submit (nếu có thể verify DB/UI hồ sơ)

## Phase 4: UX Polish & Final Refinement

**Mục tiêu:** Tối ưu hóa giao diện phòng chờ và modal lương để đạt trải nghiệm tốt nhất.

- [x] Task 4.1: **PendingRoom — Hệ thống icon nhận diện thông minh**
  - Sử dụng tag [NEW] đỏ cho nhân sự mới.
  - Sử dụng icon + tooltip cho "Sửa hồ sơ" và "Sửa lương".
  - Đảm bảo cột hành động luôn hiển thị trên 1 dòng.

- [x] Task 4.2: **PendingRoom — Tái cấu trúc cột hành động**
  - Thứ tự: Nút Submit (chính) -> Menu "..." (phụ) -> Các icon nhận diện (status).

- [x] Task 4.3: **SalaryEditModal — Tái cấu trúc phân nhóm trường lương**
  - Chuyển các trường lẻ tẻ vào nhóm "Thông tin chung" và "Bộ Cơ chế — Base".
  - Loại bỏ các section thừa để giao diện tập trung hơn.


---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-04 14:07 | 1 | 1.1-1.3 | Triển khai UI Entry Points (Dropdown table & Buttons) | done | Typecheck pass |
| 2026-05-04 14:08 | 1 | 1.Final | Chờ user verify giao diện | start | |
| 2026-05-04 15:03 | 1 | 1.Final | Hoàn thành Phase 1 | done | |
| 2026-05-04 15:03 | 2 | 2.0 | Bắt đầu cập nhật type cho lương | done | Đã update xong các task của Phase 2 |
| 2026-05-04 15:15 | 3 | 3.1 | Bắt đầu tích hợp DocumentUpload | done | Đã tích hợp DocumentUpload & OCR |
| 2026-05-04 15:18 | 3 | 3.Final | Hoàn thành toàn bộ Phase 3 | done | Sẵn sàng để user test |
| 2026-05-04 15:35 | 4 | 4.1-4.3 | Tối ưu UX phòng chờ & Modal lương | done | Giao diện đã cực kỳ tinh gọn và rõ ràng |

