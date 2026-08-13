# Feature Tasks: Chuẩn hoá trường Người Bị Thay Thế (Autocomplete Mã NS)

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-23

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Backend Import Validation Fix

**Mục tiêu:** Chặn lỗi `value too long for type character varying(20)` tại bước Preview (trước khi gọi RPC), bổ sung validate enum cho các cột nhạy cảm.

- [x] Task 1.1: Cập nhật `packages/shared/src/schemas/employee.ts`
  - Thêm `.regex(/^[A-Za-z0-9]*$/, 'Chỉ chấp nhận chữ và số (Mã NS)')` vào trường `nguoi_bi_thay_the`.
- [x] Task 1.2: Bổ sung validate `nguoi_bi_thay_the` trong `previewMigration()` tại `backend/src/services/adminImportService.ts`
  - Nếu giá trị vi phạm (dài > 20 hoặc không khớp alphanumeric) → push error theo Zod.
- [x] Task 1.3: Bổ sung validate `loai_hop_dong` trong `previewMigration()` 
  - Giá trị hợp lệ: `'nhan_vien'`, `'ctv'` (theo Migration 010)
  - Nếu không khớp enum → push error `"loai_hop_dong không hợp lệ, chỉ chấp nhận: nhan_vien, ctv"`
- [x] Task 1.4: Bổ sung validate `trang_thai` trong `previewMigration()`
  - Giá trị hợp lệ: `'thu_viec'`, `'chinh_thuc'`, `'nghi_sinh'`, `'nghi_viec'` (theo Migration 010)
  - Nếu không khớp enum → push error `"trang_thai không hợp lệ"`
- [x] Task 1.5: Dọn dẹp đoạn `console.error('[CRITICAL DB ERROR]'...)` debug đã thêm ở lần check-issue trước (nếu còn sót)
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Upload Excel với `nguoi_bi_thay_the` = "Nguyễn Bùi Thị Hà Thanh" (23 ký tự) → Preview hiện đỏ chặn Import
  - Upload Excel với `nguoi_bi_thay_the` = "@Nguyễn" (chứa ký tự đặc biệt) → Preview hiện đỏ
  - Upload Excel với `loai_hop_dong` = "chinh_thuc" (enum cũ, sai) → Preview hiện đỏ
  - Upload Excel với `trang_thai` = "invalid_status" → Preview hiện đỏ
  - Upload Excel chuẩn → Import thành công bình thường

## Phase 2: Backend Search API cho Autocomplete

**Mục tiêu:** Cung cấp endpoint search nhân sự theo mã hoặc tên để FE autocomplete dùng.

- [x] Task 2.1: Implement hàm search tại `employeeService.ts`
  - Query: `SELECT ma_nhan_su, ho_va_ten, trang_thai FROM employee_info_only WHERE (ma_nhan_su ILIKE '%q%' OR ho_va_ten ILIKE '%q%')`
  - Hàm nhận tham số tính `accessibleKhois` từ `permissionMatrix.permissions` (bao quát cả level EA, VI, VA giống hàm `listEmployees`).
  - Thêm SQL condition chặn: `WHERE khoi IN (accessibleKhois)` nếu user không phải là SA.
  - Trả về array `{ ma_nhan_su, ho_va_ten, trang_thai }` LIMIT 50.
- [x] Task 2.2: Mount route `GET /api/employees/autocomplete` và bảo vệ bằng `authMiddleware` + `permissionMiddleware`
  - Đầu vào `?q=...` (yêu cầu tối thiểu 2 ký tự).
  - Resolve permission từ `c.get('permission')` để truyền vào service.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - Gọi API bằng SA token: Trả cả danh sách nhân sự khác khối.
  - Gọi API bằng EA / VI / VA token: Chỉ trả danh sách NS thuộc Khối của tài khoản đó.
  - Gọi API bằng Reviewer (không có quyền thao tác cấp Khối): Bị chặn (403).
  - Gọi API với `<2 ký tự`: Trả rỗng hoặc 400.

## Phase 3: Frontend Autocomplete + OCR Auto-Resolve

**Mục tiêu:** Biến trường "Người bị thay thế" thành ô search thông minh; AI OCR fill tự mapping tên → mã NS.

- [x] Task 3.1: Thay `<Input>` thành `<AutoComplete>` (hoặc `<Select showSearch>`) tại `EmployeeForm.tsx` (dòng ~370)
  - Search debounce 300ms, gọi endpoint Phase 2
  - Options hiển thị: `MÃ_NS — Họ Tên (Trạng thái)`
  - Value thực lưu vào form: `ma_nhan_su` (không phải tên)
  - Cho phép clear (allowClear) 
  - Placeholder: "Gõ mã NS hoặc tên để tìm..."
- [x] Task 3.2: Cập nhật `handleFillFields` logic cho OCR auto-resolve
  - Khi AI OCR trả `nguoi_bi_thay_the` = "Nguyễn Văn A":
    1. Gọi API search với keyword = tên AI trả về
    2. Nếu kết quả = 1 match → set form value = `ma_nhan_su` của match đó, hiện message thành công
    3. Nếu kết quả = 0 → hiện `message.warning('Không tìm thấy NS phù hợp, vui lòng nhập thủ công')`
    4. Nếu kết quả > 1 → hiện `message.warning('Có nhiều NS trùng tên, vui lòng chọn thủ công')`, clear field để user tự gõ
- [x] Task 3.3: Bổ sung lấy tên NS vào View/Edit mode (`EmployeeDetailPage.tsx` & `EmployeeForm.tsx`) (Bắt buộc)
  - Ở `EmployeeForm.tsx`: Sử dụng cơ chế Lazy-load. Khi component mount mà thấy giá trị cũ của `nguoi_bi_thay_the`, kích hoạt API `/autocomplete?q={mã_cũ}`. **Lọc (filter) mảng từ API trả về để tìm đúng result có `ma_nhan_su === mã_cũ` (Exact Match)**, sau đó map vào state text hiển thị. Nếu API bị 403 (do Role), lỗi mạng, hoặc không tìm thấy result, phải catch lỗi và fallback hiển thị nguyên Mã thô cũ, giữ form không crash.
  - Ở `EmployeeDetailPage.tsx`: Tạo một State riêng để fetch `/autocomplete?q={mã_cũ}` khi mount. Nếu có exact match, hiển thị `<Typography.Text>Mã — Họ Tên</Typography.Text>`, nếu API lỗi mạng hoặc forbidden 403 (do hạn chế Role), fallback hiển thị nguyên cái Mã thô cũ.
- [x] Task 3.4: Cập nhật `DocumentUpload.tsx` (nếu cần)
  - Trường `nguoi_bi_thay_the` vẫn giữ lại trong OCR result display (hiện tên AI đọc được)
  - Logic resolve sang mã NS xảy ra khi bấm "Tự điền thông tin" → `handleFillFields` ở Form
- [/] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)
  - Gõ mã NS → autocomplete gợi ý → chọn → form lưu mã NS
  - Gõ tên → autocomplete gợi ý → chọn → form lưu mã NS
  - AI OCR fill tên "Nguyễn Hải Linh" (1 match) → auto fill mã NS, message thành công
  - AI OCR fill tên "Nguyễn" (nhiều match) → message warning, field rỗng chờ user tìm
  - AI OCR fill tên "Không Tồn_Tại" (0 match) → message warning chờ user.
  - Test View/Edit Mode: 
    - Mở Edit Page của NS đang có `nguoi_bi_thay_the` cũ → Form load xong phải hiện dòng `Mã_NS — Họ Tên` tại ô AutoComplete.
    - Mở Detail Page của NS đang có `nguoi_bi_thay_the` cũ → Label load xong phải hiện dòng `Mã_NS — Họ Tên` tại dòng Typography.
    - Mở bằng role bị giới hạn (Reviewer không có quyền search API) → API `/autocomplete` từ chối (403), FE fallback hiện Mã thô mà không sập trang.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-23 16:15 | Phase 1 | Task 1.1 | Bắt đầu thêm regex validation cho nguoi_bi_thay_the | start | — |
| 2026-04-23 16:16 | Phase 1 | Task 1.1 - 1.5 | Hoàn thành code logic validate và build shared | done | — |
| 2026-04-23 16:16 | Phase 1 | Task 1.Final | Chờ User test UI | wait | — |
| 2026-04-23 16:25 | Phase 1 | Task 1.Final | User xác nhận OK, hoàn thành Phase 1 | done | — |
| 2026-04-23 16:25 | Phase 2 | Task 2.1 - 2.2 | Hoàn thành API endpoint /autocomplete | done | — |
| 2026-04-23 16:26 | Phase 2 | Task 2.Final | Chờ User test API endpoint | wait | — |
| 2026-04-23 16:27 | Phase 2 | Task 2.Final | User yêu cầu gộp test với UI vào Phase 3 | done | — |
| 2026-04-23 16:27 | Phase 3 | Task 3.1 | Bắt đầu chuyển Input sang AutoComplete trong EmployeeForm | start | — |
| 2026-04-23 16:28 | Phase 3 | Task 3.1 - 3.2 | Hoàn thành AutoComplete và logic OCR resolve tại EmployeeForm | done | — |
| 2026-04-23 16:28 | Phase 3 | Task 3.3 | Bắt đầu triển khai lazy get name trong EmployeeDetailPage | start | — |
| 2026-04-23 16:30 | Phase 3 | Task 3.3 - 3.4 | Hoàn thành hiển thị tên NS ở View/Edit mode và xác nhận không sửa thêm DocumentUpload | done | — |
| 2026-04-23 16:30 | Phase 3 | Task 3.Final | Chờ User test UI Autocomplete và check OCR | wait | Phase 2 test được gộp vào đây |
