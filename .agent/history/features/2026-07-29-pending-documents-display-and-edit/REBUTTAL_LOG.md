# Rebuttal Log: pending-documents-display-and-edit

## Round 1 - 2026-07-24T15:50:00+07:00
### Tổng kết
- EFR: 6 (accepted: 6, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-68`, `FEATURE_PLAN.md:1-120`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-01]: Fetch tài liệu trong component dùng chung chưa được giới hạn theo workflow | Sửa: Thêm param `document_type` lọc server-side & client-side trong `getPendingDocuments` và `DocumentUpload`.
### EFR Đã Chấp Nhận -> [EFR-02]: Contract xóa hiện tại không đáp ứng yêu cầu audit và xóa nhất quán DB/R2 | Sửa: Đưa backend deletion contract vào scope, bổ sung Audit Log `recordAuditLog` cho `DELETE /api/documents/:id` và xử lý fail-closed.
### EFR Đã Chấp Nhận -> [EFR-03]: Mô hình state và `temp_uuid` chưa đủ cho danh sách nhiều tài liệu | Sửa: Quy định state machine (`serverDocuments[]`, `localFileList[]`, `isDeletingMap`, `activeTempUuid`) trong `DocumentUpload` và `SalaryEditModal`.
### EFR Đã Chấp Nhận -> [EFR-04]: Test strategy và task breakdown chưa kiểm chứng hành vi phá hủy/phân quyền | Sửa: Bổ sung integration test tasks cho backend (`getPendingDocuments` filter, deletion audit) và manual test matrix.
### EFR Đã Chấp Nhận -> [EFR-05]: Quyền xem tài liệu chưa có predicate thống nhất | Sửa: Định nghĩa predicate `canViewPendingDocuments` (`is_superadmin || is_ea_khoi || is_reviewer_of_employee`), cấm Role VA/VI trên UI và API.
### EFR Đã Chấp Nhận -> [EFR-06]: Contract xem/tải file trong plan còn mơ hồ so với API thực tế | Sửa: Làm rõ flow tải 2 bước (gọi API lấy `downloadUrl` -> `window.open`) tránh popup blocker và không hiển thị JSON thô.

---

## Round 2 - 2026-07-24T16:01:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-44`, `FEATURE_PLAN.md:1-120`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-07]: Mapping `documentType` mới vẫn làm trống modal TMP và sai workflow transfer | Sửa: Nâng cấp `DocumentUploadProps` hỗ trợ `documentType?: DocumentType | DocumentType[]`.
### EFR Đã Chấp Nhận -> [EFR-08]: “Fail-closed + recordAuditLog” chưa bảo đảm consistency hoặc audit bắt buộc | Sửa: Đổi thứ tự sang DB-first delete trước rồi mới trigger R2 object cleanup.
### EFR Đã Chấp Nhận -> [EFR-09]: Verification contract không thực thi được như plan tuyên bố | Sửa: Định rõ lệnh test thực thi được cho Backend Unit test, Backend Integration test và FE typecheck/build.

---

## Round 3 - 2026-07-24T16:11:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-120`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-10]: Prop multi-type sẽ gửi array vào upload API chỉ nhận scalar | Sửa: Tách `filterDocumentTypes?: DocumentType[]` và `uploadDocumentType?: DocumentType`.
### EFR Đã Chấp Nhận -> [EFR-11]: Ẩn UI/list không chặn VA tải tài liệu qua API trực tiếp | Sửa: Cập nhật `checkDocumentAuthz` cho pending documents để chặn VA/VI 403 cả ở API direct download.
### EFR Đã Chấp Nhận -> [EFR-12]: DB-first + “background cleanup” chưa có cơ chế durable và audit vẫn best-effort | Sửa: Đảm bảo Strict Audit Log và ghi log audit `r2_cleanup_failed` nếu R2 cleanup gặp lỗi.
### EFR Đã Chấp Nhận -> [EFR-13]: Delete integration test vẫn chưa được cô lập khỏi R2 thật | Sửa: Thêm `vi.mock('@aws-sdk/client-s3')` trong `backend/src/__tests__/integration/employee.test.ts`.

---

## Round 4 - 2026-07-24T16:40:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-120`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-14]: Đổi props `DocumentUpload` chưa migrate các consumer hiện hữu | Sửa: Thêm `EmployeeForm.tsx` và `ProbationEvaluationModal.tsx` vào scope migration 100% consumers.
### EFR Đã Chấp Nhận -> [EFR-15]: Strict Audit chưa có thứ tự đảm bảo “không xóa nếu không audit” | Sửa: Tạo helper riêng `recordAuditLogStrict` trong `auditService.ts` (throw error khi insert fail).
### EFR Đã Chấp Nhận -> [EFR-16]: Test plan chưa cover chính API bypass `GET /documents/:id` cho pending document | Sửa: Bổ sung integration test cases trong `employee.test.ts` kiểm thử trực tiếp gate 403 cho VA/VI khi tải pending documents qua API direct.
### EFR Đã Chấp Nhận -> [EFR-17]: `r2_cleanup_failed` chỉ là marker, chưa có quy trình thực sự dọn object mồ côi | Sửa: Làm rõ contract xóa DB-first + S3 DeleteObject đồng bộ, ghi vết durable `r2_cleanup_failed: true`.

---

## Round 5 - 2026-07-24T16:47:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-44`, `FEATURE_PLAN.md:1-120`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-18]: Transfer và probation vẫn thiếu filter mapping khi fetch server documents | Sửa: Khai báo cặp đầy đủ `uploadDocumentType` và `filterDocumentTypes` cho cả 3 consumers.
### EFR Đã Chấp Nhận -> [EFR-19]: `temp_uuid IS NOT NULL` không nhận diện hết pending documents của TMP | Sửa: Chuẩn hóa predicate pending document trong `checkDocumentAuthz` thành `doc.temp_uuid != null || (employee.state_phong_cho === true && employee.ma_nhan_su?.startsWith('TMP'))`.
### EFR Đã Chấp Nhận -> [EFR-20]: S3 cleanup failure vẫn không có completion path | Sửa: Làm rõ contract xóa là DB-first delete + Best-effort S3 DeleteObject đồng bộ.

---

## Round 6 - 2026-07-24T17:00:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-48`, `FEATURE_PLAN.md:1-120`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-21]: Đồng bộ UUID của tài liệu server với UUID mà consumer gửi khi submit | Sửa: Bổ sung callback `onDocumentsChange({ hasDocuments, activeTempUuid, count })` trong `DocumentUpload.tsx` và đồng bộ `activeTempUuid` về 3 parent consumers.

---

## Round 7 - 2026-07-24T17:04:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-120`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-22]: Fallback sang UUID ngẫu nhiên khi server document có `temp_uuid = null` vẫn tạo payload không có chứng từ | Sửa: Đảm bảo `DocumentUpload` luôn assign/cung cấp `activeTempUuid` session hợp lệ và parent dùng UUID này cho submit payload.
### EFR Đã Chấp Nhận -> [EFR-23]: Một `activeTempUuid` không biểu diễn được danh sách server documents thuộc nhiều UUID/workflow | Sửa: Nâng cấp `onDocumentsChange` trả về `tempUuidsByWorkflow: Record<DocumentType, string | null>` và parent chọn đúng UUID tương ứng với workflow của mình.
### EFR Đã Chấp Nhận -> [EFR-24]: Contract authorization của UUID không nhất quán — Salary chặn reuse hợp lệ, Transfer/Probation cho phép rebind UUID ngoại lai | Sửa: Bổ sung Backend Document Binding Authorization Validator: cho phép EA cùng khối reuse doc của đồng nghiệp trên cùng 1 nhân sự (Cross-actor 200 OK), chặn 403/409 khi cố bind `temp_uuid` thuộc về nhân sự khác (Cross-employee).

---

## Round 8 - 2026-07-24T17:07:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-126`, `FEATURE_TASKS.md:1-46`

### EFR Đã Chấp Nhận -> [EFR-25]: “Gán session UUID” cho document có UUID null chưa có persistence path | Sửa: Tự động gán & persist `temp_uuid` ngẫu nhiên mới trong DB cho các tài liệu server cũ có `temp_uuid IS NULL` khi `getPendingDocuments` được gọi.
### EFR Đã Chấp Nhận -> [EFR-26]: Binding Validator chưa định nghĩa unbound ownership và workflow type | Sửa: Bổ sung Backend Document Binding Authorization Validator Matrix chi tiết: Unbound document (`employee_id IS NULL`) chỉ cho phép `created_by === actorEmail` (hoặc SA) bind; Bound document (`employee_id IS NOT NULL`) chỉ cho phép reuse trên cùng `target_employee_id`; cấm re-tag `document_type` của doc đã tồn tại.
### EFR Đã Chấp Nhận -> [EFR-27]: `tempUuidsByWorkflow` vẫn mất thông tin khi cùng workflow có nhiều UUID | Sửa: Truyền `preferredTempUuid` từ pending record (ví dụ `pending_salary._temp_uuid`) xuống `DocumentUpload` để ưu tiên UUID active khi có nhiều đợt upload trong cùng một workflow.

---

## Round 9 - 2026-07-24T17:13:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-135`, `FEATURE_TASKS.md:1-49`

### EFR Đã Chấp Nhận -> [EFR-28]: Persist `temp_uuid` trong GET làm sai lifecycle pending và tạo UUID không được pending record tham chiếu | Sửa: Đảm bảo `GET /api/employees/:id/pending-documents` là API thuần túy READ-ONLY & IDEMPOTENT.
### EFR Đã Chấp Nhận -> [EFR-29]: “Cấm re-tag” chưa đồng nghĩa với chặn document sai workflow type | Sửa: Bổ sung `expectedDocumentTypes` validation cho từng submit path.
### EFR Đã Chấp Nhận -> [EFR-30]: `preferredTempUuid` của Probation không tồn tại trong data shape và workflow hiện tại | Sửa: Loại bỏ `preferredTempUuid={pendingChanges._temp_uuid}` khỏi `ProbationEvaluationModal.tsx`.

---

## Round 10 - 2026-07-24T17:25:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-136`, `FEATURE_TASKS.md:1-49`

### EFR Đã Chấp Nhận -> [EFR-31]: Manual scenario của Probation vẫn trái với contract “session đánh giá mới” | Sửa: Tách biệt manual matrix scenario cho Probation.
### EFR Đã Chấp Nhận -> [EFR-32]: `expectedDocumentTypes` đang quá rộng và không nhất quán theo mode/employee state | Sửa: Bổ sung Context-Aware `expectedDocumentTypes`.
### EFR Đã Chấp Nhận -> [EFR-33]: Sau khi GET trở lại read-only, UUID-null server document lại không có reuse contract | Sửa: Làm rõ contract hiển thị/tải/xóa cho tài liệu cũ `temp_uuid = null`.

---

## Round 11 - 2026-07-24T17:30:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-140`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-34]: Callback chưa phân biệt document hiển thị với evidence đủ điều kiện submit | Sửa: Nâng cấp signature callback `onDocumentsChange` với `hasBindableEvidence`.
### EFR Đã Chấp Nhận -> [EFR-35]: Binding Validator chưa quy định validate toàn bộ document rows cùng một `temp_uuid` | Sửa: Bổ sung quy định Full Group Check.
### EFR Đã Chấp Nhận -> [EFR-36]: Ngoại lệ `tuyen_moi` cho Salary TMP chưa gắn với predicate new-hire và UUID pending active | Sửa: Siết chặt predicate cho phép `tuyen_moi` trong salary edit.

---

## Round 12 - 2026-07-24T17:35:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-145`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-37]: “Full Group transaction” chưa có atomic implementation boundary | Sửa: Thực thi Full Group Check và binding bằng exact `id` array (`WHERE id = ANY($1) AND temp_uuid = $2`) trong cùng single DB transaction.
### EFR Đã Chấp Nhận -> [EFR-38]: Upload API cho phép client làm nhiễm một `temp_uuid` group đã tồn tại | Sửa: Bổ sung Upload Boundary check trong `saveDocumentMetadata`.
### EFR Đã Chấp Nhận -> [EFR-39]: Hard-gate Salary theo `hasBindableEvidence` làm mất flow “vẫn lưu không có chứng từ” hiện hữu | Sửa: Phân định chính sách Submit theo consumer: `EmployeeForm` & `ProbationEvaluationModal` hard-gate; `SalaryEditModal` soft-gate cảnh báo `needDocWarn`.

---

## Round 13 - 2026-07-24T17:38:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-150`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-40]: Atomic binding vẫn chưa có RPC/migration thực thi transaction thật | Sửa: Bổ sung SQL Migration `database/migrations/045_validate_and_bind_document_group.sql` chứa RPC `validate_and_bind_document_group`.
### EFR Đã Chấp Nhận -> [EFR-41]: Collision check chưa chạy trước presign nên vẫn tạo orphan R2 object | Sửa: Thực thi Upload Boundary Check ngay từ bước `generatePresignedUploadUrl` (`POST /api/documents/presign`).
### EFR Đã Chấp Nhận -> [EFR-42]: Rule `created_by` collision xung đột với flow bound cross-actor upload thay thế | Sửa: Phân định Upload Boundary Check cho Unbound vs Bound `temp_uuid`.

---

## Round 14 - 2026-07-24T17:42:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-155`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-43]: Atomic bind RPC vẫn tách khỏi transaction lưu pending của từng workflow | Sửa: Cập nhật SQL Migrations `026_save_personnel_pending_rpc.sql` và `027_fn_evaluate_probation.sql` để tích hợp Full Group Document Validation & Binding trực tiếp vào CÙNG 1 TRANSACTION DUY NHẤT.
### EFR Đã Chấp Nhận -> [EFR-44]: Presign boundary vẫn là check-then-act, không reserve UUID và không có orphan lifecycle | Sửa: Thực thi Presign Atomic Session Reservation trong `generatePresignedUploadUrl` (`POST /api/documents/presign`).
### EFR Đã Chấp Nhận -> [EFR-45]: RPC mới chưa có quyền EXECUTE và trusted-parameter contract | Sửa: Thêm `SECURITY DEFINER SET search_path = public`, `REVOKE ALL FROM PUBLIC, anon, authenticated` và `GRANT EXECUTE TO service_role`.

---

## Round 15 - 2026-07-24T17:49:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-160`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-46]: Reservation row không có trạng thái ready/expiry nên bị coi là document thật trước khi upload hoàn tất | Sửa: Tạo Forward SQL Migration `045_add_upload_status_to_employee_documents.sql` bổ sung cột `upload_status` (`'reserved'`, `'ready'`, `'failed'`) và `expires_at`.
### EFR Đã Chấp Nhận -> [EFR-47]: `saveDocumentMetadata` chưa có finalize/idempotency contract cho row đã reserve | Sửa: Cập nhật Metadata API (`POST /api/documents`): UPDATE chuyển trạng thái từ `'reserved'` sang `'ready'` đối với bản ghi đã presign.
### EFR Đã Chấp Nhận -> [EFR-48]: Workflow transaction được gán vào migration lịch sử và Salary chưa có forward SQL migration | Sửa: Tạo Forward SQL Migration `046_update_workflow_binding_rpcs.sql` chứa `CREATE OR REPLACE FUNCTION` cho `save_personnel_pending`, `fn_evaluate_probation` và `save_salary_pending_with_docs`.

---

## Round 16 - 2026-07-24T17:55:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-165`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-49]: Migration trạng thái upload chưa có backfill/default cho dữ liệu hiện hữu | Sửa: Bổ sung `DEFAULT 'ready'` và script backfill `UPDATE employee_documents SET upload_status = 'ready' WHERE upload_status IS NULL;` trong Forward Migration `045_add_upload_status_to_employee_documents.sql`.
### EFR Đã Chấp Nhận -> [EFR-50]: Finalize vẫn có thể đánh dấu `ready` khi object R2 chưa tồn tại | Sửa: Bổ sung kiểm tra `HeadObjectCommand` tới S3/R2 trong `saveDocumentMetadata` (`POST /api/documents`).
### EFR Đã Chấp Nhận -> [EFR-51]: `expires_at` được thêm nhưng không có cơ chế hết hạn/cleanup reservation | Sửa: Thực thi Lazy Expiry Cleanup trong `generatePresignedUploadUrl` và `getPendingDocuments`.

---

## Round 17 - 2026-07-24T17:59:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-170`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-52]: Lazy cleanup trên fetch mâu thuẫn trực tiếp với invariant GET read-only | Sửa: Làm rõ ranh giới Lazy Expiry Cleanup CHỈ ĐƯỢC CHẠY trong mutating boundary (`POST /api/documents/presign`).
### EFR Đã Chấp Nhận -> [EFR-53]: “Atomic Session Reservation” chưa có primitive DB chống concurrent first-writer race | Sửa: Áp dụng `pg_advisory_xact_lock` khoá `temp_uuid` trong `generatePresignedUploadUrl` (`POST /api/documents/presign`).
### EFR Đã Chấp Nhận -> [EFR-54]: Finalize chưa ràng buộc reservation còn hiệu lực và có thể race với cleanup | Sửa: Thực thi Conditional UPDATE từ `'reserved'` sang `'ready'` kèm điều kiện `expires_at >= NOW()`.
### EFR Đã Chấp Nhận -> [EFR-55]: Mọi lỗi `HeadObject` bị quy thành 400, che khuất sự cố R2 tạm thời | Sửa: Phân định chi tiết Error Taxonomy khi gọi `HeadObject` (400 vs 502/503).

---

## Round 18 - 2026-07-24T18:02:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-175`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-56]: `pg_advisory_xact_lock` chưa được đặt trong cùng DB transaction với check/cleanup/insert reservation | Sửa: Tạo SQL RPC `reserve_document_upload` trong Migration `045` thực thi `pg_advisory_xact_lock`, check ownership, cleanup và insert reservation trong 1 DB transaction duy nhất.
### EFR Đã Chấp Nhận -> [EFR-57]: `HeadObject` đang kiểm tra key do client gửi, chưa chứng minh đúng object đã được reservation cấp | Sửa: Presign API trả về `documentId`. Finalize API nhận `documentId`, nạp `r2_object_key` bất biến lưu từ DB reservation row để gọi `HeadObjectCommand` tới S3/R2.
### EFR Đã Chấp Nhận -> [EFR-58]: Giới hạn 5MB vẫn có thể bị bypass vì finalize không so `HeadObject.ContentLength` | Sửa: Trong `saveDocumentMetadata`, xác minh `headResult.ContentLength <= 5MB` và khớp kích thước đăng ký trước khi finalize status sang `'ready'`.
### EFR Đã Chấp Nhận -> [EFR-59]: Expiry cleanup chỉ chuyển DB sang `'failed'`, chưa có lifecycle dọn object R2 mồ côi | Sửa: Thực thi best-effort `DeleteObjectCommand` cho `r2_object_key` khi chuyển bản ghi reservation quá hạn sang `'failed'`.

---

## Round 19 - 2026-07-24T18:06:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-50`, `FEATURE_PLAN.md:1-180`, `FEATURE_TASKS.md:1-50`

### EFR Đã Chấp Nhận -> [EFR-60]: Frontend upload flow chưa được giao task chuyển từ `objectKey` sang `documentId` | Sửa: Cập nhật Task 2.1 trong `FEATURE_TASKS.md` và `FEATURE_PLAN.md`: `DocumentUpload.tsx` nhận `{ uploadUrl, documentId }` từ Presign API và gửi `{ documentId }` trong payload POST `/api/documents`.
### EFR Đã Chấp Nhận -> [EFR-61]: Finalize bằng `documentId` chưa giữ contract idempotency khi response đầu tiên bị mất | Sửa: Cập nhật Metadata API (`POST /api/documents`): Nếu bản ghi đã ở trạng thái `'ready'`, trả về 200 OK một cách Idempotent mà không thực hiện gọi lại S3.
### EFR Đã Chấp Nhận -> [EFR-62]: Presign retry hiện hữu không có idempotency key và sẽ tạo reservation trùng | Sửa: Khai báo cột `client_attempt_id` trong Migration `045` và SQL RPC `reserve_document_upload`: nếu client retry presign cùng `clientAttemptId`, RPC trả lại cùng `documentId` một cách Idempotent.
### EFR Đã Chấp Nhận -> [EFR-63]: Best-effort expiry `DeleteObject` không có failure state nên không thể retry | Sửa: Ghi log audit `r2_cleanup_failed: true` kèm `r2_object_key` nếu thao tác `DeleteObjectCommand` gặp sự cố S3 khi dọn dẹp bản ghi reservation quá hạn.

---

## Round 20 - 2026-07-24T18:09:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md:1-50`
  - `FEATURE_PLAN.md:1-185`
  - `FEATURE_TASKS.md:1-50`
  - `database/migrations/006_create_employee_documents_table.sql:3-18`
  - `backend/src/routes/documents.ts:25-73`
  - `backend/src/services/documentService.ts:36-95`

### EFR Đã Chấp Nhận -> [EFR-64]: `client_attempt_id` chưa có DB uniqueness và immutable replay scope | Sửa: Tạo partial unique index `idx_employee_docs_attempt` trên `(created_by, client_attempt_id) WHERE client_attempt_id IS NOT NULL` trong Migration `045`. SQL RPC `reserve_document_upload` kiểm tra khớp context trước khi trả lại `documentId` idempotent.
### EFR Đã Chấp Nhận -> [EFR-65]: Finalize/idempotent-ready chưa bắt buộc authorize `documentId` trước khi đọc/trả document | Sửa: Thực thi Row-Derived Authorization FIRST trong Metadata API (`POST /api/documents`): Nạp bản ghi `documentId` từ DB và kiểm tra quyền actor TRƯỚC TIÊN (trả 403 Forbidden nếu thiếu quyền) trước khi đánh giá status `'ready'` hay gọi S3.
### EFR Đã Chấp Nhận -> [EFR-66]: Presign vẫn cho phép thiếu `document_type` dù reservation insert vào cột `NOT NULL` | Sửa: Cập nhật Zod validation trong `POST /api/documents/presign` bắt buộc `documentType` là scalar enum non-optional, trả 400 Bad Request nếu thiếu.
### EFR Đã Chấp Nhận -> [EFR-67]: Audit log cho expiry cleanup failure vẫn không tạo retry path | Sửa: Khai báo cột `r2_cleanup_failed BOOLEAN DEFAULT false` trong Migration `045`. Cập nhật `r2_cleanup_failed = true` trong DB nếu S3 `DeleteObjectCommand` thất bại trong lượt lazy cleanup để các đợt scan sau truy vấn và retry.

### Vùng đã scan khi không có SFR -> `backend/src/routes/documents.ts`, `backend/src/services/documentService.ts`, `database/migrations/006_create_employee_documents_table.sql`.

---

## Round 21 - 2026-07-29T11:24:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-55`, `FEATURE_PLAN.md:1-232`, `FEATURE_TASKS.md:1-77`

### EFR Đã Chấp Nhận -> [EFR-68]: Strict Audit không thể fail-closed nếu delete và audit là hai transaction rời | Sửa: Xóa DB metadata và ghi Strict Audit Log trong cùng một DB Transaction/RPC (`delete_document_and_audit`) để đảm bảo fail-closed.
### EFR Đã Chấp Nhận -> [EFR-69]: Reviewer có thể xóa trực tiếp tài liệu dù plan chỉ cấp quyền xem/tải | Sửa: Cập nhật `checkDocumentAuthz` để Reviewer chỉ có quyền xem/tải (mode='read'), và bị chặn 403 khi xóa/ghi (mode='write').
### EFR Đã Chấp Nhận -> [EFR-70]: `r2_cleanup_failed` chỉ là marker; state machine không có query/retry cho row đã chuyển sang `failed` | Sửa: Cập nhật Expiry Cleanup quét cả expired `'reserved'` và `'failed'` + `r2_cleanup_failed = true` để thực hiện retry dọn dẹp R2.
### EFR Đã Chấp Nhận -> [EFR-71]: Advisory lock theo `temp_uuid` không serialize idempotency race theo `clientAttemptId` khác context | Sửa: `reserve_document_upload` sử dụng advisory lock dựa trên hash của `(created_by, client_attempt_id)` nếu có `client_attempt_id` để tránh race condition ném lỗi 500.
### EFR Đã Chấp Nhận -> [EFR-72]: Wire contract `documentType` trong plan xung đột với `document_type` mà route và frontend hiện hành đang dùng | Sửa: Cập nhật toàn bộ các file plan/tasks và wire contract thống nhất sử dụng snake_case `document_type`.

---

## Round 22 - 2026-07-29T11:32:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-56`, `FEATURE_PLAN.md:1-240`, `FEATURE_TASKS.md:1-77`

### EFR Đã Chấp Nhận -> [EFR-73]: Reviewer vẫn có thể ghi/upload qua Presign dù fix EFR-69 tuyên bố Reviewer chỉ read-only | Sửa: Chặn Reviewer ghi/upload tại cả Presign và Finalize write boundary, trả về 403 Forbidden.
### EFR Đã Chấp Nhận -> [EFR-74]: Xóa metadata trước S3 làm mất retry source cho R2 cleanup failure của thao tác DELETE | Sửa: Tạo bảng outbox `r2_cleanup_queue` để chèn key trước khi xóa metadata atomically trong RPC `delete_document_and_audit`, để Expiry Cleanup quét dọn dẹp sau đó.
### EFR Đã Chấp Nhận -> [EFR-75]: RPC `delete_document_and_audit` chưa có security/grant contract và direct-invocation test riêng | Sửa: Thiết lập `SECURITY DEFINER SET search_path = public`, `REVOKE ALL`, và `GRANT EXECUTE TO service_role` cho RPC xóa mới.
### EFR Đã Chấp Nhận -> [EFR-76]: Fix snake_case EFR-72 chưa được áp dụng nhất quán trong plan/tasks/test matrix | Sửa: Quét và cập nhật toàn bộ các references thành `document_type` trong plan, tasks, và manual/integration test matrices.
### EFR Đã Chấp Nhận -> [EFR-77]: Task/test Finalize không bắt buộc `ContentLength` khớp `size_bytes` đã reservation | Sửa: Thêm kiểm tra so sánh `ContentLength` của file thực tế phải trùng khớp với `size_bytes` đăng ký ban đầu tại Finalize API.

---

## Round 23 - 2026-07-29T11:41:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-43`, `FEATURE_PLAN.md:1-241`, `FEATURE_TASKS.md:1-64`

### EFR Đã Chấp Nhận -> [EFR-78]: Fix Round 22 chưa được chuyển đầy đủ vào executable tasks và acceptance criteria | Sửa: Cập nhật chi tiết các Task 1.2, 1.3, 1.5, 1.6 và Acceptance Criteria để đặc tả cụ thể về outbox table, ContentLength khớp, và direct denial.
### EFR Đã Chấp Nhận -> [EFR-79]: Bảng `r2_cleanup_queue` mới không có RLS/direct-access hardening | Sửa: Bật RLS cho `r2_cleanup_queue` với deny-all policy `USING (false)`, và revoke privileges từ PUBLIC/anon/authenticated.
### EFR Đã Chấp Nhận -> [EFR-80]: Outbox retry không có liveness trigger độc lập | Sửa: Tích hợp việc quét dọn dẹp bảng outbox `r2_cleanup_queue` vào background cron script `backend/scripts/cron_cleanup_orphan.ts` định kỳ.

---

## Round 24 - 2026-07-29T11:44:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-44`, `FEATURE_PLAN.md:1-243`, `FEATURE_TASKS.md:1-65`

### EFR Đã Chấp Nhận -> [EFR-81]: `Task 1.1` bị nối vào dòng Mục tiêu, không còn là checkbox Markdown độc lập | Sửa: Chèn dòng trống và tách Task 1.1 thành checklist Markdown riêng.
### EFR Đã Chấp Nhận -> [EFR-82]: “Background cron” chưa có deployment/scheduling contract và không tồn tại trong production image | Sửa: Tạo endpoint Hono HTTP độc lập, bảo vệ bằng key và provision Cloud Scheduler qua deploy workflow.
### EFR Đã Chấp Nhận -> [EFR-83]: Cron hiện tại xóa DB metadata ngay cả khi R2 bulk delete thất bại hoặc partial-fail | Sửa: Refactor logic dọn dẹp resilient đối chiếu per-key success list trả về từ `Deleted` của S3.

---

## Round 25 - 2026-07-29T11:49:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-44`, `FEATURE_PLAN.md:1-250`, `FEATURE_TASKS.md:1-72`

### EFR Đã Chấp Nhận -> [EFR-84]: Cron endpoint sẽ bị `authMiddleware` chặn 401 trước khi kiểm tra `X-Health-Key` | Sửa: Đặt route `/api/cron/cleanup-orphans` độc lập tại hono app entry point bên ngoài wildcard auth middleware.
### EFR Đã Chấp Nhận -> [EFR-85]: Tái sử dụng `HEALTH_CHECK_KEY` cho destructive cleanup vi phạm least privilege | Sửa: Sử dụng dedicated `CRON_CLEANUP_KEY` trong env config và header `x-cron-cleanup-key` để xác thực destructive cleanup.
### EFR Đã Chấp Nhận -> [EFR-86]: Plan chưa giao task/IaC nào provision Cloud Scheduler thực tế | Sửa: Thêm bước provision Cloud Scheduler `gcloud scheduler jobs create/update` vào deploy workflow `.github/workflows/deploy-be.yml`.

---

## Round 26 - 2026-07-29T11:53:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-32`, `FEATURE_PLAN.md:1-251`, `FEATURE_TASKS.md:1-72`

### EFR Đã Chấp Nhận -> [EFR-87]: Fix EFR-84–86 chưa được đồng bộ vào affected-files map và automated test task | Sửa: Đồng bộ lại bảng files/modules của plan (thêm `index.ts`, `env.ts`, `deploy-be.yml`), chỉnh sửa test path thành `/api/cron/cleanup-orphans`, bổ sung mô tả và các cases test tương ứng trong Task 1.6.

---

## Round 29 - 2026-07-29T12:49:00+07:00
### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-49`, `FEATURE_PLAN.md:1-253`, `FEATURE_TASKS.md:1-87`

### EFR Đã Chấp Nhận -> [EFR-89]: Fire-and-forget `runLazySweepCleanup()` không được Cloud Run request-based CPU bảo đảm chạy xong | Sửa: Bắt buộc `await` hàm dọn dẹp trong request lifetime để bảo vệ CPU execution, giới hạn `LIMIT 5` records và set timeout ngắn 2s để tránh ảnh hưởng request user.
### EFR Đã Chấp Nhận -> [EFR-90]: Throttle Redis chưa có atomic `SET NX`; fallback in-memory không an toàn trên nhiều Cloud Run instances | Sửa: Dùng atomic Redis `SET NX EX` và fallback bằng cơ chế DB config table throttle (cập nhật timestamp atomic).
### EFR Đã Chấp Nhận -> [EFR-91]: Lazy Sweep chỉ có liveness khi phát sinh mutating traffic, không phải mọi User Traffic | Sửa: Xác định đây là opportunistic cleanup, lập Ops runbook/SLA dọn dẹp thủ công nếu outbox queue tích tụ quá 24h.
### EFR Đã Chấp Nhận -> [EFR-92]: Artefact Cloud Scheduler/machine endpoint cũ vẫn còn trong files map và test strategy sau khi đổi sang Lazy Sweep | Sửa: Loại bỏ toàn bộ các references về Cloud Scheduler, HTTP endpoint cron cũ, các key `CRON_CLEANUP_KEY` khỏi files table và test strategies.

---

## Round 30 - 2026-07-29T13:53:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-55`, `FEATURE_PLAN.md:1-259`, `FEATURE_TASKS.md:1-92`

### EFR Đã Chấp Nhận -> [EFR-93]: Fix Round 29 chưa được đồng bộ vào executable tasks, acceptance criteria và test strategy | Sửa: Đồng bộ lại Tasks và Acceptance Criteria, xóa bỏ in-memory fallback, cron endpoint và Scheduler tasks.
### EFR Đã Chấp Nhận -> [EFR-94]: Await maintenance chưa có failure-isolation contract, có thể làm sai kết quả API mutation chính | Sửa: Bọc sweep trong try/catch độc lập, lỗi sweep chỉ log và không làm ảnh hưởng đến response API chính.
### EFR Đã Chấp Nhận -> [EFR-95]: “Timeout 2 giây” chưa tạo bounded execution nếu không có cancellation thực sự | Sửa: Dùng AbortSignal.timeout(2000) cho R2 commands và SET statement_timeout = 2000 cho Postgres để ngắt triệt để promises ngầm.
### EFR Đã Chấp Nhận -> [EFR-96]: DB throttle fallback vẫn là hai phương án mơ hồ và không có schema/task/test triển khai | Sửa: Chốt phương án table `cleanup_state` (1 row) và SQL RPC `fn_try_claim_cleanup_sweep` để claim lock atomic.
### EFR Đã Chấp Nhận -> [EFR-97]: Ops fallback 24h chưa có cơ chế phát hiện hoặc nhịp vận hành nên chưa phải runbook khả thi | Sửa: Thêm chỉ dẫn chi tiết query checking, SLA threshold và alertTelegram khi hàng đợi quá 24h.

---

## Round 31 - 2026-07-29T13:57:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-55`, `FEATURE_PLAN.md:1-260`, `FEATURE_TASKS.md:1-92`

### EFR Đã Chấp Nhận -> [EFR-98]: Đồng bộ Round 30 vẫn chưa hoàn tất trong affected-files map và test strategy | Sửa: Đồng bộ bảng map file và test strategy của plan, thêm `cleanup_state` vào Migration 045, gỡ bỏ endpoint cron test.
### EFR Đã Chấp Nhận -> [EFR-99]: Redis primary và DB fallback là hai lease độc lập, có thể cấp quyền sweep đồng thời khi Redis lỗi cục bộ | Sửa: Sử dụng DB RPC `fn_try_claim_cleanup_sweep` làm authority duy nhất; Redis chỉ làm cache pre-filter không quyết định lease.
### EFR Đã Chấp Nhận -> [EFR-100]: `cleanup_state` và RPC throttle chưa có RLS/grant hardening | Sửa: Bật RLS deny-all và revoke table privileges cho `cleanup_state`. RPC `fn_try_claim_cleanup_sweep` định nghĩa `SECURITY DEFINER SET search_path = public`, revoke public execute và grant chỉ cho `service_role`.
### EFR Đã Chấp Nhận -> [EFR-101]: Contract `SET statement_timeout` không khả thi với Supabase REST client hiện tại | Sửa: Đưa cấu hình `SET statement_timeout = '2s'` trực tiếp vào SQL function/RPC level thay vì set ở connection client level.
### EFR Đã Chấp Nhận -> [EFR-102]: CLI Ops fallback chưa có contract drain backlog hoặc bypass request throttle/LIMIT 5 | Sửa: Thêm flag `bypassThrottle = true` và `limit = 100` chạy loop/page trong CLI script `cron_cleanup_orphan.ts` để giải phóng sạch backlog queue.

---

## Round 32 - 2026-07-29T14:03:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-43`, `FEATURE_PLAN.md:1-261`, `FEATURE_TASKS.md:1-98`

### EFR Đã Chấp Nhận -> [EFR-103]: Fix Round 31 chưa được đồng bộ vào executable tasks và acceptance criteria | Sửa: Đồng bộ lại các phần tasks, acceptance criteria và files map theo đúng DB-only authority lock, table RLS, và CLI loop drain.
### EFR Đã Chấp Nhận -> [EFR-104]: Ops SLA và CLI drain chỉ bao phủ outbox, bỏ sót reservation rows cần retry cleanup | Sửa: Cấu hình Ops check age dựa trên Union query của cả outbox queue và expired/failed documents; cập nhật CLI script thực hiện page-drain cả hai nguồn.
### EFR Đã Chấp Nhận -> [EFR-105]: Function-level `statement_timeout` chưa gắn với RPC chứa actual cleanup DB work | Sửa: Chuyển toàn bộ các logic thao tác select/update/delete của cleanup sweep từ Node/REST service vào các SQL RPC functions chuyên biệt (`fn_cleanup_expired_documents_batch` và `fn_cleanup_outbox_queue_batch`) được ghim cứng config `SET statement_timeout = '2s'`.

---

## Round 33 - 2026-07-29T14:12:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-43`, `FEATURE_PLAN.md:1-264`, `FEATURE_TASKS.md:1-99`

### EFR Đã Chấp Nhận -> [EFR-106]: Affected-files map vẫn còn contract Redis/in-memory và chưa giao các cleanup RPC mới | Sửa: Đồng bộ lại files map, liệt kê đầy đủ 3 RPCs mới trong Migration 045 và DB-only lock authority trong documentService.ts.
### EFR Đã Chấp Nhận -> [EFR-107]: Timeout 2 giây đang áp dụng riêng từng bước, không bảo đảm wall-clock deadline 2 giây cho toàn sweep | Sửa: Thiết lập cơ chế Elapsed Timeout Budget tính toán remaining budget ở mỗi bước để gán dynamic timeout cho DB/S3.
### EFR Đã Chấp Nhận -> [EFR-108]: Batch RPC và acknowledge RPC mâu thuẫn về mutation ordering trước S3, chưa có crash-safe state contract | Sửa: Thiết lập 2 batch RPCs dọn dẹp hoạt động thuần túy Read-only (không mutation trước S3), mọi update/delete dồn vào acknowledge RPC sau khi gọi S3 thành công để bảo đảm crash safety.

---

## Round 34 - 2026-07-29T14:17:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-37`, `FEATURE_PLAN.md:1-264`, `FEATURE_TASKS.md:1-101`

### EFR Đã Chấp Nhận -> [EFR-109]: Remaining-budget check vẫn không giới hạn DB RPC theo budget còn lại | Sửa: Cấu hình dynamic timeout client-side qua `AbortSignal.timeout(remainingBudget)` trên Supabase PostgREST RPC requests để Node tự động hủy request khi hết hạn.
### EFR Đã Chấp Nhận -> [EFR-110]: Crash-safe read-only batch fix chưa được đồng bộ vào core plan/acceptance | Sửa: Đồng bộ lại core plan mục 1.10 và acceptance L163 khẳng định batch RPCs là read-only và chỉ mutate khi gọi acknowledge RPC, đảm bảo crash-safety.

---

## Round 35 - 2026-07-29T16:10:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-31`, `FEATURE_PLAN.md:1-265`, `FEATURE_TASKS.md:1-102`

### EFR Đã Chấp Nhận -> [EFR-111]: Client-side RPC abort không giới hạn server transaction theo remaining budget | Sửa: Cho phép tất cả các cleanup SQL RPCs nhận đối số `p_timeout_ms INT` để thực thi `set_config('statement_timeout', LEAST(p_timeout_ms, 2000)::text, true)` ở ngay đầu transaction, đảm bảo PostgreSQL tự động hủy transaction và rollback nếu quá remaining budget thực tế.

---

## Round 36 - 2026-07-29T16:15:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: `EXPERT_REVIEW.md:1-31`, `FEATURE_PLAN.md:1-265`, `FEATURE_TASKS.md:1-103`

### EFR Đã Chấp Nhận -> [EFR-112]: Lease-claim RPC chưa nằm trong dynamic timeout budget của toàn sweep | Sửa: Đổi signature RPC claim lock thành `fn_try_claim_cleanup_sweep(p_interval_seconds INT, p_timeout_ms INT)` và thực thi dynamic `statement_timeout` ở ngay đầu transaction để đảm bảo row lock wait không làm trễ toàn bộ sweep. Client ở Node cũng áp dụng abort signal timeout tương ứng.
