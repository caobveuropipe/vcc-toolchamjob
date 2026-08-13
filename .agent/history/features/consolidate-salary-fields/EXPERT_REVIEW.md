---
source: expert-rebuttal-codex
feature: consolidate-salary-fields
round: 22
timestamp: 2026-07-16T14:17:40+07:00
verdict: ✅ HỘI TỤ
---

# Expert Review - Codex Desktop

## Tóm tắt
- Findings mới: 0
- Findings đã dedupe/không lặp: Round 10/11/12 đã accepted và plan/tasks đã cập nhật các vấn đề về predicate backup, công thức KN M1, privacy backup JSON, và shared validation tests.
- Vùng đã scan: `FEATURE_PLAN.md:14,17,29-39,42,56-59,92,130,136,145-146,152-156,168-184`; `FEATURE_TASKS.md:20-23,29,37-40,48-53`; `REBUTTAL_LOG.md:121-168`; `EXPERT_REVIEW.md:1-15`; `frontend/src/pages/PendingRoom/PendingRoomPage.tsx:286-299,489-503`; `frontend/src/components/EmployeeTable.tsx:355-367,446-455`; `frontend/src/components/ProbationEvaluationModal.tsx:21-85,193-235`; `frontend/src/pages/Salaries/SalaryEditModal.tsx:96-146,173-216,312-337`; `packages/shared/src/tests/salary-validation.test.ts:33-65`; `packages/shared/package.json:19-24`.

## Findings Cần Antigravity Phản Biện

Không có finding mới đạt ngưỡng evidence trong phạm vi scan.

## Không Raise Vì Thiếu Evidence / Đã Được Cover
- Backup privacy: plan/tasks đã thêm ignore `backup_mismatch_*.json`, verify `git status`, file/module affected cho `.gitignore` hoặc `database_backups/.gitignore`, và manual verification chống leak.
- Shared validation: plan/tasks đã yêu cầu cập nhật `packages/shared/src/tests/salary-validation.test.ts` cho `nhuan_but_cc` và chạy `pnpm --filter @vcc/shared test`.
- Công thức Target CC / KN M1: plan/tasks đã giữ KN M1 conditional theo `is_target_cc_include_kn_m1` và không cộng KN ngoài target vào tổng đối chiếu `luong_target_cc`.
- Modal surface: luồng menu “Cập nhật lương” ở PendingRoom/EmployeeTable mở `SalaryEditModal`; `ProbationEvaluationModal` là luồng đánh giá thử việc riêng, nên chưa đủ evidence để yêu cầu scope feature này sửa thêm modal đó.

## Kết Luận
- `✅ HỘI TỤ` trong phạm vi scan nêu trên.
- Có thể chuyển sang triển khai bằng `feature-coordinator` hoặc review thêm vùng cụ thể nếu cần.
