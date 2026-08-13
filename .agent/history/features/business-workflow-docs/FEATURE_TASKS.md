# Feature Tasks: Business Workflow Documentation

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-03-27

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Foundation — Template & Catalog

**Mục tiêu:** Tạo nền tảng cấu trúc thư mục, template chuẩn, và catalog file.

- [x] Task 1.1: Tạo thư mục `docs/business-flows/`
- [x] Task 1.2: Tạo file `docs/business-flows/00-MASTER-INDEX.md` với:
  - Header + mục đích + reading guide
  - Bảng liệt kê 7 workflow (01 → 07) kèm title, module, status, actors, link
  - Section "Quy ước đọc" giải thích cách AI/User/Chatbot dùng docs này
  - Section "Tham chiếu Technical Contract" với link tới `.agent/business/data/` (SCHEMA, STATE_MACHINES, PERMISSION_MATRIX)
  - Section **"Discrepancy Register"** ghi các mâu thuẫn đã biết giữa docs và code, kèm trạng thái (open/resolved). Ghi sẵn 2 known issues:
    - `[DISC-001]` Reviewer UUID bug: `getReviewerEmployeeIds()` trả về UUID nhưng so sánh với `ma_nhan_su` (VARCHAR) → reviewer permission không hoạt động đúng
    - `[DISC-002]` Email policy violation: KB cho phép email trùng nhưng `createEmployee` throw 409 nếu email đã tồn tại
- [x] Task 1.3: Tạo file `docs/business-flows/_TEMPLATE.md` chứa template chuẩn cho workflow spec (frontmatter + body structure theo Phụ lục A trong FEATURE_PLAN)
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Bắt buộc)
  - Verify thư mục tồn tại và đúng cấu trúc
  - Verify `00-MASTER-INDEX.md` có đủ 7 entries + Discrepancy Register
  - Verify template file có đủ frontmatter fields (bao gồm `schema_version`, `last_verified_at`) và 9 body sections

## Phase 2: Write Workflow Specs — Nhóm Core (4 workflows chính)

**Mục tiêu:** Viết 4 workflow specs quan trọng nhất, phản ánh đúng business rules trong module specs hiện tại.

- [x] Task 2.1: Viết `01-tao-moi-nhan-su.md` — Tạo mới nhân sự
  - Nguồn: NS-001 Section 3.1 (Case Setup) + NS-002 Section 3.1 + STATE_MACHINES Section 2 (Phòng chờ)
  - Phải bao gồm: 2 giai đoạn (Nhập nháp → Submit), edge case email trùng, validation 2 phase
  - Phải có Mermaid flowchart
- [x] Task 2.2: Viết `02-cap-nhat-thong-tin.md` — Cập nhật thông tin nhân sự
  - Nguồn: NS-001 Section 3.2 + NS-002 Section 3.2
  - Case: cập nhật thông tin thường + cập nhật kéo theo lương
  - Phải bao gồm: state_phong_cho flow khi cập nhật
- [x] Task 2.3: Viết `03-dieu-chinh-luong.md` — Điều chỉnh lương
  - Nguồn: NS-002 Section 3.3
  - Case: điều chỉnh lương độc lập (không qua phòng chờ), deadline ngày 27
  - Phải bao gồm: 2 bộ lương (Giấy tờ + Cơ chế), edge case M1/M2/M3
- [x] Task 2.4: Viết `04-nghi-viec.md` — Nghỉ việc & Các chuyển trạng thái liên quan
  - Nguồn: NS-001 Section 3.4 + STATE_MACHINES Section 1 (Employee State)
  - **Luồng chính**: Nghỉ việc (terminal state blocking, `ngay_nghi_viec`, tác động tới snapshot BR-003-010)
  - **Edge case / Related transitions** (không phải luồng chính của file này): nghỉ sinh (NS-001 Section 3.3), thử việc không pass. Trình bày như reference ngắn, link sang state machine.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Bắt buộc)
  - Verify 4 files tồn tại, có đúng frontmatter + 9 sections
  - Verify tất cả BR-IDs được dùng đều tồn tại trong source of truth
  - Verify không có bảng Schema/Permission bị copy nguyên (chỉ reference link)
  - Verify tất cả relative links tới `.agent/business/data/` hoạt động

## Phase 3: Write Workflow Specs — Nhóm Phụ (3 workflows bổ sung)

**Mục tiêu:** Viết 3 workflow specs cho các luồng ít xuất hiện hơn nhưng quan trọng.

- [x] Task 3.1: Viết `05-dieu-chuyen-phong-ban.md` — Điều chuyển khối/phòng ban
  - Nguồn: NS-001 Section 3.2 (sub-case điều chuyển) + NS-002 Section 3.2 + NS-004 BR-004-009
  - Phải bao gồm: reviewer mismatch khi đổi khối, thay đổi quyền truy cập, state_phong_cho flow
  - Edge case: NS chuyển khối giữa tháng → ảnh hưởng snapshot nào?
- [x] Task 3.2: Viết `06-thay-doi-chuc-danh.md` — Thay đổi chức danh
  - Nguồn: NS-001 Section 3.2 (sub-case chức danh) + NS-002 nếu chức danh mới kéo theo lương
  - Phải bao gồm: đây có phải sub-case của Update hay đủ phức tạp để tách riêng
  - Nếu nghiệp vụ đơn giản, ghi ngắn gọn + note rằng đây thực chất là variant của `02-cap-nhat-thong-tin.md`
- [x] Task 3.3: Viết `07-xoa-nhan-su.md` — Xóa nhân sự
  - Nguồn: NS-001 Section 3.6 (Xóa NS) + BR-001-010..BR-001-014
  - Phải bao gồm: soft delete (chuyển nghỉ việc) vs hard delete (SA only, Defer Phase 4/6)
  - Phải bao gồm: Impact lên `change_history`, salary data, `employee_reviewers` (ON DELETE SET NULL / CASCADE)
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (Bắt buộc)
  - Same checks as Phase 2 Final
  - Verify tổng cộng 7 workflow files đều tồn tại

## Phase 4: Reconcile — Pointer Migration & Context Update

**Mục tiêu:** Chuyển `.agent/business/INDEX.md` thành pure redirect, cập nhật CONTEXT, đánh dấu module specs cũ.

- [x] Task 4.1: Sửa `.agent/business/INDEX.md` thành **pure redirect** (≤15 dòng)
  - Chỉ giữ: 1 dòng redirect nghĩa vụ + link tới `docs/business-flows/00-MASTER-INDEX.md`
  - Thêm: Links tới technical contracts (`data/SCHEMA.md`, `data/STATE_MACHINES.md`, `data/PERMISSION_MATRIX.md`)
  - **Xóa**: Executive Summary, Glossary, Reading Order, Module Map, Conventions, Data Flow
- [x] Task 4.2: Thêm header "⚠️ Reference Only" vào 4 module spec files (NS-001..NS-004)
  - Header nội dung: "Source of truth cho luồng nghiệp vụ đã chuyển sang `docs/business-flows/`. File này giữ lại làm technical reference cho Validation Rules và Implementation details."
  - KHÔNG sửa nội dung gốc
- [x] Task 4.3: Cập nhật `.agent/CONTEXT.md` Section 2 (`.agent/` Directory Navigation)
  - Thêm section "Business Workflow Docs" với entry: `docs/business-flows/00-MASTER-INDEX.md` → "Bộ tài liệu luồng nghiệp vụ chuẩn hóa (AI + User + Chatbot)"
- [x] Task 4.4: Cập nhật `00-MASTER-INDEX.md` — đổi status các workflow từ `planned` → `draft` (nếu vừa viết xong)
- [x] Task 4.Final: 🧪 Test & Verify Phase 4 (Bắt buộc)
  - **Read-path simulation**: Đọc `CONTEXT.md` → tìm business docs → đọc `00-MASTER-INDEX.md` → chọn 1 workflow → đọc → tìm BR-ID → trỏ về source of truth. Verify không đứt gãy.
  - **Duplicate check**: Grep `docs/business-flows/` cho các keyword bảng lớn (VD: `| Field | Type |`) để đảm bảo không copy nguyên bảng Schema.
  - **Pure redirect check**: Verify `.agent/business/INDEX.md` chỉ còn ≤15 dòng — pure redirect + links, không còn Executive Summary, Glossary, Module Map.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-03-27 22:30 | — | — | User skip review, cho phép triển khai | done | Feature thuần docs |
| 2026-03-27 22:30 | P1 | 1.1 | Bắt đầu Phase 1 — tạo thư mục | start | — |
| 2026-03-27 22:31 | P1 | 1.1 | Tạo `docs/business-flows/` | done | — |
| 2026-03-27 22:31 | P1 | 1.2 | Bắt đầu viết 00-MASTER-INDEX.md | start | — |
| 2026-03-27 22:32 | P1 | 1.2 | Tạo 00-MASTER-INDEX.md đủ 5 sections + 7 entries + Discrepancy Register | done | — |
| 2026-03-27 22:32 | P1 | 1.3 | Tạo _TEMPLATE.md đủ 12 frontmatter fields + 9 body sections | done | — |
| 2026-03-27 22:33 | P1 | 1.Final | Bắt đầu self-test Phase 1 | start | — |
| 2026-03-27 22:34 | P1 | 1.Final | Self-test 5/5 pass. Chờ User confirm. | done | Dir ✅ 7entries ✅ DISC ✅ frontmatter ✅ 9sections ✅ |
| 2026-03-27 23:07 | P1 | 1.Final | User confirm pass (sửa 2 title: WF-02 làm rõ scope, WF-05 bỏ /) | done | Phase 1 ✅ hoàn thành |
| 2026-03-27 23:07 | P2 | 2.1 | Bắt đầu Phase 2 — viết 01-tao-moi-nhan-su.md | start | — |
| 2026-03-27 23:10 | P2 | 2.1 | Viết 01-tao-moi-nhan-su.md (11 BR-IDs, Mermaid, 8 edge cases) | done | — |
| 2026-03-27 23:12 | P2 | 2.2 | Viết 02-cap-nhat-thong-tin.md (scope rõ: SĐT, kỳ NT, khu vực, NQL) | done | — |
| 2026-03-27 23:15 | P2 | 2.3 | Viết 03-dieu-chinh-luong.md (2 bộ lương, M1/M2/M3, deadline 27) | done | — |
| 2026-03-27 23:18 | P2 | 2.4 | Viết 04-nghi-viec.md (terminal state, snapshot impact, ref nghỉ sinh/thử việc) | done | — |
| 2026-03-27 23:20 | P2 | 2.Final | Self-test: 4 files ✅, frontmatter ✅, 9 sections ✅, 0 duplicate tables ✅, 26 ref links ✅, 18 BR-IDs validated ✅ | done | Chờ User confirm |
| 2026-03-28 09:43 | P2 | 2.Final | User confirm pass (feedback: upload ảnh bắt buộc WF-01, BU/PB/team → WF-05, UI routing popup) | done | Phase 2 ✅ hoàn thành |
| 2026-03-28 09:43 | P3 | 3.1 | Bắt đầu Phase 3 — viết 05-dieu-chuyen-phong-ban.md | start | — |
| 2026-03-28 09:45 | P3 | 3.1 | Viết 05 (reviewer mismatch, quyền đổi khối, snapshot impact) | done | — |
| 2026-03-28 09:46 | P3 | 3.2 | Viết 06 (variant WF-02, kéo theo lương, ghi chú merge lại nếu đơn giản) | done | — |
| 2026-03-28 09:47 | P3 | 3.3 | Viết 07 (soft/hard delete, SA only, Defer Phase 4/6, FK impact) | done | — |
| 2026-03-28 09:48 | P3 | 3.Final | Self-test: 7/7 files ✅, 9 sections ✅, mermaid ✅, 0 dup tables ✅, 16 ref links ✅ | done | Chờ User confirm |
| 2026-03-28 10:45 | P3 | 3.Final | User confirm pass | done | Phase 3 ✅ hoàn thành |
| 2026-03-28 10:45 | P4 | 4.1 | Bắt đầu Phase 4 — sửa INDEX.md thành pure redirect | start | — |
| 2026-03-28 10:46 | P4 | 4.1 | INDEX.md thành pure redirect | done | — |
| 2026-03-28 10:50 | P4 | 4.2 | Thêm Reference Only vào 4 files NS-001..NS-004 | done | — |
| 2026-03-28 10:51 | P4 | 4.3 | Cập nhật CONTEXT.md Section 2 sang MASTER-INDEX mới | done | — |
| 2026-03-28 10:52 | P4 | 4.4 | Đổi workflow status sang draft tại 00-MASTER-INDEX | done | — |
| 2026-03-28 10:54 | P4 | 4.Final | Self-test: Pure redirect pass, Ref Only pass, Dup check pass | done | Phase 4 ✅ |
| 2026-03-28 10:54 | — | — | Feature hoàn thành tất cả các tasks | done | ✅ Hoàn thành |
