---
source: expert-rebuttal-codex
feature: org-units-management-hierarchy
round: 14
timestamp: 2026-08-04T23:00:30+07:00
verdict: ✅ HỘI TỤ
---

# Expert Review - Codex Desktop

## Tóm tắt

- Findings mới: **0**
- Findings đã dedupe/không lặp: **53**
- Vùng đã scan: `FEATURE_PLAN.md:95-180`, `FEATURE_TASKS.md:103-152`, `REBUTTAL_LOG.md:173-182`, `frontend/src/components/DocumentUpload.tsx:69-96,304-319,506-607`, `frontend/src/components/EmployeeForm.tsx:125-222,387-397`.
- Finding Round 13 đã được operationalize đúng vào component, form, files affected và E2E test.

## Findings Cần Antigravity Phản Biện

Không có.

## Bằng chứng âm tính / Đã được cover

- Task 3.4 hiện target đúng `frontend/src/components/DocumentUpload.tsx` và `frontend/src/components/EmployeeForm.tsx`, không còn tham chiếu component không tồn tại.
- `FEATURE_PLAN.md` đã liệt kê cả hai file frontend thực tế trong files affected và mô tả rõ candidate confirmation, ancestor map và việc gỡ `delete payload.khoi`.
- Task 3.Final có E2E flow `/documents/:id/ocr ➔ DocumentUpload candidate confirmation ➔ EmployeeForm dual-write`, bao gồm assertion `khoi` không bị xóa.
- Code hiện tại xác nhận OCR flow thực sự chạy trong `DocumentUpload.tsx`, truyền payload qua `onFillFields` tới `EmployeeForm.tsx`; plan đã giao đúng owner để thay đổi hành vi này.
- `EmployeeForm.handleFillFields` hiện dùng `form.setFieldsValue(processed)` và đã có validation `KHOI_VALUES`, nên task bổ sung các trường org-unit FK/text vào schema/form có đường tích hợp rõ, không cần thêm một component trung gian.
- Sparse UI traversal, canonical JSON backfill và `FuzzyMatchResponse` candidate/ancestor contract vẫn nhất quán giữa Phase 2 và Phase 3.
- Các file implementation mới chưa tồn tại vì feature chưa bắt đầu triển khai; đây là trạng thái dự kiến, không phải finding của plan.

## Không Raise Vì Thiếu Evidence / Chỉ là wording

- Một số dòng acceptance/files table vẫn dùng cụm “map theo Excel”, nhưng Task 2.3 đã khóa `canonical_org_units.json` là source trực tiếp và không còn contract chức năng mâu thuẫn.
- Mô tả “Excel Single Source of Truth” chưa phản ánh đầy đủ source phân tầng với `KHOI_VALUES`, nhưng parser task đã yêu cầu merge đủ 11 roots và test/drift pipeline đã có owner.

## Kết Luận

**✅ HỘI TỤ** trong phạm vi đã scan. Không còn finding mới có evidence trực tiếp; plan có thể chuyển sang `feature-coordinator` để triển khai.
