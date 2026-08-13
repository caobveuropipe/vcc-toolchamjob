# Feature Tasks: Salary UX Fixes — Cảnh báo tài liệu, Cảnh báo ngày trùng & Fix lag tìm kiếm

> **Trạng thái**: ✅ Hoàn thành
> **Liên kết plan**: `FEATURE_PLAN.md`
> **Ngày tạo**: 2026-05-19
> **Cập nhật**: 2026-05-19 — Sau feature-review lần 1 (FR-01…FR-05) và lần 2 (Issue 1 back/forward, Issue 2 Test Strategy, Issue 3 isConfirming try/finally)

---

## Quy ước checklist

- `- [ ]`: Chưa làm
- `- [/]`: Đang làm
- `- [x]`: Hoàn thành
- Cuối mỗi phase bắt buộc có `Task X.Final: 🧪 Test & Verify Phase X`

---

## Phase 1: SalaryEditModal — Confirm Dialogs

**Mục tiêu:** Thêm guard upload + snapshot ngày + dialog xác nhận tổng hợp vào `SalaryEditModal.tsx`.

- [x] Task 1.1: Thêm ref theo dõi upload đúng cách **(FR-01)**
  - Đảm bảo file `SalaryEditModal.tsx` đã import `useRef` từ React: `import React, { useEffect, useRef, useState } from 'react'`.
  - Thêm `const uploadedRef = useRef(false)` vào `SalaryEditModal`.
  - Truyền callback xuống `DocumentUpload`: `onUploadSuccess={(isSuccess) => { uploadedRef.current = isSuccess }}`
  - Lý do pattern này đúng: `DocumentUpload` đã gọi `onUploadSuccess(false)` tại 3 nơi: upload fail (L127), `handleRemove` (L137), và `onChange status=removed` (L214). Assign `= isSuccess` tự động track mọi trạng thái mà không cần logic phân nhánh.
  - Reset `uploadedRef.current = false` trong `useEffect` khi `open` chuyển sang `false`.
  - **Xoá `console.log('Upload success')`** hiện có trong callback `onUploadSuccess` cũ (L221-223 của `SalaryEditModal`).

- [x] Task 1.2: Thêm guard chống double-submit + try/finally **(FR-02 + Issue 3)**
  - Thêm `const [isConfirming, setIsConfirming] = useState(false)` và `const isConfirmingRef = useRef(false)`.
  - Đầu `handleSaveModal`: kiểm tra `if (isConfirmingRef.current) return` (reentrancy guard).
  - Set `isConfirmingRef.current = true` và `setIsConfirming(true)` ngay đầu hàm.
  - Sau đó **wrap toàn bộ phần còn lại trong `try { ... } finally { isConfirmingRef.current = false; setIsConfirming(false) }`**.
  - **Lý do bắt buộc dùng try/finally:** code hiện có early `return` sau validation fail (L134–143 `SalaryEditModal.tsx`) — `finally` đảm bảo reset chạy kể cả khi có exception hoặc `return` ở bất kỳ path nào. Không được để các early return không reset — gây nút Save bị disabled vĩnh viễn cho đến khi modal đóng hoàn toàn.
  - Truyền `okButtonProps={{ disabled: isConfirming || updateMutation.isPending }}` vào `Modal`.
  - Reset cả state và ref về `false` trong `useEffect` khi `open = false` (bảo vệ trường hợp modal bị đóng đột ngột từ bên ngoài).

- [x] Task 1.3: Capture snapshot `ngay_dieu_chinh_luong` cũ khi modal mở
  - Thêm `const originalAdjDateRef = useRef<string | null>(null)`.
  - Trong `useEffect[open, editingModal]` (cùng nơi đang gọi `form.setFieldsValue`): khi `open = true`, đọc `pendingSalary.ngay_dieu_chinh_luong ?? editingModal.ngay_dieu_chinh_luong`, format thành `YYYY-MM-DD` (hoặc `null` nếu rỗng) và lưu vào `originalAdjDateRef.current`.
  - Reset `originalAdjDateRef.current = null` khi `open = false` (trong cùng `useEffect`).

- [x] Task 1.4: Bổ sung `modal` từ `App.useApp()` và implement dialog xác nhận tổng hợp **(FR-03 — 1 dialog)**
  - Bổ sung `modal` vào destructure hiện có: `const { message, modal } = App.useApp()`.
  - Cấu trúc `handleSaveModal` với try/catch/finally bao trùm:
    ```ts
    if (isConfirmingRef.current) return
    isConfirmingRef.current = true
    setIsConfirming(true)
    try {
      // 1. Tính changedFields + validate formula (giữ nguyên logic hiện tại)
      // 2. Nếu không có gì thay đổi: message.info, return
      // 3. Tính needDocWarn và needDateWarn
      // 4. Nếu có cảnh báo: gọi modal.confirm tổng hợp (1 dialog) và await
      //    const confirmed = await modal.confirm({...});
      //    if (!confirmed) return; (finally tự reset)
      // 5. await updateMutation.mutateAsync(...)
      // 6. message.success + onSuccess() + onCancel() (giữ nguyên logic gốc)
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi lưu') // GIỮ NGUYÊN logic catch hiện tại
    } finally {
      isConfirmingRef.current = false;
      setIsConfirming(false); // chạy mọi path: thành công, lỗi, validation fail, user huỷ
    }
    ```
  - Logic chi tiết bên trong `try`:
    1. Tính toán `changedFields` + validate formula như hiện tại. Nếu fail: `message.warning(...)`, `return` (finally tự reset).
    2. Kiểm tra `Object.keys(changedFields).length === 0` — nếu không có gì thay đổi: `message.info(...)`, `onCancel()`, `return`.
    3. Tính `newAdjDate`: `values.ngay_dieu_chinh_luong ? dayjs(values.ngay_dieu_chinh_luong).format('YYYY-MM-DD') : null`.
    4. Xác định cờ: `needDocWarn = !uploadedRef.current`, `needDateWarn = newAdjDate !== null && originalAdjDateRef.current !== null && newAdjDate === originalAdjDateRef.current`.
    5. Nếu có cảnh báo: gọi 1 `modal.confirm` tổng hợp và await kết quả:
       ```ts
       const confirmed = await modal.confirm({
         title: "Xác nhận lưu vào phòng chờ",
         content: ( /* JSX liệt kê cảnh báo active */ ),
         okText: "Tôi hiểu, vẫn lưu",
         cancelText: "Quay lại kiểm tra",
       });
       if (!confirmed) return; // finally tự reset isConfirmingRef và state
       ```
    6. `await updateMutation.mutateAsync({ maNhanSu: editingModal.ma_nhan_su, data: changedFields, tempUuid })`.
  - **Bắt buộc**: `tempUuid` luôn được truyền trong payload bất kể có upload hay không.

- [x] Task 1.Final: 🧪 Test & Verify Phase 1
  - [ ] Case 1: Mở modal, **không upload** → bấm Save → phải thấy dialog cảnh báo thiếu tài liệu.
  - [ ] Case 2: **Upload rồi xóa file** → bấm Save → phải thấy dialog cảnh báo (flag đã reset về `false` sau khi xóa).
  - [ ] Case 3: Upload thành công, ngày thay đổi → bấm Save → **KHÔNG thấy** dialog cảnh báo nào.
  - [ ] Case 4: Ngày điều chỉnh mới = ngày cũ (cả 2 có giá trị), có tài liệu → phải thấy dialog ngày trùng.
  - [ ] Case 5: Cả 2 ngày đều null, có tài liệu → bấm Save → **KHÔNG thấy** dialog ngày trùng.
  - [ ] Case 6: Cả 2 điều kiện cùng active (không tài liệu + ngày trùng) → **1 dialog tổng hợp** với cả 2 cảnh báo.
  - [ ] Case 7: Bấm "Quay lại kiểm tra" tại dialog → form vẫn mở, không lưu, nút Save **không bị kẹt disabled**.
  - [ ] Case 7b: **Validation formula fail** → bấm Save → thấy warning, form vẫn mở, nút Save **không bị kẹt disabled** (isConfirming reset qua finally).
  - [ ] Case 8: **Double-click** nút Save → chỉ 1 dialog/mutation được thực thi (nút bị disable ngay).
  - [ ] Case 9: `tempUuid` luôn có trong payload dù không có file (kiểm tra Network tab → Request body).
  - → Báo cáo User sau khi tự test xong.

---

## Phase 2: SalaryListPage — Fix Search Lag + EmployeeSearchBar Bug Fix

**Mục tiêu:** (1) Fix bug back/forward trong `EmployeeSearchBar` shared component. (2) Tách thanh tìm kiếm của `SalaryListPage` sang `EmployeeSearchBar`.

- [x] Task 2.1: Fix bug back/forward + thêm `placeholder` prop vào `EmployeeSearchBar` **(Issue 1 — Option A)**
  - Mở `frontend/src/components/EmployeeSearchBar.tsx`.
  - Xóa `Space` khỏi import từ `antd` (không dùng đến).
  - Thêm `useEffect` vào import: `import React, { useState, useCallback, useEffect } from 'react'`.
  - Thêm sau dòng `useState(defaultValue)`:
    ```ts
    useEffect(() => {
      setInputValue(defaultValue)
    }, [defaultValue])
    ```
  - **Mục tiêu của useEffect này**: giữ được mục tiêu cô lập re-render (gõ phím chỉ re-render bên trong component), nhưng sync lại input khi URL đổi thật sự do reload/back/forward/clear/search mới.
  - **Fix này áp dụng cho cả 3 màn hình**: `PendingRoomPage`, `EmployeeListPage`, và `SalaryListPage` (sau khi migrate) — không cần sửa gì ở 2 màn hình cũ.
  - **Không dùng `key={search}`** — force remount mạnh tay, có side-effect mất focus và không sửa bug gốc của component shared.
  - Thêm `placeholder?: string` vào `EmployeeSearchBarProps` interface.
  - Truyền xuống `Input.Search`: `placeholder={placeholder ?? "Tìm theo tên n/v, email..."}` (giữ default để không break màn hình cũ).

- [x] Task 2.2: Sửa `SalaryListPage.tsx` — swap search bar
  - Xóa `const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')`.
  - Kiểm tra import `useState` — nếu `searchValue` là state duy nhất dùng `useState`, xóa `useState` khỏi import; nếu còn `exporting` state thì giữ.
  - Import `EmployeeSearchBar` từ `@/components/EmployeeSearchBar`.
  - Bọc `handleSearch` trong `useCallback`:
    ```ts
    const handleSearch = useCallback((val: string) => {
      const params = new URLSearchParams(searchParams)
      if (val) params.set('search', val)
      else params.delete('search')
      params.set('page', '1')
      setSearchParams(params, { replace: true })
    }, [searchParams, setSearchParams])
    ```
  - Thay thế block `<Input.Search ... value={searchValue} onChange={...} onSearch={handleSearch} />` bằng:
    ```tsx
    <EmployeeSearchBar
      defaultValue={search}
      onSearch={handleSearch}
      placeholder="Tìm theo mã NS, họ tên..."
    />
    ```

- [x] Task 2.3: Kiểm tra imports và cleanup
  - Đảm bảo import đầy đủ các hook cần thiết: `import React, { useState, useMemo, useCallback } from 'react'`.
  - Nếu `Input` từ antd không còn được dùng trực tiếp sau khi swap, xóa khỏi import list.
  - Xóa import `SearchOutlined` nếu không còn được sử dụng.
  - Chạy `pnpm run typecheck` để xác nhận không có TypeScript error.
  - Chạy `pnpm run lint` để xác nhận không có ESLint warning mới.

- [x] Task 2.Final: 🧪 Test & Verify Phase 2
  - [ ] Case 10: Gõ liên tục vào ô tìm kiếm → bảng **KHÔNG** bị re-render mỗi ký tự, chỉ query khi Enter/click Search.
  - [ ] Case 11: Mở trang `/salaries?search=ABC` → ô tìm kiếm hiển thị sẵn "ABC".
  - [ ] Case 12: Bấm clear (X) trong search bar → bảng reset, URL param `search` bị xóa.
  - [ ] Case 13: Reload trang sau khi đã search → filter vẫn giữ nguyên (state dựa trên URL).
  - [ ] Case 14: Back/Forward browser trên **Salary** → input sync đúng với URL.
  - [ ] Case 15: Back/Forward trên **PendingRoom** và **EmployeeList** → input cũng sync đúng (xác nhận fix shared component không gây regression).
  - → Xác nhận với User sau khi test xong.

---

## Execution Log

| Thời gian | Phase | Task | Hành động | Trạng thái | Ghi chú |
|-----------|-------|------|-----------|-----------|---------|
| 2026-05-19 14:11 | Phase 1 | Task 1.1-1.4 | Code confirm dialogs | done | Hoàn tất các task code, chuẩn bị test |
| 2026-05-19 14:11 | Phase 1 | Task 1.Final | Self-test | done | Pass sau khi fix lỗi 400 |
| 2026-05-19 14:31 | Phase 2 | Task 2.1-2.3 | Fix search bug & swap bar | done | Hoàn thành thay search bar cho SalaryList |
| 2026-05-19 14:31 | Phase 2 | Task 2.Final | Self-test | done | Pass test tay và check type/lint OK |
| 2026-05-19 14:36 | All | All | Hoàn thành feature | done | Tính năng sẵn sàng để archive và cập nhật docs |
