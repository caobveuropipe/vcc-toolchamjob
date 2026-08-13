# Feature Plan: Fix Upload Presign Permission + CSP cho luồng Tạo mới nhân sự

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã hoàn tất review
> **Feature slug**: fix-upload-presign-permission
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-13

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Khi EA tạo mới nhân sự (`/employees/new`), giao diện yêu cầu upload ảnh giấy tờ tuyển dụng **trước** khi nhập thông tin (bao gồm chọn Khối). Upload này gọi API `/documents/presign` để lấy Presigned URL từ R2. Tuy nhiên, logic permission backend kiểm tra `hasPermission(permission, khoi, ['EA'])` — mà lúc này `khoi` là `undefined` vì user chưa chọn Khối nào trên form.
- **Vấn đề cần giải quyết:**
  1. **Lỗi 403 Forbidden:** API `/documents/presign` và `/documents` (save metadata) đều reject request khi `khoi` rỗng, khiến EA không thể upload tài liệu tuyển dụng ở bước đầu tiên của flow tạo mới nhân sự.
  2. **Lỗi CSP (img-src):** Nginx CSP header chưa cho phép `blob:` URL, khiến Ant Design Upload component không thể hiển thị thumbnail preview ảnh.
- **Mục tiêu:** Cho phép EA upload tài liệu nháp (draft) khi `document_type === 'tuyen_moi'` mà chưa cần chọn Khối, đồng thời fix CSP để thumbnail preview hoạt động.
- **Kết quả mong đợi:** EA có thể upload ảnh giấy tờ tuyển dụng → xem thumbnail preview → sử dụng AI OCR → tự điền form, toàn bộ flow tạo mới nhân sự hoạt động mượt mà trên production.

## 2. Phạm vi

### In scope
- Sửa logic permission check trong `generatePresignedUploadUrl()` và `saveDocumentMetadata()` tại `documentService.ts` — cho phép upload nháp khi `document_type === 'tuyen_moi'` và `khoi` rỗng, miễn user đã authenticated và có ít nhất 1 quyền EA trên bất kỳ khối nào.
- Cập nhật CSP `img-src` trong `nginx.conf` thêm `blob:`.
- Viết/cập nhật unit test cho logic permission mới.

### Out of scope
- Cron job dọn dẹp file rác trên R2 `temp/` (đã có `backend/scripts/cron_cleanup_orphan.ts`).
- Thay đổi UI flow (bắt buộc chọn Khối trước khi upload) — đã chọn Giải pháp 1 từ check-issue.
- Sửa `script-src` CSP cho Cloudflare Insights beacon (không ảnh hưởng nghiệp vụ, chỉ là warning).

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - [2026-03-13] Hybrid Security (API middleware + RLS) — vẫn giữ, chỉ nới lỏng đúng điểm permission cho draft upload.
  - [2026-03-16] Envelope-Based API Strategy — response format giữ nguyên.
  - [2026-04-01] Salary Data Isolation — không vi phạm vì fix này chỉ liên quan document upload.
- **"Cấm kỵ" cần tránh:**
  - KHÔNG nới lỏng permission cho các `document_type` khác ngoài `tuyen_moi`.
  - KHÔNG bỏ hoàn toàn permission check — vẫn phải verify user có ít nhất 1 quyền EA.
  - KHÔNG thay đổi `hasPermission()` helper trong shared (contract chung).
- **Ràng buộc kiến trúc liên quan:**
  - `documentService.ts` contract: "Chặn file > 5MB. Chỉ cho phép Image/PDF. Signed URL tối đa 3 phút."
  - `nginx.conf` là config deploy production — thay đổi cần rebuild Docker image.

## 4. Giả định và câu hỏi mở

### Giả định
- G1: Khi `document_type === 'tuyen_moi'` và `khoi` rỗng, chỉ cần verify user có ít nhất 1 entry EA trong `permissions[]` là đủ để cho upload nháp. Logic đầy đủ per-khối sẽ được enforce lại khi employee record được tạo (route `POST /api/employees`).
- G2: File rác từ upload nháp không bao giờ submit sẽ được dọn bởi cron job existing (`cron_cleanup_orphan.ts`).
- G3: Thay đổi CSP `img-src` thêm `blob:` là an toàn vì `blob:` URL chỉ tồn tại trong bộ nhớ trình duyệt hiện tại, không thể bị tải từ bên ngoài.

### Câu hỏi mở
- [Non-blocking] Có muốn bổ sung log/metric cho số lượng draft upload không bao giờ được submit để theo dõi file rác không?

## 5. Acceptance Criteria

- [ ] AC1: EA có thể upload ảnh giấy tờ tuyển dụng khi chưa chọn Khối trên form Tạo mới nhân sự (không còn lỗi 403).
- [ ] AC2: Thumbnail preview ảnh hiển thị đúng trên production (không còn CSP `img-src` block).
- [ ] AC3: Sau khi upload thành công, AI OCR vẫn hoạt động bình thường.
- [ ] AC4: Các loại `document_type` khác (ví dụ: `danh_gia_thu_viec`, `dieu_chinh_luong`) vẫn bị chặn nếu thiếu `khoi` hợp lệ — không bị nới lỏng theo.
- [ ] AC5: User không có quyền EA trên bất kỳ khối nào vẫn bị chặn upload (403).
- [ ] AC6: Unit test cover các case: EA upload tuyen_moi không khối (pass), EA upload tuyen_moi có khối (pass), VI upload tuyen_moi (reject), EA upload dieu_chinh_luong không khối (reject).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/services/documentService.ts` | Sửa | Nới lỏng permission check cho `tuyen_moi` draft upload khi `khoi` rỗng | 🟡 | Có (file-level contract) |
| `backend/src/routes/documents.ts` | Sửa nhỏ | Truyền thêm `document_type` vào hàm `generatePresignedUploadUrl()` để backend biết loại tài liệu | 🟢 | Không rõ |
| `frontend/nginx.conf` | Sửa | Thêm `blob:` vào CSP `img-src` | 🟢 | Không |
| `frontend/src/components/DocumentUpload.tsx` | Sửa | Cập nhật hàm gọi API `/documents/presign` để gửi thêm `document_type: 'tuyen_moi'` | 🟢 | Có (file-level contract) |

## 7. Risk Triage và Review Focus

- **Review required:** Yes (khuyến nghị)
- **Risk hotspots:**
  - `documentService.ts` — logic nới lỏng permission: cần đảm bảo chỉ áp dụng cho `tuyen_moi`, không vô tình mở rộng cho các document_type khác.
  - Logic "user có ít nhất 1 EA entry" phải kiểm tra đúng `permission_level === 'EA'`, không phải chỉ có entry (VI/VA cũng có entry).
- **Review focus areas:**
  - Liệu logic "has any EA permission" có tạo kẽ hở cho EA khối A upload tài liệu rồi gán cho nhân sự khối B không? → Không, vì `temp_uuid` chỉ là draft, quyền per-khối sẽ được kiểm tra tại thời điểm `POST /api/employees` (submit tạo nhân sự).
  - CSP `blob:` có rủi ro gì không? → Rất thấp, blob URL là bộ nhớ local browser.
- **Known pitfalls / historical issues:** Không tìm thấy tiền lệ tương tự trong changelog.
- **Dependencies / rollout concerns:** Cần rebuild và deploy cả backend Docker image (logic change) và frontend Docker image (nginx.conf change).

## 8. Chiến lược triển khai

- **Phase strategy:** 2 phase nhỏ
  - Phase 1: Backend + FE Request — sửa permission logic + cập nhật file-level contract + unit test
  - Phase 2: Infra/CSP — sửa nginx.conf + verify end-to-end
- **Thứ tự triển khai:**
  - Phase 1 dependency chain bắt buộc: Task 1.1 (route schema) → Task 1.2 (service presign + contract) → Task 1.3 (service metadata). Task 1.4 (FE request) có thể song song với 1.2/1.3.
  - Phase 2 sau Phase 1.
- **Điểm cần phối hợp:** Deploy cả BE và FE Docker images lên Cloud Run sau khi merge.
- **Yêu cầu migration / config / deploy:** Không cần DB migration. Chỉ cần redeploy BE + FE Docker images.

## 9. Test Strategy

- **Automated tests:**
  - Unit test `documentService.ts`: mock permission matrix, verify presign/metadata cho từng case (SuperAdmin, Reviewer, EA, VI).
  - Contract "thin route-level test": test validate schema `document_type` tại route `/documents/presign`.
- **Manual verification:**
  - Trên staging/production: EA login → vào `/employees/new` → upload ảnh JPG → verify presign thành công → xem thumbnail → chạy AI OCR → submit form hoàn chỉnh.
  - Verify user VI không thể upload (403).
  - Verify `document_type !== 'tuyen_moi'` không được nới lỏng.
- **Data / env chuẩn bị trước khi test:** Tài khoản EA có quyền trên ít nhất 1 khối. Tài khoản VI (chỉ xem). Tài khoản SA/Reviewer. File ảnh JPG < 5MB.

## 10. Rollback Plan

- Revert commit sửa `documentService.ts` và `nginx.conf`.
- Redeploy BE + FE images từ commit trước.
- Rủi ro rollback: Thấp — chỉ quay lại trạng thái lỗi cũ, không mất dữ liệu.

## 11. Review Notes

- **FR-01/02/03/04 (Vòng 1)**: Đã cấu trúc lại dependency chain `1.1 → 1.2 → 1.3`, cập nhật file-level contract, đánh dấu FE cross-layer. UX message giữ nguyên.
- **FR-05 [Cao - Đã đóng]**: Zod schema `document_type` được khai báo dạng `.optional()` kèm server-side fallback ở service layer, qua đó triệt tiêu triệt để rủi ro broken contract do FE bundle cache/trễ.
- **FR-06 [Khuyến nghị - Đã thêm]**: Bổ sung Task 1.6 viết Route test (Thin contract test) dùng `app.request()` để đảm bảo schema mapping từ Request body sang Service payload không hỏng.
- **FR-07 [Cải thiện]**: Bổ sung regression test cho case `is_superadmin` và `is_reviewer` vào Task 1.5.
- **FR-08**: Out of scope (gap cũ ở backend/src/services/employeeService.ts), không giữ lại blocker ở plan này.

## 12. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
