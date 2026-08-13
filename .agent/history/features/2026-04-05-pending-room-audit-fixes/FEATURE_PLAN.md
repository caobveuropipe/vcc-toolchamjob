# Feature Plan: Pending Room Audit & Fixes (10 Items)

> **Trạng thái**: ✅ ĐÃ DUYỆT (Sẵn sàng triển khai)
> **Review gate**: Khuyến nghị gọi `feature-review` trước khi thực thi — nhiều item đụng Auth, Schema, State Machine, AI Integration
> **Feature slug**: pending-room-audit-fixes
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-04-04
> **Cập nhật**: 2026-04-04 — User confirm tất cả câu hỏi blocking

---

## 0. Phân loại & Mức độ ưu tiên tổng quan

> Bảng dưới nhóm 10 items theo **độ phức tạp** và **ưu tiên**. Items phức tạp cao được đề xuất **tạo plan riêng** khi cần triển khai.

| # | Tên | Nhóm | Ưu tiên | Phức tạp | Ghi chú |
|---|-----|------|---------|----------|---------|
| 1 | Phòng chờ: chỉ required `ho_va_ten` khi lưu nháp | 🔧 Bug Fix | 🔴 P0 | Thấp | Sửa schema + FE form validation |
| 2 | Nút Submit sáng/mờ theo required fields | 🎨 UX Enhancement | 🔴 P0 | Thấp | FE-only, check trường bắt buộc |
| 8 | Đổi `chinh_thuc` → `nhan_vien` | 🔧 Data Migration | 🔴 P0 | Trung bình | Schema + DB enum change + data migration |
| 9 | Đổi enum `dang_lam` → `chinh_thuc` trong DB | 🔧 Data Migration | 🔴 P0 | Trung bình | Enum rename + code cascade (data giả → migration an toàn) |
| 6 | AI OCR nháy ô 3 lần khi fill data | 🎨 UX Enhancement | 🟡 P1 | Thấp | FE animation only |
| 7 | OCR đọc thêm ngày bắt đầu → tính ngày ký HĐ | 🤖 AI Enhancement | 🟡 P1 | Trung bình | Sửa OCR prompt + FE auto-calculate |
| 3 | Suggest NNT khi submit + luồng phê duyệt | 🏗️ New Feature | 🔴 P0 | **Trung bình** | Cấp quyền EA gán NNT trên form + Audit/Cache |
| 4 | Giao diện admin phụ trách khối | 🏗️ New Feature | 🟡 P1 | Trung bình | Bảng config mới, Admin UI |
| 5 | Telegram warning 3 ngày chưa submit | 🏗️ New Feature | 🟡 P1 | **Cao** | ⚠️ **Đề xuất plan riêng** — cần infra mới (cron, Telegram Bot API) |
| 10 | Paste Excel → AI phân loại → fill form | 🏗️ New Feature | 🟢 P2 | **Cao** | ⚠️ **Đề xuất plan riêng** — AI NLP, complex UX |

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Sau khi hoàn thành Phase 2 (Employee CRUD A–E) và NS-004 (Admin Dashboard), team audit phát hiện 10 issues liên quan đến luồng phòng chờ, validation, người nghiệm thu, AI OCR, và một số cải tiến UX/nghiệp vụ.
- **Vấn đề cần giải quyết:**
  1. Validation phòng chờ quá chặt khi lưu nháp (cần nhiều field hơn `ho_va_ten`)
  2. UX không rõ ràng cho submit readiness trên list phòng chờ
  3. Thiếu luồng suggest/phê duyệt người nghiệm thu (NNT) khi submit
  4. Thiếu giao diện quản lý "nhân sự phụ trách khối"
  5. Không có cơ chế cảnh báo quá deadline phòng chờ
  6. AI OCR chưa có visual feedback khi fill data
  7. AI OCR chưa đọc "thời gian bắt đầu làm việc"
  8. Enum `loai_hop_dong` chưa đúng nghiệp vụ (`chinh_thuc` → `nhan_vien`)
  9. State transition label sai (`thu_viec` → `dang_lam` thay vì `chinh_thuc`)
  10. Thiếu tính năng paste từ Excel để AI nhận diện trường

- **Mục tiêu:** Sửa các bug, cải thiện UX, và lên plan cho các feature phức tạp
- **Kết quả mong đợi:** Các item P0/đơn giản được xử lý trực tiếp, các item phức tạp được plan chi tiết riêng

## 2. Phạm vi

### In scope (xử lý trực tiếp trong plan này)
- **Item 1**: Nới lỏng validation create để chỉ yêu cầu `ho_va_ten` + `khoi` khi lưu nháp
- **Item 2**: FE hiển thị nút Submit sáng/mờ dựa trên readiness
- **Item 6**: Thêm hiệu ứng nháy ô khi AI fill data
- **Item 7**: Mở rộng OCR prompt đọc thêm `ngay_vao_cong_ty`, tính `ngay_ky_hd`
- **Item 8**: Đổi enum `chinh_thuc` → `nhan_vien` (DB migration + code)
- **Item 9**: Đổi enum `trang_thai`: `dang_lam` → `chinh_thuc` trong DB (User confirmed data hiện tại là data giả → migration an toàn)

### In scope (implement đầy đủ)
- **Item 3**: Triển khai luồng suggest NNT — API thật + UI + phân quyền EA + Audit & Cache
- **Item 4**: Bảng `khoi_managers` + Admin UI tab
- **Item 5**: Stub cho Telegram integration (config, cron concept)

### Out of scope
- **Item 10**: Paste Excel → AI parse (tạo plan riêng hoàn toàn — phức tạp cao, cross-cutting AI + UX)
- Salary-related changes (Phase 3)
- Full Telegram Bot deployment (chỉ thiết kế, không deploy infra)
- Ràng buộc NNT khi có hiệu suất/nhuận/OKR (thuộc Phase Salary, ghi nhận cho plan Phase Salary sau)

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-03-13] Phòng chờ`: `bu`, `nguoi_quan_ly`... cho phép NULL khi tạo nháp, validate Mandatory khi Submit → **Item 1 align đúng**
  - `[2026-03-13] Email Policy`: Cho phép trùng email → **Không ảnh hưởng**
  - `[2026-04-01] Salary Data Isolation`: Không cho phép thay đổi salary qua luồng hồ sơ → **Không ảnh hưởng**
  - `[2026-03-31] ID Mutation Cascade`: `ON UPDATE CASCADE` cho audit → **Item 8 cần audit**
  - `[2026-04-01] AI OCR Base64 Strategy`: Đã có sẵn Base64 pipeline → **Item 7 chỉ sửa prompt**

- **"Cấm kỵ" cần tránh:**
  - KHÔNG dùng Tailwind (Ant Design v6 only)
  - KHÔNG query data trực tiếp từ FE (phải qua API)
  - KHÔNG sửa `ma_nhan_su` immutability
  - KHÔNG skip audit log cho mọi thay đổi

- **Ràng buộc kiến trúc liên quan:**
  - Zod Schema = Single Source of Truth cho FE + BE
  - Permission model: per user per khối (EA/VI/VA/SA)
  - `employee_reviewers` hiện chỉ SA quản lý → **Item 3 sẽ thay đổi quyền này (EA cũng cần edit NNT)**
  - Schema migration: phải tạo file migration mới trong `database/migrations/`

## 4. Giả định và câu hỏi mở

### Giả định
- **G1**: ✅ **Confirmed** — Item 1 — `ho_va_ten` + `khoi` là required tối thiểu khi "Lưu nháp". Mọi field khác optional.
- **G2**: Item 2 — Nút Submit sáng có nghĩa là "đủ thông tin cơ sở" (schema `submitEmployeeSchema` pass). **Không đưa check NNT vào điều kiện làm mờ nút Submit tại list**, vì hành động bổ sung và xác nhận NNT (Suggest NNT) đã được thiết kế chạy tiếp nối ngay bên trong quy trình Submit Wizard Modal (AC-03) khi EA nhấn Submit.
- **G3**: Item 3 — Rule NNT suggest dựa trên chuỗi ID: `khoi → phong_ban → bo_phan → nhom_team → line_nhan_su`, tìm từ cụ thể nhất đến tổng quát nhất.
- **G4**: Item 4 — Bảng `khoi_managers` chỉ chứa mapping `khoi → email phụ trách`, chỉ SA quản lý.
- **G5**: Item 7 — Thời gian thử việc mặc định = 2 tháng (nếu không đọc được từ giấy tờ).
- **G6**: ✅ **Confirmed** — Item 8 — Đổi `chinh_thuc` → `nhan_vien` trong enum `loai_hop_dong`. Data giả → migration an toàn.
- **G7**: ✅ **Confirmed** — Item 9 — Đổi enum `trang_thai`: `dang_lam` → `chinh_thuc` trong DB. Data giả → migration an toàn. Impact: constants, state machine, code references, CHECK constraints.
- **G8**: Item 5 — Telegram warning chỉ cần bắn tin nhắn text (không cần interactive buttons).
- **G9**: ✅ **Confirmed** — Item 3 — EA sửa NNT **chỉ trên form nhân sự** (per-employee). SA giữ toàn quyền (form + Admin Dashboard bulk ops). `BR-PERM-011` được mở rộng, không phá vỡ.

### Câu hỏi mở

> ✅ Tất cả câu hỏi blocking đã được User giải đáp (2026-04-04).

- **[Non-blocking — Item 3]**: Ràng buộc "nếu có hiệu suất/nhuận dự kiến/OKR dự kiến thì bắt buộc có NNT" → các trường `luong_hieu_suat_gt`, `nhuan_but_gt`, `okr_gt` thuộc salary fields, chưa có trong Phase 2. Ghi nhận để bổ sung validation khi Phase 3 (Salary CRUD) triển khai.

- **[Non-blocking — Item 5]**: Telegram Bot Token và Chat ID sẽ do User cung cấp, hay cần tạo bot mới? Thông tin này cần có trong `.env` config.

- **[Non-blocking — Item 7]**: Thời gian thử việc tiêu chuẩn (2 tháng) có đúng cho mọi loại hợp đồng? Hay CTV có quy định riêng?

## 5. Acceptance Criteria

- [ ] **AC-01**: Tạo nhân sự mới chỉ cần `ho_va_ten` + `khoi` → lưu thành công vào phòng chờ (`state_phong_cho = true`)
- [ ] **AC-02**: Nút Submit trên list phòng chờ hiển thị **sáng** nếu NS đủ required fields (pass `submitEmployeeSchema`), **mờ** (disabled style) nếu không
- [ ] **AC-03**: Khi user bấm Submit → hệ thống suggest NNT từ DB → hiển thị confirmation box → user chấp nhận/chỉnh sửa → submit
- [ ] **AC-04**: Có giao diện Admin tab "Phụ trách Khối" cho phép SA quản lý mapping `khoi → email người phụ trách`
- [ ] **AC-05**: (Stub) Sau 3 ngày NS ở phòng chờ chưa submit → cảnh báo Telegram cho NNT hoặc phụ trách khối
- [ ] **AC-06**: Khi AI fill data vào ô → ô đó nháy highlight 3 lần
- [ ] **AC-07**: AI OCR đọc thêm `ngay_vao_cong_ty`. Nếu có → tự tính `ngay_ky_hd` = `ngay_vao_cong_ty + thời gian thử việc`
- [ ] **AC-08**: Enum `loai_hop_dong` có values `nhan_vien` (thay `chinh_thuc`) và `ctv`
- [ ] **AC-09**: Enum `trang_thai` có value `chinh_thuc` thay `dang_lam`. Transition `thu_viec` → `chinh_thuc` khi pass thử việc. Toàn bộ code + DB + state machine cập nhật đúng.
- [ ] **AC-10**: Bắt buộc có NNT mới được submit. Nếu không có → phải xác nhận "Xác nhận không có NNT cho nhân sự này", hệ thống tự động đánh cờ `khong_co_nnt = TRUE` trực tiếp trên bảng `employees` (cột mới thêm) và để trống bảng reviewer, qua đó cho phép State Machine duyệt bypass.
- [ ] **AC-11**: EA có thể gán/sửa NNT trên form nhân sự (per-employee, thuộc khối mình). SA giữ toàn quyền trên cả form + Admin Dashboard.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `packages/shared/src/schemas/employee.ts` | Sửa | Item 1,8: Nới lỏng createSchema, đổi enum | 🔴 | Có — SSoT |
| `packages/shared/src/constants/khoi.ts` | Sửa | Item 8: `LOAI_HOP_DONG_VALUES` + labels | 🟡 | Có |
| `database/migrations/0XX_*.sql` | Tạo | Item 4,8: Thêm bảng, migration enum | 🔴 | Chưa |
| `backend/src/routes/employees.ts` | Sửa | Item 3: Submit flow + NNT suggest API | 🟡 | Có |
| `backend/src/services/employeeService.ts` | Sửa | Item 1,3: Nới lỏng create + NNT suggest logic | 🟡 | Có |
| `backend/src/services/ocrService.ts` | Sửa | Item 7: Mở rộng prompt | 🟢 | Có |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Sửa | Item 2: Submit button sáng/mờ | 🟢 | Chưa |
| `frontend/src/components/EmployeeForm.tsx` | Sửa | Item 1,6,7,8: Validation, animation, enum | 🟡 | Chưa |
| `frontend/src/pages/Employees/EmployeeCreatePage.tsx` | Sửa | Item 1: Nới lỏng required | 🟢 | Chưa |
| `frontend/src/pages/Admin/tabs/` | Tạo | Item 4: Tab quản lý phụ trách khối | 🟢 | Chưa |
| `backend/src/services/telegramService.ts` | Tạo | Item 5: Telegram integration stub | 🟡 | Chưa |
| `backend/src/services/nntService.ts` | Tạo | Item 3: NNT suggestion logic | 🔴 | Chưa |
| `.agent/business/data/SCHEMA.md` | Sửa | Item 4,8: Cập nhật enum, thêm bảng | 🟡 | Có — nguồn sự thật |
| `.agent/business/data/STATE_MACHINES.md` | Sửa | Item 9,3: Đổi enum trang_thai, thêm rule `khong_co_nnt` | 🟡 | Có |
| `packages/shared/src/types/` | Sửa | Item 9: Cập nhật `VALID_STATE_TRANSITIONS` references | 🟡 | Có |
| `.agent/business/data/PERMISSION_MATRIX.md` | Sửa | Item 3: EA permissions cho NNT | 🔴 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes — nhiều item đụng schema, permission, state machine
- **Risk hotspots:**
  - 🔴 **Item 8+9 (Dual Enum migration)**: Thay đổi 2 enum cùng lúc (`loai_hop_dong: chinh_thuc→nhan_vien` + `trang_thai: dang_lam→chinh_thuc`). Cần migration rollback plan rõ ràng. ⚠️ Lưu ý: giá trị `chinh_thuc` di chuyển từ enum này sang enum khác — cần test kỹ.
  - 🔴 **Item 3 (NNT flow)**: Mở rộng permission (EA sửa NNT trên form, SA giữ bulk ops). Submit flow phức tạp, cần review security.
  - 🟡 **Item 1 (Nới validation)**: Rủi ro tạo record rác. Cần đảm bảo submit vẫn validate chặt.
  - 🟡 **Item 5 (Telegram)**: Infra mới (cron job, bot token), cần xử lý retry, rate limit Telegram.

- **Review focus areas:**
  - Dual enum migration: `chinh_thuc` xuất hiện ở cả 2 enum (old `loai_hop_dong` và new `trang_thai`) — migration order quan trọng
  - NNT suggest: algorithm chính xác, xử lý edge cases (NS chưa có org chain rõ)
  - Permission change: EA edit NNT trên form only — middleware phải phân biệt được form-level vs admin-level access
  - Telegram cron: error handling, dedup notifications

- **Known pitfalls / historical issues:**
  - `[2026-03-31] ID Mutation Cascade`: migration phải xử lý cascade đúng
  - `createEmployeeSchema` hiện đang `.strict()` → cần cân nhắc khi thêm field mới
  - `employee_reviewers` hiện chỉ SA quản lý → thay đổi permission cần update middleware

- **Dependencies / rollout concerns:**
  - Item 8 (enum migration) phải chạy **trước** mọi item khác sử dụng enum mới
  - Item 3 (NNT) phụ thuộc Item 4 (bảng phụ trách khối) cho fallback notification
  - Item 5 (Telegram) phụ thuộc Item 3 (NNT) + Item 4 (phụ trách khối)

## 8. Chiến lược triển khai

- **Phase strategy:** Chia thành 5 phases theo dependency chain:
  1. **Phase 1 — Schema & Dual Enum Migration** (Item 8, 9, 1): Migration 2 enums + nới validation. Phải chạy đầu tiên vì mọi phase sau phụ thuộc enum values mới.
  2. **Phase 2 — UX Improvements** (Item 2, 6): FE-only changes, low risk
  3. **Phase 3 — OCR Enhancement** (Item 7): Sửa AI prompt + auto-calculate
  4. **Phase 4 — Khối Manager & NNT Flow** (Item 4, 3): Bảng mới + luồng submit (Suggest NNT, Approval Modal, EA Edit).
  5. **Phase 5 — Telegram Stub** (Item 5): Config + concept. ⚠️ Tạo plan riêng cho infra deployment

- **Thứ tự triển khai:** Phase 1 → 2 → 3 → 4 → 5
- **Điểm cần phối hợp:** ✅ Tất cả câu hỏi blocking đã được User confirm (2026-04-04).
- **Yêu cầu migration / config / deploy:**
  - Migration SQL: `0xx_rename_loai_hop_dong_enum.sql`, `0xx_khoi_managers_table.sql`, `0xx_employee_khong_co_nnt.sql`
  - Config: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (khi Phase 5)
  - Deploy: Schema migration phải chạy trước deploy code mới

## 9. Test Strategy

- **Automated tests:**
  - Unit test: Zod schema validation (create draft → chỉ cần `ho_va_ten` + `khoi`)
  - Unit test: `submitEmployeeSchema` vẫn validate chặt
  - Integration test: Create employee with minimal data → success
  - Integration test: Submit employee with missing required → fail
  - Integration test: Enum migration → existing data correct

- **Manual verification:**
  - [ ] Tạo NS mới chỉ nhập tên → lưu OK → hiện trong phòng chờ
  - [ ] Submit button sáng/mờ chính xác
  - [ ] AI OCR fill data → ô nháy 3 lần
  - [ ] OCR đọc ngày vào công ty → tự tính ngày ký HĐ
  - [ ] Enum hiển thị "Nhân viên" thay "Chính thức"

- **Data / env chuẩn bị trước khi test:**
  - Chạy migration trên dev DB
  - Seed data có record với `loai_hop_dong = 'chinh_thuc'` để test migration
  - Employee test data trong phòng chờ (đầy đủ và thiếu fields)

## 10. Rollback Plan

- **Phase 1 (Migration)**: Có migration rollback SQL (rename enum lại). Backup DB trc khi migrate.
- **Phase 2-3 (FE only)**: Revert git commit.
- **Phase 4**: Xóa bảng `khoi_managers`, chạy lệnh `ALTER TABLE employees DROP COLUMN khong_co_nnt`, update lại View `employee_info_only` và revert code. Chấp nhận các bản ghi NNT (trong `employee_reviewers`) được sinh ra trong Phase 4 do cơ chế cache/authorization cũ vẫn hỗ trợ.
- **Phase 5**: Revert code (hiện tại mới là khái niệm).

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

## 12. Items cần Plan riêng (đề xuất)

| Item | Lý do cần plan riêng | Scope dự kiến |
|------|----------------------|---------------|
| **#5 — Telegram Warning** | Infra mới (cron/scheduler, Telegram Bot API), retry/dedup logic, environment config, deployment | BE: telegramService, cron job, config. Infra: Cloud Scheduler hoặc Cloud Run Jobs |
| **#10 — Paste Excel → AI Parse** | AI NLP parse unstructured text, complex UX (diff/compare UI), edge cases với data format | FE: Paste box, AI comparison UI. BE: parseService (AI text → structured). Shared: field mapping |
