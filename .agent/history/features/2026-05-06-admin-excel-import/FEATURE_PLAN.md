# Feature Plan: Migrate Dữ liệu (Nhân sự, Tiền lương & Người soát xét) từ Excel

> **Trạng thái**: ✅ ĐÃ DUYỆT (v11 - Sẵn sàng Coordinator)
> **Review gate**: Giải quyết triệt để 30 FRs Vòng 1-11 (Bẫy Header Multipart, Map lỗi Reviewer, Update Scripts Tạo Mẫu Excel cũ).
> **Feature slug**: admin-excel-import
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-06

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Nhập liệu khởi tạo hệ thống (Migration) sử dụng 2 nhóm file Excel mẫu. File gốc này được sinh ra bởi các script tạo nằm trong nhánh `docs`.
- **Mục tiêu:** Cung cấp tính năng "Import Migration" tại màn hình Admin cho phép tải lên và phân tích độc lập chuẩn file trên mà không phá vỡ pre-image.
- **Kết quả mong đợi:** SA có thể import hàng trăm nhân sự + lương + reviewer từ Excel trong một lần thao tác, với preview validation báo lỗi tường minh những User ID rác không tồn tại.

## 2. Phạm vi

### In scope
- **Vị trí Upload:** Tab mới "IMPORT MIGRATION" thuộc màn hình `AdminDashboard.tsx`.
- **File transport & Security:**
  - Định dạng: Gửi `multipart/form-data` qua browser với cơ chế bypass override thủ công Headers Content-Type.
  - Max Size Limit: Giới hạn File cứng 5MB ở gateway bằng middleware `@hono/body-limit`.
  - Content Guard: Bỏ qua sheet `HuongDan`, `GhiChu`.
- **Backend API (`/admin/migrate-bulk/preview` & `/admin/migrate-bulk/commit`)**: Frontend truyền theo path có prefix `/admin/migrate-bulk` để apiClient hook trúng endpoint thực tế của Backend. 
- **Tải Cả 2 File Mẫu (Static Assets Sync):** Script sinh file `docs/scripts/` sẽ được tùy biến lại content text. Sau đó Copy file về `frontend/public/templates/` lúc Build Container.
- **Mode xử lý (INSERT ONLY - Cấm ghi đè):** 
  - Block 1: Supabase `ON CONFLICT DO NOTHING`.
  - Block 2: Logic báo lỗi rác nếu Server Pipeline Lookup Mapper dò không ra `employee_id` gốc đối với `ma_nhan_su` ghi bậy. Với record nào check ra, Supabase sẽ chèn dùng `ignoreDuplicates: true` tuyệt đối.

### Out of scope
- Cập nhật, Thay thế Data đang sống. OCR documents. Cột Pending xử lý default `false`. Cột KhongCoNnt xử lý default `false`.

## 3. Đối chiếu Knowledge Base

- **KB: RLS Atomic Exemption [2026-04-06]**: Dùng thủ tục **SQL RPC function** (`bulk_import_block_1`) gom `INSERT` trong ruột Postgres. Hàm này `RETURNS UUID[]` mảng ID của Employee.
- **KB: State-driven Visibility Isolation [2026-04-06]**: Import trực tiếp thẳng lọt qua Phòng Chờ. Set `state_phong_cho = false`.

## 4. Giả định và câu hỏi mở

- Gỡ bỏ logic Override đè dữ liệu. Template Excel generator sẽ được sửa lại text để User hết hiểu lầm.

## 5. Acceptance Criteria

- [ ] FE Validate size + format. 
- [ ] Màn preview lọc rõ Data hợp lệ (xanh) và lỗi (đỏ). Nếu Reviewer chứa `ma_nhan_su` không tồn tại ở hệ thống, Preview sẽ bắn Đỏ ngay và báo Data Corrupt yêu cầu check lại (Ko chèn được List Reviewers vô data Rác).
- [ ] RPC DB Atomic giữ cho Record 2 bảng `Employee`+`Salary` kết dính chặt chẽ.
- [ ] UI Download Tải được mẫu excel File mà bên trong Text đã Update đổi Rule Ghi đè sang Insert Only.
- [ ] HTTP Request Client Frontend truyền đúng FormData với cơ chế tự set Header Boundary native của Browser thay vì đè lên JSON mặc định.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do | Rủi |
|-------------|-----------|-------|-----|
| `docs/scripts/create_employee_import_template.mjs` | Sửa | Chỉnh text HuongDan/GhiChu phù hợp với cơ chế mới Insert Only (cấm ghi đè). | 🟢 |
| `docs/scripts/create_reviewer_import_template.mjs` | Sửa | Chỉnh text Duplicate báo lỗi thành Skip Duplicate và check rõ báo đỏ. | 🟢 |
| `database/migrations/018_bulk_import_rpc_and_audit.sql` | Tạo Mới | Migration Schema function xử lý Block 1 Transaction. | 🔴 |
| `backend/src/routes/admin.ts` | Sửa | Route import `/migrate-bulk/x`, cắm `bodyLimit`. Validate field `mode="insert_only"`. | 🔴 |
| `backend/src/services/adminImportService.ts` | Tạo mới | Sheet filter OOM Guard. Filter Lookup Missing ma_nhan_su IDs. | 🔴 |
| `backend/src/services/auditService.ts` | Sửa | Thêm Union enum `'bulk_import'` cho tham số Action BE Helper. | 🟡 |
| `backend/package.json` | Sửa | Cài đặt `xlsx`, plugin ZipGuard và `@hono/body-limit`. | 🟢 |
| `packages/shared/src/schemas/admin.ts` | Sửa | Định nghĩa Constant `ADMIN_AUDIT_ACTIONS` và Zod Literal `bulk_import`. | 🟢 |
| `packages/shared/src/schemas/snapshot.ts` | Sửa | Update chung Enum Zod Source chứa logic Action cho nhất quán. | 🟢 |
| `packages/shared/src/schemas/index.ts` | Sửa | Khai báo Inner Export Barrel API. | 🟢 |
| `packages/shared/src/types/admin.ts` | Sửa | Trỏ thêm Literal string `'bulk_import'` tại Union FE `AdminAuditAction`. | 🟢 |
| `packages/shared/src/types/index.ts` | Sửa | Khai báo Inner Export Barrel Types FE. | 🟢 |
| `frontend/src/services/api.ts` | Sửa | Bổ sung Fetch module `uploadMultipart`. Delete Header Default application/json. | 🟡 |
| `frontend/package.json` | Sửa | Khai báo `vite-plugin-static-copy` DevDependencies. | 🟢 |
| `frontend/vite.config.ts` | Sửa | Khai cấu hình plugin auto-copy /docs/templates sang /public/. | 🟢 |
| `frontend/Dockerfile` | Sửa | Trỏ lệnh `COPY docs/templates/ ./docs/templates/` vào Container Source. | 🔴 |
| `frontend/src/pages/Admin/tabs/ExcelImportTab.tsx` | Tạo mới | Layout State Quản lý File Buffer UI. Link 2 Templates. | 🟢 |
| `frontend/src/pages/Admin/AdminDashboard.tsx` | Sửa | Mount UI component. | 🟡 |

## 7. Risk Triage và Review Focus
- Database UUID Lookup Mapper Missing Drop Silent Risks.
- Form Data HTTP native Content-Type Override Defaults.
- Static Document Scripts Output mismatches real backend pipeline rules.

## 8. Chiến lược triển khai
- Phase 1: Shared Core và Lõi DB (Migration RPC, Zod Csts, Script Templates Updates).
- Phase 2: Parser Service (Mapper Missing Validations, Upsert Strict, Hono limits).
- Phase 3: Setup Frontend (Docker File COPY, Base URL FormData fetch, UI Mounts).

## 9. Test Strategy
- Chạy lại các file mjs từ `docs` để sinh Template Mực tươi, check String kết quả không còn chữ "Ghi đè".
- Gửi file Data bẩn Reviewer (ma_nhan_su: X_KHONG_TON_TAI) lên Dropzone, Server check Table trả màu đỏ chặn đứng không cho phép Commit file này.

## 10. Rollback Plan
- Thu thập JSON Details Object `{ inserted_employee_ids, inserted_reviewer_ids }`. ID nào được Import thành công mới được List. Bỏ qua ID Trash. Delete From Table.

## 11. Tham chiếu
- Checklist chi tiết: `FEATURE_TASKS.md`
