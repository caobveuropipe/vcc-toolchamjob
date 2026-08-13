# Feature Tasks: Salary Target Validation & Formula Enforcement

> **Trạng thái**: 🔄 Đang thực hiện
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-04

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

## Phase 1: Database & Shared Foundation

**Mục tiêu:** Chuẩn bị cấu trúc dữ liệu và logic validation dùng chung.

- [x] Task 1.1: Tạo migration SQL thêm cột `is_target_cc_include_kn_m1` vào `salaries` và `snapshot_employees`.
- [x] Task 1.2: Cập nhật `packages/shared/src/constants/salary-fields.ts` thêm field mới.
- [x] Task 1.3: Cập nhật `packages/shared/src/schemas/salary.ts` thêm field mới vào Zod schema.
- [x] Task 1.4: Tạo `packages/shared/src/utils/salary-validation.ts` triển khai hàm `validateSalaryTarget`.
- [x] Task 1.5: Cập nhật logic backend (SQL RPC hoặc SalaryService) để map trường mới từ `pending_changes` sang `salaries`.
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Unit test logic validation & Backend mapping test).

## Phase 2: UI Implementation & Enforcing

**Mục tiêu:** Cập nhật giao diện và áp dụng ràng buộc chặn Lưu/Submit.

- [x] Task 2.1: Cập nhật `frontend/src/pages/Salaries/SalaryEditModal.tsx` thêm checkbox "Bao gồm KN M1" vào nhóm Cơ chế.
- [x] Task 2.2: Tích hợp logic validation (hiển thị delta) vào hàm `handleSaveModal` trong `SalaryEditModal.tsx`.
- [x] Task 2.3: Cập nhật `frontend/src/pages/PendingRoom/PendingRoomPage.tsx` tích hợp validation vào `checkSubmitReadiness`.
- [x] Task 2.4: Hiển thị tooltip cảnh báo lỗi công thức tại bảng Phòng chờ nếu nhân sự chưa đạt điều kiện.
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Manual test save/submit flow).

## Phase 3: Final Verification

**Mục tiêu:** Đảm bảo hệ thống hoạt động ổn định và dữ liệu nhất quán.

- [x] Task 3.1: Kiểm tra tính bền vững của checkbox khi edit nhiều lần.
- [x] Task 3.2: Verify dữ liệu được lưu đúng vào `pending_changes` và DB chính sau khi duyệt.
- [x] Task 3.Final: 🧪 Test & Verify Phase 3 (End-to-end verification).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-04 | Phase 0 | Plan | Khởi tạo plan và tasks | done | |
| 2026-05-04 18:05 | Phase 1 | Task 1.1 | Bắt đầu tạo migration DB | in-progress | |
| 2026-05-04 18:07 | Phase 1 | Task 1.Final | Hoàn thành self-test, 8/8 tests pass | done | |
| 2026-05-04 18:08 | Phase 2 | Task 2.1 | Bắt đầu UI implementation | in-progress | |
| 2026-05-04 18:09 | Phase 2 | Task 2.Final | Ho�n th�nh UI v� enforcement logic | done | |
| 2026-05-05 09:55 | Phase 3 | Task 3.1 | B?t d?u ki?m tra t�nh b?n v?ng c?a checkbox | in-progress | |
| 2026-05-05 09:56 | Phase 3 | Task 3.Final | Ho�n t?t End-to-end verification. Feature ho�n th�nh. | done | |
