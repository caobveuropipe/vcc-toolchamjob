# Feature Tasks: Merge Grouped Change History
<<<<<<< HEAD
> **Trạng thái**: ⏳ Chưa bắt đầu
=======
> **Trạng thái**: 🔄 Đang thực hiện
>>>>>>> e2f9a1e (fix(history): resolve VA document access and grouping bugs)
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-26 | Cập nhật: 2026-05-27 (sau review hội đồng)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Sửa Bugs Trước Merge

**Mục tiêu:** Sửa 5 bug phát hiện bởi hội đồng review, đảm bảo code đúng trước khi merge.

<<<<<<< HEAD
- [ ] Task 1.1: **Đổi tên migration** — Rename `033_grouped_change_history.sql` → `034_grouped_change_history.sql` trong nhánh feature (tránh collision với `033_export_probation_employees.sql` đã trên main).
- [ ] Task 1.2: **Sửa `checkDocumentAuthz` trong `documentService.ts`** — Tách biệt quyền đọc (read) và ghi (write) cho tài liệu. Thêm tham số `mode: 'read' | 'write' = 'write'` vào `checkDocumentAuthz`:
=======
- [x] Task 1.1: **Đổi tên migration** — Rename `033_grouped_change_history.sql` → `034_grouped_change_history.sql` trong nhánh feature (tránh collision với `033_export_probation_employees.sql` đã trên main).
- [x] Task 1.2: **Sửa `checkDocumentAuthz` trong `documentService.ts`** — Tách biệt quyền đọc (read) và ghi (write) cho tài liệu. Thêm tham số `mode: 'read' | 'write' = 'write'` vào `checkDocumentAuthz`:
>>>>>>> e2f9a1e (fix(history): resolve VA document access and grouping bugs)
  ```typescript
  // Chữ ký hàm mới:
  export async function checkDocumentAuthz(docId: string, actorEmail: string, permission: PermissionMatrix, mode: 'read' | 'write' = 'write')
  
  // Logic kiểm tra (ĐÚNG — VA được đọc/tải, nhưng KHÔNG được xóa, ép kiểu tránh widen sang string[]):
  const allowedRoles: ('EA' | 'VA')[] = mode === 'read' ? ['EA', 'VA'] : ['EA']
  if (!permission.is_superadmin && !hasPermission(permission, khoi, allowedRoles)) {
      const reviewerIds = await getReviewerEmployeeIds(actorEmail)
      if (!reviewerIds.includes(maNhansu)) {
          throw new HTTPException(403, { message: 'Bạn không có quyền truy cập tài liệu này' })
      }
  }
  ```
  *Lưu ý:* 
  1. Thêm tham số `mode: 'read' | 'write' = 'read'` vào `getDocumentDownloadUrl(docId, actorEmail, permission, mode = 'read')` và truyền tiếp `mode` xuống `checkDocumentAuthz`.
  2. Tại `backend/src/routes/documents.ts`:
     - Route `GET /:id` (tải tài liệu): Gọi `getDocumentDownloadUrl(id, userEmail, permission, 'read')`.
     - Route `POST /:id/ocr` (OCR): Phải gọi `getDocumentDownloadUrl(id, userEmail, permission, 'write')` để ngăn VA kích hoạt OCR ghi đè cache lên DB.
     - Route `DELETE /:id` (xóa tài liệu): Gọi `deleteDocument` (mặc định kiểm tra chế độ `'write'`).
<<<<<<< HEAD
- [ ] Task 1.3: **Sửa bug VA doc access trong `changeHistory.ts`** — Thêm `hasVa` vào `isDocAccessAllowed`:
=======
- [x] Task 1.3: **Sửa bug VA doc access trong `changeHistory.ts`** — Thêm `hasVa` vào `isDocAccessAllowed`:
>>>>>>> e2f9a1e (fix(history): resolve VA document access and grouping bugs)
  ```typescript
  // Trước (SAI — bỏ sót VA):
  const isDocAccessAllowed = permission.is_superadmin || hasEa || (permission.is_reviewer && isAssignedReviewer)
  // Sau (ĐÚNG — VA được xem document_id):
  const hasVa = hasPermission(permission, empData.khoi, ['VA'])
  const isDocAccessAllowed = permission.is_superadmin || hasEa || hasVa || (permission.is_reviewer && isAssignedReviewer)
  ```
<<<<<<< HEAD
- [ ] Task 1.4: **Sửa test Scenario 5 — 3 lỗi + 1 assertion thiếu trong `salary.test.ts`:**
=======
- [x] Task 1.4: **Sửa test Scenario 5 — 3 lỗi + 1 assertion thiếu trong `salary.test.ts`:**
>>>>>>> e2f9a1e (fix(history): resolve VA document access and grouping bugs)
  - **Lỗi 1** — `document_type: 'nang_luong'` vi phạm DB CHECK constraint. Đổi thành `document_type: 'dieu_chinh_luong'`.
  - **Lỗi 2** — `document_uuid: tempUuid2` sai tên trường; Zod ignore silently → salary pending không gắn document. Đổi thành `temp_uuid: tempUuid2`.
  - **Lỗi 3** — `submit_employee_pending` RPC không ghi `reason` vào `change_history` (INSERT trong migration 023 không có cột `reason`). Sau submit, `reason = null`. Cần sửa các assertion:
    - `expect(assignedMixedSession.reason).toBe('...')` → `expect(assignedMixedSession.reason).toBeNull()`
    - `expect(vaMixedSession.reason).toBe('...')` → `expect(vaMixedSession.reason).toBeNull()`
    - Xóa comment `// Should see reason` cho 2 scenario trên.
  - **Thiếu assertion** — Sau khi có `vaMixedSession.document_id`, thêm call verify VA thực sự download được (R2 có đủ credentials trong `.env.local`), đồng thời thêm kiểm chứng VA gọi DELETE phải bị từ chối với status 403:
    ```typescript
    // Verify VA có thể gọi GET /api/documents/:id thành công
    const vaDocRes = await app.request(`/api/documents/${vaMixedSession.document_id}`, {
      headers: { Authorization: `Bearer ${reviewerToken}` } // reviewerToken đang là VA
    })
    expect(vaDocRes.status).toBe(200)
    const vaDocJson = await vaDocRes.json() as any
    expect(vaDocJson.data.downloadUrl).toBeDefined()
    expect(typeof vaDocJson.data.downloadUrl).toBe('string')

    // Verify VA KHÔNG THỂ gọi DELETE /api/documents/:id (phải bị chặn 403)
    const vaDeleteRes = await app.request(`/api/documents/${vaMixedSession.document_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${reviewerToken}` }
    })
    expect(vaDeleteRes.status).toBe(403)

    // Verify VA KHÔNG THỂ gọi POST /api/documents/:id/ocr (phải bị chặn 403)
    const vaOcrRes = await app.request(`/api/documents/${vaMixedSession.document_id}/ocr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${reviewerToken}` }
    })
    expect(vaOcrRes.status).toBe(403)
    ```
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 — Chạy `pnpm --filter backend test:integration` trên nhánh feature (sau khi sửa Tasks 1.1–1.4). Xác nhận toàn bộ Scenario 1-6 pass (bao gồm cả các assertion kiểm tra quyền download của VA thành công, và ngăn chặn quyền delete/OCR của VA bị trả về 403).

---

## Phase 2: Gate Merge Với Latest Main

**Mục tiêu:** Đảm bảo code sau merge không gãy do delta 4 commits mới trên `main`.

- [x] Task 2.1: Checkout nhánh feature, rebase (hoặc merge) với latest `origin/main`.
- [x] Task 2.2: Giải quyết conflict nếu có (ưu tiên theo logic feature, không overwrite main fixes).
- [x] Task 2.3: Chạy `pnpm run build` (build `@vcc/shared` trước FE/BE) trên kết quả merge — phải pass.
- [x] Task 2.4: Chạy `pnpm run typecheck` — phải pass.
- [x] Task 2.5: Chạy `pnpm run lint` — phải pass.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 — Chạy `pnpm --filter backend test:integration` trên kết quả merge với main — **tất cả Scenario 1–6 phải pass**, bao gồm Scenario 5 VA download (lúc này đã có fix documentService.ts trên nhánh feature sau khi rebase/merge).

---

## Phase 3: Merge & Deploy Theo Thứ Tự

**Mục tiêu:** Merge code vào `main` và deploy theo đúng thứ tự DB-first để tránh 500.

- [x] Task 3.1: **DB trước (tránh lỗi do auto-deploy Backend)** — Apply `034_grouped_change_history.sql` lên DB (dev/prod tương ứng) trước khi merge code vào `main`. Vì RPC mới tương thích ngược hoàn toàn nên việc apply trước là an toàn.
- [x] Task 3.2: Verify DB grant: kiểm tra `GRANT EXECUTE ... TO service_role` và `NOTIFY pgrst, 'reload schema'` đã chạy để PostgREST nhận diện RPC mới.
- [x] Task 3.3: Merge nhánh feature vào `main` (sau khi DB và schema đã sẵn sàng). Hành động này sẽ tự động kích hoạt CI/CD deploy Backend lên Cloud Run.
- [/] Task 3.4: Đợi Backend auto-deploy hoàn tất thành công.
- [/] Task 3.5: Triển khai Frontend (hoặc đợi Frontend auto-deploy hoàn tất sau backend).
- [ ] Task 3.Final: 🧪 Test & Verify Phase 3 — Kiểm tra manual theo bảng:
  | Role | Kỳ vọng |
  |------|---------|
  | EA/SA | Xem tất cả lịch sử; `reason` có giá trị nếu thay đổi trực tiếp, `null` nếu qua luồng submit pending; xem document đính kèm |
  | VI (không gán) | Chỉ thấy hồ sơ; mixed session: `reason=null`, `doc=null`; salary tab: empty |
  | VA | Thấy cả lương và document đính kèm; `reason` có giá trị hoặc null tùy luồng; không sửa được |
  | Reviewer được gán | Như EA cho nhân sự được gán |

---

## Phase 5: Fix Missing History Documents (Data Backfill)

**Mục tiêu:** Cập nhật DB và Migration để sửa lỗi mất giấy tờ lịch sử cho các case Tuyển mới.

- [x] Task 5.1: Tạo file migration `035_fix_missing_history_documents.sql`.
- [x] Task 5.2: Viết lệnh Update RPC `fn_create_employee_onboarding` và `submit_employee_pending` trong file migration để lưu đúng `document_id` và `ma_nhan_su`.
- [x] Task 5.3: Viết câu lệnh UPDATE backfill data cũ trong file migration.
- [x] Task 5.4: Apply migration `035` lên Database.
- [x] Task 5.5: Commit và merge update.
- [x] Task 5.Final: Test lại UI lịch sử cho nhân sự 112843 xem đã hiện đúng giấy tờ và nhãn "Tuyển dụng mới" chưa.

---

## Phase 4: Cleanup & Archive

**Mục tiêu:** Dọn dẹp tài liệu và chốt state dự án.

- [ ] Task 4.1: **Archive cả 2 thư mục active (tránh bẩn main branch sau merge):**
  - Archive folder hiện tại: `.agent/active/merge-grouped-change-history/` → `.agent/history/features/2026-05-27-merge-grouped-change-history/`.
  - Archive/Dọn dẹp folder cũ từ feature branch: `.agent/active/grouped-change-history/` → `.agent/history/features/2026-05-27-grouped-change-history/`.
- [ ] Task 4.2: Cập nhật `CONTEXT.md` và `CHANGELOG-*.md` theo skill `update-docs`.
- [ ] Task 4.3: Dùng skill `git-sync` để chốt commit message và push.
- [ ] Task 4.4: **Dọn dẹp triệt để** — Chạy lệnh dọn hoặc xác nhận cả 2 folder active trên không còn tồn tại trong repo main.
- [ ] Task 4.Final: 🧪 Test & Verify Phase 4 — Xác nhận `main` sạch, build CI pass.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-26 | - | - | Khởi tạo plan | done | |
| 2026-05-27 | - | - | Cập nhật plan sau review hội đồng: phát hiện 3 bugs + migration conflict | done | FR-05 VA bug, FR-07 doc_type sai, FR bổ sung migration 033 collision |
| 2026-05-27 | Phase 1 | Task 1.1 | Bắt đầu rename migration | start | |
| 2026-05-27 | Phase 1 | Task 1.1 | Đổi tên migration thành 034 | done | git mv thành công |
| 2026-05-27 | Phase 1 | Task 1.2 | Bắt đầu sửa documentService.ts và documents.ts | start | |
| 2026-05-27 | Phase 1 | Task 1.2 | Đã thêm tham số mode và allowedRoles theo mode | done | |
| 2026-05-27 | Phase 1 | Task 1.3 | Bắt đầu sửa changeHistory.ts | start | |
| 2026-05-27 | Phase 1 | Task 1.3 | Đã thêm hasVa vào isDocAccessAllowed | done | |
| 2026-05-27 | Phase 1 | Task 1.4 | Bắt đầu sửa salary.test.ts | start | |
| 2026-05-27 | Phase 1 | Task 1.4 | Fix document_type, temp_uuid, expect null reason, add VA asserts | done | |
| 2026-05-27 | Phase 1 | Task 1.Final | Bắt đầu chạy test integration | start | |
| 2026-05-27 | Phase 1 | Task 1.Final | Pass 100% integration tests | done | Fix lỗi setup DB roles |
| 2026-05-27 | Phase 2 | Task 2.1 | Bắt đầu merge/rebase với origin/main | start | |
| 2026-05-27 | Phase 2 | Task 2.1, 2.2 | Rebase và resolve conflict thành công | done | |
| 2026-05-27 | Phase 2 | Task 2.3 | Bắt đầu chạy pnpm run build | start | |
| 2026-05-27 | Phase 2 | Task 2.3, 2.4, 2.5 | Chạy build, typecheck, lint thành công | done | |
| 2026-05-27 | Phase 2 | Task 2.Final | Bắt đầu chạy test integration sau rebase | start | |
| 2026-05-27 | Phase 2 | Task 2.Final | Pass 100% test integration sau rebase | done | Merge an toàn |
| 2026-05-27 | Phase 3 | Task 3.1, 3.2 | User đã apply 034 lên Supabase | done | |
| 2026-05-27 | Phase 3 | Task 3.3 | Bắt đầu merge nhánh feature vào main | start | |
| 2026-05-27 | Phase 3 | Task 3.3 | Đã fast-forward merge và push lên origin/main | done | |
| 2026-05-27 | Phase 3 | Task 3.4, 3.5 | Chờ deploy lên Cloud Run/Vercel hoàn tất | start | |
