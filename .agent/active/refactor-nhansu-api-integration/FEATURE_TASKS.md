# Feature Tasks: Refactor Lấy Dữ Liệu Nhân Sự & Lương Qua API Snapshot Mới

> **Trạng thái**: ✅ Hoàn thành  
> **Liên kết plan**: `FEATURE_PLAN.md`  
> **Ngày tạo**: 2026-08-13 (Cập nhật bổ sung Round 3: 2026-08-13)  

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: Fix Deployment Scripts, Rà soát Callers & Xây dựng Backend API Client

**Mục tiêu:** Sửa PowerShell deployment scripts, rà soát callers (gỡ prefetch rỗng kỳ), tích hợp API `GET /api/snapshots/employees-detail` với preflight check ScriptProperties, hỗ trợ ScriptCache và refactor data mapper theo Object Array.

- [x] Task 1.1: Audit và sửa `push-all.ps1` và `deploy-all.ps1` — loại bỏ tham chiếu `doget` không tồn tại, cập nhật loop danh sách module thực tế `@("client", "doPost")`, kiểm tra exit code từng lệnh `clasp` (EFR-04).
- [x] Task 1.2: Quét toàn bộ vị trí gọi `pg_general_1_LayDataLuong` và `pg_general_1_LayDanhSachLuong` trên Client. Loại bỏ call prefetch lương không có kỳ trong `pg_general_3_XemHieuSuatChiTiet()` (file `pg_general_3.html:343`) (EFR-01, FR-03).
- [x] Task 1.3: Khai báo `API_CONFIG` với Strict Fail-Closed Preflight Check: đọc `APP_ENV = ScriptProperties.getProperty('APP_ENV')`. Nếu thiếu/rỗng/khác `'production'|'development'` → throw Exception ngay. Nếu `production` → bắt buộc có `API_BASE_URL` & `INTERNAL_API_KEY` (fail-closed nếu thiếu). Chỉ khi `development` tường minh mới cho phép fallback dev URL (`https://vcc-hr-backend-dev-69050732080.asia-southeast1.run.app`) trong [`client/pg_general_1.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/pg_general_1.js) (EFR-01 Round 12, FR-06).
- [x] Task 1.4: Refactor hàm `timKiemNhanSuTheoMa()` lọc mảng đối tượng nhân sự dựa trên `item.ma_nhan_su` thay vì `row[0]` của mảng 2D (FR-02).
- [x] Task 1.5: Viết hàm chuẩn hóa dữ liệu nhân sự & tính `luongTarget = targetCC > 0 ? targetCC : targetGT`, gán `luongCoDinh = item.luong_co_dinh ?? item.lcd_gt ?? 0` (EFR-02, FR-01).
- [x] Task 1.6: Thêm cơ chế `CacheService.getScriptCache()` (TTL 600s); xử lý ngoại lệ HTTP an toàn: khi API lỗi (HTTP non-200, timeout, sai key) phải **throw exception** (không `return []`) để kích hoạt `withFailureHandler` phía client — phân biệt rõ với trường hợp API thành công nhưng không có nhân sự (return `[]`) (EFR-02).
- [x] Task 1.Final: 🧪 Test & Verify Phase 1 (Chạy test backend GAS function trong Apps Script Editor, log kết quả Object Array từ API; test `.\push-all.ps1` thành công).

---

## Phase 2: Cập nhật Client UI, Contract Migration & Ghép Nối Dữ Liệu Lương

**Mục tiêu:** Cập nhật contract migration phía Client sang Object Array, truyền tháng nghiệm thu và hiển thị báo cáo Tổng hợp hiệu suất.

- [x] Task 2.1: Cập nhật hàm [`pg_general_1_LayDanhSachLuong(maNS_String, kyNghiemThu)`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/pg_general_3.html#L354) trong `pg_general_3.html` để truyền kỳ nghiệm thu xuống backend.
- [x] Task 2.2: Refactor hàm [`mergeHieuSuatVaLuong()`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/modal_tonghophieusuat_3.html#L915) trong `modal_tonghophieusuat_3.html` để map thuộc tính đối tượng (`item.ma_nhan_su`, `item.luongTarget`, `item.luongCoDinh = item.luong_co_dinh ?? item.lcd_gt ?? 0`) thay vì đọc index mảng 2D `row[0]`, `row[26]`, `row[27]` (EFR-02, FR-07).
- [x] Task 2.3: Thực thi xác nhận output `mergeHieuSuatVaLuong()` với dữ liệu mẫu: kiểm tra đủ 14 cột, `luongTarget > 0`, công thức các tỷ lệ % hoạt động chính xác (FR-04).
- [x] Task 2.4: Kiểm thử 2 sub-case theo contract: (a) **Failure toast** — giả lập lỗi API thực sự (sai key, tắt network) → `withFailureHandler` kích hoạt, UI toast lỗi, không render lương 0; (b) **Empty-state** — kỳ hợp lệ nhưng không có nhân sự (API trả `[]`) → UI hiển bảng rỗng, không toast lỗi, không render lương 0 (EFR-02).
- [x] Task 2.5: Xử lý cache invalidation khi user đổi dropdown kỳ nghiệm thu trong modal: gọi lại `pg_general_1_LayDanhSachLuong(maNS_String, kyMoi)` trước khi chạy `mergeHieuSuatVaLuong()`, hoặc invalidate `pg_general_3_cachedLuongChiTiet = null` rồi reload đồng bộ (EFR-01).
- [x] Task 2.Final: 🧪 Test & Verify Phase 2 (Kiểm tra end-to-end trên UI Web App & chạy `.\deploy-all.ps1`).

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-08-13 17:48 | Phase 1 | Task 1.1 | Tạo plan & tasks checklist | done | Khởi tạo kế hoạch |
| 2026-08-13 18:08 | Phase 1 & 2 | Checklist | Bổ sung 7 điểm khuyến nghị từ feature-review | done | Cập nhật plan & tasks |
| 2026-08-13 18:36 | Phase 1 & 2 | Checklist | Bổ sung 4 EFR mới (EFR-01..EFR-04) từ expert-rebuttal Round 3 | done | Cập nhật tasks & scripts fix |
| 2026-08-13 20:53 | Phase 1 | Task 1.1 | Sửa deployment scripts `push-all.ps1` & `deploy-all.ps1` | done | Loại bỏ doget, thêm exit-code validation |
| 2026-08-13 20:54 | Phase 1 | Task 1.2 | Quét callers & gỡ prefetch lương rỗng kỳ trong `pg_general_3.html` | done | Gỡ prefetch tại XemHieuSuatChiTiet() |
| 2026-08-13 20:55 | Phase 1 | Tasks 1.3-1.6 | Tích hợp API Snapshot backend, Strict Preflight Check, Cache & Mapper | done | Hoàn thành refactor backend GAS |
| 2026-08-13 20:56 | Phase 1 | Task 1.Final | Self-test Phase 1 backend GAS | done | User đã confirm, hoàn thành Phase 1 |
| 2026-08-13 20:56 | Phase 2 | Tasks 2.1-2.5 | Cập nhật Client UI, `mergeHieuSuatVaLuong()` & auto-fetch theo `kyBaoCao` | done | Hoàn thành refactor Client UI |
| 2026-08-13 20:57 | Feature | All | Hoàn tất triển khai feature `refactor-nhansu-api-integration` | done | Sẵn sàng cho bước Archive, Update Docs & Git Sync |
