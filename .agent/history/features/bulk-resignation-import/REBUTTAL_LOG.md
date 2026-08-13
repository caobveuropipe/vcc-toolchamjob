# Rebuttal Log - bulk-resignation-import

## Round 1 - 2026-07-17T11:06:00+07:00

### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - `EXPERT_REVIEW.md`
  - `FEATURE_PLAN.md`
  - `FEATURE_TASKS.md`
  - `docs/business-flows/04-nghi-viec.md`
  - `.agent/business/data/STATE_MACHINES.md`

### EFR Đã Chấp Nhận
- **[EFR-01]: Direct-live bulk resignation is an undocumented exception to the pending workflow**
  - *Sửa:* Cập nhật mục 1 (Bối cảnh và mục tiêu) trong `FEATURE_PLAN.md` để ghi nhận ngoại lệ nghiệp vụ cập nhật trực tiếp live đã được User phê duyệt rõ ràng cùng các chốt chặn bù đắp (Anti-drift lock, terminal state block).
- **[EFR-02]: Atomic transaction design is not anchored to an RPC or migration**
  - *Sửa:* Đưa thiết kế Multi-table write sử dụng PostgreSQL RPC (`SECURITY DEFINER`) vào ràng buộc kiến trúc ở mục 3 trong `FEATURE_PLAN.md`, đồng thời bổ sung Task 1.1 tạo DB migration SQL cho RPC này trong `FEATURE_TASKS.md`.
- **[EFR-03]: Preview and confirm phases do not require revalidation at commit time**
  - *Sửa:* Bổ sung ràng buộc revalidate 100% dữ liệu ở bước Confirm tại mục 5 (Acceptance Criteria) trong `FEATURE_PLAN.md` và chi tiết hóa trong Task 1.3 tại `FEATURE_TASKS.md`.
- **[EFR-04]: Duplicate employee rows and idempotency are not specified**
  - *Sửa:* Thêm kiểm tra trùng lặp `ma_nhan_su` trong file upload vào phần validate tại mục 2 (Phạm vi) và mục 5 (Acceptance Criteria) trong `FEATURE_PLAN.md`, bổ sung Task 1.1 trong `FEATURE_TASKS.md`.
- **[EFR-05]: Upload contract, route hardening, and test coverage are underspecified**
  - *Sửa:* Chi tiết hóa API contract (JSON payload parsed client-side), cấu hình Route Hardening (size limit, placement, rate limiters) ở mục 2 (Phạm vi) trong `FEATURE_PLAN.md` và bổ sung các test cases tiêu cực chi tiết (cross-block EA denial, lock period, duplicate, race-condition rollback) trong mục 9 (Test Strategy) và Task 1.Final trong `FEATURE_TASKS.md`.

### Vùng đã scan khi không có SFR
- `backend/src/routes/employees.ts:1-55` (Xem xét cách cấu hình rate limiters và middleware phân quyền cho routes nhân sự hiện tại).
- `backend/src/services/employeeService.ts:840-899` (Xác thực cách thức RPC được gọi và viết audit logs trong các luồng hiện tại).

## Round 2 - 2026-07-17T11:09:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md`
  - `FEATURE_PLAN.md`
  - `FEATURE_TASKS.md`
  - `backend/src/lib/supabase.ts`
  - `backend/src/middleware/permission.ts`

### EFR Đã Chấp Nhận
- **[EFR-01]: RPC permission check dựa vào auth.uid() không khớp backend service-role boundary**
  - *Sửa:* Cập nhật mục 7 (Risk Triage) trong `FEATURE_PLAN.md` và Task 1.1 trong `FEATURE_TASKS.md` để loại bỏ việc dùng `auth.uid()` trong RPC. Thay vào đó, RPC sẽ nhận email actor (`p_actor_email`) truyền từ backend và tra cứu quyền trong DB, đồng thời thu hồi quyền execute của public/authenticated và chỉ grant cho `service_role`.

### Vùng đã scan khi không có SFR
- `backend/src/lib/supabase.ts:1-14` (Kiểm chứng client sử dụng `service_role`).
- `backend/src/middleware/permission.ts:37-127` (Kiểm chứng cách phân quyền qua context của Hono).

## Round 3 - 2026-07-17T11:14:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md`
  - `FEATURE_PLAN.md`
  - `FEATURE_TASKS.md`
  - `packages/shared/src/constants/state-machine.ts`

### EFR Đã Chấp Nhận
- **[EFR-01]: Rollback plan chỉ rollback deploy, chưa có kế hoạch hoàn tác dữ liệu live đã chuyển sang nghi_viec**
  - *Sửa:* Cập nhật mục 10 (Rollback Plan) trong `FEATURE_PLAN.md` để bổ sung giải pháp Data Compensation (lưu old values trong dữ liệu chi tiết của Audit Log) và quy trình hoàn tác dữ liệu thủ công của SA. Thêm Task 3.2 trong `FEATURE_TASKS.md` để xây dựng, kiểm thử script SQL hoàn tác này và ghi nhận tài liệu hướng dẫn vận hành cho SA.

### Vùng đã scan khi không có SFR
- `packages/shared/src/constants/state-machine.ts:3-7` (Xác thực `nghi_viec` là terminal state).

