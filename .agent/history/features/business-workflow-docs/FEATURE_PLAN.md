# Feature Plan: Business Workflow Documentation

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: User skip review (2026-03-27) — feature thuần docs, không chạm code. Rủi ro chấp nhận được.
> **Feature slug**: business-workflow-docs
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-03-27

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Dự án đã có bộ tài liệu nghiệp vụ tốt trong `.agent/business/` (4 module specs + 3 data docs), nhưng chúng phục vụ chủ yếu cho AI implement code. Thiếu bộ tài liệu **luồng nghiệp vụ end-to-end** (workflow-centric) mà cả AI lẫn con người (User, QC, BA) và chatbot đều khai thác được.
- **Vấn đề cần giải quyết:**
  1. Không có tài liệu "step-by-step" nào cho phép user hiểu quy trình vận hành (SOP) mà không cần đọc code.
  2. AI thiếu nguồn chân lý luồng nghiệp vụ để đối chiếu khi review code, viết test E2E, hoặc phản biện logic.
  3. Business knowledge đang nằm trong `.agent/` — khu vực chỉ dành cho AI operational, khiến user/QC không tiếp cận tự nhiên.
  4. Nếu tạo bộ tài liệu mới mà không reconcile, sẽ gây duplicate source of truth → loãng docs.
- **Mục tiêu:**
  1. Tạo bộ **Workflow Specification** chuẩn hóa tại `docs/business-flows/` — một nguồn chân lý duy nhất cho cả 3 đối tượng: AI, User, Chatbot.
  2. Migrate business knowledge từ `.agent/business/` sang `docs/business-flows/` — giữ `.agent/` thuần AI-operational.
  3. Thiết lập template + naming convention bền vững cho mở rộng sau này.
- **Kết quả mong đợi:**
  - 7 workflow spec files (`01-tao-moi-nhan-su.md` → `07-xoa-nhan-su.md`) + 1 mục lục `00-MASTER-INDEX.md`.
  - `.agent/business/INDEX.md` trở thành thin pointer trỏ sang `docs/business-flows/`.
  - Mỗi workflow spec có frontmatter structured (cho AI/RAG) + nội dung Markdown (cho người đọc).

## 2. Phạm vi

### In scope
1. **Chốt canonical home**: Promote business docs từ `.agent/business/` → `docs/business-flows/`.
2. **Tạo template chuẩn**: Frontmatter + body structure cho workflow spec.
3. **Tạo `00-MASTER-INDEX.md`**: Mục lục + cổng vào duy nhất.
4. **Viết 7 workflow specs**:
   - `01-tao-moi-nhan-su.md`: Tạo mới nhân sự (bao gồm phòng chờ + submit)
   - `02-cap-nhat-thong-tin.md`: Cập nhật thông tin nhân sự
   - `03-dieu-chinh-luong.md`: Điều chỉnh lương
   - `04-nghi-viec.md`: Nghỉ việc & Các chuyển trạng thái liên quan
   - `05-dieu-chuyen-phong-ban.md`: Điều chuyển khối/phòng ban
   - `06-thay-doi-chuc-danh.md`: Thay đổi chức danh
   - `07-xoa-nhan-su.md`: Xóa nhân sự
5. **Migrate `.agent/business/`**: Chuyển `INDEX.md` thành thin pointer; archive module specs cũ hoặc giữ ở dạng reference (không duplicate nội dung).
6. **Cập nhật `.agent/CONTEXT.md`**: Thêm link tới `docs/business-flows/` trong navigation map.

### Out of scope
- **Viết manual user riêng** (dạng tutorial/guide) — workflow spec chính là SOP, chưa cần tách.
- **Tạo chatbot RAG** — đó là phase sau, workflow specs chỉ cần đảm bảo RAG-friendly (frontmatter + heading structured).
- **Tạo bản sao của `STATE_MACHINES.md`, `PERMISSION_MATRIX.md`, `SCHEMA.md`** trong `docs/business-flows/` — workflow specs sẽ **tham chiếu** (reference link) tới source of truth hiện tại, không copy lại.
- **Sửa code, migration, hoặc fix bug** — đây là feature thuần docs. Nếu phát hiện mâu thuẫn code-vs-business, ghi vào Discrepancy Register, không tự sửa code.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - KB entry `[2026-03-13] Email Policy`: Hệ thống cho phép trùng email → workflow "Tạo mới" phải phản ánh edge case này.
  - KB entry `[2026-03-13] Phòng chờ`: Cho phép NULL khi tạo nháp, validate khi submit → workflow phải nêu rõ 2 giai đoạn validation.
  - KB entry `[2026-03-13] trang_thai = nghi_viec → block change`: Workflow "Nghỉ việc" phải ghi rõ đây là terminal state.
  - KB entry `[2026-03-13] Snapshot Rechốt → backup GCS trước khi ghi đè`: Nếu workflow liên quan snapshot, phải tham chiếu.
  - KB entry `[2026-03-13] ma_nhan_su Immutable, ON DELETE SET NULL`: Workflow "Xóa" phải phản ánh.
  - KB entry `[2026-03-14] BR-004 (employee_reviewers)`: Workflow "Điều chuyển" phải nêu edge case reviewer mismatch.

- **"Cấm kỵ" cần tránh:**
  - **KHÔNG** duplicate nội dung Schema/State Machine/Permission Matrix vào workflow docs — chỉ tham chiếu bằng link + BR-ID.
  - **KHÔNG** tạo file lẻ ngoài catalog — mọi workflow phải được đăng ký trong `00-MASTER-INDEX.md`.

- **Ràng buộc kiến trúc liên quan:**
  - Docs sẽ tham chiếu `.agent/business/data/SCHEMA.md`, `.agent/business/data/STATE_MACHINES.md`, `.agent/business/data/PERMISSION_MATRIX.md` như technical contract. Do đó cần giữ ổn định relative path giữa `docs/business-flows/` và `.agent/business/data/`.

## 4. Giả định và câu hỏi mở

### Giả định
1. **G1**: Bộ tài liệu technical contract (SCHEMA, STATE_MACHINES, PERMISSION_MATRIX) vẫn giữ nguyên tại `.agent/business/data/` — không migrate, vì đây thuộc AI-operational knowledge. Workflow specs tham chiếu bằng relative path.
2. **G2**: Module specs hiện tại (NS-001 → NS-004) trong `.agent/business/modules/` sẽ **giữ nguyên** nhưng đánh dấu là "reference only — source of truth cho workflow đã chuyển sang `docs/business-flows/`". Lý do: các module specs còn chứa Validation Rules, Implementation details mà workflow không cần copy.
3. **G3**: Naming convention `xx-ten-tieng-viet.md` (số thứ tự + tên tiếng Việt kebab-case) phù hợp cho team Việt Nam và quy mô ~7 files. Nếu sau này có luồng Non-Employee, thêm prefix nhóm (VD: `08-tuyen-dung-xxx.md`).
4. **G4**: Frontmatter dùng `schema_version` (VD: `2.5.0` — lấy từ `001_schema.sql` header) + `last_verified_at` (ngày verify gần nhất). Không dùng `last_verified_code` (path dễ stale). Dùng `related_modules` trỏ tới module ID.

### Câu hỏi mở
- [Non-blocking] `.agent/business/modules/` nên archive hay giữ nguyên kèm header cảnh báo? → Giả định G2: giữ nguyên + header cảnh báo.
- [Non-blocking] Workflow "Thay đổi chức danh" (`WF-EMP-06`) — có luồng riêng hay là sub-case của "Cập nhật thông tin"? → Giả định: tách file riêng vì chức danh (`chuc_danh`) kéo theo thay đổi lương + role, cần document rõ.
- [Non-blocking] Có cần version lock giữa workflow doc và schema version không? → Giả định: Có — dùng `schema_version` (giá trị VD: `2.5.0`) + `last_verified_at` (ngày) trong frontmatter.

## 5. Acceptance Criteria

- [ ] AC-01: Thư mục `docs/business-flows/` tồn tại với cấu trúc: `00-MASTER-INDEX.md` + `01-xxx.md` → `07-xxx.md` (7 files)
- [ ] AC-02: Mỗi workflow file có frontmatter chuẩn (fields: `workflow_id`, `module`, `title`, `status`, `actors_allowed`, `actors_denied`, `entities`, `business_rules`, `related_modules`, `schema_version`, `last_verified_at`)
- [ ] AC-03: Body mỗi workflow có đủ 9 section: Mục đích, Quyền hạn, Điều kiện tiên quyết, Luồng chính (Mermaid flowchart + step-by-step), Edge cases, Dữ liệu bị tác động, Audit/Change history, Checklist test, FAQ
- [ ] AC-03a: Section 1—5 và 8—9 phải **self-contained** cho user đọc hiểu mà không cần mở `.agent/`. Chỉ section 6—7 (Dữ liệu bị tác động / Audit) được reference sang `.agent/business/data/`.
- [ ] AC-04: `00-MASTER-INDEX.md` liệt kê đầy đủ 7 workflow kèm summary, status, và link. Có section **Discrepancy Register** ghi các mâu thuẫn đã biết giữa docs và code.
- [ ] AC-05: `.agent/business/INDEX.md` trở thành **pure redirect** (≤15 dòng): 1 dòng redirect + link tới `00-MASTER-INDEX.md` + links tới technical contracts.
- [ ] AC-06: `.agent/CONTEXT.md` section 2 có thêm entry cho `docs/business-flows/`.
- [ ] AC-07: Không có nội dung Schema/State Machine/Permission Matrix bị **duplicate** (copy nguyên bảng) sang workflow docs — chỉ reference bằng link + BR-ID.
- [ ] AC-08: Tất cả Business Rule ID (BR-xxx-xxx) được sử dụng trong workflow phải tồn tại trong source of truth (module specs + data docs).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|---|---|---|---|---|
| `docs/business-flows/00-MASTER-INDEX.md` | Tạo mới | Cổng vào duy nhất cho bộ workflow | 🟢 Thấp | Không |
| `docs/business-flows/01-tao-moi-nhan-su.md` → `07-xoa-nhan-su.md` | Tạo mới (7 files) | 7 workflow spec files | 🟢 Thấp | Không |
| `.agent/business/INDEX.md` | Sửa | Chuyển thành thin pointer | 🟡 Trung bình — nếu sai link sẽ đứt read-path AI | Không |
| `.agent/business/modules/NS-001..NS-004` | Sửa nhẹ | Thêm header "reference only" + link sang workflow tương ứng | 🟡 Trung bình — phải giữ content nguyên, chỉ thêm header | Không |
| `.agent/CONTEXT.md` | Sửa nhẹ | Thêm row cho `docs/business-flows/` | 🟢 Thấp | Không |

## 7. Risk Triage và Review Focus

- **Review required:** Khuyến nghị (không bắt buộc) — đây là feature thuần docs, không chạm code.
- **Risk hotspots:**
  - **R1: Broken read-path** — Nếu `.agent/business/INDEX.md` sửa sai, AI sẽ mất navigation tới business docs. Cần test bằng cách giả lập AI đọc từ CONTEXT → INDEX → workflow.
  - **R2: Duplicate source of truth** — Nếu workflow docs copy nguyên bảng Schema/Permission vào trong, khi Schema thay đổi sẽ tạo mâu thuẫn. Phải enforce "reference only" rule (AC-07).
  - **R3: Stale frontmatter** — `schema_version` và `last_verified_at` có thể bị quên cập nhật khi Schema thay đổi. Đây là rủi ro dài hạn, chấp nhận ở phase này.
- **Review focus areas:**
  - Kiểm tra relative link giữa `docs/business-flows/` → `.agent/business/data/` có chính xác?
  - Kiểm tra nội dung 7 workflow có phản ánh đúng business rules hiện tại (đối chiếu module specs NS-001..NS-004)?
  - Kiểm tra catalog đủ đầy, không có file lẻ ngoài catalog.
- **Known pitfalls / historical issues:** Không có — đây là feature mới thuần docs.
- **Dependencies / rollout concerns:** Không có migration/deploy. Chỉ cần commit docs lên git.

## 8. Chiến lược triển khai

- **Phase strategy:** 3 phases — Nền tảng → Viết workflows → Reconcile & polish
  1. **Phase 1 — Foundation**: Tạo template chuẩn, `00-MASTER-INDEX.md`, thư mục `docs/business-flows/`.
  2. **Phase 2 — Write Workflows**: Viết 7 workflow spec files dựa trên nội dung module specs NS-001..NS-004 + STATE_MACHINES + PERMISSION_MATRIX. Mỗi file tham chiếu (không copy) business rules.
  3. **Phase 3 — Reconcile & Polish**: Sửa `.agent/business/INDEX.md` thành thin pointer, thêm header "reference only" vào module specs, cập nhật `.agent/CONTEXT.md`.

- **Thứ tự triển khai:** Phase 1 → Phase 2 → Phase 3 (tuần tự).
- **Điểm cần phối hợp:** User review nội dung workflow có đúng quy trình thực tế không (đặc biệt WF-EMP-05, WF-EMP-06 chưa có nhiều mô tả trong module specs hiện tại).
- **Yêu cầu migration / config / deploy:** Không.

## 9. Test Strategy

- **Automated tests:** Không cần — feature thuần docs.
- **Manual verification:**
  1. **Link integrity check**: Mở từng workflow file, verify tất cả relative links tới `.agent/business/data/` không bị 404.
  2. **Content accuracy check**: Đọc từng workflow, đối chiếu với module spec tương ứng để đảm bảo không có business rule bị thiếu hoặc sai.
  3. **Read-path simulation**: Giả lập AI flow: đọc `CONTEXT.md` → tìm business docs entry → đọc `00-MASTER-INDEX.md` → chọn workflow → đọc content. Đảm bảo không đứt gãy.
  4. **Duplicate check**: Grep toàn bộ `docs/business-flows/` để đảm bảo không có bảng Schema/Permission bị copy nguyên.
- **Data / env chuẩn bị:** Không.

## 10. Rollback Plan

- Feature thuần docs → rollback = `git revert` commit. Không có side effect.
- Module specs cũ vẫn giữ nguyên nội dung, chỉ thêm header — rollback chỉ cần xóa header.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

---

## Phụ lục A: Template Workflow Spec (Chuẩn hóa)

### Frontmatter chuẩn

```yaml
---
workflow_id: WF-EMP-XX
title: [Tiêu đề tiếng Việt]
module: [NS-001 | NS-002 | NS-003 | NS-004]
status: draft | verified | implemented
actors_allowed: [EA, SA]
actors_denied: [VI, VA]
entities: [employees, salaries, change_history, audit_log]
business_rules: [BR-001-001, BR-001-007]
related_modules: [NS-001, NS-002]
schema_version: "2.5.0"
last_verified_at: "2026-03-27"
---
```

> **Lưu ý**: `workflow_id` vẫn dùng format `WF-EMP-XX` trong frontmatter (cho AI/RAG truy vấn). Tên file dùng tiếng Việt (cho con người browse thư mục).

### Body structure chuẩn

```markdown
# [WF-EMP-XX] [Tiêu đề]

## 1. Mục đích
## 2. Quyền hạn (Ai được thực hiện)
## 3. Điều kiện tiên quyết
## 4. Luồng chính
### 4.1. Flowchart (Mermaid)
### 4.2. Từng bước (Step-by-step)
## 5. Ngoại lệ và Edge Cases
## 6. Dữ liệu bị tác động
## 7. Audit Log / Change History yêu cầu
## 8. Checklist Test
## 9. FAQ (Ngắn gọn)
```

### Nguyên tắc viết
1. **Tham chiếu, không copy**: Schema fields → link tới `SCHEMA.md#section`. Business rules → dùng BR-ID.
2. **Mermaid flowchart**: Mỗi workflow PHẢI có ít nhất 1 flowchart trong section 4.1.
3. **Step-by-step**: Viết dạng SOP (Standard Operating Procedure) — user đọc hiểu mà không cần biết code.
4. **Audit/Change History**: Ghi rõ action name, payload mẫu — AI dùng để verify implementation.
5. **Checklist Test**: Liệt kê test cases tối thiểu — AI/QC dùng để kiểm tra.

## Phụ lục B: Phản biện ý kiến chuyên gia (Đã chọn lọc)

| Ý kiến | Kết luận | Lý do |
|---|---|---|
| Corpus canonical + 2 entrypoint riêng | ⚠️ Học 1 nửa | Canonical corpus = đúng. 2 entrypoint riêng = over-engineering cho ~7 workflows. Dùng 1 file (frontmatter cho AI + body cho user). |
| Promote business docs khỏi `.agent/` sang `docs/` | ✅ Áp dụng | `.agent/` chỉ giữ AI-operational. Business knowledge chung → `docs/business-flows/`. |
| `last_verified_code` trong frontmatter | ❌ Loại | Path file thay đổi liên tục → stale. Thay bằng `related_modules` (module ID ổn định). |
| Tạo `glossary.md`, `permission-model.md`, `state-machines.md` riêng trong `docs/` | ❌ Loại | Đã có SOURCE OF TRUTH tại `.agent/business/data/`. Tạo thêm = duplicate. Workflow sẽ tham chiếu bằng link. |
| `00-MASTER-INDEX.md` làm cổng vào duy nhất | ✅ Áp dụng | Giúp discovery, tránh file lẻ. |
| Viết "workflow spec" chuẩn hóa thay vì "manual user" riêng | ✅ Áp dụng (core idea) | Workflow spec = 1 source phục vụ 3 đối tượng (AI + User + Chatbot). |
| Reconcile / sửa mismatch trước khi viết | ✅ Áp dụng một phần | Check mismatch trong Phase 2 khi viết từng workflow, ghi lại discrepancy nếu phát hiện. Không block Phase 1. |
| Mỗi doc có owner, status | ✅ Áp dụng bớt | Status có trong frontmatter. Owner không cần ở giai đoạn hiện tại (1 team nhỏ). |

## Phụ lục C: Post-Review Amendments (Sau phản biện chuyên gia lần 1)

| # | Nhận định chuyên gia | Kết luận | Hành động đã áp |
|---|---|---|---|
| 1 | Source of truth giải mới một nửa | ⚠️ Đúng 1 phần | Thêm AC-03a: Section 1-5, 8-9 self-contained cho user. Giữ technical contracts tại `.agent/` (đúng chỗ). |
| 2 | Known mismatches ngoài scope → docs sai ngay | ✅ Đúng severity | Thêm Discrepancy Register vào `00-MASTER-INDEX.md` (AC-04). Ghi 2 mismatch đã biết: reviewer UUID bug + email policy vi phạm. |
| 3 | `last_verified_schema` lệch nghĩa | ✅ Đúng hoàn toàn | Tách thành `schema_version: "2.5.0"` + `last_verified_at: "2026-03-27"`. |
| 4 | `04-nghi-viec.md` ôm quá nhiều | ⚠️ Đúng 1 phần | Giữ 1 file nhưng scope rõ: nghỉ sinh + thử việc không pass là edge case/reference, không phải luồng chính. |
| 5 | Thin pointer chưa thin | ✅ Đúng | INDEX.md sẽ chỉ còn ≤15 dòng: 1 redirect dòng + 3 links. Xóa Executive Summary, Glossary, Module Map. |
