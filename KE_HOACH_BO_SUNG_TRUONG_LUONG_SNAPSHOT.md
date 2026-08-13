# Kế hoạch bổ sung trường lương cho báo cáo Tổng hợp hiệu suất

## 1. Mục tiêu

Đồng bộ dữ liệu lương từ snapshot Nhân sự sang Module hiệu suất để báo cáo sử dụng đúng ba giá trị nghiệp vụ:

- **Lương Target**: ưu tiên `luong_target_cc`, fallback `luong_target_gt`.
- **Lương Cố Định**: lấy trực tiếp từ `luong_cb`.
- **Lương Hiệu Suất Dự Kiến**: lấy trực tiếp từ `thuong_hieu_suat_cham_job_nhuan`.

Không tính Lương Hiệu Suất Dự Kiến bằng `luongTarget - luongCoDinh`.

## 2. Contract đích

Endpoint `GET /api/snapshots/employees-detail?thang=T{MM}.{YYYY}` cần trả tối thiểu bốn trường lương:

```json
{
  "luong_target_gt": 0,
  "luong_target_cc": 18000000,
  "luong_cb": 10000000,
  "thuong_hieu_suat_cham_job_nhuan": 8000000
}
```

Quy tắc chuẩn hóa tại Module hiệu suất:

```js
const luongTarget = Number(item.luong_target_cc) > 0
  ? Number(item.luong_target_cc)
  : Number(item.luong_target_gt ?? 0);

const luongCoDinh = Number(item.luong_cb ?? 0);
const luongHieuSuatDuKien = Number(item.thuong_hieu_suat_cham_job_nhuan ?? 0);
```

## 3. Thay đổi tại `D:\Project_VCC\Module_NhanSu_moi`

### 3.1. Mở rộng service snapshot

File: `backend/src/services/snapshotService.ts`

Trong `getSnapshotEmployeesDetail(thang)`:

- Bổ sung vào Supabase `.select(...)`:
  - `luong_cb`
  - `thuong_hieu_suat_cham_job_nhuan`
- Bổ sung hai trường này vào object response.
- Giữ response lỗi và empty-state hiện tại:
  - HTTP lỗi: trả error envelope.
  - Kỳ hợp lệ không có dữ liệu: `{ data: [] }`.

### 3.2. Cập nhật contract tests

Các file chính:

- `backend/src/__tests__/integration/snapshots.test.ts`
- `backend/src/__tests__/integration/snapshotsDetailApi.test.ts`
- `backend/src/__tests__/unit/snapshotDetailService.test.ts`

Nội dung:

- Cập nhật contract endpoint từ 12 lên 14 trường.
- Fixture phải có các giá trị khác nhau cho:
  - `luong_target_cc`
  - `luong_target_gt`
  - `luong_cb`
  - `thuong_hieu_suat_cham_job_nhuan`
- Xác nhận service trả nguyên giá trị snapshot, không tự tính lại.
- Giữ test authentication, tháng sai định dạng và empty-state.

### 3.3. Triển khai backend

- Chạy unit/integration tests liên quan endpoint.
- Deploy backend trước Module hiệu suất.
- Smoke test endpoint production bằng một kỳ có dữ liệu.
- Không log hoặc đưa `x-api-key` vào tài liệu/test output.

## 4. Thay đổi tại Module hiệu suất

### 4.1. Chuẩn hóa response GAS

File: `client/pg_general_1.js`

Trong mapper của `getSnapshotEmployeesDetailFromAPI`:

- Nhận thêm:
  - `luong_cb`
  - `thuong_hieu_suat_cham_job_nhuan`
- Trả object chuẩn hóa có:
  - `luongTarget`
  - `luongCoDinh`
  - `luongHieuSuatDuKien`
- Không dùng `lcd_gt` cho Lương Cố Định của báo cáo này.

### 4.2. Cập nhật merge báo cáo

File: `client/modal_tonghophieusuat_3.html`

Trong `mergeHieuSuatVaLuong()`:

- Map trực tiếp ba giá trị đã chuẩn hóa.
- Bỏ công thức `luongTarget - luongCoDinh` cho Lương Hiệu Suất Dự Kiến.
- Giữ các công thức:

```js
tyLeHieuSuatTarget = luongTarget !== 0 ? tongHieuSuat / luongTarget : 0;
tyLeDatHieuSuat = luongHieuSuatDuKien !== 0
  ? tongHieuSuat / luongHieuSuatDuKien
  : 0;
tongThuNhap = tongHieuSuat + luongCoDinh;
tyLeDatTTN = luongTarget !== 0 ? tongThuNhap / luongTarget : 0;
```

### 4.3. Kiểm thử Module hiệu suất

- Một nhân sự có Target, Cố định và Hiệu suất dự kiến khác nhau.
- `luong_target_cc > 0`: dùng Target Cơ chế.
- `luong_target_cc = 0`: fallback Target Giấy tờ.
- `luong_cb = 0`: zero là giá trị hợp lệ.
- `thuong_hieu_suat_cham_job_nhuan = 0`: zero là giá trị hợp lệ.
- Empty-state không render một báo cáo lương toàn số 0.
- Đổi kỳ nghiệm thu phải tải lại snapshot đúng kỳ.

## 5. Thứ tự triển khai

1. Mở rộng endpoint và tests tại `Module_NhanSu_moi`.
2. Deploy và smoke test backend.
3. Cập nhật mapper GAS tại Module hiệu suất.
4. Cập nhật `mergeHieuSuatVaLuong()`.
5. Push/deploy Apps Script `client`.
6. Kiểm tra end-to-end với một nhân sự mẫu có đủ giá trị lương.

## 6. Ngoài phạm vi của kế hoạch này

- Không thay đổi công thức tạo Target trong dự án Nhân sự.
- Không thay đổi schema Supabase vì các cột cần thiết đã tồn tại trong `snapshot_employees`.
- Không dùng nguồn lương cũ để ghép tạm.
- Hai lỗi JavaScript khi load trang được xử lý độc lập trước khi triển khai kế hoạch dữ liệu lương này.
