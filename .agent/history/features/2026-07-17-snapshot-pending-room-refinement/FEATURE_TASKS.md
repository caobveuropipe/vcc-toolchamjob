# Feature Tasks: Tinh chỉnh cơ chế chốt snapshot phòng chờ

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-07-17

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành

Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database & Backend Logic Updates

**Mục tiêu:** Cập nhật hàm SQL RPC và route backend để tinh chỉnh kiểm tra phòng chờ và chặn chốt đối với nhân sự mới.

- [x] Task 1.1: Tạo migration file `database/migrations/042_snapshot_pending_room_refinement.sql` thực hiện:
  - Cập nhật hàm `create_monthly_snapshot` để chặn nhân sự mới (đang phòng chờ và có file `tuyen_moi` chưa duyệt) vướng ngày bắt đầu, và bỏ lọc `state_phong_cho = false` đối với nhân sự cũ không vướng ngày hiệu lực.
- [x] Task 1.2: Cập nhật logic tính ngày kỳ lương trong `packages/shared/src/utils/date.ts` thành chu kỳ từ 26 tháng trước đến 25 tháng hiện tại.
- [x] Task 1.3: Cập nhật file `backend/src/routes/snapshots.ts` tại endpoint `/check-block` để đồng bộ logic kiểm tra chặn chốt.
- [x] Task 1.4: Cập nhật tài liệu nghiệp vụ `docs/business-flows/09-chot-danh-sach-thang.md` và `.agent/business/data/STATE_MACHINES.md` để khớp với logic và chu kỳ mới.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy tích hợp cục bộ để xác minh logic hoạt động đúng)

## Phase 2: Integration Testing & Verification

**Mục tiêu:** Bổ sung các test cases mới và đảm bảo toàn bộ suite test chạy thành công.

- [x] Task 2.1: Cập nhật các mock/fixture trong `backend/src/__tests__/integration/snapshots.test.ts` và `isPeriodLocked.test.ts` theo chu kỳ mới 26-25.
- [x] Task 2.2: Sửa đổi `backend/src/__tests__/integration/snapshots.test.ts` để bổ sung các kịch bản kiểm thử bao phủ các trường hợp (nhân sự mới chặn, nhân sự mới kỳ sau bỏ qua, nhân sự cũ chặn/cho phép chốt, đồng bộ `/restore-live`, kiểm thử nhân sự legacy không có history đang pending).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Chạy toàn bộ integration test suite)

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-07-17T17:05:00+07:00 | Phase 1 | Task 1.1 | Khởi động thực hiện feature, bắt đầu làm Task 1.1 | start | Chuẩn bị viết migration file |
| 2026-07-17T17:12:00+07:00 | Phase 1 | Task 1.1 | Đã tạo xong migration file 042 | done | SQL function create_monthly_snapshot đã được tinh chỉnh |
| 2026-07-17T17:13:00+07:00 | Phase 1 | Task 1.2 | Bắt đầu cập nhật logic ngày chu kỳ lương trong date.ts | start | Đổi từ 27-26 sang 26-25 |
| 2026-07-17T17:15:00+07:00 | Phase 1 | Task 1.2 | Đã cập nhật xong packages/shared/src/utils/date.ts | done | Hoàn thành đổi chu kỳ sang 26-25 |
| 2026-07-17T17:16:00+07:00 | Phase 1 | Task 1.3 | Bắt đầu cập nhật endpoint /check-block trong backend | start | Cần check New Hire và Existing pending room |
| 2026-07-17T17:20:00+07:00 | Phase 1 | Task 1.3 | Đã cập nhật xong routes/snapshots.ts | done | Hoàn thành logic chặn chốt /check-block |
| 2026-07-17T17:21:00+07:00 | Phase 1 | Task 1.4 | Bắt đầu cập nhật tài liệu nghiệp vụ và state machine docs | start | Cập nhật docs/business-flows và .agent/business/data |
| 2026-07-17T17:23:00+07:00 | Phase 1 | Task 1.4 | Đã cập nhật xong tài liệu nghiệp vụ | done | Đồng bộ nghiệp vụ và state machine docs |
| 2026-07-17T17:24:00+07:00 | Phase 1 | Task 1.Final | Bắt đầu tự test cục bộ để xác minh Phase 1 | start | Chạy migration SQL và build/lint/typecheck |
| 2026-07-17T17:38:00+07:00 | Phase 1 | Task 1.Final | Đã self-test thành công, các integration tests hiện tại pass độc lập | done | Đang chờ User kiểm chứng và confirm để chốt Phase 1 |
| 2026-07-17T17:40:00+07:00 | Phase 1 | Task 1.Final | User xác nhận OK, chốt Phase 1 thành công | done | Chuẩn bị sang Phase 2 |
| 2026-07-17T17:41:00+07:00 | Phase 2 | Task 2.1 | Bắt đầu cập nhật các mock/fixture theo chu kỳ mới 26-25 | start | Sửa các ngày biên trong test cases cũ |
| 2026-07-17T17:42:00+07:00 | Phase 2 | Task 2.1 | Hoàn thành cập nhật mock/fixture trong isPeriodLocked.test.ts | done | Đã đổi boundaries sang 26-25 |
| 2026-07-17T17:43:00+07:00 | Phase 2 | Task 2.2 | Bắt đầu viết thêm các test cases mới trong snapshots.test.ts | start | Viết các kịch bản chặn chốt mới |
| 2026-07-17T17:45:00+07:00 | Phase 2 | Task 2.2 | Đã viết xong các test cases chặn chốt và check-block mới | done | Hoàn tất viết kịch bản test Phase 2 |
| 2026-07-17T17:48:00+07:00 | Phase 2 | Task 2.Final | Chạy thành công toàn bộ integration test suite, bao gồm 4 kịch bản mới cho pending room | done | Đã xác minh hoàn tất Phase 2 và kết thúc feature |
