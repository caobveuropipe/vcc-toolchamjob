# Feature Tasks: Merge nhánh pending-room-documents vào main

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-26

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Rebase, Resolve Conflicts & Clean Dependencies

**Mục tiêu:** Rebase nhánh feature lên main, resolve 2 conflicts thủ công và loại bỏ dependency rác của Windows.

- [x] Task 1.1: Checkout nhánh `feature/ns-003-pending-room-documents` và `git fetch origin main`
- [x] Task 1.2: Chạy `git rebase main` — resolve conflict tại `backend/src/services/employeeService.ts`:
  - Giữ logic `documentsMap` + `salaryPendingMap` (từ nhánh)
  - Giữ fields `has_pending_bo_phan` / `pending_bo_phan` trong `enhancedData` (từ main)
  - Giữ cleanup `console.log` (từ nhánh)
- [x] Task 1.3: Resolve conflict tại `frontend/src/pages/PendingRoom/PendingRoomPage.tsx`:
  - Merge component `PendingDocumentsPopover` và status icons (từ nhánh)
  - Giữ fix scope `isNewHireRecord` (từ main)
- [x] Task 1.4: Mở `package.json` ở root, gỡ bỏ dòng `"@rolldown/binding-win32-x64-msvc": "^1.0.2"`
- [x] Task 1.5: Chạy `pnpm install --no-frozen-lockfile` để cập nhật lại `pnpm-lock.yaml`
- [x] Task 1.6: Gỡ bỏ các docs ngoài scope bị lẫn vào nhánh: `git rm -r .agent/active/monthly-data-finalization/`
- [x] Task 1.7: Stage các file cụ thể đã sửa: `git add backend/src/services/employeeService.ts frontend/src/pages/PendingRoom/PendingRoomPage.tsx package.json pnpm-lock.yaml`
- [x] Task 1.8: Chạy `git rebase --continue` cho đến khi hoàn tất
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 — `git status` sạch, `git diff main..HEAD package.json` không còn package rolldown

---

## Phase 2: Build Verification

**Mục tiêu:** Đảm bảo code biên dịch thành công sau resolve conflict và loại bỏ dependency.

- [x] Task 2.1: `pnpm run build:shared` — verify shared types compile
- [x] Task 2.2: `pnpm run typecheck` — verify tất cả workspaces không lỗi types
- [x] Task 2.3: `pnpm run build` — verify full build thành công (FE + BE)
- [x] Task 2.4: (Tùy chọn) Chạy lại integration tests nếu env backend đã có: `pnpm --filter backend test:integration`
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 — Build xanh, không warning nghiêm trọng, có thể test tay local nếu cần

---

## Phase 3: Push và Merge vào Main

**Mục tiêu:** Đưa code đã rebase lên remote và merge vào main sử dụng merge commit.

- [x] Task 3.1: `git push --force-with-lease origin feature/ns-003-pending-room-documents`
- [x] Task 3.2: `git checkout main && git merge --no-ff feature/ns-003-pending-room-documents`
- [x] Task 3.3: Kiểm tra log đảm bảo merge commit được tạo ra: `git log -1`
- [x] Task 3.4: `git push origin main`
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 — CI GitHub Actions bắt đầu chạy và passing trên Ubuntu

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-26 10:15 | - | - | Tạo plan v1 | done | |
| 2026-05-26 11:29 | - | - | KTS phản biện vòng 2 | done | Plan v2 |
| 2026-05-26 11:40 | - | - | KTS phản biện vòng 3 | done | Plan v3: xóa dep rác, sửa rollback, gỡ phase 2 cũ |
| 2026-05-26 13:52 | Phase 1 | Task 1.1 | Chốt plan, cập nhật trạng thái đồng ý, bắt đầu Phase 1 | start | |
| 2026-05-26 14:02 | Phase 1 | Task 1.Final | Hoàn thành rebase, resolve 2 conflicts thủ công, gỡ bỏ dependency rác, lockfile update | done | |
| 2026-05-26 14:03 | Phase 2 | Task 2.1 | Bắt đầu Phase 2: Build Verification | start | |
| 2026-05-26 14:15 | Phase 2 | Task 2.Final | Hoàn thành build verification: typecheck và full build 100% thành công | done | |
| 2026-05-26 14:16 | Phase 3 | Task 3.1 | Bắt đầu Phase 3: Push và Merge vào Main | start | |
| 2026-05-26 14:22 | Phase 3 | Task 3.Final | Hoàn tất push force branch, merge --no-ff vào main, verify merge commit, và push main lên remote | done | |
