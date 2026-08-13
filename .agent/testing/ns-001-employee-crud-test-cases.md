# Test Cases - NS-001 Employee CRUD (Phase 2 Refinement)

> Tạo ngày: 2026-03-31
> Liên kết feature: `phase-2-ns-001-employee-crud`
> Phạm vi: Feature / Regression / UI-UX

---

## 1. Mục tiêu kiểm thử

- Xác minh luồng chuyển đổi từ nhân sự "Nháp" (Pending Room) sang nhân sự "Chính thức".
- Đảm bảo tính vẹn toàn của Audit Log và Change History khi thay đổi Mã nhân sự (ID mutation).
- Kiểm tra các cải tiến về Validation UI (dấu sao đỏ, email duplicate check).

## 2. Tiền điều kiện

- Account có quyền EA (khối Admicro) hoặc SA.
- Có ít nhất một nhân sự trong Phòng chờ với mã `TMP...` và email `@vcc.tmp`.

## 3. Happy Path

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| HP-01 | Mở trang Edit nhân sự TMP | Form hiển thị các dấu sao đỏ (*) tại các trường bắt buộc (Họ tên, Mã NS, Email...) |
| HP-02 | Đổi mã TMP thành mã 100xxx và bấm Lưu | Lưu thành công, console không báo lỗi 404, URL chuyển sang `/employees/100xxx` |
| HP-03 | Quay lại Phòng chờ và bấm nút Submit | Nhân sự biến mất khỏi Phòng chờ và xuất hiện tại Danh sách Nhân sự chính |
| HP-04 | Kiểm tra Lịch sử thay đổi của NS đó | Thấy đầy đủ các dòng log từ lúc còn là mã TMP đến khi đổi sang mã mới |
| HP-05 | Login Reviewer (không phải khối) và sửa NS được gán | Sửa thành công thông qua UUID bind đúng, không bị lỗi 403 như khi so sánh ma_nhan_su |

## 4. Edge / Regression

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| RG-01 | Nhập email đã tồn tại của NS khác | Box cảnh báo màu vàng hiện ngay khi Blur khỏi ô email |
| RG-02 | Submit NS thiếu thông tin bắt buộc | Hiện Toast cảnh báo "Vui lòng điền đầy đủ...", không nổ lỗi console 500 |
| RG-03 | Edit NS đã nghỉ việc (role EA) | Form bị khóa, hiển thị Warning chỉ SA mới được sửa |
| RG-04 | Nhập liệu form -> Chuyển tab khác -> Quay lại | Form phải giữ nguyên dữ liệu, không hiện vạch Loading Spinner gây mất tập trung |

## 5. Negative Cases

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| NG-01 | Cố tình xóa Mã nhân sự thành rỗng và Lưu | Form báo lỗi Validation ngay tại field, nút Lưu không kích hoạt |
| NG-02 | Nhập mã TMP mới vào ô Mã nhân sự khi Edit | Hệ thống báo lỗi "Không chấp nhận mã tạm (TMP...)" |

## 6. Security / Permission

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| SC-01 | EA cố tình sửa NS thuộc khối mình không có quyền | API trả về 403 Forbidden, giao diện hiện Toast thông báo đỏ |
| SC-02 | Login role VI (Viewer) và quét payload trường lương | Dữ liệu trả về NULL hoặc bị omit, không rò rỉ kể cả qua devtool |
| SC-03 | Gửi payload sửa lương qua generic Update | API ném lỗi 403 Validation Error (Blocked salary fields) |
| SC-04 | Gửi payload lương (`tam_ung_hang_thang`) khi Create | API ném lỗi 403 (Không được phép khởi tạo lương qua Hồ sơ) |
| SC-05 | Gửi `ngay_dieu_chinh_luong` qua generic Update | API ném lỗi 403 (Chặn cập nhật ngày lương qua API này) |
| SC-06 | Gửi field không xác định (extra key) qua Create/Update | API ném lỗi 400 (strict schema violation) |

## 5. Phase D (Polish & Export)

| ID | Bước kiểm thử | Kết quả mong đợi |
|----|----------------|------------------|
| PD-01 | Mở Chi tiết NS và bấm Chuyển trạng thái | Modal hiện ra, yêu cầu nhập lý do/ngày nếu chuyển sang Nghỉ việc/Nghỉ sinh |
| PD-02 | Bấm Export Excel từ danh sách | File tải về thành công; mở file check Sheet Metadata mặc định được Ẩn (Hidden) |
| PD-03 | Bấm "Đưa lại phòng chờ" từ trang Chi tiết | Thao tác thành công, NS quay lại trạng thái Phòng chờ, không báo lỗi 404 |
| PD-04 | Kiểm tra Console F12 khi thao tác | Không còn cảnh báo vàng/đỏ (Deprecation) của thư viện Ant Design |

## 6. Ghi chú regression

- Cập nhật 2026-03-31: Toàn bộ Phase D đã được verify thủ công bởi User.
- Cần kiểm tra lại view `employee_full` để đảm bảo dữ liệu sau khi Submit Phòng chờ hiển thị đầy đủ các cột lương.
