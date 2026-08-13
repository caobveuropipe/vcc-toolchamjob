# Test Cases - Sửa lỗi ghi log lịch sử và khôi phục database local

> Tạo ngày: 2026-07-28
> Liên kết feature: `fix-audit-history-and-test-cleanup`
> Phạm vi: Bug fix / Regression / Ops change / Security

---

## 1. Mục tiêu kiểm thử

- Xác minh khi cập nhật `nguoi_nghiem_thu_thu_viec` qua route riêng, bảng `change_history` chỉ lưu duy nhất 1 thay đổi của trường này (không ghi nhận log rác 15+ cột).
- Xác minh hiển thị song song ở Frontend: Nhân sự cũ đang chờ duyệt (`state_phong_cho = true`) vẫn hiển thị bình thường ở màn hình danh sách chính thức (không bị lọc cứng bởi `state_phong_cho={false}`).
- Xác minh ô tìm kiếm AutoComplete trong Reviewer Management gọi API autocomplete động trên server thay vì tải tĩnh 1000 bản ghi.
- Xác minh script khôi phục database local (`restore-local-db.ps1`) chạy thành công qua cơ chế `docker cp` an toàn, có đầy đủ preflight checks (Docker, container status, git ignore, DDL reject).
- Kiểm tra tính đúng đắn của script kiểm tra tĩnh frontend (`verify-fe-parameters.js`) để chặn đứng regression.

## 2. Tiền điều kiện

- Database local chạy bằng Docker Desktop.
- Có ít nhất một file backup nhị phân `.backup` hoặc file data-only SQL `.sql` trong thư mục `database_backups`.
- Tài khoản Test:
  - Super Admin (SA): `admin.dev@vccorp.vn`
  - EA Khối Admicro (EA): `loi.admicro@gmail.com`
  - Reviewer (VI/VA): `reviewer.dev@vccorp.vn`

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Chạy lệnh `pnpm db:restore` tự động hoặc `pnpm db:restore <tên_file>` | Database được reset về schema chuẩn và khôi phục thành công dữ liệu từ file backup. |
| HP-02 | Chạy lệnh `node scripts/smoke-check-restore.js` sau khi khôi phục | Tất cả các kiểm tra sức khỏe DB (replication role, employees count, triggers status, sentinel data) báo **PASSED**. |
| HP-03 | Đăng nhập EA, vào trang chi tiết nhân sự thử việc, cập nhật NNT thử việc và lưu lại | Chỉ có duy nhất 1 dòng ghi nhận thay đổi của trường `nguoi_nghiem_thu_thu_viec` được tạo ra trong change history. |
| HP-04 | Vào màn hình Admin -> Reviewer Management -> Click Gán người soát xét -> Gõ tìm kiếm mã/tên nhân sự | Ô AutoComplete hiển thị danh sách gợi ý động lấy từ API server dựa trên ký tự nhập vào. |
| HP-05 | Vào màn hình Danh sách nhân sự chính thức | Nhân sự cũ đang chờ duyệt (có `state_phong_cho = true` và mã nhân sự chính thức) vẫn hiển thị song song. |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Chạy lệnh `pnpm test:fe-verify` hoặc `node scripts/verify-fe-parameters.js` | Script kiểm tra tĩnh báo **PASSED** nếu không có file FE nào chứa `state_phong_cho={false}` hoặc `state_phong_cho: false`. |
| RG-02 | Chèn chuỗi `state_phong_cho={false}` vào một component frontend bất kỳ và chạy `pnpm test:fe-verify` | Script báo **FAILED**, hiển thị chi tiết file, số dòng vi phạm và trả về exit code 1. |
| RG-03 | Chạy `pnpm db:restore` chỉ định một file SQL chứa lệnh DDL (ví dụ: `CREATE TABLE test_table...`) | Script chặn restore ngay ở bước preflight check và báo lỗi: file SQL chứa cấu trúc DDL không được hỗ trợ. |
| RG-04 | Chạy `pnpm db:restore` chỉ định một file backup chưa được git ignore | Script chặn restore ngay lập tức ở bước preflight check và báo lỗi rò rỉ dữ liệu PII. |

## 5. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | Đăng nhập tài khoản Reviewer (không có quyền cấp khối), cố tình gọi API Autocomplete | Server trả về lỗi 403 Forbidden. |
| SC-02 | Kiểm tra logs của API Autocomplete hoặc query autocomplete | Không có bất kỳ raw query PII nào được in ra console (console.log / console.error được dọn dẹp sạch). |

## 6. Ghi chú regression

- Luôn chạy smoke test và integration test suite sau khi khôi phục dữ liệu hoặc cập nhật schema để đảm bảo tính ổn định.
- Pipeline CI/CD sẽ tự động chạy bước `Verify Frontend Parameters` trong job validate để đảm bảo ngăn ngừa lỗi lọc cứng ở frontend.
