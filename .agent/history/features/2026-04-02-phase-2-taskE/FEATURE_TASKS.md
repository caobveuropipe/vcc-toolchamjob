# Feature Tasks: Phase E — Upload giấy tờ + AI OCR

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md` (cùng thư mục)
> **Tách từ**: `.agent/active/phase-2-ns-001-employee-crud/FEATURE_TASKS.md`
> **Ngày tách**: 2026-04-01
> **Cập nhật cuối**: 2026-04-01

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm — có code nhưng chưa khép kín hoặc chưa test
- `- [x]`: Hoàn thành — code xong, test pass, flow khép kín
- Cuối phase bắt buộc có `Task E.Final: 🧪 Test & Verify`

---

## Phase E: Upload giấy tờ + AI OCR *(Create-mode only)*

**Mục tiêu:** EA upload ảnh giấy tờ tuyển dụng lên hệ thống, AI OCR tự đọc và điền thông tin vào form tạo mới NS. (Theo FR-03)

### Infra & DB

- [x] Task E.0: **Infra & Config (`backend/.env.example`, `backend/src/config/env.ts`)**
  - Khai báo các cấu hình Env: `OCR_API_KEY`, `OCR_PROVIDER`, `OCR_API_URL`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`.
  - Quy hoạch Bucket trên Cloudflare R2 (Backend Hono tự cấp authz Signed URL, không dùng Edge Function).

- [x] Task E.1: **DB — Migration bổ sung cột `ocr_result` vào `employee_documents`**
  - File: `database/migrations/005_add_ocr_result_to_employee_documents.sql`
  - Câu lệnh: `ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS ocr_result JSONB;` (idempotent).
  - Header `database/001_schema.sql` đã cập nhật v2.5.1.

### Backend Routes & Services

- [x] Task E.2: **BE — Upload routes & Bind Service (`backend/src/routes/documents.ts`)**
  - ✅ Bước 1 (Cấp URL): `POST /api/documents/presign` — done
  - ✅ Bước 2 (Lưu Metadata): `POST /api/documents` — done
  - ✅ Authz Security (GET/DELETE/OCR):
    - Draft (employee_id IS NULL): Chỉ SA hoặc uploader (`created_by == actor`). VI/VA block.
    - Bound (có employee_id): EA(khối), SA, Reviewer.
      - `GET /api/documents/:id` — fetch metadata + signed URL (3 min)
      - `DELETE /api/documents/:id` — soft delete R2 + clean metadata
      - `POST /api/documents/:id/ocr` — trigger OCR hoặc fetch cache
  - ✅ **Bind Logic đã khép kín**: Đã bổ sung `temp_uuid` vào `createEmployeeSchema` và xử lý bind logic trong `employeeService.ts`.

- [x] Task E.3: **BE — AI OCR Service (`backend/src/services/ocrService.ts`)**
  - Gọi Provider (OpenAI GPT-5 via Proxy) kèm prompt format JSON employee fields.
  - Hỗ trợ Base64 (ưu tiên) và URL fallback.
  - Lưu kết quả vào `ocr_result` để cache, tránh gọi lại.
  - **Verified**: Script `backend/scripts/test_ocr_openai.ts` đã thông kết nối GPT-5 thành công.
  - Lệnh test: `cd backend && npx tsx scripts/test_ocr_openai.ts`

### Frontend (chưa bắt đầu)

- [x] Task E.4: **FE — DocumentUpload component (`frontend/src/components/DocumentUpload.tsx`)**
  - Component Ant Upload + Thumbnail. Nút "Xóa file". Nút "AI Đọc Giấy Tờ".
  - FE tự động catch timeout/hết hạn URL và tự retry cấp presign lại 1 lần nếu R2 reject.
  - Hiển thị preview các trường detect được. Bấm "Tự điền" truyền ngược dữ liệu vào form cha.
  - Chặn không hiển thị component này nếu FE đang ở mode Edit (tuân thủ pending_changes).
  - Mọi draft rác chưa bind bằng `temp_uuid` sẽ bị clear theo cronjob sau 24h.

- [x] Task E.5: **FE/Shared — Tích hợp (Create Mode) DocumentUpload vào EmployeeForm**
  - Thêm `temp_uuid: z.string().uuid()` (Bắt buộc) vào `createEmployeeSchema` trong `packages/shared/src/schemas/employee.ts`. Build lại shared.
  - Chỉ render DocumentUpload khi form mode = create.
  - Mặc định fetch/tạo `temp_uuid` khi render form mới để truyền cho component upload.
  - BẮT BUỘC: FE chặn submit Form nếu chưa upload tài liệu thành công.
  - BE Query `employee_documents` verify `{temp_uuid, created_by: actor.email}`. Block nếu không tìm thấy → `HTTP 400 VALIDATION_ERROR`.
  - **Lưu ý**: Task này bắt buộc phải hoàn thành trước khi Task E.2 Bind Logic có thể xem là "done".

### Cleanup

- [x] Task E.6: **BE — Script dọn dẹp file nháp (`backend/scripts/cron_cleanup_orphan.ts`)**
  - Worker script chạy định kỳ (24h).
  - Thu dọn DB: Xóa `employee_documents` có `employee_id IS NULL` và `created_at < now() - 24h`.
  - Thu dọn R2: Quét `ListObjectsV2` → xóa objects mồ côi không có trong DB.

### Verification

- [x] Task E.Final: 🧪 Test & Verify Phase E (Lifecycle & Authz Check)
  - Authz Check (Role): VI/VA gọi API `/api/documents/*` bị 403.
  - Authz Check (Draft state): EA cùng khối KHÔNG phải uploader → 403. EA "B" reuse `temp_uuid` của EA "A" → Reject.
  - Authz Check (Bound state): Reviewer truy cập file NS được gán → OK. EA khác khối → 403.
  - E2E: Upload ảnh → AI OCR → fields tự điền → lưu NS → Bind temp_uuid → employee_id.
  - Security URL: R2 download URL chỉ active 3 phút. FE retry 1 lần OK.
  - OCR Caching: Bấm OCR cùng 1 file lần 2 → cache hit (không gọi API).
  - Edit mode check: Form edit NS cũ không có upload component.

---

## Execution Log

| Thời gian | Task | Hành động | Trạng thái | Ghi chú |
|-----------|------|-----------|------------|---------|
| 2026-03-31 20:55 | E.0 | Bắt đầu cấu hình Infra & Config R2 | start | Tạm dừng để Audit Phase D |
| 2026-04-01 11:00 | E.0 | Resume cấu hình Infra & Config R2 | start | |
| 2026-04-01 13:50 | E.0 | Hoàn tất khai báo biến môi trường cho R2 và OCR | done | .env.example và env.ts schema z |
| 2026-04-01 13:51 | E.1 | Bắt đầu viết file migrate bổ sung cột ocr_result | start | |
| 2026-04-01 13:52 | E.1 | Hoàn thành file DB migration | done | Header schema đã có sẵn ocr_result |
| 2026-04-01 13:53 | E.2 | Bắt đầu tạo Upload routes & Bind Service | start | |
| 2026-04-01 13:56 | E.2 | Triển khai presign API, S3 Client, authz checks | partial | AWS SDK integrated. ⚠️ Bind logic chưa khép kín (thiếu temp_uuid trong shared schema) |
| 2026-04-01 13:57 | E.3 | Bắt đầu viết AI OCR Service | start | |
| 2026-04-01 14:18 | E.3 | Hoàn tất AI OCR thực tế (GPT-5 via Proxy) | done | Kết nối thành công, script test pass |
| 2026-04-01 13:59 | E.6 | Hoàn tất CRON cleanup R2 Objects và DB mồ côi | done | s3 DeleteObjects + DB query |
| 2026-04-01 14:32 | — | User phát hiện lỗi cấu trúc file gốc, yêu cầu tách Phase E | info | Tách sang `.agent/active/phase-2-taskE/` |
| 2026-04-01 17:54 | E.5 | Bắt đầu tích hợp BE/Shared cho form create. Thêm temp_uuid vào schema, sửa bind logic ở employeeService.ts. | start | FE part chưa bắt đầu. |
| 2026-04-01 17:55 | E.2 | Hoàn thành gap Bind Logic. Build lại shared. Typecheck backend pass. | done | Task E.2 đã thực sự khép kín. |
| 2026-04-01 18:00 | E.4, E.5 | Bắt đầu và hoàn thành phần FE React: DocumentUpload, tích hợp EmployeeForm, update logic xử lý trạng thái. | done | Build FE typecheck pass. |
| 2026-04-01 18:01 | E.Final | Hoàn tất Test & Verify Phase E | done | User xác nhận hoạt động tốt. |

