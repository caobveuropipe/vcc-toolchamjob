# Feature Plan: Salary UX Fixes — Cảnh báo tài liệu, Cảnh báo ngày trùng & Fix lag tìm kiếm

> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã qua feature-review lần 1 (2026-05-19) và lần 2 (2026-05-19) — blocker FR-01, FR-02 giải quyết; FR-03 gộp 1 dialog; FR-05 frontend-only; Issue 1 (back/forward sync) chốt Option A useEffect; Issue 3 (isConfirming early-return) dùng try/finally
> **Feature slug**: `salary-ux-fixes`
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-05-19

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Màn hình Quản lý lương (`SalaryListPage` + `SalaryEditModal`) có 3 vấn đề UX cần khắc phục: (1) form đang chặn hoàn toàn việc Lưu vào phòng chờ khi người dùng chưa upload tài liệu — điều này quá cứng vì có trường hợp cố tình không cần tài liệu; (2) không có cơ chế cảnh báo khi người dùng bấm Lưu mà ngày điều chỉnh mới trùng với ngày điều chỉnh cũ — dễ nhầm lẫn nghiệp vụ; (3) nút tìm kiếm vẫn gây re-render toàn bộ table mỗi khi gõ ký tự, gây lag UI.
- **Vấn đề cần giải quyết:**
  1. Logic block upload tài liệu quá cứng → cần chuyển sang warn + confirm.
  2. Không có guard cho trường hợp ngày điều chỉnh trùng nhau → người dùng có thể bấm nhầm.
  3. `SalaryListPage` chưa áp dụng pattern `EmployeeSearchBar` đã được dùng ở `PendingRoomPage` và `EmployeeListPage` để cô lập re-render.
- **Mục tiêu:** Cải thiện UX/UXD của luồng điều chỉnh lương mà không thay đổi nghiệp vụ backend, không tạo thêm API, không đụng schema/DB.
- **Kết quả mong đợi:** Người dùng có thể lưu vào phòng chờ khi không có tài liệu (sau xác nhận), được cảnh báo khi ngày điều chỉnh trùng, và thanh tìm kiếm không gây giật lag.

---

## 2. Phạm vi

### In scope
- `SalaryEditModal.tsx`: Thêm 2 luồng confirm trước khi submit (thiếu tài liệu / ngày trùng).
- `SalaryListPage.tsx`: Tách `Input.Search` nội tuyến sang `EmployeeSearchBar` để cô lập re-render.
- `EmployeeSearchBar.tsx`: **(Bug fix — shared component)** Thêm `useEffect` sync `inputValue` khi `defaultValue` prop thay đổi (back/forward/reload). Fix này áp dụng cho tất cả màn hình đang dùng component: `PendingRoomPage`, `EmployeeListPage`, và `SalaryListPage` (sau khi migrate). Thêm prop `placeholder?: string`.

### Out of scope
- Không thay đổi backend API `salary.ts` hoặc `salaryService.ts`.
- Không thay đổi Zod schema hoặc DB.
- Không thêm tính năng upload tài liệu bắt buộc (chỉ cảnh báo).
- Không refactor logic nghiệp vụ khác trong `SalaryEditModal`.
- Không áp dụng fix này cho các modal khác ngoài màn hình Quản lý lương.

---

## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-05-07] perf(search)`: Đây chính là tiền lệ — đã tách `EmployeeSearchBar` riêng, bọc `React.memo`, dùng local state bên trong component để cô lập re-render. Fix #3 phải làm đúng pattern này.
  - `[2026-04-01] Validation`: Chặn submit khi thiếu tài liệu là đúng với flow onboarding, nhưng KB ghi rõ `[2026-04-13] Draft Upload Permission Exception` — cho phép upload trước khi có đầy đủ thông tin. Nhận thấy luồng `dieu_chinh_luong` hiện tại **không giống luồng onboarding** (onboarding bắt buộc, còn điều chỉnh lương chỉ nên khuyến cáo).
  - `[2026-05-07] Dual-payload Pending Save`: `temp_uuid` vẫn phải được truyền lên BE dù không có file, vì BE sẽ kiểm tra trong `submit_employee_pending` — cần đảm bảo không cắt `temp_uuid` khi cho phép lưu không có tài liệu.
  - `[2026-03-13] UI Architecture`: Ant Design v6 + Theme Tokens — dùng `App.useApp().modal` cho confirm dialog.

- **"Cấm kỵ" cần tránh:**
  - Không được bỏ `temp_uuid` khỏi payload ngay cả khi thiếu tài liệu — BE cần nó để bind sau.
  - Không được dùng `Modal.confirm` tĩnh (static API) — phải dùng `useApp().modal` theo chuẩn Ant Design v6 của dự án (tránh cảnh báo context thiếu `App` wrapper).
  - Không được viết inline style `Tailwind` — dự án dùng Ant Design v6 + CSS thuần.

- **Ràng buộc kiến trúc liên quan:**
  - `SalaryEditModal` đang lấy `temp_uuid` từ `React.useMemo` khi `open = true`. Snapshot ngày điều chỉnh cũ phải được capture tại cùng thời điểm `open`.
  - `EmployeeSearchBar` là shared component tại `frontend/src/components/` — không tạo mới, dùng lại.

---

## 4. Giả định và câu hỏi mở

### Giả định
- [G1] `temp_uuid` luôn được gửi trong payload kể cả khi không có tài liệu — BE không validate sự tồn tại của file tại bước `save_pending`, đây là behavior đã chốt từ `[2026-05-07] Dual-payload Pending Save`. Không cần backend audit marker riêng — đây là UX-confirmed exception theo WF-EMP-03 (upload giấy tờ "nếu có").
- [G2] **[Đã chốt bởi User 2026-05-19]** `EmployeeSearchBar` cần sửa bug back/forward bằng `useEffect(() => setInputValue(defaultValue), [defaultValue])` — Option A: fix trong shared component, áp dụng cho tất cả màn hình dùng component này. Không dùng `key={search}` (vá cục bộ, side-effect mất focus). Cũng thêm prop `placeholder?: string` khi sửa.
- [G3] **[Đã chốt bởi User 2026-05-19]** Khi cả 2 điều kiện (thiếu tài liệu + ngày trùng) cùng active, **gộp thành 1 dialog tổng hợp** thay vì 2 dialog tuần tự — giảm friction, 1 lần xác nhận cho cả 2 cảnh báo.
- [G4] Trường hợp cả `ngay_dieu_chinh_luong` cũ và mới đều `null`/rỗng thì không hiển thị cảnh báo ngày trùng.
- [G5] `DocumentUpload` đã gọi `onUploadSuccess(false)` tại 3 điểm: upload fail (L127), `handleRemove` (L137), và `onChange status=removed` (L214). Callback `onUploadSuccess` là `(isSuccess: boolean) => void` — implement trong `SalaryEditModal` phải assign `uploadedRef.current = isSuccess` để tự động track đúng mọi trạng thái.

### Câu hỏi mở
- ~~[Non-blocking] Thứ tự confirm~~ — **Đã chốt**: gộp 1 dialog.
- ~~[Non-blocking] Placeholder search bar~~ — **Đã chốt**: thêm prop `placeholder` vào `EmployeeSearchBar`, truyền `"Tìm theo mã NS, họ tên..."` từ `SalaryListPage`.

---

## 5. Acceptance Criteria

- [ ] AC-1: Khi bấm "Lưu vào phòng chờ" mà chưa upload tài liệu, hệ thống **không chặn ngay** mà hiển thị dialog xác nhận với cảnh báo rõ ràng. Người dùng bấm "Tôi hiểu, vẫn lưu" để tiếp tục, hoặc "Quay lại" để upload.
- [ ] AC-2: Khi bấm "Lưu vào phòng chờ" mà ngày điều chỉnh mới bằng ngày điều chỉnh cũ (snapshot tại thời điểm mở modal), hệ thống hiển thị dialog xác nhận. Ngoại lệ: cả hai đều `null`/rỗng → không hiển thị.
- [ ] AC-3: Khi cả 2 điều kiện (thiếu tài liệu + ngày trùng) cùng active → **gộp thành 1 dialog tổng hợp** với cả 2 cảnh báo, chỉ 1 lần xác nhận.
- [ ] AC-4: Sau khi xác nhận, payload gửi lên BE bao gồm đầy đủ `temp_uuid` và `changedFields`. Hành vi lưu không thay đổi.
- [ ] AC-5: Nút OK/"Lưu vào phòng chờ" bị disable trong suốt quá trình từ lúc confirm dialog mở đến khi mutation hoàn tất (`finally`). Không thể double-submit.
- [ ] AC-6: Thanh tìm kiếm trên `SalaryListPage` không gây re-render toàn bộ table khi gõ phím. Chỉ trigger query khi bấm Enter hoặc nút Search.
- [ ] AC-7: Search bar đọc đúng giá trị ban đầu từ URL (`?search=...`), clear hoạt động đúng (xóa filter), reload/back-forward giữ đúng state URL.
- [ ] AC-8: Không có cảnh báo ESLint mới hoặc TypeScript error.

---

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `frontend/src/pages/Salaries/SalaryEditModal.tsx` | Sửa | Thêm 2 luồng confirm (thiếu tài liệu, ngày trùng). Cần track upload state và snapshot ngày điều chỉnh cũ khi `open`. | 🟡 Trung bình — logic confirm sai thứ tự hoặc miss case null/empty có thể gây UX confusion | Có (CONTRACT ở đầu file — không được vi phạm) |
| `frontend/src/pages/Salaries/SalaryListPage.tsx` | Sửa | Thay `Input.Search` + local `searchValue` state bằng `EmployeeSearchBar` để cô lập re-render | 🟢 Thấp — thay đổi thuần UI, không ảnh hưởng data flow | Không |
| `frontend/src/components/EmployeeSearchBar.tsx` | Đọc / có thể sửa nhẹ | Kiểm tra xem `placeholder` có hỗ trợ custom qua prop không (hiện chưa có) | 🟢 Thấp — chỉ thêm optional prop `placeholder` nếu cần | Không (shared component) |

---

## 7. Risk Triage và Review Focus

- **Review required:** Đã qua review — ✅ ĐỒNG Ý với điều kiện tasks đã cập nhật
- **Risk hotspots (sau review):**
  - `SalaryEditModal.tsx`: **[FR-02 — Blocker đã xử lý]** Guard state `isConfirming`: set `true` ở đầu hàm, **bắt buộc wrap toàn bộ body trong `try/finally`** để `setIsConfirming(false)` luôn chạy kể cả khi validation fail (early return không đi qua `finally` nếu không throw — phải dùng try/finally hoặc reset trước mọi return path). Disable nút OK bằng `okButtonProps`.
  - **[FR-01 — Blocker đã xử lý]** `uploadedRef.current = isSuccess` — `DocumentUpload` đã gọi `false` ở 3 nơi (fail/remove/onChange-removed), pattern assign trực tiếp là đủ.
  - **[FR-03 — Đã chốt]** Khi cả 2 điều kiện active: gộp 1 dialog tổng hợp, không chaining 2 modal.confirm.
  - State snapshot `ngay_dieu_chinh_luong` cũ: capture tại `useEffect[open]`, reset khi `open = false`.
  - **[FR-05 — Đã làm rõ]** Lưu không tài liệu là UX-confirmed exception theo WF-EMP-03. Frontend warning là đủ. `temp_uuid` luôn trong payload.
  - **[Issue 1 — Đã chốt Option A]** `EmployeeSearchBar`: thêm `useEffect(() => setInputValue(defaultValue), [defaultValue])` để sync input khi URL đổi (back/forward/reload). Fix ảnh hưởng tất cả màn hình dùng component.

- **Review focus areas (đã giải quyết):**
  - ✅ Confirm flow async (gộp 1 dialog, guard double-submit)
  - ✅ `temp_uuid` không bị cắt
  - ✅ `EmployeeSearchBar` contract: `defaultValue` từ URL, clear, back/forward — đã có test cases bổ sung (AC-7)

- **Known pitfalls / historical issues:**
  - `[2026-05-07] perf(search)`: Đây chính là lý do `EmployeeSearchBar` được tạo ra — bài học từ lần fix lag trước.
  - `[2026-04-01] Validation — Ant Design App.useApp()`: Dự án đã có tiền lệ phải dùng `App.useApp()` thay vì static API để tránh cảnh báo context. Confirm dialog cũng phải dùng `useApp().modal`, không dùng `Modal.confirm` trực tiếp.
  - `[2026-05-18] fix salary update bug (conv. 6fe0c19e)`: Fix trước đó đã giải quyết vấn đề `tempUuid` chỉ được gửi khi có file upload. Plan hiện tại cần đảm bảo không revert lại lỗi này — `tempUuid` luôn được gửi, kể cả khi chưa có file.

- **Dependencies / rollout concerns:**
  - Không cần migration DB hay deploy backend.
  - Chỉ cần build frontend và deploy.
  - Có thể deploy độc lập, không phụ thuộc feature khác đang active.

---

## 8. Chiến lược triển khai

- **Phase strategy:** 2 phase — (1) Fix SalaryEditModal (2 confirm flows), (2) Fix SalaryListPage (search lag).
- **Thứ tự triển khai:**
  1. Phase 1: Sửa `SalaryEditModal.tsx` — thêm state track upload + snapshot ngày cũ + confirm dialogs.
  2. Phase 2: Sửa `SalaryListPage.tsx` — swap `Input.Search` sang `EmployeeSearchBar`.
  3. (Nếu cần) Sửa nhẹ `EmployeeSearchBar.tsx` để nhận `placeholder` prop tùy chỉnh.
- **Điểm cần phối hợp:** Chỉ frontend — không cần backend hay DB.
- **Yêu cầu migration / config / deploy:** Không có.

---

## 9. Test Strategy

- **Manual verification (ưu tiên vì thay đổi là pure UI/UX):**
  - Case 1 — Lưu không có tài liệu: Mở modal, không upload, bấm "Lưu vào phòng chờ" → phải thấy confirm dialog thiếu tài liệu.
  - Case 2 — Lưu có tài liệu và ngày mới: Upload file xong, đổi ngày, bấm Save → KHÔNG thấy dialog cảnh báo nào.
  - Case 2b — Upload rồi xóa file: Upload rồi xóa → bấm Save → phải thấy dialog thiếu tài liệu (flag đã reset).
  - Case 3 — Ngày trùng (cả hai có giá trị, có tài liệu): Mở modal khi nhân sự đã có `ngay_dieu_chinh_luong = "2026-04-01"`, giữ nguyên ngày, có file → phải thấy dialog cảnh báo ngày trùng.
  - Case 4 — Cả hai ngày đều null, có tài liệu: Không set ngày → KHÔNG thấy dialog ngày trùng.
  - Case 5 — Cả 2 điều kiện active: Mở modal, không upload, giữ nguyên ngày → phải thấy **1 dialog tổng hợp** với cả 2 cảnh báo.
  - Case 5b — Validation fail (formula sai): Bấm Save khi công thức sai → thấy warning, form vẫn mở, nút Save **không bị kẹt disabled**.
  - Case 6 — Huỷ tại confirm dialog: Click "Quay lại kiểm tra" → form vẫn mở, không lưu, nút Save không bị kẹt.
  - Case 7 — Search lag: Gõ liên tục → bảng KHÔNG re-render mỗi ký tự, chỉ filter khi Enter/Search.
  - Case 8 — Search từ URL: Mở `/salaries?search=ABC` → ô tìm kiếm hiển thị "ABC" sẵn.
  - Case 9 — Clear search: Bấm clear (X) → bảng reset, URL param xóa.
  - Case 10 — Back/Forward: Search "ABC" rồi bấm Back → input sync về giá trị URL tương ứng (test trên cả PendingRoom và EmployeeList để xác nhận fix shared component).

- **Automated tests:** Không bắt buộc — các case này là pure UI interaction, khó test tự động với Vitest. Nếu có thời gian, có thể viết unit test cho hàm logic kiểm tra điều kiện ngày trùng.

- **Data / env chuẩn bị trước khi test:** Cần một nhân sự trong Quản lý lương có `can_edit = true` và đã có giá trị `ngay_dieu_chinh_luong` để test Case 3.

---

## 10. Rollback Plan

- Toàn bộ thay đổi là frontend-only, không có migration hay API change.
- Rollback bằng git revert commit tương ứng là đủ.
- Không ảnh hưởng đến dữ liệu BE hay DB.

---

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
