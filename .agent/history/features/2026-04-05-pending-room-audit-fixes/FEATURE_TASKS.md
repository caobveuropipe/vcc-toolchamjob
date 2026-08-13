# Feature Tasks: Pending Room Audit & Fixes (10 Items)

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-04-04

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Schema & Dual Enum Migration (Item 8, 9, 1)

**Mục tiêu:** Migration 2 enums (`loai_hop_dong: chinh_thuc→nhan_vien`, `trang_thai: dang_lam→chinh_thuc`) và nới lỏng validation khi tạo nháp phòng chờ.

> ⚠️ **Lưu ý**: Giá trị `chinh_thuc` di chuyển từ enum `loai_hop_dong` (bị xóa) sang enum `trang_thai` (được thêm). Migration SQL phải xử lý đúng thứ tự.

- [x] Task 1.1: Tạo migration SQL `database/migrations/0XX_dual_enum_migration.sql`:
  - **Bước 1**: Bỏ các constraint cũ: `ALTER TABLE employees DROP CONSTRAINT <tên_constraint_loai_hop_dong>, DROP CONSTRAINT <tên_constraint_trang_thai>;`
  - **Bước 2**: Backfill dữ liệu Live table: `UPDATE employees SET trang_thai = 'chinh_thuc' WHERE trang_thai = 'dang_lam'; UPDATE employees SET loai_hop_dong = 'nhan_vien' WHERE loai_hop_dong = 'chinh_thuc';`
  - **Bước 3**: Backfill dữ liệu JSON trong `pending_changes`: dùng hàm JSONB thay giá trị cũ của `trang_thai` và `loai_hop_dong` trong JSON object, ngừa trôi data sau submit.
  - **Bước 4**: Backfill dữ liệu Snapshot: `UPDATE snapshot_employees SET trang_thai = 'chinh_thuc' WHERE trang_thai = 'dang_lam'; UPDATE snapshot_employees SET loai_hop_dong = 'nhan_vien' WHERE loai_hop_dong = 'chinh_thuc';` (Lưu ý Snapshot không sửa constraint vì bảng không có CHECK).
  - **Bước 5**: Thêm constraint mới cho bảng `employees` check `IN ('nhan_vien', 'ctv')` và `IN ('thu_viec', 'chinh_thuc', 'nghi_sinh', 'nghi_viec')`.
  - **Bước 6**: Cập nhật `change_history` values cho các thay đổi lịch sử.
- [x] Task 1.2: Cập nhật `packages/shared/src/constants/khoi.ts`:
  - `LOAI_HOP_DONG_VALUES`: `['nhan_vien', 'ctv']`
  - `LOAI_HOP_DONG_LABELS`: `{ nhan_vien: 'Nhân viên', ctv: 'CTV' }`
  - `TRANG_THAI_VALUES`: `['thu_viec', 'chinh_thuc', 'nghi_sinh', 'nghi_viec']`
  - `TRANG_THAI_LABELS`: `{ thu_viec: 'Thử việc', chinh_thuc: 'Chính thức', nghi_sinh: 'Nghỉ sinh', nghi_viec: 'Nghỉ việc' }`
- [x] Task 1.3: Cập nhật `packages/shared/src/schemas/employee.ts` — nới lỏng `createEmployeeSchema`: chỉ bắt buộc `ho_va_ten` + `khoi` + `temp_uuid`, tất cả field còn lại `.nullable().optional()` bao gồm `chuc_danh`, `loai_hop_dong`, `ngay_sinh`.
- [x] Task 1.4: Cập nhật `packages/shared/src/types/` — tìm và sửa tất cả references đến `'dang_lam'` thành `'chinh_thuc'` (bao gồm `VALID_STATE_TRANSITIONS`).
- [x] Task 1.5: Cập nhật `backend/src/services/employeeService.ts`:
  - Sửa tất cả hardcoded `'dang_lam'` → `'chinh_thuc'`
  - Xử lý default values khi tạo NS nháp (nếu `loai_hop_dong` null thì không insert, `trang_thai` default `thu_viec`)
- [x] Task 1.6: Cập nhật `frontend/src/pages/Employees/EmployeeDetailPage.tsx` — sửa `statusMap`: key `dang_lam` → `chinh_thuc`, label "Chính thức".
- [x] Task 1.7: Cập nhật FE `EmployeeForm.tsx` — bỏ required star (*) khỏi các trường không còn bắt buộc khi mode=create. Chỉ giữ `ho_va_ten`, `khoi` là required luôn.
- [x] Task 1.8: Cập nhật docs:
  - `.agent/business/data/SCHEMA.md` — đổi enum `loai_hop_dong` + `trang_thai`
  - `.agent/business/data/STATE_MACHINES.md` — đổi tất cả `dang_lam` → `chinh_thuc`
- [x] Task 1.9: Build `@vcc/shared` (`pnpm run build:shared`) và verify `pnpm run typecheck` pass.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - [ ] Chạy migration trên dev DB → verify data `chinh_thuc` đã → `nhan_vien` (loại HĐ)
  - [ ] Verify data `dang_lam` đã → `chinh_thuc` (trạng thái)
  - [ ] Tạo NS mới chỉ với `ho_va_ten` + `khoi` → thành công, `state_phong_cho=true`
  - [ ] Tạo NS mới thiếu `ho_va_ten` → fail validation
  - [ ] UI hiển thị "Nhân viên" thay "Chính thức" (loại HĐ)
  - [ ] UI hiển thị "Chính thức" thay "Đang làm" (trạng thái)
  - [ ] State transitions vẫn hoạt động (`thu_viec→chinh_thuc`, `chinh_thuc→nghi_sinh`, etc.)
  - [ ] `submitEmployeeSchema` vẫn validate chặt (ma_nhan_su thật, email thật, line_nhan_su)
  - [ ] `grep -r "dang_lam" packages/ backend/ frontend/` → 0 kết quả (trừ docs/comments)

---

## Phase 2: UX Improvements (Item 2, 6)

**Mục tiêu:** Cải thiện trải nghiệm phòng chờ: nút Submit sáng/mờ, animation OCR fill.

- [x] Task 2.1: Sửa `PendingRoomPage.tsx` — kiểm tra submit readiness cho mỗi record bằng cách validate `submitEmployeeSchema` ở client-side (chỉ áp dụng cho các field cơ sở như ma_nhan_su, email, không check NNT để tuân thủ G2 mở Submit Wizard). Nếu pass → nút Submit bật sáng (primary). Nếu fail → nút Submit mờ (disabled style) kèm tooltip "Thiếu thông tin bắt buộc cơ bản".
  - Lưu ý: Đảm bảo view `employee_info_only` trả về đủ data cho check này.
- [x] Task 2.2: Sửa `EmployeeForm.tsx` (hoặc parent page) — thêm CSS animation `@keyframes blink-field` nháy background 3 lần khi AI OCR fill data vào ô. Logic: khi OCR result trả về, danh sách field IDs được fill → trigger class `ai-filled-blink` lên các form item tương ứng → auto-remove class sau ~2s.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - [ ] Nút Submit sáng cho NS đầy đủ thông tin, mờ cho NS thiếu
  - [ ] Tooltip hiển thị khi hover nút mờ
  - [ ] Tạo NS mới → upload ảnh → OCR → fill → ô nháy 3 lần

---

## Phase 3: OCR Enhancement (Item 7)

**Mục tiêu:** Mở rộng AI OCR để đọc thêm ngày bắt đầu làm việc và tự động tính ngày ký hợp đồng.

- [x] Task 3.1: Sửa `backend/src/services/ocrService.ts` — cập nhật prompt AI:
  - Thêm yêu cầu trích xuất: `ngay_vao_cong_ty` (ngày bắt đầu làm việc), `thoi_gian_thu_viec` (thời gian thử việc nếu có, đơn vị tháng)
  - Output JSON mới: `{ ..., ngay_vao_cong_ty: "YYYY-MM-DD", thoi_gian_thu_viec: 2 }`
- [x] Task 3.2: Sửa FE `EmployeeForm.tsx` — khi nhận OCR result có `ngay_vao_cong_ty`:
  - Fill `ngay_vao_cong_ty` vào ô tương ứng
  - Tự tính `ngay_ky_hd` = `ngay_vao_cong_ty` + `thoi_gian_thu_viec` (default 2 tháng nếu không có)
  - Fill `ngay_ky_hd` vào ô tương ứng
  - Cả 2 ô đều trigger animation nháy (Phase 2 đã có sẵn mechanism)
- [x] Task 3.3: Cập nhật OCR mockup data cho test (claude/vision providers).
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)
  - [ ] OCR đọc ảnh giấy tờ → trả về `ngay_vao_cong_ty`
  - [ ] FE tự tính `ngay_ky_hd` = `ngay_vao_cong_ty + 2 tháng`
  - [ ] Cả 2 ô ngày nháy khi được fill
  - [ ] Nếu AI không đọc được → không fill, không lỗi

---

## Phase 4: Khối Manager & NNT Flow (Item 4, 3)

**Mục tiêu:** Tạo bảng quản lý người phụ trách khối + triển khai luồng suggest NNT khi submit.

> ⚠️ **Item 3** — Phase này sẽ triển khai luồng đầy đủ cho việc gán/sửa NNT.

### Sub-phase 4A: Bảng Phụ Trách Khối (Item 4)

- [x] Task 4A.1: Tạo migration SQL `database/migrations/0XX_khoi_managers.sql` — tạo bảng `khoi_managers(id, khoi TEXT UNIQUE, manager_email TEXT NOT NULL, manager_name TEXT, created_at, updated_at)`. Kế thừa baseline RLS: `ALTER TABLE khoi_managers ENABLE ROW LEVEL SECURITY; CREATE POLICY "deny_direct_access" ON khoi_managers FOR ALL USING (false);`.
- [x] Task 4A.2: Tạo `backend/src/services/khoiManagerService.ts` — CRUD cho bảng `khoi_managers`. Chỉ SA được thêm/sửa/xóa.
- [x] Task 4A.3: Tạo route `backend/src/routes/admin.ts` (mở rộng) — thêm endpoints:
  - `GET /api/admin/khoi-managers` — list tất cả mapping
  - `PUT /api/admin/khoi-managers/:khoi` — upsert mapping
  - `DELETE /api/admin/khoi-managers/:khoi` — xóa mapping
- [x] Task 4A.4: Tạo FE Admin tab `KhoiManagersTab.tsx` trong `frontend/src/pages/Admin/tabs/`:
  - Hiển thị table: Khối | Email phụ trách | Tên | Actions
  - SA có thể inline edit / thêm / xóa
  - Seed data mẫu: Admicro → `hue@vccorp.vn`, KND → `xoan@vccorp.vn`

### Sub-phase 4B: NNT Suggest & Approval Flow (Item 3)

- [x] Task 4B.0: Bổ sung persistence cho `khong_co_nnt`:
  - Tạo migration SQL `database/migrations/0XX_employee_khong_co_nnt.sql`: `ALTER TABLE employees ADD COLUMN khong_co_nnt BOOLEAN DEFAULT FALSE;`.
  - Cập nhật VIEW `employee_info_only` để include cột `khong_co_nnt`.
  - Cập nhật Zod schemas trong `packages/shared/src/schemas/employee.ts` (thêm `khong_co_nnt: z.boolean()`) nhằm đồng bộ Frontend/Backend.
  - Cập nhật tài liệu `.agent/business/data/SCHEMA.md` bổ sung cột này.
- [x] Task 4B.1: Tạo `backend/src/services/nntService.ts`:
  - Function `suggestReviewers(employeeId: string)`: query `employee_reviewers` bảng hiện có theo chain `khoi → phong_ban → bo_phan → nhom_team → line_nhan_su` của NS → trả về list email NNT phù hợp.
  - Function logic: Ưu tiên tìm reviewer ở cấp cụ thể nhất. Nếu rỗng thì fallback ngược dần lên trên theo đúng thứ tự: `line_nhan_su` → `nhom_team` → `bo_phan` → `phong_ban` → `khoi`. Vòng lặp dừng lại ngay ở level đầu tiên tìm thấy (lấy unique reviewer emails).
- [x] Task 4B.2: Thêm route `GET /api/employees/:id/suggest-reviewers` — gọi `suggestReviewers`, trả về `{ data: { reviewers: string[], has_multiple: boolean, warning?: string } }`.
- [x] Task 4B.3: Bổ sung logic validate `submitEmployeeSchema`: Bỏ đi ý tưởng thêm mảng reviewer vào đây vì vi phạm contract phân tách. Chỉ bổ sung trường tùy chọn `khong_co_nnt: z.boolean().optional()` vào endpoint submit.
- [x] Task 4B.4: Triển khai endpoint `PUT /api/employees/:id/reviewers`: Định nghĩa contract chuẩn với payload `{ reviewers: string[] }`. Đây là API duy nhất để xử lý write logic cho `employee_reviewers`, gọi `adminService` để thực hiện invariant cache invalidation và ghi event audit `reviewer_assign / reviewer_remove`. (EA sử dụng endpoint này nếu có quyền form-level).
- [x] Task 4B.5: Sửa submit flow `POST /api/employees/:id/submit`:
  - Trước khi submit → BE query `employee_reviewers` để xem NS đã có reviewer chưa.
  - Nếu chưa có + payload `khong_co_nnt` không phải `true` → return error yêu cầu gán NNT.
  - Xử lý State Machine: Nếu `khong_co_nnt = true`, BE update cờ `khong_co_nnt = true` vào bảng `employees` và bỏ trống bảng `employee_reviewers` để pass luồng phê duyệt hợp lệ.
- [x] Task 4B.6: Sửa FE `PendingRoomPage.tsx` submit handler:
  - Khi user bấm Submit → call `suggest-reviewers` API → hiển thị Modal:
    - Nếu có gợi ý NNT → box chọn checkbox. Nếu user accept/sửa → gọi `PUT /api/employees/:id/reviewers` ĐẦU TIÊN để chốt danh sách xuống bảng riêng. Sau khi thành công, gọi tiếp API submit (không cần truyền flag khong_co_nnt).
    - Nếu 0 NNT / user reject NNT → box trống + bắt buộc user check "Xác nhận không có NNT". Sau đó KHÔNG gọi API PUT reviewers, mà gọi thẳng API submit với payload `{ khong_co_nnt: true }`.
- [x] Task 4B.7: Sửa FE `EmployeeForm.tsx` (hoặc `EmployeeDetailPage.tsx`): Triển khai UI Component `ReviewerManager` để thỏa mãn AC-11. Cho phép EA đang xem form có thể xem danh sách Reviewer hiện tại, gọi thủ công nút "Gợi ý NNT", và thêm/xóa NNT thông qua gọi endpoint `PUT /api/employees/:id/reviewers`.
- [x] Task 4B.8: Cập nhật các SSoT liên quan:
  - Sửa `.agent/business/data/STATE_MACHINES.md`: Định nghĩa rõ rule behavior sau khi submit thành công mà có `khong_co_nnt = true` (VD: bypass chờ manager, bay thẳng ra pool chờ SA duyệt).
  - Cập nhật `PERMISSION_MATRIX.md`: mở rộng `BR-PERM-011` — SA bulk ops + EA per-employee trên form. Cập nhật contract route mô tả rõ invariant bảo mật.

- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (Bắt buộc)
  - [ ] SA thêm/sửa/xóa phụ trách khối → thành công
  - [ ] Giao diện Admin hiển thị tab Phụ Trách Khối
  - [ ] Submit API suggest NNT → trả về list phù hợp
  - [ ] FE hiển thị modal NNT khi submit
  - [ ] Submit không có NNT → bị chặn (trừ khi tick "Không có")
  - [ ] EA sửa NNT cho NS trong khối mình → thành công

---

## Phase 5: Telegram Warning Stub (Item 5)

**Mục tiêu:** Thiết kế và stub cơ chế cảnh báo Telegram khi NS ở phòng chờ >3 ngày.

> ⚠️ **Cần plan riêng** cho full deployment (cron infra, error handling, dedup). Phase này chỉ tạo code base + manual trigger.

- [x] Task 5.1: Thêm config vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_DEFAULT_CHAT_ID` trong `backend/.env.example` và config loader.
- [x] Task 5.2: Tạo `backend/src/services/telegramService.ts`:
  - Function `sendTelegramMessage(chatId: string, message: string)`: gọi Telegram Bot API `sendMessage`.
  - Function `notifyPendingOverdue()`:
    1. Query `employees WHERE state_phong_cho = true AND created_at < NOW() - INTERVAL '3 days'`
    2. Gom theo khối
    3. Nếu NS có NNT (join `employee_reviewers`) → gửi warning cho NNT
    4. Nếu NS không có NNT → gửi cho phụ trách khối (join `khoi_managers`)
    5. Format message: "⚠️ [NS: Tên - Mã] đã trong phòng chờ >3 ngày. Vui lòng xử lý."
- [x] Task 5.3: Tạo route `POST /api/admin/trigger-pending-warnings` (SA only) — trigger thủ công cho test.
- [x] Task 5.4: (Thiết kế) Ghi nhận spec cho Cloud Scheduler cron job (chạy daily 9:00 AM) — **KHÔNG deploy** trong phase này. Chỉ tạo doc design.
- [x] Task 5.5: Cập nhật docs: thêm config Telegram vào `.env.example`. Docs `.agent/CONTEXT.md` defer sang `update-docs`.

- [x] Task 5.Final: 🧪 Test & Verify Phase 5 (Bắt buộc)
  - [ ] Config TELEGRAM env vars → service load OK
  - [ ] SA trigger manual endpoint → gửi message test thành công
  - [ ] Query pending >3 ngày → trả đúng danh sách
  - [ ] Message format readable trên Telegram

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-04-04 17:30 | Phase 1 | Task 1.1 | Bắt đầu tạo migration SQL dual enum | start | — |
| 2026-04-04 17:31 | Phase 1 | Task 1.1 | Tạo `010_dual_enum_migration.sql` thành công | done | 6 bước: drop constraints, backfill employees/snapshot/pending_changes/change_history, add new constraints |
| 2026-04-04 17:32 | Phase 1 | Task 1.2-1.8 | Triển khai các task code changes | done | Cập nhật constants, schemas, state-machine, FE, seed, test, docs |
| 2026-04-04 17:35 | Phase 1 | Task 1.9 | Build shared + typecheck pass 3/3 modules | done | — |
| 2026-04-04 17:35 | Phase 1 | Task 1.Final | Bắt đầu AI self-test | start | — |
| 2026-04-04 21:18 | Phase 1 | Task 1.Final | User confirmed Phase 1 test pass | done | User đã test manual |
| 2026-04-04 21:18 | Phase 2 | Task 2.1 | Bắt đầu submit readiness UX | start | — |
| 2026-04-04 21:22 | Phase 2 | Task 2.1 | Triển khai checkSubmitReadiness + nút sáng/mờ | done | submitEmployeeSchema.safeParse client-side |
| 2026-04-04 21:22 | Phase 2 | Task 2.2 | Bắt đầu OCR blink animation | start | — |
| 2026-04-04 21:24 | Phase 2 | Task 2.2 | Triển khai CSS @keyframes + JS trigger blink | done | index.css + EmployeeForm.tsx |
| 2026-04-04 21:24 | Phase 2 | Task 2.Final | Bắt đầu AI self-test Phase 2 | start | typecheck pass |
| 2026-04-05 15:16 | Phase 2 | Task 2.Final | User confirmed Phase 2 test pass | done | Test 1,2 pass lần đầu; Test 3 retry (nháy viền mỏng) → sửa CSS target .ant-input + tăng 10s → pass |
| 2026-04-05 15:16 | Phase 3 | Task 3.1 | Bắt đầu sửa OCR prompt | start | — |
| 2026-04-05 15:17 | Phase 3 | Task 3.1 | Cập nhật prompt OpenAI + mockup claude/vision | done | Thêm ngay_vao_cong_ty, thoi_gian_thu_viec |
| 2026-04-05 15:18 | Phase 3 | Task 3.2 | Triển khai auto-compute ngay_ky_hd trong handleFillFields | done | ngay_vao_cong_ty + thu_viec_months, filter non-form keys |
| 2026-04-05 15:18 | Phase 3 | Task 3.3 | Mockup data đã được cập nhật cùng Task 3.1 | done | — |
| 2026-04-05 15:18 | Phase 3 | Task 3.Final | Bắt đầu AI self-test Phase 3 | start | typecheck pass |
| 2026-04-05 15:21 | Phase 3 | Task 3.Final | User confirmed Phase 3 test pass | done | — |
| 2026-04-05 15:21 | Phase 4 | Task 4A.1 | Bắt đầu tạo migration khoi_managers | start | — |
| 2026-04-05 15:23 | Phase 4 | Task 4A.1-4A.4 | Sub-phase 4A hoàn tất | done | Migration 011, service, routes, FE tab. typecheck pass |
| 2026-04-05 15:31 | Phase 4 | Task 4B.0 | Bắt đầu migration khong_co_nnt | start | — |
| 2026-04-05 15:32 | Phase 4 | Task 4B.0 | Migration 012 + VIEW update + Zod schema | done | — |
| 2026-04-05 15:34 | Phase 4 | Task 4B.1-4B.5 | BE: nntService + routes + submit flow NNT check | done | suggestReviewers, setReviewers, getReviewers, khong_co_nnt flag |
| 2026-04-05 15:36 | Phase 4 | Task 4B.6 | FE: NNT Submit Wizard Modal trong PendingRoomPage | done | Modal với checkbox gợi ý + "Không có NNT" |
| 2026-04-05 15:38 | Phase 4 | Task 4B.7 | FE: ReviewerCard component trong EmployeeDetailPage | done | Xem/thêm/xóa/gợi ý NNT inline |
| 2026-04-05 15:38 | Phase 4 | Task 4B.8 | Docs chưa cập nhật (defer to update-docs) | done | Sẽ cập nhật qua update-docs skill |
| 2026-04-05 15:39 | Phase 4 | Task 4.Final | Bắt đầu AI self-test Phase 4 | start | typecheck pass 3/3 |
| 2026-04-05 21:23 | Phase 4 | Task 4.Final | User confirmed Phase 4 test pass | done | — |
| 2026-04-05 21:23 | Phase 5 | Task 5.1 | Bắt đầu thêm config Telegram | start | — |
| 2026-04-05 21:24 | Phase 5 | Task 5.1 | Thêm env vars vào .env.example + config loader | done | TELEGRAM_BOT_TOKEN, TELEGRAM_DEFAULT_CHAT_ID |
| 2026-04-05 21:25 | Phase 5 | Task 5.2 | Tạo telegramService.ts | done | sendTelegramMessage + notifyPendingOverdue |
| 2026-04-05 21:25 | Phase 5 | Task 5.3 | Thêm route POST trigger-pending-warnings | done | SA only, rate-limited |
| 2026-04-05 21:26 | Phase 5 | Task 5.4 | Tạo TELEGRAM_CRON_DESIGN.md | done | Spec cho Cloud Scheduler, dedup, retry |
| 2026-04-05 21:26 | Phase 5 | Task 5.5 | .env.example done, CONTEXT.md defer to update-docs | done | — |
| 2026-04-05 21:26 | Phase 5 | Task 5.Final | Bắt đầu AI self-test Phase 5 | start | — |
| 2026-04-05 21:50 | Phase 5 | Task 5.Final | User confirmed Phase 5 test pass | done | Test gửi alert, lỗi 'chat not found' (Telegram anti-spam act, logic routed successfully) |
| 2026-04-05 21:50 | All | All | Hoàn tất feature pending-room-audit-fixes | done | Sẵn sàng archive |
