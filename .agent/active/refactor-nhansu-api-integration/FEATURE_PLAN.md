# Feature Plan: Refactor Lấy Dữ Liệu Nhân Sự & Lương Qua API Snapshot Mới

> **Trạng thái**: ✅ ĐỒNG Ý — Sẵn sàng triển khai  
> **Review gate**: ✅ Đã qua gate — Handoff sang `feature-coordinator`  
> **Feature slug**: refactor-nhansu-api-integration  
> **Tạo bởi**: feature-plan  
> **Ngày tạo**: 2026-08-13 (Cập nhật: 2026-08-13)  

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại, module Hiệu suất ([`client/pg_general_1.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/pg_general_1.js#L866)) đang sử dụng phương thức cũ gọi qua Web App URL `general_webapp_thongtinnhansu?type=datanhansu` để lấy mảng dữ liệu nhân sự và lương (đọc mảng index cứng `row[26]` và `row[27]`). Nguồn dữ liệu này đã cũ và không còn đúng chuẩn hệ thống.
- **Vấn đề cần giải quyết:** 
  - Thay thế phương thức cũ bằng API Backend Snapshot Nhân sự chuẩn hóa mới từ dự án `Module_NhanSu_moi`: `GET /api/snapshots/employees-detail?thang=...`.
  - Áp dụng mẫu tích hợp API chuẩn đã được triển khai ở `Module_TongHopTn_TheoChuanHoa` (sử dụng `API_CONFIG`, `x-api-key`, xử lý `luongTarget` từ `luong_target_cc` và `luong_target_gt`, cơ chế cache TTL 600s và fallback an toàn).
- **Mục tiêu:** Đồng bộ dữ liệu nhân sự & lương giữa Module Hiệu suất với Backend Nhân sự chuẩn hóa mới.
- **Kết quả mong đợi:** 
  - Hàm lấy dữ liệu nhân sự backend GAS trả về danh sách nhân sự chính xác theo kỳ/tháng nghiệm thu.
  - Màn hình Tổng hợp hiệu suất ([`modal_tonghophieusuat_3.html`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/modal_tonghophieusuat_3.html#L915)) hiển thị đúng Lương Target, Lương Cố Định và các tỷ lệ tính toán theo chuẩn API mới.

---

## 2. Phạm vi

### In scope
- Quét toàn bộ call sites gọi `pg_general_1_LayDataLuong` trên Client, loại bỏ prefetch lương thiếu kỳ trong `pg_general_3_XemHieuSuatChiTiet()` và chỉ kích hoạt fetch khi có kỳ nghiệm thu hợp lệ (EFR-01).
- Cấu hình `API_CONFIG` (`API_BASE_URL` & `INTERNAL_API_KEY`) trong Script Properties với preflight check (fail-closed ở production nếu thiếu config; fallback dev URL ở local/dev) (EFR-03).
- Viết lại hàm lấy dữ liệu nhân sự snapshot từ API backend `GET /api/snapshots/employees-detail?thang={ky_nghiem_thu}` với Header `x-api-key`.
- Refactor hàm `timKiemNhanSuTheoMa()` xử lý lọc mảng đối tượng (object array) dựa trên `e.ma_nhan_su` thay vì chỉ số `row[0]` của mảng 2D (FR-02).
- Cập nhật hàm [`mergeHieuSuatVaLuong()`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/modal_tonghophieusuat_3.html#L915) trong `modal_tonghophieusuat_3.html` để map contract mới từ Object array (`item.ma_nhan_su`, `item.luongTarget = targetCC > 0 ? targetCC : targetGT`, `item.luongCoDinh = item.luong_co_dinh ?? item.lcd_gt ?? 0`) (EFR-02).
- Audit & sửa đổi scripts [`push-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/push-all.ps1) và [`deploy-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/deploy-all.ps1) loại bỏ tham chiếu `doget` không tồn tại, cập nhật danh sách module thực tế (`client`, `doPost`) và kiểm tra clasp exit codes (EFR-04).
- Bổ sung cơ chế ScriptCache (TTL 600s) tránh gọi API trùng lặp và xử lý fallback an toàn khi API lỗi/mất kết nối.

### Out of scope
- Sửa đổi cấu trúc cơ sở dữ liệu Supabase của `Module_NhanSu_moi`.
- Thay đổi logic tính toán hiệu suất gốc từ tờ trình/job.

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - Giữ phân tách 2 dự án GAS độc lập (`client` và `doPost`).
  - Đảm bảo quy trình deploy/push chuẩn qua `push-all.ps1` và `deploy-all.ps1` (sau khi được sửa đúng cấu trúc folder).
- **Ràng buộc & quy tắc cấu hình (Environment Marker & Preflight Strict Fail-Closed):**
  - Môi trường bắt buộc xác định qua Script Property: `APP_ENV` (chấp nhận 2 giá trị hợp lệ: `'production'` hoặc `'development'`). Nếu thiếu, rỗng hoặc giá trị bất hợp lệ khác → **fail-closed ngay** (throw Exception: `Error("APP_ENV Script Property must be explicitly set to 'production' or 'development'")`).
  - Khi `APP_ENV === 'production'`: `API_BASE_URL` và `INTERNAL_API_KEY` bắt buộc có trong `ScriptProperties`. Nếu thiếu bất kỳ giá trị nào → **fail-closed** (throw Exception), tuyệt đối không dùng URL dev.
  - Chỉ khi `APP_ENV === 'development'` được khai báo tường minh: Mới cho phép fallback `API_BASE_URL` mặc định về dev Cloud Run URL (`https://vcc-hr-backend-dev-69050732080.asia-southeast1.run.app`) nếu `ScriptProperties` chưa thiết lập `API_BASE_URL`.
  - Chuẩn hóa contract chuyển từ mảng 2D cũ sang mảng đối tượng (Object Array) ở cả backend GAS lẫn frontend mapping.
- **Ràng buộc kiến trúc liên quan:**
  - API endpoint: `GET /api/snapshots/employees-detail?thang=T{MM}.{YYYY}`
  - Authentication: Header `x-api-key: <INTERNAL_API_KEY>`

---

## 4. Giả định và chính sách xử lý

### Giả định & Chính sách nghiệp vụ
- Server `Module_NhanSu_moi` (dev env: `https://vcc-hr-backend-dev-69050732080.asia-southeast1.run.app`) đang hoạt động và đáp ứng request `GET /api/snapshots/employees-detail`.
- **Quy tắc Lương Target:** Thống nhất theo `Module_TongHopTn_TheoChuanHoa`: `luongTarget = targetCC > 0 ? targetCC : targetGT`.
- **Chính sách Lương Cố Định (`luongCoDinh`) (EFR-02):** Ưu tiên đọc `item.luong_co_dinh`, nếu không có đọc alias `item.lcd_gt`, nếu cả hai đều không có thì mặc định `0`. Khi đó `luongHieuSuatDuKien = luongTarget - luongCoDinh`.

---

## 5. Acceptance Criteria

- [ ] Hàm lấy dữ liệu nhân sự backend GAS (`pg_general_1.js`) gọi thành công API `/api/snapshots/employees-detail?thang=...` sử dụng `x-api-key`.
- [ ] Dữ liệu thu được có đầy đủ các thông tin: `ma_nhan_su`, `ho_va_ten`, `khoi`, `phong_ban`, `nhom_team`, `luongTarget` và `luongCoDinh` (hỗ trợ `luong_co_dinh` / `lcd_gt`, mặc định 0 nếu không có).
- [ ] Màn hình Tổng hợp hiệu suất ghép nối thành công `dataLuong` từ Object array mới và hiển thị đúng thông tin lên bảng DataTable.
- [ ] Có cơ chế cache dữ liệu (ScriptCache 600s) và xử lý ngoại lệ HTTP (try/catch + fallback) không làm sập giao diện nếu API gián đoạn.
- [ ] Khi user mở modal/chọn kỳ nghiệm thu, snapshot lương được tải đúng kỳ; loại bỏ call prefetch rỗng kỳ ở màn hình chính (EFR-01).
- [ ] Backend GAS phân biệt rõ 2 trạng thái: (a) lỗi API/timeout → throw exception để kích hoạt `withFailureHandler` (→ UI toast lỗi + không render dữ liệu 0), và (b) kỳ hợp lệ nhưng không có nhân sự → trả `[]` như empty-state bình thường.
- [ ] Pre-deploy script `push-all.ps1` và `deploy-all.ps1` được sửa đúng danh sách module `client` và `doPost`, thực thi không lỗi (EFR-04).

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [`client/pg_general_1.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/pg_general_1.js) | Refactor | Tích hợp `API_CONFIG`, refactor `pg_general_1_laythongtinnhansu`, `pg_general_1_LayDataLuong` và `timKiemNhanSuTheoMa` hỗ trợ Object array & Preflight check | 🟡 | Đổi contract sang Object Array |
| [`client/modal_tonghophieusuat_3.html`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/modal_tonghophieusuat_3.html) | Refactor | Cập nhật hàm `mergeHieuSuatVaLuong()` đọc thuộc tính object (`item.ma_nhan_su`, `item.luongTarget`, `item.luongCoDinh = item.luong_co_dinh ?? item.lcd_gt ?? 0`) | 🟡 | Cập nhật client mapping |
| [`client/pg_general_3.html`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/pg_general_3.html) | Refactor | Gỡ bỏ call prefetch rỗng kỳ trong `pg_general_3_XemHieuSuatChiTiet()`, truyền `kyNghiemThu` xuống backend khi tải lương | 🟢 | Có |
| [`push-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/push-all.ps1) | Refactor | Bỏ thư mục `doget` không tồn tại, cập nhật loop `@("client", "doPost")` | 🟢 | Script |
| [`deploy-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/deploy-all.ps1) | Refactor | Bỏ thư mục `doget` không tồn tại, cập nhật loop backup/version/deploy cho `@("client", "doPost")` | 🟢 | Script |

---

## 7. Risk Triage và Review Focus

- **Review required:** Yes (`feature-review`)
- **Risk hotspots:** 
  - Đảm bảo tất cả callers của `pg_general_1_LayDataLuong` đều truyền đúng định dạng kỳ nghiệm thu `T6.2026`.
  - Loại bỏ call prefetch không có kỳ ở `pg_general_3_XemHieuSuatChiTiet()`.
  - Preflight check ScriptProperties tránh dùng URL dev âm thầm ở production.
  - Sửa script deploy/push PowerShell để đảm bảo clasp sync đúng folder.
- **Review focus areas:** 
  - Tính ổn định của cơ chế fallback khi API lỗi (HTTP 500 / Timeout).
  - An toàn cấu hình API Key trong Script Properties.

---

## 8. Chiến lược triển khai

- **Phase strategy:** 2 Phase
  - **Phase 1:** Sửa PowerShell scripts (`push-all.ps1`, `deploy-all.ps1`) + Rà soát callers + Khai báo `API_CONFIG` với Preflight check + Backend GAS fetch API & refactor `timKiemNhanSuTheoMa` (Object Array).
  - **Phase 2:** Cập nhật Client UI (`pg_general_3.html` gỡ prefetch, `modal_tonghophieusuat_3.html` map object array & alias `lcd_gt`) + kiểm thử end-to-end + fallback error.
- **Thứ tự triển khai:** Phase 1 Backend & Scripts -> Phase 2 Frontend & Integration Test.

---

## 9. Test Strategy

- **Automated / Apps Script tests:** Chạy thử hàm backend GAS `pg_general_1_LayDataLuong("101563", "T6.2026")` trong Apps Script Editor để kiểm tra response API và log output object array.
- **Manual verification:** 
  - Mở Web App UI -> Modal Tổng hợp hiệu suất -> Chọn Kỳ nghiệm thu -> Bấm Tổng hợp -> Kiểm tra cột Lương Target và Tỷ lệ % hiển thị chính xác.
  - **Failure toast test (EFR-02a):** Giả lập lỗi API thực sự (đổi tạm API key sai hoặc tắt network) -> Kiểm tra `withFailureHandler` kích hoạt, UI hiển thị Toast lỗi và **không render** dữ liệu lương 0.
  - **Empty-state test (EFR-02b):** Chọn kỳ hợp lệ nhưng không có nhân sự trong snapshot (API trả `[]`) -> Kiểm tra UI hiển thị thông báo "không có dữ liệu" hoặc bảng rỗng, **không hiện toast lỗi**, **không render** lương 0.
  - **Deployment pipeline test (EFR-04):** Chạy `.\push-all.ps1` và `.\deploy-all.ps1` -> Kiểm tra không báo lỗi folder `doget` không tồn tại, clasp push thành công cả `client` và `doPost`.

---

## 10. Rollback Plan

- Nếu API mới gặp sự cố hoặc gián đoạn network, hệ thống catch error, hiển thị thông báo toast lỗi cho người dùng và giữ an toàn trạng thái giao diện.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
