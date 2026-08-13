# Changelog FE - Tool Nhân Sự VCC

> Phạm vi: Frontend, UI, UX, state client, routing, hiển thị, validation phía client
> Format: [Conventional Commits](https://www.conventionalcommits.org/)
> Ngôn ngữ: Tiếng Việt

## [2026-08-13] v8.1.0 - Refactor Client UI & Ghép nối dữ liệu lương theo API Snapshot mới

- **Trang Tổng quan & Xem chi tiết (`client/pg_general_3.html`)**:
  - Cập nhật hàm `pg_general_1_LayDanhSachLuong(maNS_String, kyNghiemThu)` truyền kỳ nghiệm thu xuống backend GAS.
  - Loại bỏ call prefetch lương không có kỳ rỗng trong `pg_general_3_XemHieuSuatChiTiet()` tránh gọi thừa API không đủ thông tin.
- **Modal Tổng hợp hiệu suất (`client/modal_tonghophieusuat_3.html`)**:
  - Refactor hàm `mergeHieuSuatVaLuong()` map trực tiếp thuộc tính đối tượng (`item.ma_nhan_su`, `item.luongTarget`, `item.luongCoDinh = item.luong_co_dinh ?? item.lcd_gt ?? 0`) thay cho việc đọc chỉ số mảng 2D legacy.
  - Xử lý cache invalidation & auto-refetch dữ liệu lương khi người dùng thay đổi dropdown kỳ nghiệm thu báo cáo (`kyBaoCao`), đảm bảo số liệu hiển thị luôn đồng bộ với kỳ đã chọn.
  - Xử lý phân biệt rõ 2 trạng thái API: Hiển thị toast cảnh báo lỗi khi API thất bại (withFailureHandler), giữ bảng rỗng sạch sẽ khi API trả mảng `[]` không có nhân sự.

## [2026-08-08] v8.0.0 - Dynamic 5-Level Org Unit Search Dropdowns & Strict Cascading Parent Guard

- **Component Cascading Select (`frontend/src/components/common/OrgUnitCascadingSelect.tsx`)**:
  - Chuyển đổi 100% 5 cấp tổ chức (Khối, BU, Phòng ban, Bộ phận, Nhóm team) và Line Nhân sự từ ô Text nhập tự do sang ô Search Select xổ xuống với tìm kiếm thông minh.
  - Tích hợp helper chuẩn hóa tiếng Việt Unicode NFD (`removeVietnameseTones`) gõ không dấu tìm có dấu (như `phong` tìm được `Phòng`).
  - Áp dụng thuật toán **Strict Cascading Filter & Anchor Node Traversal**: Khi đã chọn một cấp cha (như Phòng ban), ô con (như Bộ phận) bắt buộc chỉ hiển thị các đơn vị trực thuộc cấp cha đó. Nếu cấp cha chưa có dữ liệu con, ô con hiển thị Trống thay vì tràn toàn bộ danh sách Khối.
  - Hỗ trợ hiển thị và nạp nhãn node đã khóa `(Đã khóa)` khi hồ sơ nhân sự cũ tham chiếu node inactive.
- **Component Form Nhân sự (`frontend/src/components/EmployeeForm.tsx` & `EmployeeEditPage.tsx`)**:
  - Đăng ký đủ 12 trường ẩn tổ chức (`khoi`, `bu`, `phong_ban`, `bo_phan`, `nhom_team`, `line_nhan_su` và 6 UUID FKs tương ứng) qua Form.Item hidden.
  - Bổ sung **Target EA Scope Contextual Guard**: Hiển thị cảnh báo trực quan màu vàng ngay bên dưới khối Tổ chức khi người dùng chọn Khối mà mình không có quyền EA, hướng dẫn chuyển sang luồng Điều chuyển.
  - Lọc sạch các thuộc tính Lương khỏi payload Direct Edit (`PUT /api/employees/:id`) tránh bị vô tình kích hoạt 403 Permission Denied.
- **Component Tải chứng từ (`frontend/src/components/DocumentUpload.tsx`)**:
  - Khắc phục lỗi cảnh báo React State-in-Render bằng cách trì hoãn `onDocumentsChange` qua `queueMicrotask`.
  - Thay thế component `<List>` cũ của Ant Design bằng danh sách thẻ Custom Card bo góc 6px với Flexbox layout hiện đại.

## [2026-08-05] v7.9.0 - Dynamic Parent Select, Status Toggle Guard & CascadingSelect Root Matching

- **Trang Quản lý Danh mục Tổ chức (`frontend/src/pages/Admin/OrgUnitManagementPage.tsx`)**:
  - Bổ sung `Form.Item name="parent_id"` trong Modal Create với dropdown Select lọc đơn vị cha động theo phân cấp và phạm vi Scope EA.
  - Thêm nút Status Toggle trực tiếp trên row/card (cho phép vô hiệu hóa node lá và kích hoạt lại top-down).
  - Khai báo helper `canEditOrgUnit` kiểm tra quyền Scope EA từ `permissionMatrix`, ẩn option `type = 'khoi'` đối với tài khoản Non-SA.
- **Component Tạo Nhanh (`QuickAddOrgUnitModal.tsx`)**:
  - Lọc loại đơn vị tổ chức theo quyền SA/EA permissions (ẩn `khoi` đối với Non-SA).
- **Component Cascading Select (`OrgUnitCascadingSelect.tsx`)**:
  - Refactor root node resolution (EFR-25 fix): Khớp root node qua `u.khoi / u.code / u.id` thay vì so sánh chuỗi hiển thị `u.name`. Đảm bảo giữ nguyên `khoi_id` trong `EmployeeForm` khi SA đổi tên hiển thị Root Khối.


- **Đồng bộ Single `activeTempUuid`**:
  - `EmployeeEditPage.tsx`: Fetch và merge `pending_salary` từ `useSalaryDetail` vào `initialValues` truyền xuống `EmployeeForm`.
  - `EmployeeForm.tsx`: Đọc canonical `activeTempUuid` từ `pending_changes._temp_uuid`, `pending_salary._temp_uuid`, hoặc `active_pending_temp_uuid` trước khi tạo mới UUID, truyền xuống `DocumentUpload` và gắn vào `normValues.temp_uuid`.
- **Component Tải chứng từ (`DocumentUpload.tsx`)**:
  - Cập nhật logic `hasBindableEvidence` chỉ bằng `true` khi file đã finalize thành công (`upload_status === 'ready'`).
  - Bổ sung kích hoạt `notifyChange` trên mọi state transitions (upload thành công, upload thất bại, xóa file local, xóa file server).

## [2026-07-29] v7.7.0 - Giao diện quản lý chứng từ đính kèm & Tích hợp Chi tiết nhân sự

- **Component Tải chứng từ (`frontend/src/components/DocumentUpload.tsx`)**:
  - Phân tách 2 props `filterDocumentTypes` và `uploadDocumentType`, hỗ trợ `preferredTempUuid` và callback `onDocumentsChange` (`hasDocuments`, `hasBindableEvidence`, `activeTempUuid`, `count`).
  - Cập nhật custom upload handler xin Presign API lấy `documentId`, PUT trực tiếp lên R2 và POST `/api/documents` chỉ với `{ documentId }`.
  - Hiển thị danh sách tài liệu từ server (`upload_status = 'ready'`) hỗ trợ Xem/Tải file 2 bước an toàn qua `downloadUrl` và Popconfirm xóa file.
- **Tích hợp Form & Modal Consumers**:
  - `SalaryEditModal.tsx`: Đồng bộ `activeTempUuid`, hỗ trợ `preferredTempUuid` từ pending salary, giữ nguyên cảnh báo soft-gate ("*Tôi hiểu, vẫn lưu*") khi không đính kèm file chứng từ.
  - `EmployeeForm.tsx`: Mode create truyền `uploadDocumentType="tuyen_moi"`, mode transfer truyền `uploadDocumentType="dieu_chuyen"`, hard-gate khóa nút Submit khi `hasBindableEvidence === false`.
  - `ProbationEvaluationModal.tsx`: Tạo session `tempUuid` mới cho đợt đánh giá thử việc, hard-gate khóa nút Submit khi chưa tải lên biên bản.
- **Trang Chi tiết nhân sự (`frontend/src/pages/Employees/EmployeeDetailPage.tsx`)**:
  - Khai báo predicate `canViewPendingDocuments` (SuperAdmin, EA của khối, hoặc Reviewer của nhân sự).
  - Render Card "Giấy tờ minh chứng đính kèm (chờ duyệt)" trực tiếp tại tab Thông tin chung.

## [2026-07-28] v7.6.2 - Đồng bộ danh sách Khối chuẩn và loại bỏ khối Vccorp

- **Danh sách Khối văn phòng (`packages/shared/src/constants/khoi.ts`)**:
  - Loại bỏ khối `'Vccorp'` khỏi hằng số dùng chung `KHOI_VALUES`.
- **Trang Quản lý chốt dữ liệu hàng tháng (`frontend/src/pages/Snapshots/index.tsx`)**:
  - Thay thế mảng hardcode danh sách khối văn phòng của Super Admin (`allowedKhois`) bằng cách import và sử dụng trực tiếp hằng số `KHOI_VALUES` từ `@vcc/shared`.
- **Trang Danh sách lương (`frontend/src/pages/Salaries/SalaryListPage.tsx`)**:
  - Thay thế mảng hardcode danh sách khối văn phòng (`KHOI_OPTIONS`) bằng cách import và sử dụng trực tiếp hằng số `KHOI_VALUES` từ `@vcc/shared`.

## [2026-07-28] v7.6.1 - Hiển thị song song nhân sự cũ phòng chờ và Autocomplete động Reviewer

- **Trang danh sách nhân sự chính thức (`frontend/src/pages/Employees/EmployeeListPage.tsx`)**:
  - Loại bỏ hoàn toàn filter cứng `state_phong_cho={false}` trong `EmployeeTable` để danh sách chính hiển thị song song cả các nhân sự cũ đang chờ duyệt (pending update).
- **Giao diện quản lý Reviewer (`frontend/src/pages/Admin/tabs/ReviewerManagement.tsx`, `frontend/src/hooks/useEmployees.ts`)**:
  - Loại bỏ `state_phong_cho: false` trong hook query danh sách.
  - Chuyển đổi ô chọn AutoComplete gán Reviewer sang gọi autocomplete động qua API `/api/employees/autocomplete?q=...` từ server khi người dùng gõ phím.
  - Thêm custom hook `useEmployeeAutocomplete` trong `useEmployees.ts` để gọi API.
- **Tích hợp CI/CD và Script kiểm tra tĩnh (`scripts/verify-fe-parameters.js`, `.github/workflows/ci.yml`)**:
  - Viết script kiểm tra tĩnh `verify-fe-parameters.js` quét mã nguồn frontend và tự động chặn đứng (exit code 1) nếu phát hiện file code chứa tham số lọc cứng `state_phong_cho=false` hoặc `state_phong_cho: false`.
  - Tích hợp chạy `pnpm test:fe-verify` vào quy trình Github Actions (`.github/workflows/ci.yml`).

## [2026-07-24] v7.6.0 - Cập nhật parameter exclude_pending_new_hires cho useEmployees và Export Excel

- **Employee Hook (`frontend/src/hooks/useEmployees.ts`)**:
  - Thêm thuộc tính `exclude_pending_new_hires?: boolean` vào `PaginationAndFilters` và đồng bộ truyền vào URLQuery parameter.
- **Trang Danh sách nhân sự (`frontend/src/pages/Employees/EmployeeListPage.tsx`)**:
  - Cập nhật explicit parameter `exclude_pending_new_hires = true` trong các hàm export dữ liệu (`handleExport`, `runExportFull`) để loại bỏ hoàn toàn các dòng nháp nhân sự mới `TMP...` khi xuất file Excel.

## [2026-07-17] v7.2.1 - Tối ưu hóa hiển thị rà soát lỗi import nghỉ việc

- **Component `BulkResignModal` (`frontend/src/pages/Employees/components/BulkResignModal.tsx`):**
  - Tối ưu hóa bảng xem trước (preview table): Khi phát hiện bất kỳ lỗi logic nào (`hasErrors === true`), bảng sẽ tự động lọc chỉ hiển thị các dòng bị lỗi để người dùng tiện rà soát.
  - Khi không có lỗi, bảng vẫn hiển thị toàn bộ danh sách dòng dữ liệu hợp lệ bình thường.

## [2026-07-17] v7.2.0 - Giao diện cập nhật nghỉ việc hàng loạt qua Excel

- **Component `BulkResignModal` (`frontend/src/pages/Employees/components/BulkResignModal.tsx`):**
  - Tạo mới component sử dụng Ant Design `<Modal>`, `<Upload>`, `<Table>` và thư viện `xlsx` để tải file Excel mẫu, parse client-side và hiển thị preview validation theo dòng với Tag đỏ/xanh.
  - Sửa lỗi tương thích Ant Design v6: Đổi `Space` sang `Flex` và đổi prop `message` trên các thẻ `Alert` thành `title`.
  - Khắc phục lỗi strict type kiểm soát an toàn `sheetName` và `sheet` có thể bị `undefined`.
- **Trang Danh sách nhân sự (`frontend/src/pages/Employees/EmployeeListPage.tsx`):**
  - Tích hợp nút "Import nghỉ việc" (icon `UserDeleteOutlined`) bên cạnh nút "Thêm NS mới" cho các tài khoản có quyền EA/SA.
  - Tích hợp gọi hiển thị modal `BulkResignModal` và làm sạch cache React Query (`queryClient.invalidateQueries`) khi import thành công.

## [2026-07-16] v7.1.1 - Bổ sung Nhuận bút cơ chế và đổi tên HS Chấm/Job/Nhuận

- **Modal Cập nhật lương (`SalaryEditModal.tsx`)**:
  - Đổi tên nhãn của trường `thuong_hieu_suat_cham_job_nhuan` thành "HS chấm job".
  - Thêm ô nhập liệu cho `nhuan_but_cc` trong vùng "Bộ Cơ chế — Base".
  - Cập nhật thông điệp cảnh báo `unallocatedWarning` sử dụng tên nhãn mới "HS chấm job".
- **Modal Đánh giá thử việc (`ProbationEvaluationModal.tsx`)**:
  - Bổ sung ô nhập liệu cho `nhuan_but_cc` vào vùng "Bộ Cơ chế — Base".
- **Trang Chi tiết nhân sự (`EmployeeDetailPage.tsx`)**:
  - Đổi tên nhãn của hàng Hiệu suất thành "3. HS chấm job" trong bảng breakdown lương.
  - Bổ sung dòng hiển thị "4. Nhuận bút (CC)" ứng với trường `nhuan_but_cc` trong bảng breakdown lương chi tiết.
  - Cập nhật công thức tính tổng Target dự kiến và Tổng thu nhập dự kiến để cộng dồn chính xác Nhuận bút (CC) và tăng số thứ tự nhãn cho các hàng sau nó.
- **Trang Danh sách nhân sự (`EmployeeListPage.tsx`)**:
  - Đổi nhãn xuất Excel của trường `thuong_hieu_suat_cham_job_nhuan` thành "Thưởng hiệu suất chấm job".

## [2026-07-16] v7.1.0 - Hợp nhất trường lương & Cải tiến hiển thị

- **Onboarding Form (`EmployeeForm.tsx`)**:
  - Khôi phục ô nhập liệu "Hiệu suất" (Cơ chế) hiển thị trực quan cho người dùng.
  - Tự động xóa trường `thuong_hieu_suat_cham_job_nhuan` và `thuong_doanh_so_cc` trước khi submit gửi lên API (chỉ bỏ đi khi lưu DB).
  - Sửa logic Fallback sao chép tự động: Lương cố định (CC) = Lương cố định (GT) + Thưởng KD (GT). OKR và Nhuận bút map tương ứng, loại bỏ việc copy `thuong_doanh_so_cc` và không tự copy Hiệu suất/Thưởng KD sang CC.
  - Sử dụng `App.useApp()` thay cho static `message` để tránh các lỗi context theme/warning.
- **OCR Upload Panel (`DocumentUpload.tsx`)**:
  - Ẩn trường `thuong_doanh_so_cc` khỏi UI và tự động map `okr_cc` sang `thuong_okr_m1` khi bấm nút "Tự điền".
  - Tách biệt component hiển thị danh sách file upload (read-only list) để tránh lỗi crash `getImageNode` của AntD Upload.
  - Đồng bộ hiển thị tổng và thêm icon cảnh báo màu đỏ nhấp nháy khi có sự lệch Target CC do AI đọc.
- **Modal Cập nhật lương (`SalaryEditModal.tsx`)**:
  - Tự động tính toán chênh lệch chưa phân bổ `unallocated` và gán vào ô `thuong_hieu_suat_cham_job_nhuan` khi mở modal cho nhân sự thuộc phòng chờ (`state_phong_cho === true`).
  - Thêm cảnh báo màu vàng phía dưới tiêu đề "Bộ Cơ chế — Base", sử dụng thuộc tính `title` của `Alert` để sửa warning deprecation.
- **Trang Chi tiết nhân sự (`EmployeeDetailPage.tsx`)**:
  - Hiển thị Lương cố định CC (`luong_cb`), Hiệu suất CC (tổng của `thuong_hieu_suat_cham_job_nhuan` + các component M1 khác), Nhuận bút CC (`nhuan_but_cc`), OKR CC (`thuong_okr_m1`), và ẩn Thưởng KD CC.
  - Tự động tính tổng thực tế và so sánh với Target CC lưu trong DB. Nếu lệch, đổi màu dòng "Tổng thu nhập" sang màu đỏ và áp dụng hiệu ứng nháy (blink animation) kèm icon cảnh báo và tooltip giải thích chi tiết.
  - Mặc định bật Switch "Xem bảng chi tiết" (`showDetailedMechanism = true`).

## [2026-07-14] v7.0.0 - NS-003: Trang quản lý chốt dữ liệu nhân sự hàng tháng

- **Trang Snapshots** (`frontend/src/pages/Snapshots/`) — 2 tab: "Chốt Chính Thức" và "Chốt Bổ Sung":
  - **RBAC**: SA/EA/VA truy cập route `/snapshots`; VA read-only (mọi nút thao tác bị ẩn); VI-only/Reviewer-only bị chặn hoàn toàn
  - Bảng danh sách: Tháng, Khối, Số NS, Số bổ sung, Trạng thái, Ngày khóa, Người khóa (`locked_by`)
- **Chốt chính thức (EA)**:
  - Chọn Tháng + Khối → check trạng thái chặn → gọi API Create
  - Popup cảnh báo nếu có nhân sự phòng chờ vướng ngày hiệu lực trong kỳ
- **Xóa snapshot (EA)** — luồng 2 bước an toàn:
  - Bước 1: `GET /:id/export-before-delete` → tải Excel watermark về máy
  - Bước 2: Modal xác nhận → `DELETE /:id` với `version_updated_at` (chống race condition)
  - Nút Xóa disable khi `locked`; ẩn hoàn toàn khi `deleted`
- **Khôi phục snapshot (EA)** — khi trạng thái `deleted`, hiển thị 2 tùy chọn rõ ràng:
  - "Khôi phục & Chốt lại (Live Master)": Gọi API `POST /:id/restore-live` tính lại từ master data sống
  - "Khôi phục từ Excel Backup": Upload Excel → Preview bảng → `POST /:id/restore`
- **Lock/Unlock (SA-only)**: nút chỉ hiển thị cho SA; gọi `PUT /:id/lock` / `PUT /:id/unlock`
- **Tab Chốt Bổ Sung (SA + EA)**:
  - EA: Upload Excel (bodyLimit 5MB) → Preview bảng → bắt buộc nhập note nếu lệch khối → `POST /:id/commit`
  - SA: Bảng danh sách `snapshot_supplemental_pending` (pending/approved/rejected); tích chọn bulk; duyệt/từ chối/thu hồi lẻ
- **ProtectedRoute & MainLayout** (`frontend/src/App.tsx`, `frontend/src/components/MainLayout.tsx`): thêm route `/snapshots` và menu item theo RBAC
- Files: `frontend/src/pages/Snapshots/`, `frontend/src/App.tsx`, `frontend/src/components/MainLayout.tsx`

## [2026-07-01] v6.4.0 - Mở rộng hỗ trợ tải file PDF và OCR trên giao diện DocumentUpload
- **DocumentUpload Component**:
  - Mở rộng thuộc tính `accept` của AntD Upload component cho phép chọn tệp PDF (`application/pdf`) bên cạnh các file ảnh truyền thống.
  - Cập nhật nhãn nút bấm hành động chọn file từ thiết bị thành **"Chọn file (Ảnh/PDF)"**.
  - Kích hoạt nút **"AI Đọc Giấy Tờ"** chạy thành công cho cả file PDF thông qua API OCR mặc định ở backend.
- Files: `frontend/src/components/DocumentUpload.tsx`.

## [2026-06-23] v6.2.0 - Tích hợp bộ lọc Người nghiệm thu thử việc và tùy chọn xuất Excel
- **Employee Table**:
  - Thay thế cột Email bằng cột **"Người nghiệm thu thử việc"** (`nguoi_nghiem_thu_thu_viec`) ở cả bảng thường và Phòng chờ.
  - Tích hợp **Dropdown Multi-select Filter** (bộ lọc đa chọn) cho cột Người nghiệm thu thử việc, tự động fetch unique values khả dụng từ backend.
  - Điều chỉnh độ rộng scroll ngang (`scroll.x`) của bảng rộng thêm 40px tránh vỡ layout.
- **Employee List Page (Export Excel)**:
  - Bổ sung controlled `<Modal>` của Ant Design hiển thị khi chọn xuất full danh sách với 3 lựa chọn: Hủy, Chỉ nhân sự đang hoạt động, Bao gồm cả nhân sự nghỉ việc.
  - Tối ưu hóa chiều rộng Modal (580px) và rút gọn label nút để hiển thị cân đối trên một dòng.
  - Khắc phục stale closures bằng cách memoize `menuItems` và bọc các hàm export trong `useCallback`, giúp các nút export luôn nhận params search/filter mới nhất khi người dùng thay đổi trên UI.
- Files: `frontend/src/components/EmployeeTable.tsx`, `frontend/src/pages/Employees/EmployeeListPage.tsx`, `frontend/src/hooks/useEmployees.ts`.

## [2026-06-19] v6.0.0 - Xuất Excel full danh sách nhân sự (excel-full-export)
- **Employee List Page (Export Excel)**:
  - Thêm tùy chọn "Xuất full danh sách" vào dropdown "Xuất Excel" tại `EmployeeListPage.tsx`.
  - Tự động gọi API `/employees?limit=all&include_salaries=true` kết hợp truyền thêm tham số loại trừ trạng thái nghỉ việc (`trang_thai=thu_viec,chinh_thuc,nghi_sinh`).
  - Định nghĩa mapping 56 trường (25 trường nhân sự cơ bản + 31 trường lương nhạy cảm).
  - Hiển thị cảnh báo bằng `message.warning` của Ant Design nếu phát hiện cờ `truncated === true` từ API (dữ liệu bị giới hạn ở 5000 dòng đầu tiên).
- Files: `frontend/src/pages/Employees/EmployeeListPage.tsx`.

## [2026-06-18] v5.9.0 - Tích hợp Người nghiệm thu chính thức vào Form & Sửa hồ sơ
- **EmployeeForm**:
  - Thêm trường "Người nghiệm thu chính thức" sử dụng Select multiple autocomplete hiển thị định dạng `Tên <email> (Nguồn)`.
  - Disable trường và hiện cảnh báo "Không có quyền chỉnh sửa" cho các tài khoản không phải SA/EA cùng Khối của nhân sự.
  - Tự động nạp giá trị ban đầu cho `reviewer_emails` của nhân sự.
- **EmployeeEditPage**:
  - So sánh `reviewer_emails` cũ và mới khi lưu cập nhật. Nếu có thay đổi, tự động chuyển hướng submit qua phòng chờ duyệt (`/personnel-pending`) thay vì cập nhật trực tiếp (kể cả chế độ thường non-transfer).
- Files: `frontend/src/components/EmployeeForm.tsx`, `frontend/src/pages/Employees/EmployeeEditPage.tsx`.

## [2026-06-17] v5.8.0 - Bổ sung Người nghiệm thu thử việc
- **EmployeeForm**: Bổ sung trường nhập "Người nghiệm thu thử việc (Email)" tại khu vực "Quản lý & Hợp đồng" trên form tạo mới nhân sự.
- **ChangeHistoryTab**: Bổ sung nhãn tiếng Việt "Người nghiệm thu thử việc" cho key `nguoi_nghiem_thu_thu_viec` để hiển thị tường minh khi so sánh lịch sử.
- **EmployeeDetailPage**: Nới lỏng hiển thị `ReviewerCard` cho cả Viewer (chế độ readonly) thay vì chỉ render khi có quyền `canEdit`.
- **ReviewerCard**: 
  - Tái cấu trúc giao diện hiển thị thành 2 phần độc lập: "Người Nghiệm Thu Thử Việc" và "Người Nghiệm Thu Chính Thức".
  - Phân quyền các hành động dựa trên vai trò: mục NNT chính thức (SA-only); mục NNT thử việc (SA hoặc EA cùng khối) gọi API Live Update và thông báo thành công tức thì.
- **PendingRoomPage**: Điều chỉnh nút Submit cho tài khoản non-SA (EA) để thực hiện submit trực tiếp luôn, bypass hoàn toàn wizard NNT chính thức (tránh lỗi 403 ở client).
- Files: `frontend/src/components/EmployeeForm.tsx`, `frontend/src/pages/Employees/components/ChangeHistoryTab.tsx`, `frontend/src/pages/Employees/EmployeeDetailPage.tsx`, `frontend/src/components/ReviewerCard.tsx`, `frontend/src/pages/PendingRoom/PendingRoomPage.tsx`.

## [2026-05-28] v5.7.1 - Tinh chỉnh định dạng Excel Xuất DS làm thưởng KD
- **Employee List Page (Export Excel)**:
    - Loại bỏ hoàn toàn định dạng `.toLocaleString('vi-VN')` (dấu chấm phân tách hàng nghìn) cho các cột tiền lương: **Lương Target**, **Lương cố định hợp đồng**, và **Thưởng doanh số**, đảm bảo dữ liệu xuất ra dạng số thô (`General` format trong Excel) để hỗ trợ tính toán dễ dàng.
    - Cập nhật các cột thông tin tổ chức (**Chức danh**, **BU**, **Phòng ban**, **Bộ phận**, **Nhóm/Team**, **Line nhân sự**): khi không có dữ liệu (rỗng/null/undefined), xuất ra ô trống (`""`) thay vì dấu gạch ngang (`-`).
- Files: `frontend/src/pages/Employees/EmployeeListPage.tsx`

## [2026-05-28] v5.7.0 - Gộp lịch sử thay đổi thông tin và lương thành một (merge-grouped-change-history)
- **Change History Tab**: Cấu trúc lại toàn bộ `ChangeHistoryTab` sang dạng bảng gom nhóm (Grouped Expandable Table) dựa trên thời gian, người thực hiện, lý do và tài liệu đính kèm, thay vì hiển thị dạng danh sách phẳng truyền thống.
- **UI/UX**: Cải tiến giao diện bảng gom nhóm: Thay thế icon `+` mặc định của Ant Design bằng icon Chevron xanh hiện đại để báo hiệu trạng thái đóng/mở trực quan hơn.

## [2026-05-26] v5.6.0 - Xuất danh sách làm thưởng KD (kèm lương)
- **Employee List Page / Dropdown**:
    - Nâng cấp nút "Xuất Excel" thành Dropdown Menu. Thêm tùy chọn **"Xuất DS làm thưởng KD"** hiển thị có điều kiện (chỉ dành cho tài khoản có quyền EA hoặc SA).
    - Kết nối menu với API `/salaries/export-probation` thông qua hàm `getProbationSalariesForExport` tại client layer.
    - Sửa đổi định dạng file Excel xuất ra: Làm sạch dữ liệu, loại bỏ hoàn toàn các dòng trống (watermark) từ dòng 1 đến 6 và cột trống A đến C ở sheet dữ liệu chính, bắt đầu dữ liệu trực tiếp từ ô A1 để người dùng dễ thao tác và khớp công thức. Chuyển toàn bộ thông tin metadata watermark bảo mật ẩn sang sheet phụ riêng biệt (`Metadata`).
- Files: `frontend/src/pages/Employees/EmployeeListPage.tsx`, `frontend/src/utils/exportExcel.ts`, `frontend/src/services/salaryService.ts`

## [2026-05-25] v5.5.1 - Sửa lỗi Autocomplete Người bị thay thế
- **Employee Autocomplete**:
    - Khắc phục lỗi hiển thị trống kết quả gợi ý khi gõ tìm kiếm "Người bị thay thế" trong Modal Sửa hồ sơ.
    - Sửa lỗi unwrapping kép dữ liệu (`res.data` -> `res`) do `apiClient` đã tự động bóc tách payload `{ data: T }` từ trước.
    - Bổ dung log lỗi chi tiết ra console (`console.error`) trong khối catch của API autocomplete để thuận tiện cho việc theo dõi lỗi sau này.
- Files: `frontend/src/components/EmployeeForm.tsx`, `frontend/src/pages/Employees/EmployeeDetailPage.tsx`

## [2026-05-25] v5.5.0 - Thêm Cột Bộ Phận và Tối Ưu Hiển Thị Phòng Chờ
- **Employee Table**:
    - Thêm cột **"Bộ phận"** (`bo_phan`) hiển thị có điều kiện khi ở chế độ phòng chờ (`state_phong_cho === true`), đứng trước cột Email.
    - Hiển thị giá trị Bộ phận chờ duyệt (`pending_bo_phan`) kèm đường kẻ đứt màu vàng và Tooltip *"Chờ duyệt (Hiện tại: [Bộ phận cũ])"* nếu có thay đổi chờ duyệt; hiển thị Bộ phận hiện tại nếu không thay đổi.
    - Chuyển toàn bộ các tag trạng thái (`NEW`, `ĐGTV`) và các icon tài liệu (`PDF`, `Info`, `Dollar`) từ cột Hành động sang hiển thị inline ngay bên cạnh **Họ và tên**, giúp cột Hành động gọn gàng.
    - Áp dụng bộ lọc `ellipsis` thông minh trên các cột: Họ tên, Người nghiệm thu, Khối, Line nhân sự, Bộ phận, Email.
    - Thu nhỏ khoảng đệm (padding) và font-size (13px) của bảng thông qua `ConfigProvider` khi ở phòng chờ để tối ưu không gian hiển thị.
    - Tinh chỉnh chính xác độ rộng (`width`) của các cột và chốt thông số `scroll.x` cố định (`1355px` cho phòng chờ, `1135px` cho trang thường) để tránh vỡ layout và kích hoạt đúng cơ chế cuộn ngang an toàn.
- **Pending Room Page**:
    - Thiết kế lại các nút **"submit" Hồ Sơ**: Chuyển chữ về dạng viết thường, thu nhỏ kích thước chữ (12px) và khoảng đệm (padding: 0 6px), đồng thời gỡ bỏ hoàn toàn icon chữ "V" (`CheckCircleOutlined`) để tránh chiếm diện tích chiều ngang.
    - Dọn dẹp sạch sẽ các import dư thừa (`useMemo`, `Breadcrumb`, `Tag`, `CheckCircleOutlined`, `FilePdfOutlined`, `Link`, `canViewSalary`, `Title`) để loại bỏ cảnh báo ESLint.
- Files: `frontend/src/components/EmployeeTable.tsx`, `frontend/src/pages/PendingRoom/PendingRoomPage.tsx`

## [2026-05-25] v5.4.0 - Gợi ý Người nghiệm thu (NNT) v2 & Fix lỗi UI phòng chờ
- **Pending Room Page**:
    - Tối ưu hóa nút "Submit": Nếu nhân sự đã được gán NNT hoặc đã được đánh dấu bypass NNT (`khong_co_nnt`), hệ thống sẽ trực tiếp gọi API submit duyệt nhân sự thay vì luôn tự động mở ra Modal gợi ý NNT.
    - Sửa cảnh báo `message` bị deprecate của component `Alert` trong Ant Design sang prop `title`.
- **ReviewerCard**:
    - Sửa lỗi click "Cập nhật theo gợi ý" trong Alert Mismatch bị sai lệch thông tin do truyền nhầm `MouseEvent` của React. Bọc toàn bộ các hàm gọi `handleSuggest` bằng arrow function tường minh: `onClick={() => handleSuggest(false)}` (gợi ý thường) và `onClick={() => handleSuggest(true)}` (cập nhật theo gợi ý mới).
- **Probation Evaluation Modal**:
    - Khắc phục lỗi crash trang chi tiết khi mở modal Đánh giá thử việc. Tránh việc gộp đè trực tiếp raw string từ API đè lên đối tượng `dayjs` (`ngay_dieu_chinh_luong`). Trích xuất và parse dayjs tường minh.
- Files: `frontend/src/pages/PendingRoom/PendingRoomPage.tsx`, `frontend/src/components/ReviewerCard.tsx`, `frontend/src/components/ProbationEvaluationModal.tsx`

## [2026-05-19] v5.3.0 - Cảnh báo tài liệu, Cảnh báo ngày trùng & Fix lag tìm kiếm (salary-ux-fixes)
- **SalaryEditModal**:
    - Chuyển cơ chế bắt buộc upload tài liệu cứng nhắc sang **Cảnh báo tổng hợp** (1 dialog duy nhất) trước khi lưu.
    - Bổ sung logic so sánh và cảnh báo khi **Ngày điều chỉnh mới trùng với ngày điều chỉnh hiện tại**.
    - Thêm cơ chế **chống double-submit** sử dụng `isConfirming` state, `isConfirmingRef` và khối `try/finally` bao trùm.
    - Sửa lỗi nghiêm trọng gửi `tempUuid` rỗng lên backend gây lỗi 400 Bad Request khi người dùng chọn lưu không tài liệu (chỉ gửi `tempUuid` khi thực sự tải lên thành công).
    - Cập nhật contract đầu tệp tin.
- **SalaryListPage**:
    - Tách thanh tìm kiếm `<Input.Search>` nội tuyến sang component dùng chung `<EmployeeSearchBar>`, giúp cô lập re-render và giải quyết triệt để tình trạng giật lag bảng lương khi gõ ký tự.
    - Bọc hàm `handleSearch` trong `useCallback` để tối ưu hóa render.
- **EmployeeSearchBar (Shared)**:
    - Bổ sung `useEffect` đồng bộ `defaultValue` với state `inputValue` để sửa lỗi mất đồng bộ ô tìm kiếm khi bấm Back/Forward trình duyệt hoặc bấm nút Tải lại.
    - Hỗ trợ prop `placeholder?: string` tùy biến hiển thị.

## [2026-05-18] v5.2.0 - Scoped RPC for NNT Filter (Bypass 414 URL-too-long)
- **Pending Room Page**:
    - Bổ sung cột **"Người nghiệm thu"** (NNT) vào bảng Phòng chờ, hiển thị trực quan phía trước cột "Line nhân sự". Ẩn cột BU tại màn hình này.
    - Tích hợp bộ lọc **Dropdown Multi-select** cho NNT, tự động gọi API lấy danh sách unique NNT khả dụng dựa trên phân quyền của user.
    - Đồng bộ hóa trạng thái bộ lọc NNT với URL Search Params, đảm bảo giữ nguyên trạng thái lọc khi reload trang.
    - Sửa lỗi cảnh báo `react-hooks/exhaustive-deps` bằng cách tối ưu hóa `useCallback` dependencies.
- **Employee Table / List Page**:
    - Đảm bảo cột NNT chỉ hiển thị tại Phòng Chờ, giao diện Danh sách nhân sự chính vẫn giữ nguyên cột BU và ẩn cột NNT để tránh phân tán thông tin.
- Files: `frontend/src/components/EmployeeTable.tsx`, `frontend/src/hooks/useEmployees.ts`

## [2026-05-13]
- **Employee Detail Modernization**:
    - Chuyển đổi toàn diện giao diện Chi tiết nhân sự sang phong cách **Card-in-Card** hiện đại.
    - Component hóa thông tin bằng `InfoItem` kèm Icon trực quan, tăng khả năng quét thông tin nhanh.
    - Thiết kế lại section Tiền lương: Sử dụng danh sách SaaS-style, đổ bóng nhẹ, làm nổi bật "Tổng thu nhập" bằng đường kẻ tinh tế thay cho màu nền cũ.
    - Đồng bộ màu sắc trung tính cho thông tin hiện tại (Cá nhân, Tổ chức, Lương hiện tại) và giữ màu cảnh báo vàng cho Lương chờ duyệt.
- **Table UX Optimization**:
    - **Minimalist Actions**: Rút gọn cột "Hành động" thành "Act.", gỡ bỏ icon Xem (Mắt) để tối giản, hỗ trợ click trực tiếp vào Mã nhân sự để xem chi tiết.
    - **Header Alignment**: Căn giữa toàn bộ tiêu đề cột tại bảng Nhân sự và bảng Phòng chờ.
    - **Multi-select Filter**: Hỗ trợ lọc đa chọn (multi-select) cho trường "Khối" tại màn hình Danh sách nhân sự.
- **Main Layout**: Đồng bộ chiều cao Header và Sidebar (64px) để đạt độ căn chỉnh pixel-perfect.
- **Mobile Optimization**: Tối ưu padding `4px` cho `PageContent` và ẩn Breadcrumb trên thiết bị di động.
- **Shared**: Cập nhật danh mục Khối hợp lệ, bổ sung khối **'Support'**.
- **Fix (Pending Room)**: Sửa lỗi mất nút **"Cập nhật hồ sơ"** đối với nhân sự mới (Onboarding) có thay đổi lương. Đảm bảo nút này luôn hiển thị cho bản ghi mới (`isNewHire`) để HR có thể hoàn thiện thông tin trước khi duyệt.

## [2026-05-13] v5.1.0 - Admin Cleanup Dashboard UI
- **Admin Cleanup Dashboard**:
    - Triển khai tab **"DỌN DẸP"** (`CleanupTab.tsx`) trong trang Quản trị, dành riêng cho Super Admin.
    - **Filtering**: Hỗ trợ lọc nhanh nhân sự theo 4 danh mục: Tất cả, MOCK, Onboard Test, Mã TMP.
    - **Bulk Actions**: 
        - Cho phép chọn nhiều nhân sự và thực hiện xóa vĩnh viễn (Hard Delete) đồng thời.
        - Tích hợp Modal xác nhận bảo mật: Yêu cầu người dùng nhập chính xác chuỗi `"XÓA VĨNH VIỄN"` để kích hoạt nút xóa.
    - **Feedback**: Hiển thị thông báo kết quả chi tiết, bao gồm số lượng bản ghi đã xóa thành công và các mã lỗi nếu có.
- **Fix**: Sửa lỗi tham số truy vấn API trong `CleanupTab.tsx` bằng cách sử dụng `URLSearchParams`, đảm bảo đồng bộ dữ liệu chính xác giữa Frontend và Backend.

## [2026-05-13] v5.0.0 - Probation Evaluation UI & Verification
- **Probation Evaluation**:
    - Triển khai `ProbationEvaluationModal`: Form chuyên dụng cho Đánh giá thử việc (Đạt/Nghỉ việc), hỗ trợ upload và bắt buộc đính kèm giấy tờ minh chứng.
    - UX: Tự động reset `tempUuid` và trạng thái file mỗi khi mở modal để đảm bảo isolation dữ liệu giữa các lần đánh giá.
    - Fix: Giải quyết triệt để lỗi ESLint `react-hooks/set-state-in-effect` bằng cách tách biệt logic reset state.
- **Pending Room**:
    - **UI**: Bổ sung Tag **"ĐGTV"** (màu purple) cho các bản ghi sinh ra từ luồng Đánh giá thử việc.
    - **UI**: Hiển thị icon **PDF** 📄 kèm tooltip khi rê chuột vào hàng nhân sự có gắn `is_probation_eval`, cho phép nhận diện nhanh các bản ghi có tài liệu đính kèm.
- **Stability**: Đảm bảo tương thích layout trên Mobile cho các Tag và Icon mới thêm vào bảng Phòng chờ.

## [2026-05-07]
### feat(employee): hoàn thiện hiển thị lương hiện tại trong chi tiết nhân sự (show-salary-in-employee-info)
- **UI**: Thêm thẻ "Thông tin tiền lương hiện tại" sử dụng Ant Design Descriptions để hiển thị rõ các nhóm trường lương (Giấy tờ vs Cơ chế).
- **UI/UX**: Xây dựng bảng Matrix 7 cột cho "Chi tiết cơ chế lương (M1-M3)", hỗ trợ tính toán động (Target dự kiến, TTN dự kiến, tỷ trọng %) với nút On/Off để ẩn hiện linh hoạt.
- **Responsive**: Hỗ trợ tự động chuyển từ giao diện bảng (table) sang dạng lưới (grid) khi xem trên thiết bị di động.
- **Security**: Tích hợp chặt chẽ với cơ chế phân quyền (role VI không được phép xem section này).

### perf(search): tối ưu hiệu năng danh sách nhân sự và chống giật lag
- **UI**: Tách component `EmployeeSearchBar` riêng biệt để quản lý state input tìm kiếm cục bộ, loại bỏ việc re-render toàn bộ bảng nhân sự ở mỗi ký tự người dùng gõ phím.
- **Performance**: Bọc `EmployeeTable` và các cột bằng `React.memo` / `useMemo`, đồng thời bọc các hàm truyền xuống (`renderActions`, `openNntWizard`) trong `useCallback` tại `EmployeeListPage` và `PendingRoomPage`. Giải quyết dứt điểm hiện tượng giật lag UI khi tìm kiếm.

### [2026-05-07] v4.7.0 - Transfer UI & Reviewer Mismatch Alert
- **ReviewerCard**: Thêm cảnh báo "Reviewer Mismatch" khi phát hiện thay đổi tổ chức chờ duyệt không khớp với NNT hiện tại. Thêm nút "Cập nhật theo gợi ý".
- **EmployeeEditPage**: Triển khai logic lưu song song (Dual-save) cho cả Hồ sơ và Lương khi ở chế độ `transfer`.
- **EmployeeForm**: Hỗ trợ `mode="transfer"` với giao diện tối ưu cho điều chuyển (highlight Org/Salary cards).
- **Bug Fix**: Sửa lỗi cú pháp JSX tại `PendingRoomPage` làm hỏng render menu Dropdown.

### [2026-05-07] v4.6.0 - Reject Pending UI
- Thêm tính năng **"Hủy thay đổi"** trong Phòng chờ:
    - Bổ sung lựa chọn vào menu thao tác cho nhân sự cũ (Existing Employee).
    - Modal xác nhận hiển thị tóm tắt các thay đổi sẽ bị hủy bỏ và trạng thái khôi phục.
    - Hook `useRejectEmployeePending` tích hợp React Query để tự động làm mới danh sách.
- Cải tiến nút **"Xóa vĩnh viễn"**:
    - Hiển thị cho cả EA và SA đối với mọi bản ghi trong phòng chờ.
    - Tăng cường cảnh báo (Alert) màu đỏ trong Modal xác nhận đối với nhân sự cũ để phân biệt rõ giữa "Hủy sửa" và "Xóa người".


## [2026-05-06]
### Added
- Thêm tab "Lịch sử" trong trang Chi tiết nhân sự:
    - Hiển thị đầy đủ lịch sử thay đổi thông tin hồ sơ và lương.
    - Hỗ trợ lọc theo danh mục (Hồ sơ / Lương / Tất cả).
    - Tích hợp icon 📄 cho phép xem và tải xuống giấy tờ đính kèm trực tiếp từ lịch sử (Phase 2.B).
- Tích hợp logic tải file an toàn (presigned URL) từ Cloudflare R2 cho tài liệu lịch sử.
- Thêm DatePicker "Ngày điều chỉnh" trong SalaryEditModal và hiển thị đồng bộ tại EmployeeDetailPage (Quản lý & Ngày tháng).
- Tái cấu trúc hiển thị Cơ chế lương (M1-M3) dạng Lưới (Grid):
    - Nhóm các chỉ số theo loại thưởng (KPI, OKR, Doanh số, v.v.).
    - Tự động chuyển đổi giữa dạng Bảng (Desktop) và dạng Lưới (Mobile) để tối ưu trải nghiệm người dùng.

### Fixed
- Sửa lỗi vỡ giao diện (chữ hiển thị dọc) tại tab Lịch sử trên Mobile bằng cách hỗ trợ flex-wrap và căn chỉnh lại header.
- Cập nhật component `Card` tuân thủ chuẩn Ant Design v6: thay thế các prop deprecated (`bordered={false}` -> `variant="borderless"`, `bodyStyle` -> `styles.body`) tại tab Lịch sử để xóa bỏ cảnh báo trong console.
- Sửa lỗi `ReferenceError: ArrowLeftOutlined is not defined` tại `MainLayout.tsx` gây crash trang chi tiết nhân sự do thiếu import icon.

## [2026-05-05]
### fix(ocr): chặn định dạng PDF vì giới hạn của AI provider
- **UI**: Đổi nhãn nút chọn file thành "Chọn file (Ảnh)" và loại bỏ định dạng `.pdf` khỏi bộ lọc `accept` tại `DocumentUpload.tsx`, để chặn người dùng tải lên PDF khi sử dụng tính năng AI Đọc Giấy Tờ.

## [2026-05-04] - Salary Formula Enforcement & KN M1 Checkbox
### Added
- Thêm checkbox "Target (CC) bao gồm KN M1" vào `SalaryEditModal`.
- Tích hợp logic validation công thức lương tập trung từ `@vcc/shared`.
- Hiển thị thông báo cảnh báo chi tiết (Warning) kèm độ chênh lệch (delta) khi sai công thức trong Modal sửa lương.
- Hiển thị tooltip liệt kê chi tiết các lỗi công thức tại nút Submit trong Phòng chờ.

### Changed
- Cập nhật hàm `handleSaveModal` để chặn lưu dữ liệu nháp nếu không khớp công thức.
- Cập nhật hàm `checkSubmitReadiness` trong `PendingRoomPage` để chặn duyệt hồ sơ nếu lương chưa nhất quán.
- [Verify] Đã xác minh tính nhất quán dữ liệu (Data Persistence) cho checkbox khi edit nhiều lần và mapping thành công khi duyệt hồ sơ.

## [2026-05-04]
### feat(hrm): hoàn thiện luồng điều chỉnh lương và tối ưu giao diện phòng chờ
- **AI OCR**: Tích hợp tự động điền 30 tham số lương từ tài liệu minh chứng (FR-01, FR-04).
- **Upload**: Tích hợp quản lý tài liệu minh chứng điều chỉnh lương (`dieu_chinh_luong`).
- **UX/UI**: Tái cấu trúc logic nhận diện nhân sự phòng chờ (New Hire [NEW], Info, Salary icons).
- **Refactor**: Tập trung logic phân loại vào Utilities dùng chung (`employeeUtils.ts`).
- **Form**: Tổ chức lại 30 trường dữ liệu lương trong modal theo 4 nhóm logic: Thông tin chung, Giấy tờ, Cơ chế - Base, Thưởng.
- **Sync**: Đồng bộ giao diện icons và tooltips giữa `EmployeeTable` và `PendingRoomPage`.

## [2026-04-24]
### feat(employee): chuẩn hoá select Người Bị Thay Thế bằng mã NS qua Autocomplete và AI OCR mapping (nguoi-bi-thay-the-autocomplete)
- **UI**: Thay thế `<Input>` bằng `<Select showSearch>` (Autocomplete) tại trường `nguoi_bi_thay_the` trong `EmployeeForm.tsx`. Hỗ trợ debounce search.
- **UI**: Tại `EmployeeDetailPage.tsx`, thêm logic lazy fetch để phiên dịch `mã` sang định dạng hiển thị `Mã — Họ Tên`. Có tính năng fallback giữ nguyên mã nếu API lỗi mạng / chặn phân quyền.
- **AI OCR**: Cập nhật hàm `handleFillFields` tự động resolve tên nhân viên đọc từ giấy tờ, map sang đúng `mã` trong DB nếu khớp duy nhất (1 match).

## [2026-04-23]
### feat(admin): cải tiến UI Preview Import và hỗ trợ thông tin liên hệ phụ
- **UI**: Thêm tính năng Lọc (Filter) và Sắp xếp (Sort) cho cột "Trạng thái" trong bảng Preview (`ExcelImportTab.tsx`). Giúp Admin dễ dàng tìm và xử lý các dòng lỗi trước khi Import.
- **Template**: Bổ sung cột "Ghi chú" vào file mẫu Excel. Cho phép HR lưu trữ các thông tin liên hệ phụ (SĐT thứ 2, Email phụ, ghi chú liên lạc) một cách linh hoạt mà không vi phạm quy tắc validation của cột chính.

## [2026-04-22]
### feat(admin): triển khai UI Excel Import cho di cư dữ liệu hàng loạt (admin-excel-import)
- **Tab**: Thêm tab "Import Excel" vào Admin Dashboard (`ExcelImportTab.tsx`).
- **UI**: Tích hợp component `Dragger` hỗ trợ kéo thả file, tự động parse và hiển thị Preview ngay lập tức.
- **UI/UX**: Thiết kế bảng Preview dữ liệu phân trang, hỗ trợ hiển thị lỗi (Validation) trực tiếp trên từng ô dữ liệu.
- **Logic**: Tích hợp nút "Xác nhận Import" thực hiện commit atomic, hiển thị kết quả thống kê (Thành công/Bỏ qua/Lỗi) sau khi hoàn tất.
- **Template**: Bổ sung liên kết tải File mẫu Excel định dạng chuẩn (`.xlsx`) đã được cấu hình sẵn các Enums hợp lệ.
- **Fix**: Áp dụng cơ chế Cache-busting (`?v=timestamp`) cho đường dẫn tải template để tránh lỗi tải file cũ/broken từ browser cache.
- **Refactor**: Đồng bộ Ant Design components lên version mới (`styles` prop thay cho `valueStyle` deprecated).

### feat(ocr): cập nhật hiển thị AI đọc Người bị thay thế và ẩn mục email
- **UI**: Thêm nhãn "Người bị thay thế" (`nguoi_bi_thay_the`) vào phần hiển thị kết quả AI đọc trong `DocumentUpload.tsx`.
- **UI**: Gỡ bỏ trường Email khỏi bảng kết quả hiển thị của AI OCR.
- **Logic**: Đảm bảo key `nguoi_bi_thay_the` được fill chính xác vào trường tương ứng trên `EmployeeForm.tsx` khi người dùng nhấn "Tự điền".

## [2026-04-17]
### feat(onboard): form Cơ cấu thu nhập và AI OCR nâng cao (ea-personnel-salary-integration)
- **Form**: Bổ sung section "Thông tin lương" vào `EmployeeForm.tsx` (chỉ hiển thị cho EA/SA) gồm 2 nhóm: Lương HĐLĐ và Cơ chế nội bộ.
- **AI OCR**: Nâng cấp `DocumentUpload.tsx` trích xuất 36 trường dữ liệu từ giấy tờ nhân sự. Tự động fill vào form fields theo bảng Matching. Chủ động xoá trường `khoi` khỏi dữ liệu trích xuất để đảm bảo người dùng chọn thủ công, tránh sai lệch.
- **Logic**: Tự động tính `ty_le_luong_tv` = LCD Thử việc / LCD HĐLĐ × 100 (client-side).
- **Logic**: Cơ chế fallback — nếu toàn bộ mục Nội bộ từ OCR trống, tự động copy bộ HĐLĐ sang bộ Cơ chế trên form.
- **Hook**: Thêm `useCreateEmployeeOnboard()` trong `useEmployees.ts` typed bằng `CreateEmployeeOnboardInput`, gọi `POST /api/employees/onboard`.
- **Page**: `EmployeeCreatePage.tsx` reshape values thành `{ personnel, salary, temp_uuid }` trước khi gọi hook onboard. Nếu không có salary thì giữ hook cũ.
- **Page**: `EmployeeDetailPage.tsx` hiển thị 5 cột lương mới trong section chi tiết, chuẩn hóa alignment UI.
- **UI**: `PendingRoomPage.tsx` thêm guard render tag "Lương" chỉ hiện khi user role có quyền xem lương.
- **Fix**: Loại bỏ "Tạm ứng" khỏi AI OCR prompt & UI kết quả. Khử warning deprecated `bodyStyle` antd Card. Xử lý email validation `null`.

## [2026-04-14]
### feat(ui): tối ưu giao diện mobile-responsive và camera tải tài liệu
- **UI/UX**: Gỡ thiết lập `fixed` columns và thay đổi cấu hình `xs` trong các bảng (`EmployeeTable`, `SalaryListPage`, `BulkReviewerOps`) để hỗ trợ cuộn ngang mượt mà trên điện thoại.
- **UI/UX**: Thiết kế lại `SalaryEditModal` và `PendingRoomPage` tương thích layout lưới thu nhỏ, tận dụng tối đa không gian màn hình hẹp.
- **Logic**: Tái thiết kế toàn diện component `DocumentUpload`:
  + Hỗ trợ nút chụp ảnh bằng Native Camera (`capture="environment"`) và nút chọn File riêng biệt.
  + Tích hợp nén ảnh client-side (tối đa 2MB, 1920px) trước khi tải lên Cloudflare R2 để tối ưu băng thông mobile.
  + Sửa lỗi race condition gây treo loading khi unmount component trong lúc upload.


## [2026-04-13]
### fix(document): cho phép hiển thị ảnh preview và đồng bộ payload draft upload
- **Infra**: Thêm `blob:` vào CSP `img-src` trong `nginx.conf` để hỗ trợ Ant Design hiển thị thumbnail preview sau khi người dùng chọn file.
- **Logic**: Cập nhật `DocumentUpload.tsx` gửi kèm `document_type: 'tuyen_moi'` khi xin Presigned URL, giúp backend nhận diện luồng draft upload không cần khối.

## [2026-04-10]
### fix: cho phép nhập email tùy chọn khi gán quyền
- **UI**: Chuyển đổi `Select` thành `AutoComplete` tại Admin Dashboard > Quản lý Quyền User (`PermissionManagement.tsx`), cho phép gán quyền cho email mới (chưa từng đăng nhập) bên cạnh việc chọn từ danh sách có sẵn.

## [Phase 5] Production Polish, Demo & Go-live (2026-04-08)
### feat: DevOps CI/CD và Performance Polish
- **DevOps**: Cấu hình `deploy-fe.yml` kết nối GitHub Actions với Cloud Run. Set limit quota an toàn (256Mi RAM, Max 3 Instances).
- **Docs**: Biên soạn `USER_MANUAL.md` hoàn chỉnh phục vụ bộ phận Nhân Sự (HR) test nghiệm thu.
- **Docs**: Soạn thảo `UAT_CHECKLIST.md` gồm 39 kịch bản Edge Case thực tế.

## [Phase 3] NS-002: Salary Management UI (2026-04-07)
### Added
- Trang Quản lý Lương (`SalaryListPage.tsx`): Table editable, pagination, server-side search/filter.
- Modal Điều chỉnh Lương (`SalaryEditModal.tsx`): 25 fields lương, upload chứng từ.
- Export Excel Salary: Tích hợp watermark và rate limit.
- Hook `useSalaryQueries`: Query list/detail, mutation update salary.
### Changed
- `PendingRoomPage.tsx`: Hiển thị tags "Hồ sơ" và "Lương" dựa trên boolean flags mới.
- `EmployeeDetailPage.tsx`: Permission-aware salary fetch (gate bằng `can_view_salary_detail`).
- `ProtectedRoute.tsx` & `MainLayout.tsx`: Mở route `/salaries` cho vai trò Reviewer.

## [Phase 2] NS-004: Admin & Permission UI (2026-04-04)
## [2026-04-07]
### feat: rà soát Admin Dashboard, thêm filter Mismatch và cải thiện error handling (Phase 4A)
- **Reviewers**: Bổ sung bộ lọc "Chỉ hiện Mismatch" (Checkbox) giúp Admin lọc nhanh các gán quyền thiếu hụt.
- **Components**: Sửa lỗi Deprecation cho `Alert` component (chuyển `message` -> `title`).
- **Hooks**: Cập nhật `useAdmin.ts` bổ sung xử lý `onError` cho toàn bộ mutations (Permissions, SuperAdmins, Reviewers) để hiển thị thông báo lỗi Toast đỏ thay vì để mặc định.
- **UX**: Cải thiện Error Boundary bằng cách log chi tiết lỗi API gán quyền ra console phục vụ debug.

## [2026-04-07]
### feat: module Quản lý Lương và tái cấu trúc UI Phòng chờ (salary-pending-isolation)
- **Pages**: Hoàn thiện màn hình `SalaryListPage` và `SalaryEditModal` hỗ trợ xem/sửa lương tập trung.
- **UI**: Tái cấu trúc `PendingRoomPage` — hiển thị tag "Hồ sơ" và "Lương" dựa trên cờ boolean từ backend, loại bỏ logic parse JSON rủi ro tại client.
- **UI**: Cập nhật `EmployeeDetailPage` hỗ trợ fetch động dữ liệu lương chờ duyệt từ endpoint riêng biệt. Áp dụng Permission Gating để ẩn/hiện thông tin lương dựa trên quyền hạn record-level.
- **Fix**: Sửa lỗi CSS gập chữ dọc tại tiêu đề trang chi tiết nhân sự trên màn hình hẹp. Sửa cảnh báo Deprecation của Ant Design (`Spin` component).

## [2026-04-06]
### feat: nâng cấp UX Quản lý Lương (chặn sửa lương NS nghỉ việc và bộ lọc đa trạng thái)
- **UI**: Thêm bộ lọc đa lựa chọn (multi-select) cho Trạng thái lương tại `SalaryListPage`. Mặc định ẩn nhân viên "Nghỉ việc".
- **UI**: Thay thế tham số `destroyOnClose` của Modal thành `destroyOnHidden` để sửa lỗi cảnh báo Deprecation của Ant Design trong Console.
- **Security**: Triển khai khóa giao diện Sửa lương đối với nhân sự đã "Nghỉ việc". Nút chỉnh sửa sẽ chỉ hiển thị cho Super Admin (EA và Reviewer bị ẩn đi).


## [2026-04-05]
### feat: nâng cấp Submit UX, OCR Blink và Modal Suggest NNT (pending-room-audit-fixes)
- **UX/UI**: Triển khai hiệu ứng nháy nền vàng (blinking) cho các field do AI OCR tự động trích xuất.
- **UX/UI**: Cải thiện thuật toán bắt trạng thái nút Submit phòng chờ (Readiness trigger), loại bỏ validation rác.
- **Components**: Bổ sung `ReviewerModal` kết nối NNT Suggestion Service, cho phép EA set NNT hoặc click "Không có NNT" để bypass phòng chờ.
- **Pages**: Thêm Tab "Phụ trách khối" trên Admin Dashboard phục vụ map thông tin quản lý đổ Telegram alert.

### feat: bổ sung luồng xóa vĩnh viễn (hard delete)
- **UI**: Tích hợp nút "Xóa vĩnh viễn" hiển thị dành riêng cho Superadmin tại màn hình `PendingRoomPage` và `EmployeeDetailPage`.
- **Logic**: Triển khai `useHardDeleteEmployee` từ React Query để gọi API quy quét sạch dữ liệu thực.
- **Fix**: Sửa lỗi Typescript (nhận diện thiếu `.code`, `.status`) trong lúc ép kiểu Error tại các khối Try/Catch bắt API của Form thao tác nhân sự.

## [2026-04-01]

### feat: tích hợp Upload giấy tờ và AI OCR (Phase E)
- **UI**: Triển khai `DocumentUpload` component sử dụng Ant Design Dragger, hỗ trợ upload thẳng lên R2 via Cloudflare CORS.
- **AI**: Tích hợp nút "AI Đọc Giấy Tờ" và "Tự điền" thông tin bóc tách được trực tiếp vào `EmployeeForm`.
- **UX**: Khắc phục các cảnh báo Static message của Ant Design bằng `App.useApp` context.
- **Validation**: Chặn nút Submit tạo nhân sự khi chưa upload đủ giấy tờ bắt buộc.
- **Form**: Tự động sinh và quản lý `temp_uuid` cho mỗi phiên tạo mới nhân sự.

### fix: áp dụng Data Isolation trên Form và Detail
- **UI**: Bổ sung hiển thị trường `tam_ung_hang_thang` tại màn hình chi tiết nhân sự (chế độ chỉ xem).
- **Security**: Loại bỏ trường `tam_ung_hang_thang` khỏi Form Thêm mới và Sửa nhân sự. Dữ liệu này được chuyển sang luồng Quản lý Lương riêng biệt để tăng cường bảo mật.
- **UX**: Triển khai Email Autocomplete (Select searchable) cho tất cả các tab Admin.
- **Performance**: Chuyển đổi từ Remote Search sang Local Filter (tải 1 lần ~4000 records) giúp trải nghiệm mượt mà, không giật lag.
- **UX**: Thêm Search Box cho các bảng `user_permissions`, `superadmins`, `employee_reviewers` để lọc nhanh dữ liệu.
- **Fix**: Sửa lỗi cảnh báo `useForm` không kết nối bằng cách chuyển logic reset form vào `useEffect` dựa trên `isModalOpen`.
- **Security**: Củng cố `ProtectedRoute.tsx` để bảo vệ toàn bộ `/admin/*` (không chỉ permissions).
- **Admin**: Sửa lỗi `BulkReviewerOps.tsx` bị chặn validate `target_email` khi gỡ quyền (Email rỗng).
- **Hooks**: Cập nhật `useBulkPreview` cho phép preview khi target rỗng.
- Files: `frontend/src/pages/Employees/EmployeeDetailPage.tsx`, `frontend/src/components/EmployeeForm.tsx`, `frontend/src/components/DocumentUpload.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/pages/Admin/tabs/BulkReviewerOps.tsx`.

## [2026-03-31]
### feat: hoàn thiện phase D
- **UI**: Triển khai `EmployeeDetailPage` hiển thị đầy đủ 25 trường thông tin nhân sự, chia section theo Descriptions chuẩn.
- **UI**: Tích hợp luồng Chuyển trạng thái (State Transition) với UI Modal, yêu cầu nhập lý do và ngày tháng cho Nghỉ sinh/Nghỉ việc.
- **Excel**: Nâng cấp công cụ Export Excel hỗ trợ Metadata ẩn (Sheet Metadata) và Watermark thông tin người xuất chuẩn bảo mật.
- **UX**: Giải quyết triệt để các cảnh báo Deprecation của Ant Design (Breadcrumb, Space, message) trong console.
- **Bug**: Sửa lỗi gọi sai ID (`.id` thay vì `ma_nhan_su`) gây lỗi 404 khi Đưa lại phòng chờ hoặc Xóa nhân sự.
- Files: `frontend/src/pages/Employees/EmployeeDetailPage.tsx`, `frontend/src/utils/exportExcel.ts`, `frontend/src/pages/Employees/EmployeeListPage.tsx`.

### feat: hỗ trợ tạm ứng hàng tháng và khu vực enum
- **UI**: Thay đổi trường `khu_vuc` từ Input sang `Select` với các giá trị 'HN', 'HCM' để đảm bảo tính nhất quán dữ liệu.
- **UI**: Thêm trường `tam_ung_hang_thang` vào form với định dạng `InputNumber` và format tiền tệ.
- **Validation**: Đồng bộ Zod schema để kiểm tra giới hạn 'HN'/'HCM' ngay tại frontend.
- Files: `frontend/src/components/EmployeeForm.tsx`.

### fix: chặn unmount form và tối ưu request phân quyền
- **UX**: Khắc phục lỗi hiển thị Loading Spinner che mất UI và làm mất dữ liệu nhập dở trong Form khi Supabase refresh session ngầm (Window Focus).
- **Performance**: Tối ưu `setSession` để chỉ gọi API nạp quyền (`refreshPermissions`) khi User ID thay đổi hoặc khi chưa có cache trên RAM, giảm tải cho Database.
- **Stability**: Đảm bảo cờ `isPermissionHydrated` không bị reset về `false` trong các lượt refresh nền để giữ ổn định cây DOM.

### feat: tối ưu UX luồng Phòng chờ và hiển thị Validation
- **UX**: Tự động hiển thị dấu sao đỏ (*) cho các trường bắt buộc trong Form Cập nhật bằng cách đồng bộ `updateEmployeeSchema` (không dùng `.partial()` ở tầng UI).
- **UX**: Sử dụng `App.useApp()` context cho toàn bộ thông báo Toast/Message (thay vì gọi hàm static), giải quyết cảnh báo console của Ant Design.
- **Validation**: Thư viện `shared` gỡ bỏ ràng buộc bắt buộc `line_nhan_su` khi submit phòng chờ để linh hoạt theo workflow thực tế.
- **Bug**: Sửa lỗi 404 sau khi cập nhật mã nhân sự thành công (navigate nhầm về ID cũ).
- **Validation**: Kích hoạt kiểm tra trùng lặp Email trên sự kiện `onBlur` ngay cả trong chế độ Edit.
- Files: `frontend/src/components/EmployeeForm.tsx`, `frontend/src/pages/PendingRoom/PendingRoomPage.tsx`, `frontend/src/pages/Employees/EmployeeEditPage.tsx`, `frontend/src/App.tsx`.

## [2026-03-26]

### fix: dọn dẹp file rác và sửa lỗi Lint/Typecheck
- **Refactor**: Xóa bỏ các tệp tin không còn sử dụng: `src/lib/api.ts` (thay bằng service layer), `src/stores/permissionStore.ts`, và các assets mặc định của Vite/React.
- **Security**: Hardening CSP bằng cách gỡ bỏ `'unsafe-inline'` khỏi `nginx.conf`.
- **Bug**: Sửa lỗi biến `show` khai báo nhưng không dùng trong `MainLayout.tsx`.
- **Bug**: Sửa lỗi Type `any` và xử lý lỗi trong block `catch` tại `Login.tsx`, `authStore.ts`, và `exportExcel.ts`.
- Files: `frontend/src/components/MainLayout.tsx`, `frontend/src/pages/Login.tsx`, `frontend/src/stores/authStore.ts`, `frontend/src/utils/exportExcel.ts`, `frontend/nginx.conf`.

---

*Cập nhật tự động bởi update-docs*
