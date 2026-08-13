# Feature Plan: Merge nhánh pending-room-documents vào main

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: User tự review conflict resolution trước khi push
> **Feature slug**: merge-pending-room-documents
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-26
> **Review**: Đã qua phản biện hội đồng 3 vòng, KTS chốt ✅

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Nhánh `feature/ns-003-pending-room-documents` (3 commits) đã hoàn thành tính năng "Xem giấy tờ chưa submit trong Phòng chờ". Main đã tiến thêm 5 commits.
- **Vấn đề cần giải quyết:** Merge nhánh feature vào main an toàn, resolve 2 conflicts, và kiểm soát rủi ro từ các dependency rác do quá trình dev trên Windows để lại.
- **Mục tiêu:** Main nhận tính năng xem tài liệu Popover + phân quyền, giữ nguyên mọi cải tiến đã có trên main.
- **Kết quả mong đợi:** Main build thành công, CI xanh trên Ubuntu, tính năng mới hoạt động đúng.

## 2. Phạm vi

### In scope
- Resolve 2 merge conflicts thủ công: `employeeService.ts`, `PendingRoomPage.tsx`
- Loại bỏ root dependency rác của Windows (`@rolldown/binding-win32-x64-msvc`) khỏi nhánh trước khi merge
- Loại bỏ docs của feature khác (`monthly-data-finalization`) bị đưa nhầm vào nhánh
- Build verification + smoke test
- Cập nhật Rollback plan phù hợp với chiến lược tạo merge commit (`--no-ff`)

### Out of scope
- Không sửa logic nghiệp vụ mới
- Không thêm DTO cho pending documents (follow-up tech debt)
- Không can thiệp các file auto-merge (changelog, history docs, test rác) do git 3-way merge sẽ tự xử lý đúng

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - [Salary Pending Isolation] — Nhánh đã đúng khi fetch `salaries.pending_changes` riêng
  - [Batch-Chunking Strategy] — Nhánh đã chunked query `employee_documents`
  - [TMP-based New Hire Identification] — Logic phân biệt TMP đúng
  - [Two-Tier CI/CD] — Merge vào main sẽ trigger auto-deploy Dev (CI chạy trên Ubuntu)
  - [Envelope-Based API Strategy] — FE dùng `apiClient.get<T>()` tự unwrap
- **"Cấm kỵ" cần tránh:**
  - Không phá RLS/IDOR — endpoint mới đã enforce 3-tier access check
  - Tuyệt đối không đẩy artifact/dependency thuần Windows (`win32-x64-msvc`) lên CI Ubuntu làm hỏng tiến trình build

## 4. Quyết định đã chốt

| Quyết định | Phương án | Người chốt |
|------------|-----------|------------|
| Cột Bộ phận & Shared types | **Tự động giữ nguyên** — git 3-way merge sẽ tự giữ vì nhánh không sửa `EmployeeTable.tsx` và `api.ts` | KTS xác nhận |
| Changelog & History docs | **Tự động giữ nguyên** — git 3-way merge sẽ không xóa vì nhánh không có lệnh xóa | KTS xác nhận |
| Test files rác | **Tự động xóa** — main đã xóa (`bcb93f5`), merge sẽ tự áp dụng việc xóa này | KTS xác nhận |
| Dependency rác | **Gỡ bỏ thủ công** — xóa `@rolldown/binding-win32-x64-msvc` khỏi nhánh trước khi merge | User |
| Rollback & Merge | **Dùng `--no-ff`** — tạo merge commit để dễ dàng `git revert` nếu lỗi sau push | User |
| Docs `monthly-data-finalization` | **Loại bỏ thủ công** — xóa khỏi nhánh trước khi commit để không lẫn scope | User |

## 5. Acceptance Criteria

- [ ] AC1: Resolve 2 conflicts thành công, không còn conflict markers
- [ ] AC2: Dependency `@rolldown/binding-win32-x64-msvc` bị loại bỏ, lockfile đã update
- [ ] AC3: `pnpm run build` thành công (shared → FE + BE)
- [ ] AC4: `pnpm run typecheck` thành công
- [ ] AC5: Popover xem tài liệu hoạt động, phân quyền đúng (VI/VA không thấy)
- [ ] AC6: Không regression trên trang DSNV chính
- [ ] AC7: Merge commit được tạo ra (`--no-ff`)

## 6. File Inventory (Đánh giá lại theo 3-way merge)

### 🔴 Cần xử lý/loại bỏ thủ công (5 files)

| File | Cách xử lý |
|------|-------------|
| `backend/src/services/employeeService.ts` | Merge **cả hai**: logic `documentsMap` (nhánh) VÀ `has_pending_bo_phan` (main) |
| `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` | Merge component `PendingDocumentsPopover` (từ nhánh) + status icons (từ nhánh) + fix `isNewHireRecord` scope (main) |
| `package.json` | Gỡ dòng `@rolldown/binding-win32-x64-msvc` + update `pnpm-lock.yaml` |
| `.agent/active/monthly-data-finalization/*` | Gỡ bỏ 2 files docs ngoài scope bằng `git rm` trước khi commit |

### 🟢 Auto-merge clean (Tự động giữ, không cần can thiệp)

- **Feature code**: `documentService.ts`, `employees.ts`, `employee.test.ts`, `vitest.integration.config.ts`, `backend/package.json`
- **Main updates (Giữ nguyên)**: `EmployeeTable.tsx`, `api.ts`, `CHANGELOG*.md`, `FEATURE_*.md` (cột bộ phận, changelog và docs đều an toàn)
- **File rác**: `test5.ts`, `test_env.ts` (git sẽ tự áp dụng lệnh xóa từ main)

## 7. Risk Triage và Review Focus

- **Review required:** Yes — User review conflict resolution và package.json
- **Risk hotspots:**
  - `employeeService.ts`: Sai merge = mất field hoặc duplicate.
  - `package.json`: Nếu quên update lockfile sau khi gỡ dependency, CI có thể lỗi.
- **Dependencies / rollout:** CI chạy Ubuntu, nên việc gỡ bỏ binding Windows là bắt buộc trước push.

## 8. Chiến lược triển khai (Đường thực thi duy nhất)

1. Checkout nhánh feature, fetch main
2. Rebase lên main, resolve 2 conflicts thủ công
3. Chỉnh sửa `package.json`, chạy `pnpm install` để update lockfile
4. Gỡ bỏ docs ngoài scope: `git rm -r .agent/active/monthly-data-finalization/`
5. Khai báo explicit `git add` cho các file đã sửa, tuyệt đối KHÔNG dùng `git add .`
6. Chạy `git rebase --continue`
7. Build + typecheck
8. Push force nhánh đã rebase
9. Merge vào main với cờ `--no-ff` (tạo merge commit)

## 9. Test Strategy

- **Bắt buộc:** `pnpm run typecheck` và `pnpm run build`
- **Tùy chọn:** Chạy lại integration tests nếu env sẵn sàng
- **Manual verification:** Kiểm tra tính năng Popover và hiển thị cột Bộ phận trên local dev

## 10. Rollback Plan

- **Trước push main:** `git reset --hard` về commit local trước khi merge
- **Sau push main:** `git revert -m 1 <merge-commit-hash>` (vì đã merge bằng `--no-ff`)

## 11. Follow-up Tech Debt

- [ ] Thêm `PendingDocumentItem` DTO vào `@vcc/shared`
- [ ] Archive `pending-room-documents` plan
