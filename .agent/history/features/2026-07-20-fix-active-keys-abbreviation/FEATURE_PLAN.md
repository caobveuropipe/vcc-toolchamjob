# Feature Plan: Sửa lỗi lệch khóa đối chiếu Snapshot (API active-keys) cho Khối Bizfly Martech & Sale tech và các khối dùng tên đầy đủ

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Bắt buộc review trước khi thực thi
> **Feature slug**: fix-active-keys-abbreviation
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-20

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Người dùng gặp lỗi không đối chiếu được dữ liệu khi import Excel trên module lương cũ của Apps Script đối với khối Bizfly Martech & Sale tech (và một số khối khác).
- **Vấn đề cần giải quyết:** API `GET /api/snapshots/active-keys` (tại `backend/src/services/snapshotService.ts`) đang tự động cắt 3 ký tự đầu `k.slice(0, 3)` cho các khối không đặc thù, dẫn đến việc trả về mã khối viết tắt là `BIZ` thay vì tên đầy đủ `BIZFLY MARTECH & SALE TECH` như Apps Script cũ yêu cầu.
- **Mục tiêu:** Cập nhật hàm `khoisAbbreviation` trong `backend/src/services/snapshotService.ts` để bảo toàn tên đầy đủ của các khối sử dụng tên đầy đủ tại hệ thống cũ, đảm bảo kết quả API đối chiếu khớp 100% với định dạng của Apps Script.
- **Kết quả mong đợi:** Apps Script đối chiếu thành công khóa cho khối Bizfly Martech & Sale tech cũng như các khối tên đầy đủ khác.

## 2. Phạm vi

### In scope
- Sửa hàm `khoisAbbreviation` trong file `backend/src/services/snapshotService.ts`.
- Bổ sung danh sách các khối dùng tên đầy đủ bao gồm: `BIZFLY CLOUD`, `SOHAGAME`, `BIZFLY MARTECH & SALE TECH`, `KND`, `MY SOHA`, `VCCORP`, `VIVA`, `NANDA`, `CNND`.
- Cập nhật/Bổ sung integration tests để đảm bảo tính chính xác của hàm đối chiếu active keys.
- Sửa logic tiền tố prefix của API active-keys để chuẩn hóa tháng gửi lên (loại bỏ zero-padding ở tháng ví dụ `T06.2026` -> `T6.2026`). <!-- Sửa theo EFR-03: Chuẩn hóa tiền tố tháng -->

### Out of scope
- Thay đổi cấu trúc cơ sở dữ liệu hoặc logic chốt Snapshot chính.
- Sửa đổi Apps Script bên Google Sheets.

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:** Tôn trọng nguyên tắc bảo mật và cấu trúc đối chiếu khóa `active-keys` đã chốt trong [monthly-data-finalization](file:///d:/ToolNhanSuVcc/.agent/history/features/2026-07-14-monthly-data-finalization/FEATURE_PLAN.md).
- **"Cấm kỵ" cần tránh:** Không phá vỡ định dạng tiền tố `T6.2024-MA_NS-KHOI` đã thống nhất cho API đối chiếu.

## 4. Giả định và câu hỏi mở

### Giả định
- Các khối trong danh sách `fullNameBlocks` đều sử dụng tên đầy đủ dạng chữ in hoa được trim khoảng trắng ở hai đầu để đối chiếu.

### Câu hỏi mở
- *Không có* (Yêu cầu kỹ thuật đã rất rõ ràng và khớp với logic nghiệp vụ Apps Script hiện hành).

## 5. Acceptance Criteria

- [ ] Hàm `khoisAbbreviation` trả về đúng `BIZFLY MARTECH & SALE TECH` thay vì `BIZ`.
- [ ] API `GET /api/snapshots/active-keys` hoạt động chính xác cho khối Bizfly Martech & Sale tech và trả về các khóa dạng `T6.2026-112470-BIZFLY MARTECH & SALE TECH`. <!-- Sửa theo EFR-01: Dùng định dạng tháng năm 4 chữ số thống nhất -->
- [ ] API `GET /api/snapshots/active-keys?thang=T06.2026` tự động chuẩn hóa tiền tố trả về thành `T6.2026-...` thay vì giữ nguyên `T06.2026-...`. <!-- Sửa theo EFR-03: Chuẩn hóa tiền tố tháng -->
- [ ] Mọi bài kiểm thử tự động (tests) cho API active-keys đều pass.

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `backend/src/services/snapshotService.ts` | Sửa | Cập nhật hàm `khoisAbbreviation` hỗ trợ danh sách khối dùng tên đầy đủ | 🟢 | Có |
| `backend/src/__tests__/integration/snapshots.test.ts` (hoặc test tương ứng) | Sửa/Bổ sung | Viết test kiểm tra active-keys với khối Bizfly Martech & Sale tech | 🟢 | Có |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Đảm bảo không làm ảnh hưởng đến việc viết tắt của các khối đặc thù cũ như ADMICRO (ADM), KENH14 (K14), CAFEF (CFF), SOKHOI (KNS).
- **Review focus areas:** Kiểm tra việc khớp chuỗi không phân biệt hoa thường và khoảng trắng.

## 8. Chiến lược triển khai

- **Phase strategy:** 
  - **Phase 1:** Triển khai code sửa logic hàm `khoisAbbreviation`.
  - **Phase 2:** Cập nhật Unit Test/Integration Test và xác minh hoạt động của API.
- **Thứ tự triển khai:** Sửa logic -> Viết test kiểm chứng.

## 9. Test Strategy

- **Automated tests:** 
  - Viết/Cập nhật test case dạng table-driven cho `getActiveKeys` trong integration tests của backend. Test suite phải bao phủ:
    1. Toàn bộ danh sách `fullNameBlocks` (ví dụ: `BIZFLY CLOUD`, `SOHAGAME`, `BIZFLY MARTECH & SALE TECH`...).
    2. Các khối viết tắt đặc thù cũ (ví dụ: `ADMICRO` -> `ADM`, `KENH14` -> `K14`...).
    3. Case-insensitive và trim khoảng trắng (ví dụ: `  Bizfly Martech & Sale Tech  ` -> `BIZFLY MARTECH & SALE TECH`).
    4. Fallback 3 chữ số cho khối thường (ví dụ: `KHOITHUONG` -> `KHO`).
    <!-- Sửa theo EFR-02: Bổ sung table-driven test bao phủ đầy đủ -->
    5. Kiểm tra truyền định dạng tháng có padding zero `T06.2026` assert key trả về chuẩn hóa tiền tố thành `T6.2026-...` thay vì `T06.2026-...`. <!-- Sửa theo EFR-03: Kiểm tra chuẩn hóa tiền tố month -->
- **Manual verification:**
  - Gọi thử API `GET /api/snapshots/active-keys?thang=T06.2026` và `GET /api/snapshots/active-keys?thang=T6.2026` với `x-api-key` và kiểm tra giá trị trả về đều chuẩn hóa thành `T6.2026-...`.

## 10. Rollback Plan

- Revert thay đổi code trong `backend/src/services/snapshotService.ts` về trạng thái ban đầu của Git.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
