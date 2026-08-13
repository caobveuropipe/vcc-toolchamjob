# Feature Plan: Merge Grouped Change History
> **Trạng thái**: ✅ ĐỒNG Ý
> **Review gate**: Đã được duyệt hoàn toàn bởi chuyên gia, sẵn sàng thực thi
> **Feature slug**: merge-grouped-change-history
> **Liên kết tasks**: `FEATURE_TASKS.md`
> **Ngày tạo**: 2026-05-26 | Cập nhật: 2026-05-27


## 1. Tóm tắt

Plan này hướng dẫn merge nhánh `feature/grouped-change-history` vào `main`. Mục tiêu của feature là gom nhóm lịch sử thay đổi (Change History) theo cụm (group) dựa trên thời gian, người thực hiện, lý do, và tài liệu đính kèm, sử dụng PostgreSQL RPC để đảm bảo hiệu năng và tính nhất quán với quyền (Authz).

## 2. Rủi ro và Vùng ảnh hưởng

- **API Contract**: Frontend phụ thuộc vào định dạng response mới (có `group_key` và cấu trúc mảng).
- **Data Privacy (Salary)**: Chế độ isolation đối với các thay đổi lương (Salary) cực kỳ nhạy cảm. Vi phạm sẽ dẫn đến lộ thông tin lương cho người không có thẩm quyền.
- **Migration collision**: Đảm bảo file migration không bị trùng số thứ tự với main.

## 3. Kiến trúc và Cấu trúc dữ liệu

- Backend: PostgreSQL RPC `get_grouped_change_history` trả về dạng bảng, đã tính toán sẵn cờ `has_salary_change` ở mức Database thay vì API Node.js.
- API: Route `/api/change-history/:ma_nhan_su` chỉ đóng vai trò phân quyền, mapping kiểu dữ liệu và truyền param xuống RPC.
- Frontend: Tab *Lịch sử Lương* có thể ẩn nếu thiếu quyền. Danh sách được render theo giao diện bảng gom nhóm (expandable rows).

## 4. Giả định và câu hỏi mở

### Giả định
- Database môi trường dev đã có migration `033_export_probation_employees.sql` (từ nhánh main) và sẵn sàng chạy `034_grouped_change_history.sql`.
- Nhánh feature sẽ được rebase lên latest `main` trước khi merge.

### Câu hỏi mở
- *Không có.*

## 5. Acceptance Criteria

- [ ] File migration đã đổi tên thành `034_grouped_change_history.sql`.
- [ ] `documentService.ts`: VA được thêm vào quyền tải tài liệu (read-only) trong `checkDocumentAuthz`, ngăn chặn quyền xóa/ghi (write).
- [ ] `changeHistory.ts`: VA được tính vào `isDocAccessAllowed` (VA xem được `document_id`).
- [ ] Integration test Scenario 5 sửa 3 lỗi (`document_type`, `temp_uuid`, `reason = null`) và verify thành công VA download API (`GET /api/documents/:id` -> 200), chặn đứng VA xóa (`DELETE /api/documents/:id` -> 403), chặn đứng VA chạy OCR (`POST /api/documents/:id/ocr` -> 403).
- [ ] `pnpm run build` (bao gồm build `@vcc/shared`) pass trên kết quả merge.
- [ ] `pnpm run typecheck` và `pnpm run lint` pass trên kết quả merge.
- [ ] `pnpm --filter backend test:integration` pass hoàn toàn trên kết quả merge.
- [ ] RPC `get_grouped_change_history` được xác nhận: `REVOKE ALL ... FROM PUBLIC, anon, authenticated`, `GRANT EXECUTE ... TO service_role`.
- [ ] Nhánh được merge vào `main` theo đúng deploy order (DB migration trước).

## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| `database/migrations/034_grouped_change_history.sql` (đổi từ 033) | Sửa tên + Merge | Tránh collision số 033 với `export_probation_employees` | 🔴 Cao (Migration hygiene) | Có |
| `backend/src/services/documentService.ts` | Sửa | Sửa `checkDocumentAuthz`: tách biệt mode read/write, chỉ cho phép VA tải tài liệu (read) mà không cho phép xóa (write) | 🔴 Cao (Permission bug — VA bị 403 khi click download, tránh rò rỉ quyền xóa) | Có |
| `backend/src/routes/changeHistory.ts` | Sửa + Merge | Sửa bug `isDocAccessAllowed` bỏ sót VA; logic VI isolation đúng | 🔴 Cao (Security bug) | Có |
| `backend/src/__tests__/integration/salary.test.ts` | Sửa + Merge | Sửa 3 bug: `document_type`, `document_uuid→temp_uuid`, assertion `reason` và `document_id` cho VA | 🟡 Trung bình (Test reliability) | Có |
| `frontend/src/pages/Employees/components/ChangeHistoryTab.tsx` | Merge | Đổi UI sang grouped expandable | 🟡 Trung bình | Có |
| `frontend/src/hooks/useEmployees.ts` | Merge | Thêm param `category` vào `useChangeHistory`, cập nhật query key | 🟢 Thấp | Có |
| `frontend/src/pages/Employees/EmployeeDetailPage.tsx` | Merge | Truyền prop `canViewSalary` xuống `ChangeHistoryTab` | 🟢 Thấp | Có |
| `packages/shared/src/types/api.ts` | Merge | Thêm type `GroupedChangeHistoryEntry`, `ChangeHistoryDiff`, `ChangeHistoryResponse` | 🟢 Thấp | Có |
| `packages/shared/src/types/index.ts` | Merge | Re-export `GroupedChangeHistoryEntry`, `ChangeHistoryDiff` | 🟢 Thấp | Có |
| `.agent/active/merge-grouped-change-history/` | Archive | Dọn sang history sau khi merge xong | 🟢 Thấp | N/A |

## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:**
  - **Bug VA doc download:** `checkDocumentAuthz` trong `documentService.ts` (main) chỉ cho `SA || EA || Reviewer được gán` — VA bị 403 khi tải tài liệu. Cần tách biệt chế độ kiểm tra `read` / `write`; chỉ cho phép VA xem/tải tài liệu (`read`), tuyệt đối không cho phép ghi/xóa (`write`) bao gồm cả việc chặn VA gọi route OCR `POST /api/documents/:id/ocr` để bảo vệ DB.
  - **Bug VA doc access trong changeHistory:** `isDocAccessAllowed` trong feature thiếu `hasVa` → `document_id = null` with VA, frontend không hiển thị icon download.
  - **Bug test Scenario 5 — 3 lỗi chồng nhau:**
    - `document_type: 'nang_luong'` vi phạm DB CHECK constraint (giá trị đúng: `'dieu_chinh_luong'`) → document không được tạo.
    - `document_uuid: tempUuid2` sai tên trường → salary route nhận `temp_uuid` → bị Zod ignore silently → salary pending không biết có document.
    - `submit_employee_pending` RPC (migration 023) INSERT `change_history` không có cột `reason` → sau submit, `reason = null`. Assertions `expect(reason).toBe('Quyết định nâng lương...')` sẽ fail.
  - **Migration collision 033:** Hai file `033_*.sql` sẽ cùng tồn tại sau khi merge nếu không đổi tên trước.
  - **Post-merge delta:** Main có 4 commits mới kể từ merge base (`e1d551d`, `a55fb8a`, `af81c75`, `d8724b8`). Cần rebase/merge và chạy lại full test suite.

## 8. Chiến lược triển khai

- **Phase strategy:** Chia làm 4 phase rõ ràng được theo dõi tại `FEATURE_TASKS.md`:
  - **Phase 1: Sửa Bugs Trước Merge:** Khắc phục triệt để các bug quyền hạn và test suite ngay trên nhánh feature.
  - **Phase 2: Gate Merge Với Latest Main:** Đồng bộ hóa code thông qua rebase/merge, chạy đầy đủ build/lint/test để bảo vệ main.
  - **Phase 3: Merge & Deploy Theo Thứ Tự:** Triển khai DB migration trước để tạo RPC mới, reload schema PostgREST, sau đó deploy Backend và Frontend.
  - **Phase 4: Cleanup & Archive:** Đóng gói, lưu trữ tài liệu kế hoạch lịch sử và chốt Git.
- **Thứ tự triển khai (DB-First trước khi Merge):**
  1. Chạy DB Migration (`034_grouped_change_history.sql`) lên database môi trường đích trước khi merge (đảm bảo tương thích ngược).
  2. Nạp lại schema PostgREST (`NOTIFY pgrst, 'reload schema'`).
  3. Merge nhánh feature vào `main` (kích hoạt auto-deploy Backend qua GitHub Action).
  4. Đợi Backend auto-deploy hoàn tất, sau đó tiến hành/đợi deploy Frontend UI.
- **Yêu cầu migration / config / deploy:** Cần đảm bảo file migration được đặt đúng số thứ tự `034` tiếp theo của main để tránh collision.

## 9. Test Strategy

- **Automated tests:**
  - Chạy bộ integration test hiện có: `pnpm --filter backend test:integration` để đảm bảo Scenario 1-6 đều vượt qua hoàn toàn.
  - Đảm bảo kịch bản test Scenario 5 thực hiện cuộc gọi tải tài liệu thực tế của VA (`GET /api/documents/:id` thành công 200), chặn xóa (`DELETE /api/documents/:id` thất bại 403), chặn OCR (`POST /api/documents/:id/ocr` thất bại 403) để kiểm chứng triệt để.

## Phase 5: Xử lý hiển thị giấy tờ lịch sử bị thiếu (Data Fix)

**Vấn đề:** Các nhân sự tạo qua luồng **Tuyển mới** (Onboarding) và một số đợt **Điều chỉnh lương** cũ đang bị mất link giấy tờ trong lịch sử (`document_id = NULL`), đồng thời nhãn bị hiển thị sai thành "Điều chỉnh lương" do thiếu trường `ma_nhan_su` trong `change_history`.

**Giải pháp khả thi (Đề xuất sửa tận gốc Data thay vì Workaround UI):**
1. **Sửa DB RPC (`035_fix_missing_history_documents.sql`)**:
   - Sửa hàm `fn_create_employee_onboarding` hoặc `submit_employee_pending` để giữ lại biến `temp_uuid` khi duyệt Tuyển mới, từ đó map thành công `document_id`.
   - Cập nhật logic `submit_employee_pending` để bắt buộc lưu trường `ma_nhan_su` vào `change_history` khi Tuyển mới.
2. **Chạy Data Migration hồi tố (Backfill)**:
   - Tự động map các `document_id` đang bị thiếu trong `change_history` bằng cách quét bảng `employee_documents` theo `employee_id` và thời gian `created_at` gần khớp với `changed_at`.
   - Cập nhật lại nhãn `Tuyển dụng mới` bằng cách insert bù field `ma_nhan_su` cho lần duyệt đầu tiên của nhân sự.
3. **Tái sử dụng UI hiện tại**: Sau khi data sạch, nút "Xem" tài liệu trên UI sẽ tự động hoạt động trở lại như bình thường mà không cần chế thêm màn hình hay Popover nào cả.

> [!IMPORTANT]
> **User Review Required**: 
> Bạn có đồng ý chốt phương án Fix Data (migration dữ liệu cũ và sửa RPC) này không, hay bạn muốn một phương án UI Workaround (chế thêm nút Popover giống hệt Phòng Chờ để hiện một list TẤT CẢ giấy tờ lịch sử của nhân sự)?

## Verification Plan

  - Đăng nhập dưới các tài khoản thử nghiệm tương ứng với các vai trò (SA, EA, VA, VI không gán, Reviewer được gán).
  - Truy cập tab Lịch sử thay đổi nhân sự và kiểm tra:
    - Gom nhóm hiển thị đúng (expandable rows).
    - Quyền ẩn/hiện thông tin lương (Salary) chính xác.
    - Quyền tải tài liệu đính kèm (document download icon) hoạt động đúng như mong đợi.

## 10. Rollback Plan

- **Rollback Database:** Trong trường hợp xảy ra lỗi nghiêm trọng liên quan đến DB RPC sau khi deploy, thực hiện hạ cấp thủ công bằng cách drop RPC mới và index:
  ```sql
  DROP FUNCTION IF EXISTS get_grouped_change_history(VARCHAR, BOOLEAN, BOOLEAN, VARCHAR, TEXT[]);
  DROP INDEX IF EXISTS idx_change_history_grouping;
  NOTIFY pgrst, 'reload schema';
  ```
- **Rollback Code:** Revert commit merge trên nhánh `main`, thực hiện redeploy frontend và backend về tag/commit ổn định trước đó.

## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`

