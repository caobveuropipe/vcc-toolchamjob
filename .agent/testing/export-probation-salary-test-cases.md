# Test Cases: Xuất danh sách làm thưởng KD (kèm lương)

## 1. Happy Path
- **Kịch bản**: Super Admin (SA) thực hiện xuất danh sách nhân sự làm thưởng kinh doanh (kèm lương).
  - **Hành động**: Click vào nút "Xuất Excel" -> Chọn "Xuất DS làm thưởng KD".
  - **Kết quả mong đợi**:
    - Xuất file thành công, file tải về có tên bắt đầu bằng `DanhSachNhanSuKemLuong`.
    - Dữ liệu được hiển thị bắt đầu trực tiếp từ ô `A1` của sheet chính (không có các dòng trống hay cột trống watermark).
    - File chứa đúng 16 cột thông tin gồm: Khối, Mã nhân sự, Họ và tên, Chức danh, BU, Phòng ban, Bộ phận, Nhóm/Team, Line nhân sự, Người quản lý, Ngày vào công ty, Ngày ký HĐ, Lương Target, Lương cố định hợp đồng, Thưởng doanh số, Tỷ lệ lương thử việc.
    - Sheet phụ `Metadata` được ẩn đi, ghi nhận thông tin audit bảo mật đầy đủ (Người xuất, thời gian, hash...).
    - Toàn bộ nhân viên đang làm việc thuộc mọi khối được xuất đầy đủ (không bị lọc chỉ giới hạn nhân viên thử việc).

- **Kịch bản**: Quản lý khối (EA) thực hiện xuất danh sách làm thưởng kinh doanh.
  - **Hành động**: Click vào nút "Xuất Excel" -> Chọn "Xuất DS làm thưởng KD".
  - **Kết quả mong đợi**:
    - Chỉ xuất thành công danh sách nhân sự thuộc khối mà tài khoản EA đó được phân quyền quản lý.
    - Excel xuất ra có đầy đủ 16 cột thông tin và sheet ẩn `Metadata`.

## 2. Edge / Negative Path
- **Kịch bản**: Người dùng không có quyền EA hoặc SA (Reviewer, VA, VI) thực hiện xem menu hoặc gọi API trực tiếp.
  - **Hành động**:
    - Truy cập trang Danh sách nhân sự với tài khoản Reviewer/VA/VI.
    - Gửi request trực tiếp đến API `/api/salaries/export-probation`.
  - **Kết quả mong đợi**:
    - Trên giao diện UI: Dropdown menu không hiển thị tùy chọn "Xuất DS làm thưởng KD" (chỉ hiển thị tùy chọn mặc định).
    - Tầng API: Trả về lỗi `403 Forbidden` (do bị chặn bởi middleware phân quyền EA/SA).

- **Kịch bản**: Hệ thống có số lượng nhân sự lớn vượt quá 1000 bản ghi (ví dụ: 2500 bản ghi).
  - **Hành động**: Thực hiện xuất Excel với tài khoản SA.
  - **Kết quả mong đợi**:
    - Hệ thống tự động bypass giới hạn 1000 dòng mặc định của PostgREST, cho phép tải xuống đầy đủ toàn bộ 2500 dòng nhân sự (hỗ trợ tối đa 5000 dòng).

- **Kịch bản**: Người dùng không chọn khoảng thời gian lọc (startDate, endDate).
  - **Hành động**: Bấm xuất Excel trực tiếp không qua bộ lọc ngày.
  - **Kết quả mong đợi**:
    - Hệ thống tự động áp dụng chu kỳ ngày mặc định tính từ ngày 26 tháng trước đến hết ngày 25 tháng này (theo múi giờ UTC+7).

## 3. Security & Audit Path
- **Kịch bản**: Ghi nhận hoạt động vào nhật ký hệ thống khi xuất Excel.
  - **Hành động**: Thực hiện một lượt xuất file "Xuất DS làm thưởng KD" thành công.
  - **Kết quả mong đợi**:
    - Một bản ghi audit log được tự động lưu vào bảng `audit_log` với:
      - `action = 'export'`
      - `module = 'NS-002'`
      - Cột `details` chứa thông tin về thời gian lọc, email người xuất, tổng số dòng được xuất.

- **Kịch bản**: Chống tấn công Spam/DoS Export qua Rate Limiting.
  - **Hành động**: Liên tục click xuất file nhanh chóng nhiều lần trong 1 phút.
  - **Kết quả mong đợi**:
    - Từ lần click thứ 6 trở đi, API trả về lỗi `429 Too Many Requests`. Giao diện hiển thị Toast báo lỗi: *"Thao tác quá nhanh. Vui lòng đợi 1 phút (Rate limit 5 lần/phút)."*
