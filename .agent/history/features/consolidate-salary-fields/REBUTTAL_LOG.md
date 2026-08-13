## Round 1 - 2026-07-15T16:30:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 1 | Plan sửa: có
- Mode: normal
- Context loaded: [.agent/active/consolidate-salary-fields/EXPERT_REVIEW.md]

### EFR Đã Chấp Nhận
- **[FR-01]**: OCR và upload vẫn nạp dữ liệu vào field cũ.
- **[FR-02]**: Migration không có preflight, assert và backup rõ ràng.
- **[FR-03]**: Công thức UI mới chưa đối chiếu với công thức `salary-validation` và `luong_target_cc`.
- **[FR-04]**: Scope bỏ sót snapshot/import-export salary mapping.
- **[FR-05]**: Plan thiếu rollout, rollback và test strategy.

### Phát Hiện Bổ Sung
- **[SFR-01]**: Trùng lặp dữ liệu `nhuan_but_cc` và `thuong_hieu_suat_cham_job_nhuan` gây lỗi double-count trên UI.

---

## Round 2 - 2026-07-15T16:40:00+07:00
### Tổng kết
- EFR: 0 | SFR mới: 0 | Plan sửa: không
- Mode: post-convergence scan
- Kết luận: ✅ HỘI TỤ (Tất cả đã sửa).

---

## Round 3 - 2026-07-15T16:44:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: [.agent/active/consolidate-salary-fields/EXPERT_REVIEW.md]

### EFR Đã Chấp Nhận
- **[EFR-01] (Guardrail cho migration)**: Thêm assert count, bọc transaction SQL block, và bổ sung dry-run restore.
- **[EFR-02] (OCR empty-block rule)**: Cập nhật rule null-check cho cả 2 trường M1 mới khi Khối 4 trống vào prompt OCR.
- **[EFR-03] (Mâu thuẫn snapshot logic)**: Chốt giữ snapshot out-of-scope do không đổi cấu trúc cột DB, nhưng thêm task regression test snapshot.

---

## Round 4 - 2026-07-15T17:30:00+07:00
### Tổng kết
- EFR: 0 | SFR mới: 0 | Plan sửa: có (sửa đổi theo ý kiến User ở các bước thảo luận)
- Mode: post-convergence scan
- Kết quả: ✅ HỘI TỤ hoàn toàn.

---

## Round 5 - 2026-07-15T17:35:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: [.agent/active/consolidate-salary-fields/EXPERT_REVIEW.md]

### EFR Đã Chấp Nhận
- **[EFR-01] (Auto-fill/Form fallback logic)**: Thêm việc sửa logic fallback trong `EmployeeForm.tsx` (copy sang `thuong_okr_m1` và `thuong_doanh_so_m1` thay vì viết vào trường `_cc` cũ khi khối Cơ chế trống), đảm bảo form không còn đường tái ghi dữ liệu cũ.

---

## Round 6 - 2026-07-15T17:40:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: [.agent/active/consolidate-salary-fields/EXPERT_REVIEW.md]

### EFR Đã Chấp Nhận
- **[EFR-01] (Đồng bộ Thưởng KD nội bộ OCR)**: Đồng bộ hóa toàn bộ tài liệu (Mapping table & Lưu ý AI) sang Phương án (B): Bỏ qua hoàn toàn Thưởng KD nội bộ từ kết quả OCR trong Auto-fill. Điều này đảm bảo tính nhất quán giữa các tài liệu thiết kế.

---

## Round 7 - 2026-07-16T12:40:00+07:00
### Tổng kết
- EFR: 0 | SFR mới: 0 | Plan sửa: có
- Mode: post-convergence scan
- Kết quả: ✅ HỘI TỤ hoàn toàn.
- Các sửa đổi đã tích hợp:
  - Giữ nguyên luồng Onboarding cũ (lưu dữ liệu chờ duyệt `state_pending = true`).
  - Sửa logic lưu Onboarding: OKR $\rightarrow$ `thuong_okr_m1`, Nhuận bút $\rightarrow$ `nhuan_but_cc`. Không lưu "Hiệu suất" và "Thưởng KD" vào DB lúc Onboard (để trống).
  - Tích hợp logic **tính toán và tự điền động** phần Hiệu suất chưa phân loại vào ô "HS Chấm/Job/Nhuận" kèm Warning Alert khi người nghiệm thu mở Modal sửa lương cho nhân sự ở phòng chờ (`state_pending === true`).
  - Sửa đổi công thức validate lương core (`salary-validation.ts`) đưa `nhuan_but_cc` vào bộ CC để đảm bảo tính tổng Target CC hợp lệ.

---

## Round 8 - 2026-07-16T12:50:00+07:00
### Tổng kết
- EFR: 0 | SFR mới: 0 | Plan sửa: có
- Mode: post-convergence scan
- Kết quả: ✅ HỘI TỤ hoàn toàn.
- Các sửa đổi đã tích hợp:
  - Bỏ qua việc dọn dẹp dữ liệu trùng lặp của 3 nhân sự cũ ra khỏi phạm vi kế hoạch này (sẽ lập kế hoạch dọn dẹp riêng sau này theo yêu cầu của User).

---

## Round 9 - 2026-07-16T12:51:00+07:00
### Tổng kết
- EFR: 0 | SFR mới: 0 | Plan sửa: có
- Mode: post-convergence scan
- Kết quả: ✅ HỘI TỤ hoàn toàn.
- Các sửa đổi đã tích hợp:
  - Bổ sung bảng mapping đầy đủ và chi tiết cho **tất cả** các trường dữ liệu lương/cơ chế trong hệ thống (gồm cả Bộ Giấy tờ, Bộ Cơ chế Base, Thưởng chi tiết M1/M2/M3, Bậc lương, Tỷ lệ thử việc, Ngày điều chỉnh...).

---

## Round 10 - 2026-07-16T13:40:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: [EXPERT_REVIEW.md:1-38], [FEATURE_PLAN.md:1-186], [FEATURE_TASKS.md:1-56], [packages/shared/src/utils/salary-validation.ts:1-84], [frontend/src/pages/Salaries/SalaryEditModal.tsx:35-75,320-350]
### EFR Đã Chấp Nhận
- **[EFR-01] (Migration assert mismatch)**: Thay đổi điều kiện quét của script backup sang `IS NOT NULL` (bao gồm cả giá trị bằng 0) để đồng bộ với điều kiện `WHERE okr_cc IS NOT NULL OR thuong_doanh_so_cc IS NOT NULL` của migration SQL, đảm bảo assert row count hoàn toàn chuẩn xác và khôi phục chính xác trạng thái DB khi rollback.
- **[EFR-02] (UI performance & unallocated formula update)**: Đồng bộ công thức Hiệu suất trên UI (chỉ cộng `thuong_kiem_nhiem_m1` khi checkbox bật). Đồng thời cập nhật công thức tính `unallocated` trong modal cập nhật lương để trừ đi toàn bộ các cấu phần thưởng M1 đang có (`thuong_kpi_m1`, `thuong_doanh_so_m1`, `thuong_du_an_m1`, và `thuong_kiem_nhiem_m1` nếu checkbox bật) nhằm tránh double-counting.
### Phát Hiện Bổ Sung
- Không có.
### Vùng đã scan khi không có SFR
- Vùng plan và task bị ảnh hưởng bởi EFR-01 và EFR-02. Cấu trúc validation formula của `salary-validation.ts` và checkbox UI trong `SalaryEditModal.tsx`.

---

## Round 11 - 2026-07-16T13:45:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: [EXPERT_REVIEW.md:1-38], [FEATURE_PLAN.md:41-50,85-95,160-180], [FEATURE_TASKS.md:45-56]
### EFR Đã Chấp Nhận
- **[EFR-01] (Fix IS NOT NULL propagation)**: Đồng bộ thuật ngữ "không null" (`IS NOT NULL`) vào mục Chiến lược triển khai (Phase strategy) và Kiểm thử thủ công (Manual verification) của `FEATURE_PLAN.md`, tránh nhầm lẫn với predicate "lớn hơn 0" cũ.
- **[EFR-02] (Tổng thu nhập UI vs luong_target_cc)**: Làm rõ công thức Tổng thu nhập đối chiếu trên UI bằng tổng 4 thành phần hiển thị, không cộng thêm kiêm nhiệm khi checkbox tắt, đảm bảo khớp đúng với `luong_target_cc` và tránh warning sai. Cập nhật bảng mapping tương ứng.
### Phát Hiện Bổ Sung
- Không có.
### Vùng đã scan khi không có SFR
- Vùng Chiến lược triển khai và manual test cases của plan, công thức tổng thu nhập và đối chiếu cảnh báo của UI.

---

## Round 12 - 2026-07-16T14:16:00+07:00
### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: [EXPERT_REVIEW.md:1-38], [FEATURE_PLAN.md:27-37,134-186], [FEATURE_TASKS.md:15-40], [packages/shared/src/tests/salary-validation.test.ts:1-78]
### EFR Đã Chấp Nhận
- **[EFR-01] (Backup JSON leaks protection)**: Cập nhật plan và task để thêm tệp JSON backup lương nhạy cảm (`backup_mismatch_*.json`) vào `.gitignore` hoặc `database_backups/.gitignore`, đồng thời bổ sung checklist kiểm tra `git status` trước khi commit/deploy để ngăn rò rỉ dữ liệu qua Git.
- **[EFR-02] (Shared package test coverage)**: Thêm công việc bổ sung unit test cho package shared (`packages/shared/src/tests/salary-validation.test.ts`) để bao phủ việc thêm `nhuan_but_cc` vào công thức CC và chạy verify `pnpm --filter @vcc/shared test` trước khi kết thúc Phase 2.
### Phát Hiện Bổ Sung
- Không có.
### Vùng đã scan khi không có SFR
- Vùng quản lý bảo mật của folder backup, cấu hình .gitignore và file test unit của package shared.
