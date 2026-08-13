## Round 1 - 2026-07-01T15:30:00+07:00
### Tổng kết
- EFR: 5 (accepted: 5, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded: 
  - [EXPERT_REVIEW.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/EXPERT_REVIEW.md)
  - [FEATURE_PLAN.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_PLAN.md)
  - [FEATURE_TASKS.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_TASKS.md)
  - [ocrService.ts:L1-175](file:///d:/ToolNhanSuVcc/backend/src/services/ocrService.ts#L1-L175)
  - [documents.ts:L80-118](file:///d:/ToolNhanSuVcc/backend/src/routes/documents.ts#L80-L118)
  - [ocr.test.ts:L1-36](file:///d:/ToolNhanSuVcc/backend/src/__tests__/ocr.test.ts#L1-L36)
  - [.env.local:L1-39](file:///d:/ToolNhanSuVcc/backend/.env.local#L1-L39)
  - [env.ts:L1-60](file:///d:/ToolNhanSuVcc/backend/src/config/env.ts#L1-L60)

### EFR Đã Chấp Nhận -> [FR-01]: Thiết kế payload PDF đang dựa trên contract chưa được chứng minh | Sửa: Bổ sung task spike/probe kiểm tra contract của proxy. Cập nhật thiết kế adapter tùy biến theo MIME type (ảnh dùng image_url, PDF dùng file input thích hợp hoặc fallback render thành ảnh).
### EFR Đã Chấp Nhận -> [FR-02]: Cache hiện tại làm lựa chọn model không có hiệu lực sau lần OCR đầu tiên | Sửa: Thiết kế cache key bao gồm model và prompt_version; chỉ cache-hit khi model yêu cầu khớp với metadata trong kết quả đã lưu; bổ sung test case tương ứng.
### EFR Đã Chấp Nhận -> [FR-03]: Danh mục model và API validation chưa có nguồn chân lý đáng tin cậy | Sửa: Xác thực danh sách model thực tế từ proxy, định nghĩa một schema allowlist validation duy nhất ở phía backend (sử dụng z.enum hoặc tương tự) và đồng bộ default model cấu hình từ backend.
### EFR Đã Chấp Nhận -> [FR-04]: Test strategy có thể báo xanh dù integration thực tế thất bại | Sửa: Bổ sung unit tests mock fetch cho image/PDF và stream collector; viết route contract tests; đưa live integration test thành opt-in suite riêng.
### EFR Đã Chấp Nhận -> [FR-05]: Giới hạn 5MB chưa đủ để coi PDF là an toàn về tài nguyên và chi phí | Sửa: Giới hạn số trang tối đa cho PDF, xác thực magic bytes của PDF, thêm AbortController timeout, cải thiện cơ chế buffer/base64 tránh peak memory và thêm test case cho các điều kiện biên.

### Vùng đã scan khi không có SFR -> [FEATURE_PLAN.md:L1-101] [Quét các khía cạnh bảo mật, contract và cache để đảm bảo không có lỗ hổng bổ sung]

## Round 2 - 2026-07-01T15:45:00+07:00
### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - [EXPERT_REVIEW.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/EXPERT_REVIEW.md)
  - [FEATURE_PLAN.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_PLAN.md)
  - [FEATURE_TASKS.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_TASKS.md)
  - `backend/package.json`
  - `backend/Dockerfile`

### EFR Đã Chấp Nhận -> [EFR-06]: Fallback render PDF và giới hạn số trang chưa có dependency/runtime ownership | Sửa: Đưa việc "fallback render PDF thành ảnh" thành OUT OF SCOPE để tránh thêm các thư viện cồng kềnh/native vào Docker image; chỉ hỗ trợ native PDF.
### EFR Đã Chấp Nhận -> [EFR-07]: `model` optional có thể phá backward compatibility với request không có body | Sửa: Cập nhật route documents.ts xử lý parse JSON body an toàn, hỗ trợ request không có body, body `{}` hoặc content-type không hợp lệ; bổ sung test cases tương ứng.
### EFR Đã Chấp Nhận -> [EFR-08]: Plan cấm log PII nhưng chưa task hóa việc redact OCR provider error body hiện có | Sửa: Thêm subtask redact/truncate raw `errorBody` khi API lỗi, chỉ lưu giữ status, model, message an toàn. Bổ sung test kiểm chứng redact logging.

### Vùng đã scan khi không có SFR -> [FEATURE_PLAN.md:L1-105] [Đã quét kỹ dependencies, docker configurations, và logger error configurations để đảm bảo tính khả thi]

## Round 3 - 2026-07-01T15:53:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - [EXPERT_REVIEW.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/EXPERT_REVIEW.md)
  - [FEATURE_PLAN.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_PLAN.md)
  - [FEATURE_TASKS.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_TASKS.md)

### EFR Đã Chấp Nhận -> [EFR-09]: Guardrail chặn PDF > 5 trang vẫn chưa có cơ chế khả thi sau khi bỏ fallback/render | Sửa: Cài đặt và sử dụng thư viện lightweight `pdf-parse` (pure JS, an toàn cho Alpine/Cloud Run) để đọc page count PDF ở backend, đồng thời thêm backend/package.json và backend/pnpm-lock.yaml vào danh sách ảnh hưởng + rollback plan.

### Vùng đã scan khi không có SFR -> [FEATURE_PLAN.md:L1-119] [Đã rà soát kỹ lưỡng các tệp tin cấu hình dự án và dependencies của module PDF để đảm bảo tính nhất quán]

## Round 4 - 2026-07-01T16:05:00+07:00
### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - [EXPERT_REVIEW.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/EXPERT_REVIEW.md)
  - [FEATURE_PLAN.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_PLAN.md)
  - [FEATURE_TASKS.md](file:///d:/ToolNhanSuVcc/.agent/active/ocr-pdf-model-selection/FEATURE_TASKS.md)
  - `package.json`
  - `pnpm-workspace.yaml`

### EFR Đã Chấp Nhận -> [EFR-10]: Plan trỏ sai vị trí pnpm lockfile trong monorepo | Sửa: Thay đổi tất cả tham chiếu `backend/pnpm-lock.yaml` thành `pnpm-lock.yaml` ở repo root; cập nhật task sử dụng workspace command `pnpm --filter backend add pdf-parse` và đưa root lockfile vào affected files + rollback plan.

### Vùng đã scan khi không có SFR -> [FEATURE_PLAN.md:L1-120] [Đã xác thực cấu trúc pnpm workspace và cấu hình lockfile ở root repo]



