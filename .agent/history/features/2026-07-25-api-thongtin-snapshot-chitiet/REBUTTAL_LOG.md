## Round 1 — 2026-07-25T10:37:00+07:00

### Tổng kết
- EFR: 3 (accepted: 3, rejected: 0, inconclusive: 0) | SFR mới: 0 | Plan sửa: có
- Mode: normal
- Context loaded:
  - `EXPERT_REVIEW.md` (full — 67 lines)
  - `FEATURE_TASKS.md:42-46` (vùng test cases Phase 2)
  - `FEATURE_TASKS.md:20-35` (vùng Task 1.1/1.2 để xác minh cross-reference)

### EFR Đã Chấp Nhận

→ **EFR-01**: Test task vẫn cho phép 404, trái với contract 200 `{ data: [] }` | Sửa: `FEATURE_TASKS.md:46` — thay "empty array hoặc 404" bằng 2 case riêng: `4a` (tháng không tồn tại → HTTP 200 `{ data: [] }`) và `4b` (snapshot deleted → HTTP 200 `{ data: [] }`)
- Evidence xác nhận: `FEATURE_TASKS.md:31` ghi rõ "không trả 404" nhưng `FEATURE_TASKS.md:46` (cũ) vẫn chứa "hoặc 404" — mâu thuẫn nội bộ trong tasks file.

→ **EFR-02**: Không có test bắt buộc chứng minh snapshot soft-deleted bị loại trừ | Sửa: `FEATURE_TASKS.md:46` tách thành Test case 4b độc lập — tạo snapshot có employee, đổi thành `snapshot_status = 'deleted'`, assert employee đó không xuất hiện.
- Evidence xác nhận: `FEATURE_TASKS.md:24` yêu cầu lọc `snapshot_status != 'deleted'` nhưng không có test fixture riêng để enforce predicate đó. `FEATURE_TASKS.md:46` (cũ) ghép với "không có snapshot" — coverage bị merge không đủ riêng biệt.

→ **EFR-03**: Test case 3 không bắt buộc cover tháng ngoài khoảng `[1,12]` | Sửa: `FEATURE_TASKS.md:45` (cũ) → bảng test 4 item: thiếu param, `2026-06`, `T0.2026`, `T13.2026` — tất cả assert 400.
- Evidence xác nhận: `FEATURE_TASKS.md:22` yêu cầu guard `monthNum in [1,12]` nhưng task test chỉ nói "sai định dạng", không liệt kê case `T0.2026`/`T13.2026` có format đúng regex nhưng giá trị không hợp lệ.

### Phát Hiện Bổ Sung
- Không có finding bổ sung sau hotspot scan Phase 2 test coverage.
- Vùng scan xác nhận không có SFR: `FEATURE_TASKS.md:42-50`, `FEATURE_PLAN.md:65-66` (Acceptance Criteria).
