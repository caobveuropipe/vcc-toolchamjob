## Round 1 - 2026-08-13T18:20:00+07:00

### Tổng kết
- EFR: 2 (accepted: 2, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (full)
  - `client/pg_general_3.html:333–371` — luồng tải lương, call timing, success/failure handler
  - `client/modal_tonghophieusuat_3.html:1–100` — dropdown change handler, `pg_general_3_GetDataTongHop` definition
  - `client/modal_tonghophieusuat_3.html:323–374` — `GetDataTongHop` body, merge gate, cache usage
  - `client/pg_general_1.js:895–906` — error return path hiện tại (`return []` trên cả lỗi và không có data)
  - grep: `pg_general_3_GetDataTongHop` callers across client

### EFR Đã Chấp Nhận
- **EFR-01: Luồng tải snapshot chưa xác định kỳ nghiệm thu đúng lúc** | Sửa: Thêm AC [EFR-01] vào FEATURE_PLAN.md; thêm Risk hotspot [EFR-01]; thêm Task 2.5 cache invalidation khi user đổi kỳ trong FEATURE_TASKS.md
  - Evidence: `pg_general_3.html:333–343` tải lương không có kỳ; `modal_tonghophieusuat_3.html:22–25` `change` handler chỉ gọi `GetDataTongHop()` không reload lương; `modal_tonghophieusuat_3.html:365–370` merge dùng cache cũ.

- **EFR-02: Contract fallback `[]` không phân biệt lỗi API với kỳ không có dữ liệu** | Sửa: Thêm AC [EFR-02] vào FEATURE_PLAN.md; làm rõ Task 1.5 yêu cầu throw exception thay vì return []; làm rõ Task 2.4 kiểm tra withFailureHandler.
  - Evidence: `pg_general_1.js:899–905` cả lỗi lẫn `status !== success` đều `return []`; `pg_general_3.html:359–369` `withSuccessHandler` nhận `[]` → gán cache; `modal_tonghophieusuat_3.html:365–366` gate `!Array.isArray` không chặn `[]` → merge với dữ liệu 0.

### Vùng đã scan khi không có SFR
- `client/pg_general_3.html:333–371`: đã kiểm tra toàn bộ luồng call timing và cache handler.
- `client/modal_tonghophieusuat_3.html:1–100,323–374`: đã kiểm tra dropdown change handler và merge function.
- `client/pg_general_1.js:895–906`: đã kiểm tra error return path hiện tại.
- Không phát hiện SFR bổ sung từ các vùng này.

## Round 2 - 2026-08-13T18:25:00+07:00

### Tổng kết
- EFR: 2 (accepted: 1, rejected: 1, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (full — round 5 từ Codex Desktop)
  - `client/pg_general_3.html:354–371` — async handler và cache write point
  - `FEATURE_PLAN.md:103–120` — Test Strategy và Rollback Plan
  - `REBUTTAL_LOG.md` — check dedupe

### EFR Đã Bác Bỏ
- **EFR-01: Reload theo kỳ chưa chống response bất đồng bộ đến sai thứ tự** | Phản biện: `google.script.run` trong GAS không hỗ trợ true concurrent calls trong cùng một client session — sequential execution đã đảm bảo bởi GAS runtime. Task 2.5 đã yêu cầu "reload đồng bộ" theo pattern `async/await` hiện có (`pg_general_3.html:341–344`), đủ ngăn race condition trong thực tế. | Evidence âm tính: `pg_general_3.html:354–371` cho thấy Promise wrapper với `google.script.run` — GAS không fire-and-forget concurrent calls theo nghĩa REST HTTP. Severity thực tế là Low, không phải High. Bổ sung note GAS sequential vào Task 2.5 là đủ.

### EFR Đã Chấp Nhận
- **EFR-02: Test Strategy gộp "tháng không tồn tại" vào case toast lỗi** | Sửa: Tách Test Strategy thành (a) Failure toast test (sai key/tắt network → toast) và (b) Empty-state test (kỳ hợp lệ không có nhân sự → bảng rỗng, không toast). Task 2.4 cập nhật tương ứng.
  - Evidence trực tiếp: `FEATURE_PLAN.md:70` AC EFR-02 chốt `[]` là empty-state; `FEATURE_PLAN.md:112` Test Strategy gộp "tháng không tồn tại" vào case toast — mâu thuẫn nội bộ cùng file.

## Round 3 - 2026-08-13T18:36:50+07:00

### Tổng kết
- EFR: 4 (accepted: 4, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (full — Round 8 từ Codex Desktop)
  - `client/pg_general_3.html:330–350` — prefetch call `pg_general_1_LayDanhSachLuong`
  - `push-all.ps1:40–70` — `doget` folder missing issue
  - `deploy-all.ps1:15–80` — `doget` backup & versioning fail issue

### EFR Đã Chấp Nhận
- **EFR-01: Gỡ prefetch lương không có kỳ tại `pg_general_3_XemHieuSuatChiTiet()`** | Sửa: Thêm Task 1.2 gỡ call prefetch rỗng kỳ trong `pg_general_3.html:343` và quy định chỉ tải snapshot lương khi có kỳ nghiệm thu hợp lệ.
  - Evidence: `pg_general_3.html:333–344` gọi `pg_general_1_LayDanhSachLuong(maNS_String)` không truyền kỳ nghiệm thu.

- **EFR-02: Support alias `lcd_gt` cho `luongCoDinh`** | Sửa: Thêm `item.luong_co_dinh ?? item.lcd_gt ?? 0` vào Task 1.5, Task 2.2 và Mục 4 trong plan.
  - Evidence: `FEATURE_PLAN.md:59` cam kết hai alias nhưng Task 1.4 cũ chỉ đọc `item.luong_co_dinh`.

- **EFR-03: Preflight validation cho `API_BASE_URL` tránh dùng ngầm URL dev ở Prod** | Sửa: Thêm preflight validation trong Task 1.3: fail-closed ở Production nếu thiếu config `API_BASE_URL` trong ScriptProperties.
  - Evidence: `FEATURE_PLAN.md:28,46` cũ cho phép fallback dev URL mà không kiểm tra môi trường Prod.

- **EFR-04: Sửa PowerShell deploy/push scripts phù hợp với folder structure local** | Sửa: Thêm Task 1.1 audit và refactor `push-all.ps1` & `deploy-all.ps1`, loại bỏ folder `doget` không tồn tại, cập nhật loop cho `@("client", "doPost")` và kiểm tra exit codes của clasp.
  - Evidence: `deploy-all.ps1:28,72` cố gắng truy cập folder `doget` không tồn tại trong repo, gây fail pipeline.

## Round 4 - 2026-08-13T18:50:30+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (full — Round 10 từ Codex Desktop)
  - `FEATURE_PLAN.md:24–60` — Section 2, 3, 4
  - `FEATURE_TASKS.md:18–28` — Task 1.3
  - `REBUTTAL_LOG.md` — check dedupe

### EFR Đã Chấp Nhận
- **EFR-01: Preflight production vẫn thiếu nguồn sự thật để phân biệt production và dev** | Sửa: Đã định nghĩa Environment Marker explicit `APP_ENV = ScriptProperties.getProperty('APP_ENV') || 'development'`. Khi `production`, `API_BASE_URL` & `INTERNAL_API_KEY` bắt buộc (fail-closed nếu thiếu); chỉ khi `development` mới cho phép fallback dev URL. Cập nhật `FEATURE_PLAN.md` (Mục 3 & 4) và `FEATURE_TASKS.md` (Task 1.3).

## Round 5 - 2026-08-13T18:54:00+07:00

### Tổng kết
- EFR: 1 (accepted: 1, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (full — Round 12 từ Codex Desktop)
  - `FEATURE_PLAN.md:40–55` — Section 3 & 4
  - `FEATURE_TASKS.md:18–28` — Task 1.3
  - `REBUTTAL_LOG.md` — check dedupe

### EFR Đã Chấp Nhận
- **EFR-01: `APP_ENV` thiếu đang mặc định thành development nên production vẫn có thể fail-open** | Sửa: Đã cập nhật quy tắc Strict Fail-Closed. Nếu `APP_ENV` thiếu, rỗng hoặc khác `'production'`|`'development'` → throw Exception ngay lập tức. Không default missing `APP_ENV` thành `development`. Chỉ khi `APP_ENV === 'development'` được khai báo tường minh mới cho phép fallback dev URL. Cập nhật `FEATURE_PLAN.md` (Mục 3 & 4) và `FEATURE_TASKS.md` (Task 1.3).
  - Evidence: `FEATURE_PLAN.md` cũ và `FEATURE_TASKS.md` Task 1.3 default missing marker thành `development`, làm lộ rủi ro fail-open nếu production quên set `APP_ENV`.
  - Evidence: `FEATURE_PLAN.md` cũ và `FEATURE_TASKS.md` Task 1.3 chưa chỉ định Script Property marker để phân biệt Prod và Dev.
