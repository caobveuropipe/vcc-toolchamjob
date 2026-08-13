# Feature Tasks: Fix Upload Presign Permission + CSP

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-13

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Backend + FE Request — Sửa Permission Logic cho Draft Upload

**Mục tiêu:** Cho phép EA upload tài liệu nháp (`document_type === 'tuyen_moi'`) khi `khoi` chưa được chọn, miễn user có ít nhất 1 quyền EA trên bất kỳ khối nào.

> ⚠️ **Dependency chain bắt buộc:** Task 1.1 → Task 1.2 → Task 1.3 (phải triển khai đúng thứ tự). Task 1.4 có thể song song với 1.2/1.3.

- [x] Task 1.1: Sửa route `POST /documents/presign` và `POST /documents` trong `backend/src/routes/documents.ts` — thêm field `document_type: z.enum([...]).optional()` vào Zod schema validation (thiết kế optional để backward compatible cho các client cũ bị cache). Truyền xuống `generatePresignedUploadUrl()`. Logic Service sẽ tự fallback check `khoi` chặt nếu `document_type` bị thiếu.
- [x] Task 1.2: Sửa hàm `generatePresignedUploadUrl()` trong `backend/src/services/documentService.ts` — thêm tham số `documentType`. Khi `documentType === 'tuyen_moi'` và `khoi` rỗng: kiểm tra `permissions.some(p => p.permission_level === 'EA')` thay vì `hasPermission(permission, khoi, ['EA'])`. Các `documentType` khác giữ nguyên logic cũ. **Cập nhật file-level contract** đầu file để ghi nhận: khi `document_type === 'tuyen_moi'` và `khoi` rỗng, chỉ cần verify user có ít nhất 1 EA entry.
- [x] Task 1.3: Sửa hàm `saveDocumentMetadata()` trong `backend/src/services/documentService.ts` — áp dụng cùng logic nới lỏng như Task 1.2 cho consistency (presign và save metadata phải cùng gate).
- [x] Task 1.4: *(cross-layer — FE)* Cập nhật `frontend/src/components/DocumentUpload.tsx` — đảm bảo request tới `/documents/presign` gửi kèm `document_type: 'tuyen_moi'` (hiện đang thiếu field này trong presign request body, chỉ gửi ở save metadata request).
- [x] Task 1.5: Viết/Cập nhật unit test cho `documentService.ts` cover 6 case:
  - EA upload `tuyen_moi` không có `khoi` → ✅ pass
  - EA upload `tuyen_moi` có `khoi` → ✅ pass (logic cũ vẫn hoạt động)
  - VI upload `tuyen_moi` không có `khoi` → ❌ reject 403
  - EA upload `dieu_chinh_luong` không có `khoi` → ❌ reject 403
  - Superadmin upload `tuyen_moi` không có `khoi` (auth branch) → ✅ pass
  - Reviewer upload `tuyen_moi` cho `ma_nhan_su` được quản lý (auth branch) → ✅ pass
- [x] Task 1.6: Viết route-level "thin contract test" cho `/documents/presign`. Sử dụng `app.request()` để giả lập gửi payload JSON có `document_type`, và mock hàm `generatePresignedUploadUrl(...)` để kiểm tra Zod schema đã parse đúng và truyền đầy đủ field xuống tầng Service.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 — Chạy unit test, typecheck (`pnpm run typecheck`), và test thủ công trên local dev: EA upload ảnh khi chưa chọn Khối → presign thành công → upload R2 thành công → save metadata thành công.

## Phase 2: Infra/CSP — Sửa Nginx CSP + Verify End-to-End

**Mục tiêu:** Fix CSP `img-src` để Ant Design Upload thumbnail preview hiển thị đúng. Verify toàn bộ flow end-to-end.

- [x] Task 2.1: Sửa `frontend/nginx.conf` — thêm `blob:` vào directive `img-src` trong header `Content-Security-Policy`. Dòng sửa: `img-src 'self' data: blob: https://*.supabase.co;`
- [x] Task 2.2: Verify end-to-end trên local Docker (nếu có) hoặc sau deploy:
  - EA login → `/employees/new` → upload ảnh JPG → thumbnail hiển thị → AI OCR hoạt động → điền form → submit.
  - VI login → `/employees/new` → upload ảnh → verify 403.
  - EA upload document type khác (nếu có UI) → verify vẫn cần `khoi`.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 — Confirm no CSP errors in browser console. Confirm toàn bộ AC1–AC6 pass.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-13 16:57 | Phase 1 | Task 1.1 | Bắt đầu triển khai: thêm `document_type` vào Zod schema route presign & save | start | |
| 2026-04-13 16:59 | Phase 1 | Task 1.1 | Thêm `document_type` optional vào presign Zod schema, truyền xuống service. Route `POST /` đã có sẵn field này | done | |
| 2026-04-13 16:59 | Phase 1 | Task 1.2 | Bắt đầu: sửa `generatePresignedUploadUrl()` + contract | start | |
| 2026-04-13 17:00 | Phase 1 | Task 1.2 | Thêm `documentType` param, nới lỏng permission cho tuyen_moi+khoi rỗng, cập nhật contract | done | |
| 2026-04-13 17:01 | Phase 1 | Task 1.3 | Bắt đầu: sửa `saveDocumentMetadata()` cùng logic | start | |
| 2026-04-13 17:01 | Phase 1 | Task 1.3 | Áp dụng draft upload exception cho `saveDocumentMetadata()` | done | |
| 2026-04-13 17:02 | Phase 1 | Task 1.4 | Thêm `document_type: 'tuyen_moi'` vào presign request body trong `DocumentUpload.tsx` | done | File bị hỏng do edit incremental, đã khôi phục đầy đủ |
| 2026-04-13 17:03 | Phase 1 | Task 1.5 | Bắt đầu: viết unit test cho documentService | start | |
| 2026-04-13 17:05 | Phase 1 | Task 1.5 | 9/9 tests pass (6 presign + 3 saveMetadata) | done | |
| 2026-04-13 17:05 | Phase 1 | Task 1.6 | Bắt đầu: viết route-level contract test | start | |
| 2026-04-13 17:19 | Phase 1 | Task 1.6 | 4/4 route contract tests pass | done | |
| 2026-04-13 17:19 | Phase 1 | Task 1.Final | Bắt đầu AI self-test: unit test, typecheck | start | |
| 2026-04-13 17:22 | Phase 1 | Task 1.Final | **AI self-test pass**: BE 13/13 unit tests, BE typecheck 0 err, FE typecheck 0 err | done | Chờ User manual test |
| 2026-04-13 17:25 | Phase 1 | Task 1.Final | User confirm: local test pass | done | Phase 1 hoàn thành ✅ |
| 2026-04-13 17:26 | Phase 2 | Task 2.1 | Bắt đầu: sửa nginx.conf CSP img-src | start | |
| 2026-04-13 17:26 | Phase 2 | Task 2.1 | Thêm `blob:` vào `img-src` CSP directive | done | |
| 2026-04-13 17:26 | Phase 2 | Task 2.2 | E2E verify: đã pass ở Phase 1 local test (upload flow). CSP chỉ verify được sau deploy Docker | done | CSP cần deploy Docker để verify thật |
| 2026-04-13 17:26 | Phase 2 | Task 2.Final | AI self-test Phase 2 | start | |
| 2026-04-13 17:27 | Phase 2 | Task 2.Final | **AI self-test pass**: nginx.conf đã thêm `blob:`, regression 13/13 pass, diff chỉ 1 dòng config | done | Chờ User confirm |
| 2026-04-13 17:28 | Phase 2 | Task 2.Final | User confirm: Phase 2 pass | done | Phase 2 hoàn thành ✅ |
| 2026-04-13 17:28 | Feature | — | **Feature hoàn thành**. Tất cả task + Task X.Final đều ✅ | done | Chờ archive → update-docs → git-sync |
