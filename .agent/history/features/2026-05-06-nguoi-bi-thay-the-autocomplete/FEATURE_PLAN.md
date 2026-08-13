# Feature Plan: Chuẩn hoá trường Người Bị Thay Thế (Autocomplete Mã NS)

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã thông qua `feature-review` với các điều chỉnh (FR-01, FR-02).
> **Feature slug**: nguoi-bi-thay-the-autocomplete
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-23

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Trường `nguoi_bi_thay_the` trong bảng `employees` hiện được khai báo `VARCHAR(20)` với thiết kế lưu **Mã Nhân Sự** của người bị thay thế. Tuy nhiên trong thực tế vận hành, HR nhập **Họ và Tên đầy đủ** (qua file Excel import hoặc via AI OCR fill), dẫn tới lỗi `value too long for type character varying(20)` khi import 948 nhân sự.
- **Vấn đề cần giải quyết:**
  1. Import Excel bị chặn toàn bộ Transaction chỉ vì 1 dòng có tên dài > 20 ký tự.
  2. Backend `adminImportService.ts` thiếu validation length/format cho cột này → không bắt lỗi ở bước Preview.
  3. Khi AI OCR đọc được tên người bị thay thế (ví dụ: "Nguyễn Bùi Thị Hà Thanh"), hệ thống fill thẳng tên đó vào ô `nguoi_bi_thay_the` mà không resolve sang mã nhân sự.
- **Mục tiêu:** Chuẩn hoá trường `nguoi_bi_thay_the` để **luôn lưu Mã Nhân Sự** — cung cấp search thông minh (theo mã hoặc tên) cho HR và auto-resolve từ AI OCR.
- **Kết quả mong đợi:** Import Excel hoạt động trơn tru; trường người bị thay thế trên Form UI hỗ trợ tìm kiếm linh hoạt; AI OCR fill tự động mapping tên → mã nhân sự khi có thể.

## 2. Phạm vi

### In scope
1. **Backend Import Validation** (`adminImportService.ts`): Thêm validate `nguoi_bi_thay_the` phải `<= 20 ký tự` và match format mã nhân sự (alphanumeric). Nếu HR điền tên dài → báo đỏ tại Preview yêu cầu sửa.
2. **Frontend EmployeeForm**: Thay `<Input />` thành `<AutoComplete />` (hoặc `<Select showSearch />`) cho trường `nguoi_bi_thay_the`, cho phép search theo **mã nhân sự** hoặc **họ tên**. Hiển thị dạng `MÃ_NS — Họ Tên` để HR chọn chính xác. Giá trị cuối cùng lưu vào form = Mã Nhân Sự.
3. **Backend API endpoint**: Tạo hoặc tái sử dụng endpoint search nhân sự nhẹ nhàng (mã + tên) phục vụ autocomplete.
4. **OCR Fill Logic** (`EmployeeForm.tsx` → `handleFillFields`): Khi AI trả về tên của người bị thay thế, FE phải gọi API tìm kiếm:
   - Khớp đúng 1 → tự lấy mã nhân sự điền vào form.
   - Không khớp hoặc khớp nhiều → cảnh báo user tự gõ tìm kiếm chọn.
5. **Backend Import validation bổ sung**: Validate `loai_hop_dong`, `trang_thai` đúng enum hợp lệ tại `previewMigration()`.
6. **Zod Schema (Single Source of Truth)**: Bổ sung thẳng quy tắc regex `/^[A-Za-z0-9]*$/` vào trường `nguoi_bi_thay_the` tại file `packages/shared/src/schemas/employee.ts` để đồng bộ Validation cho toàn bộ Server (FR-02).
7. **Phân quyền cho Search API**: Giới hạn kết quả Autocomplete tuân thủ nguyên tắc `accessibleKhois` (EA/VI/VA chỉ thấy nhân sự thuộc Khối đang quản lý), bảo mật Data Isolation (FR-01).
8. **View/Edit UX**: Tự động hiển thị `Mã — Họ Tên` khi User có quyền truy cập mở Form Edit (EA) hoặc Detail (EA/VI/VA) để xem thông tin nhân sự cũ.

### Out of scope
- Thay đổi kiểu dữ liệu cột `nguoi_bi_thay_the` trong Database (giữ nguyên `VARCHAR(20)`).
- Thay đổi prompt/output của AI OCR service (`ocrService.ts`).
- Tìm kiếm vượt quyền (EA khối A tìm tên NS khối B).

## 3. Đối chiếu Knowledge Base

- **KB: Service-Layer Data Splitting**: Employee + Salary tách DB, flatten tại service → không ảnh hưởng flow search, chỉ cần query view `employee_info_only` cho autocomplete (Cách ly an toàn).
- **KB: Single Source of Truth (Zod)**: Zod schema `employee.ts` hiện có `z.string().max(20)` cho trường này → giữ nguyên, nhất quán với DB.
- **KB: RLS Atomic Exemption**: RPC `bulk_import_block_1` chạy `SECURITY DEFINER`. Validation phải xảy ra TRƯỚC khi gọi RPC → Backend service layer.
- **KB: Local-First Admin Search (~4000 records)**: Có tiền lệ local-first autocomplete cho Admin. Tuy nhiên EmployeeForm dùng cho EA (per-khối) nên dữ liệu nhỏ hơn; cách tiếp cận server-side search (debounced) hoặc pre-fetch đều khả thi.
- **"Cấm kỵ"**: Không dùng Tailwind (Ant Design v6). Không bypass RLS bằng anon key.

## 4. Giả định và câu hỏi mở

### Giả định
- Autocomplete tìm kiếm tất cả nhân sự thuộc phạm vi quyền của user (SA xem full, EA xem nội bộ Khối) kể cả người đã nghỉ việc.
- Endpoint search trả tối đa ~50 kết quả mỗi lần gõ.
- AI OCR vẫn trả về field `nguoi_bi_thay_the` dạng text (tên người). Logic resolve xảy ra tại FE `handleFillFields`.

### Câu hỏi mở
- Không có câu hỏi blocking.

## 5. Acceptance Criteria

- [ ] Import Excel: nếu ô `nguoi_bi_thay_the` dài > 20 ký tự hoặc không khớp format mã NS → hiện màu đỏ ở bước Preview với message rõ ràng.
- [ ] Import Excel: nếu ô `loai_hop_dong` hoặc `trang_thai` chứa giá trị ngoài enum → hiện đỏ tương tự.
- [ ] EmployeeForm: trường "Người bị thay thế" cho phép gõ tìm kiếm theo mã hoặc tên, hiển thị danh sách gợi ý `MÃ — Họ Tên`, giá trị lưu = Mã NS. Đầu vào cũ (nếu có) phải tự resolve ra Tên để hiển thị đúng.
- [ ] Phân quyền Autocomplete: Đây là Read-endpoint, áp dụng quy tắc lấy theo `accessibleKhois`. SA search ra toàn bộ. EA, VI, VA chỉ search ra nhân sự thuộc Khối mà họ được phân quyền. Rejects (403) người không có quyền xem Khối (vd: Reviewer).
- [ ] AI OCR Fill: nếu tên AI trả về khớp đúng 1 nhân sự (trong phạm vi quyền) → auto fill mã NS. Nếu 0 hoặc >1 → hiện cảnh báo.
- [ ] Form validation (Zod + UI) vẫn enforce `max(20)` và chỉ cho phép chữ + số (alphanumeric).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/services/adminImportService.ts` | Sửa | Bổ sung validate length + enum cho Preview | 🟡 | Có |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Thay `<Input>` → `<AutoComplete>`, thêm resolve logic tại `handleFillFields` | 🟡 | Có |
| `frontend/src/components/DocumentUpload.tsx` | Sửa nhẹ | Loại bỏ `nguoi_bi_thay_the` ra khỏi COMMON_FIELDS nếu cần (OCR vẫn trả nhưng xử lý ở Form) | 🟢 | Có |
| `backend/src/routes/employees.ts` | Sửa hoặc Thêm | Thêm/mở rộng endpoint GET search nhân sự cho autocomplete, **có check Permission Khối** | 🟡 | Có |
| `backend/src/services/employeeService.ts` | Sửa hoặc Thêm | Hàm search nhân sự theo mã + tên (sử dụng `ilike` hoặc `textSearch`) | 🟢 | Có |
| `packages/shared/src/schemas/employee.ts` | Sửa | Thêm regex quy tắc vào Zod schema (SSoT) | 🟡 | Có |
| `database/001_schema.sql` | Không sửa | Giữ nguyên `VARCHAR(20)` — đúng thiết kế mã NS | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (khuyến nghị)
- **Risk hotspots:**
  1. Logic OCR auto-resolve tên → mã NS tại FE: cần xử lý edge case tên gần giống, tên có dấu, tên trùng.
  2. Import Validation phải chặn TRƯỚC khi gọi RPC → nếu thiếu sẽ lặp lại lỗi DB crash.
- **Review focus areas:**
  - `handleFillFields` logic branching (0 match / 1 match / >1 match)
  - Import preview validation coverage (bao phủ hết các cột VARCHAR giới hạn)
  - Autocomplete UX: debounce, phân trang, hiệu suất khi dataset lớn
- **Known pitfalls / historical issues:**
  - Import Excel đã từng crash toàn bộ Transaction vì thiếu pre-validation (đây là bug gốc).
  - AI OCR trả về tên người (string dài) thay vì mã NS.
- **Dependencies / rollout concerns:**
  - Không cần migration DB (giữ nguyên schema).
  - Phải **chắc chắn build lại `@vcc/shared`** (`pnpm run build:shared`) sau khi sửa luật regex của Zod schema, trước khi chạy test FE/BE.

## 8. Chiến lược triển khai

- **Phase 1: Backend Validation Fix (Import)**
  - Bổ sung validate `nguoi_bi_thay_the` length + format + loai_hop_dong enum + trang_thai enum tại `previewMigration()`.
  - Fix trực tiếp lỗi Import Excel đang block user.

- **Phase 2: Backend Search API (`GET /api/employees/autocomplete`)**
  - Contract path duy nhất: `GET /api/employees/autocomplete?q=...`
  - Đặt sau `authMiddleware` và `permissionMiddleware`.
  - Tương tác DB qua view `employee_info_only` (không query bảng `employees` trực tiếp để bảo vệ strict read-boundary). Trả list `{ ma_nhan_su, ho_va_ten, trang_thai }`.
  - Hoạt động strict theo quyền.

- **Phase 3: Frontend Autocomplete + OCR Resolve + Existing Load**
  - Chốt cơ chế resolve existing (View/Edit MS cũ): FE tự chủ động Lazy-load gọi 1 request HTTP `/autocomplete?q=MãNS` ngay khi Form mount nếu detect có value `nguoi_bi_thay_the` hiện hữu. Không enrich ở API Get Detail backend để tránh thay đổi logic cứng.
  - Thay `<Input>` → `<AutoComplete>` trên `EmployeeForm.tsx`.
  - Thêm logic resolve tên AI OCR → mã NS trong `handleFillFields`.
  - Xử lý 3 case: 0/1/>1 match.

- **Thứ tự:** Phase 1 → Phase 2 → Phase 3 (mỗi phase test riêng biệt).

## 9. Test Strategy

- **Phase 1:**
  - Upload Excel với ô `nguoi_bi_thay_the` dài > 20 ký tự → Preview phải hiện đỏ rực, chặn không cho Import.
  - Upload Excel với ô `nguoi_bi_thay_the` = "!@#$%" (chuỗi non-alphanumeric <= 20 ký tự) → Preview hiện đỏ chặn Import.
  - Upload Excel với `loai_hop_dong` sai enum → Preview hiện đỏ.
  - Upload Excel với `trang_thai` sai enum (vd: 'invalid_status') → Preview hiện đỏ.
  - Upload Excel chuẩn → Import thành công.

- **Phase 2:**
  - Gọi API search với quyền SA → Trả cả NS ngoài khối.
  - Gọi API search với quyền EA hoặc VI/VA → Trả đúng NS trong các khối được quản lý, ẩn NS khối khác.
  - Gọi API search bằng Reviewer (không có quyền khối nào) → Bị từ chối 403.
  - Gọi API search không truyền `?q=` hoặc `<2 ký tự` → bị từ chối hoặc trả mảng rỗng.

- **Phase 3:**
  - Trên form, gõ mã NS → autocomplete gợi ý → chọn → form lưu mã NS.
  - Trên form, gõ tên → autocomplete gợi ý → chọn → form lưu mã NS.
  - AI OCR fill tên "Nguyễn Văn A" (1 match) → tự fill mã "VCC001".
  - AI OCR fill tên "Nguyễn" (nhiều match) → hiện cảnh báo chọn thủ công.
  - AI OCR fill tên "XYZ_Không_Tồn_Tại" (0 match) → hiện cảnh báo tự nhập.
  - **View/Edit Mode Lazy-load**:
    - **Edit Page**: Mở chỉnh sửa hồ sơ cũ → Form load xong phải tự autocomplete/resolve thành dạng `Mã_NS — Họ Tên`.
    - **Detail Page**: Mở trang chi tiết hồ sơ cũ → Component load xong phải hiển thị text dạng `Mã_NS — Họ Tên`.
    - Mở bằng role bị giới hạn (vd: Reviewer) → `GET /autocomplete` bị chặn (403), UI fallback âm thầm hiển thị Mã thô, trang Detail/Edit không sập.

## 10. Rollback Plan

- Phase 1: Revert validate tại `adminImportService.ts` → quay về hành vi cũ (lỗi DB).
- Phase 2: Xóa endpoint search mới (nếu tạo riêng) → không ảnh hưởng hệ thống.
- Phase 3: Chuyển `<AutoComplete>` về `<Input>` → quay về hành vi gõ tự do.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
