# Báo cáo cơ chế lưu dữ liệu Tổng hợp hiệu suất

> Cập nhật: 13/08/2026  
> Phạm vi: Modal **Tổng hợp hiệu suất** — luồng **Tính / Submit / đóng modal / xem lại trạng thái**.

## Quy ước duy trì tài liệu

Đây là tài liệu nguồn dùng để giữ tính nhất quán trong toàn bộ quá trình phân tích, thiết kế và chia nhỏ các bước bổ sung code cho cơ chế lưu Tổng hợp hiệu suất.

Từ ngày 13/08/2026, sau mỗi câu hỏi hoặc quyết định có liên quan, cần cập nhật vào tài liệu này các nội dung cốt lõi gồm:

- Yêu cầu hoặc vấn đề mới được xác nhận.
- Quyết định thiết kế đã thống nhất.
- Điểm còn chưa chốt và cần xác nhận sau.
- Ảnh hưởng đến dữ liệu, giao diện, server và các bước triển khai.
- Nhật ký cập nhật ở cuối tài liệu.

Khi bắt đầu code, cần đối chiếu tài liệu này trước mỗi bước. Không tự thay đổi các quyết định đã chốt mà không cập nhật lại tài liệu.

## Kết luận nhanh

Hệ thống hiện có cảnh báo chung khi người dùng đã thực hiện tính toán nhưng chưa Submit. Tuy nhiên, hệ thống **chưa có cơ chế xem lại bản đã lưu** và **chưa phân biệt trạng thái lưu theo từng dòng**.

Nếu người dùng chỉ chọn một phần số dòng để Submit, biến trạng thái chung vẫn được đặt thành "đã lưu" sau khi server trả về thành công. Vì vậy, những dòng không được chọn có thể chưa được lưu nhưng người dùng không còn nhận được cảnh báo khi đóng modal.

## 1. Cơ chế Submit hiện tại

Khi người dùng bấm **Submit**, client thực hiện các bước sau:

1. Lấy các dòng đang thuộc kết quả tìm kiếm/lọc hiện tại của DataTables.
2. Trong tập kết quả đó, chỉ lấy những dòng có checkbox đang được chọn.
3. Gửi mảng dữ liệu được chọn tới hàm Apps Script `modal_tonghophieusuat_1_SubmitHieuSuatToSheet`.

Mã liên quan:

- `client/modal_tonghophieusuat_3.html`, hàm `modal_dataluong_3_getDataFromTable()` (khoảng dòng 231).
- `client/modal_tonghophieusuat_3.html`, hàm `modal_tonghophieusuat_3_LuuChiTra()` (khoảng dòng 97).

Ở phía server, hệ thống:

1. Mở một Google Sheet bằng ID cố định.
2. Truy cập sheet `DataHieuSuat`.
3. Lấy vị trí ngay sau dòng dữ liệu cuối cùng.
4. Bổ sung email người ghi và tháng chi trả vào từng dòng.
5. Ghi nối tiếp toàn bộ các dòng bằng `setValues()`.

Mã liên quan:

- `client/modal_tonghophieusuat_1.js`, hàm `modal_tonghophieusuat_1_SubmitHieuSuatToSheet()` (khoảng dòng 87–107).

Thông tin được bổ sung trước khi ghi:

- Cột 15 (index 14): email người ghi.
- Cột 16 (index 15): tháng chi trả.

Sau khi server trả về thành công, client:

- Đặt biến `pg_tonghophieusuat_isCalculated = false`.
- Hiển thị toast: **“Dữ liệu đã được ghi vào Data”**.

## 2. Cơ chế cảnh báo chưa lưu

Trạng thái chưa lưu hiện chỉ được quản lý bằng một biến Boolean chung cho toàn modal:

```js
var pg_tonghophieusuat_isCalculated = false;
```

- Khi thực hiện tính/tạo lại bảng: biến được đặt thành `true`.
- Khi Submit thành công: biến được đặt thành `false`.
- Khi đóng modal trong lúc biến là `true`: hiển thị cảnh báo dữ liệu chưa được lưu.
- Khi người dùng chọn **Đóng luôn**: biến cũng bị đặt về `false`.

Mã liên quan:

- Khai báo trạng thái: `client/modal_tonghophieusuat_3.html`, khoảng dòng 2–3.
- Đánh dấu sau khi tính: khoảng dòng 323–328.
- Reset sau khi lưu: khoảng dòng 147–152.
- Kiểm tra và cảnh báo khi đóng modal: khoảng dòng 167–204.
- Cảnh báo khi đóng tab/trình duyệt: `client/pg_general_3.html`, khoảng dòng 616–672.

### Hạn chế

Biến này chỉ biểu diễn trạng thái của **toàn bộ modal**, không theo dõi từng dòng.

Ví dụ: bảng có 7 dòng, người dùng chỉ chọn và Submit 2 dòng. Sau khi ghi 2 dòng thành công, biến chung được đặt thành `false`. Năm dòng còn lại chưa được lưu nhưng khi đóng modal hệ thống không còn cảnh báo.

## 3. Cơ chế xem lại dữ liệu đã lưu

**Hiện chưa có.**

Khi mở lại hoặc bấm Tính, bảng Tổng hợp hiệu suất được dựng lại từ dữ liệu cache nguồn, chủ yếu là:

- `pg_general_3_cachedDataHieuSuat` — dữ liệu hiệu suất chi tiết.
- `pg_general_3_cachedLuongChiTiet` — dữ liệu lương chi tiết.

Giao diện Tổng hợp hiệu suất không có hàm đọc ngược sheet `DataHieuSuat` để:

- Hiển thị bản đã Submit.
- Đối chiếu bản đang tính với bản đã lưu.
- Xác định dòng nào đã tồn tại trong dữ liệu.
- Hiển thị người lưu hoặc thời điểm lưu.
- Hiển thị lịch sử các lần lưu.

Thiết lập `stateSave: true` của DataTables chỉ lưu trạng thái hiển thị như tìm kiếm, sắp xếp hoặc phân trang. Nó không lưu dữ liệu nghiệp vụ và không chứng minh một dòng đã được Submit.

## 4. Nhận biết dòng đã lưu và chưa lưu

**Hiện chưa có.**

Mỗi dòng chỉ có checkbox dùng để chọn dữ liệu gửi đi. Bảng chưa có:

- Cột **Trạng thái**.
- Badge **Đã lưu / Chưa lưu**.
- Màu nền hoặc biểu tượng trạng thái.
- ID bản ghi đã lưu gắn với dòng giao diện.
- Danh sách key đã lưu được server trả về.
- Biến trạng thái riêng cho từng dòng.

Sau khi Submit thành công, giao diện không cập nhật riêng những dòng vừa được lưu. Vì vậy checkbox không phải là dấu hiệu xác nhận trạng thái lưu.

## 5. Kiểm tra trùng dữ liệu

Trong server có comment quy định key dự kiến:

> Mã nhân sự + kỳ chi trả + tên cơ chế.

Tuy nhiên, code hiện tại chưa thực hiện kiểm tra key này trước khi ghi. Dữ liệu được ghi nối tiếp trực tiếp xuống cuối sheet, nên Submit lặp có thể tạo bản ghi trùng.

Ngoài ra:

- Tham số `strCoChe` được truyền vào hàm server nhưng chưa được sử dụng trong thân hàm.
- `Ghi chú` và `Loại thu nhập` được đọc ở client nhưng chưa được truyền vào hàm lưu.

## 6. Danh sách có/chưa có

### Đã có

- Cảnh báo chung sau khi đã Tính nhưng chưa Submit.
- Cảnh báo khi đóng modal hoặc đóng trang trong trạng thái chưa lưu.
- Toast khi server ghi thành công.
- Ghi email người thực hiện và tháng chi trả vào dữ liệu.
- Chỉ Submit các dòng được chọn trong kết quả lọc hiện tại.

### Chưa có

- Xem lại bản dữ liệu đã lưu.
- Phân biệt từng dòng đã lưu/chưa lưu.
- Đối chiếu bảng hiện tại với dữ liệu trong `DataHieuSuat`.
- Kiểm tra và ngăn dữ liệu trùng theo key nghiệp vụ.
- Trạng thái lưu bền vững sau khi đóng/mở lại modal.
- Lịch sử các lần lưu.
- Cảnh báo chính xác khi người dùng chỉ lưu một phần số dòng.

## 7. Kết luận nghiệp vụ

Ở phiên bản hiện tại, thông báo **“Dữ liệu đã được ghi vào Data”** chỉ xác nhận lần gọi server đã hoàn thành đối với các dòng được chọn. Nó không cho biết trên bảng dòng nào đã được ghi và không bảo đảm toàn bộ bảng đã được lưu.

Muốn người dùng nhận biết chính xác trạng thái từng dòng, cần bổ sung cơ chế định danh/key cho mỗi dòng, đọc danh sách đã lưu từ `DataHieuSuat`, đối chiếu với bảng hiện tại và hiển thị trạng thái riêng trên từng dòng.

## 8. Bảng vấn đề và phương án xử lý

| STT | Vấn đề | Phương án xử lý cốt lõi | Ưu tiên |
|---:|---|---|---|
| 1 | Một biến trạng thái cho toàn modal | Quản lý trạng thái riêng cho từng dòng | Rất cao |
| 2 | Chưa có khóa ổn định để đối chiếu | Tạo `RecordKey` từ các trường nghiệp vụ đã chuẩn hóa | Rất cao |
| 3 | Chưa kiểm tra trùng ở server | Kiểm tra `RecordKey` trong vùng khóa trước khi ghi | Rất cao |
| 4 | Chưa có cách xem lại bản lưu | Đọc `DataHieuSuat` theo bộ lọc nghiệp vụ và hiển thị bản đã lưu | Rất cao |
| 5 | Không biết dòng nào đã lưu | Thêm cột trạng thái và badge theo từng dòng | Rất cao |
| 6 | Lưu một phần nhưng reset trạng thái toàn bảng | Server trả kết quả theo từng `RecordKey`; client chỉ cập nhật các dòng tương ứng | Rất cao |
| 7 | Không phát hiện bản tính đã khác bản lưu | Tạo `DataHash` để đối chiếu nội dung | Cao |
| 8 | `strCoChe` chưa được sử dụng khi lưu | Ghi cơ chế vào dữ liệu và đưa vào `RecordKey` | Cao |
| 9 | Ghi chú và loại thu nhập chưa được lưu | Truyền và lưu đầy đủ hai trường này | Cao |
| 10 | Thiếu thông tin truy vết | Thêm `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy` | Cao |
| 11 | Chưa có lịch sử cập nhật | Lưu bản hiện hành trong `DataHieuSuat`, bản cũ trong `HistoryHieuSuat` | Trung bình/Cao |
| 12 | Server chỉ trả kết quả chung | Trả kết quả từng dòng: thêm mới, cập nhật, bỏ qua, lỗi | Cao |
| 13 | Chưa xử lý rõ thành công một phần | Hiển thị số dòng thành công/thất bại và lý do cụ thể | Cao |
| 14 | `stateSave` dễ bị hiểu nhầm | Tách trạng thái DataTables khỏi trạng thái lưu nghiệp vụ | Trung bình |
| 15 | Checkbox chỉ biểu thị lựa chọn | Giữ checkbox để chọn; tạo cột trạng thái riêng | Cao |
| 16 | Cảnh báo đóng modal không xét từng dòng | Đếm các dòng chưa lưu, đã thay đổi và lỗi trước khi cảnh báo | Cao |
| 17 | Có thể đánh dấu chưa lưu trước khi tính xong | Chỉ khởi tạo trạng thái dòng sau khi dựng bảng thành công | Trung bình |
| 18 | Hai người có thể Submit đồng thời | Dùng `LockService` và kiểm tra lại key bên trong vùng khóa | Cao |
| 19 | Chưa xác thực payload trước khi ghi | Validate header, số cột, trường bắt buộc và kiểu dữ liệu ở server | Cao |
| 20 | Không phân biệt bản tính và bản chính thức | Bổ sung chế độ Bản đang tính, Bản đã lưu và Đối chiếu | Trung bình/Cao |

## 9. Trạng thái chuẩn theo từng dòng

| Mã trạng thái | Ý nghĩa | Hành vi |
|---|---|---|
| `UNSAVED` | Chưa có trong `DataHieuSuat` | Cho phép Submit |
| `SAVING` | Đang được server xử lý | Khóa thao tác Submit lại |
| `SAVED` | Bản hiện tại khớp bản đã lưu | Không cần Submit lại |
| `CHANGED` | Đã có bản lưu nhưng nội dung hiện tại khác | Cho phép cập nhật |
| `ERROR` | Lưu thất bại | Hiển thị lỗi và cho phép thử lại |

Có thể bổ sung `LOCKED` hoặc `APPROVED` khi phát sinh quy tắc khóa dữ liệu đã trình ký.

## 10. Khóa dữ liệu đề xuất

Khóa sơ bộ:

```text
Mã nhân sự
+ Kỳ nghiệm thu
+ Kỳ chi trả
+ Tên cơ chế
+ Loại thu nhập
```

Ví dụ:

```text
101563|T1.2026|T2.2026|CCL-ADM|HIEU_SUAT
```

Trước khi tạo key phải chuẩn hóa khoảng trắng, kiểu chữ và định dạng tháng. Không dùng họ tên làm thành phần định danh.

Cấu trúc dữ liệu nên có đồng thời:

- `RecordKey`: khóa nghiệp vụ để tìm kiếm và chống trùng.
- `RecordId`: UUID cố định của bản ghi.
- `DataHash`: dấu vân tay nội dung để phát hiện thay đổi.

**Điểm chưa chốt:** cần xác nhận bộ trường trên có bảo đảm một dòng duy nhất hay phải bổ sung mã hạng mục/ID nguồn.

## 11. Quy tắc lưu được khuyến nghị

Sử dụng mô hình **một bản hiện hành + lịch sử thay đổi**:

- `DataHieuSuat` giữ một bản hiện hành duy nhất theo `RecordKey`.
- `HistoryHieuSuat` giữ bản cũ trước mỗi lần cập nhật.
- Dòng chưa có key được thêm mới.
- Dòng có key và hash giống được bỏ qua vì không thay đổi.
- Dòng có key nhưng hash khác được cập nhật sau khi lưu bản cũ vào lịch sử.
- Mỗi bản hiện hành có `Version`, `UpdatedAt`, `UpdatedBy`.

## 12. Luồng xử lý mục tiêu

### Khi bấm Tính

1. Tính và dựng bảng thành công.
2. Tạo `RecordKey` và `DataHash` cho từng dòng.
3. Đọc các bản đã lưu tương ứng từ server.
4. Đối chiếu từng dòng thành `UNSAVED`, `SAVED` hoặc `CHANGED`.

### Khi bấm Submit

1. Chỉ lấy các dòng được chọn và có trạng thái hợp lệ để ghi.
2. Chuyển đúng các dòng đó sang `SAVING`.
3. Server dùng `LockService`, validate và kiểm tra lại key.
4. Server thêm mới, cập nhật hoặc bỏ qua theo quy tắc.
5. Server trả kết quả riêng theo từng `RecordKey`.
6. Client cập nhật chính xác từng dòng thành `SAVED` hoặc `ERROR`.
7. Hiển thị tổng kết số dòng thêm mới, cập nhật, không đổi và lỗi.

### Khi đóng modal

Kiểm tra trạng thái từng dòng thay cho biến Boolean chung. Cảnh báo phải nêu đúng số dòng `UNSAVED`, `CHANGED` và `ERROR` còn tồn tại.

### Khi xem lại

Cung cấp ba chế độ:

- **Bản đang tính**: kết quả mới nhất từ dữ liệu nguồn.
- **Bản đã lưu**: bản hiện hành trong `DataHieuSuat`.
- **Đối chiếu**: so sánh bản đang tính với bản đã lưu.

## 13. Thứ tự triển khai dự kiến

### Giai đoạn 1 — Nền tảng bắt buộc

1. Chốt cấu trúc `RecordKey` và schema dữ liệu.
2. Bổ sung validate, chống trùng và khóa đồng thời ở server.
3. Chuẩn hóa response theo từng dòng.
4. Thêm trạng thái theo từng dòng trên client.
5. Sửa cảnh báo đóng modal theo số dòng thực tế.
6. Lưu đầy đủ cơ chế, loại thu nhập, ghi chú và audit metadata.

### Giai đoạn 2 — Xem lại và đối chiếu

1. Bổ sung hàm đọc dữ liệu đã lưu.
2. Đối chiếu bằng `RecordKey`.
3. Phát hiện thay đổi bằng `DataHash`.
4. Thêm các chế độ Bản đang tính, Bản đã lưu và Đối chiếu.

### Giai đoạn 3 — Lịch sử

1. Tạo `HistoryHieuSuat`.
2. Quản lý version.
3. Hiển thị người lưu và thời gian cập nhật.
4. Bổ sung màn hình lịch sử nếu nghiệp vụ yêu cầu.

## 14. Nhật ký quyết định

| Ngày | Nội dung cốt lõi |
|---|---|
| 13/08/2026 | Xác nhận hệ thống hiện chưa xem lại được bản lưu và chưa theo dõi trạng thái từng dòng. |
| 13/08/2026 | Đề xuất dùng `RecordKey`, `RecordId`, `DataHash` và trạng thái riêng từng dòng. |
| 13/08/2026 | Khuyến nghị mô hình một bản hiện hành trong `DataHieuSuat` và bản cũ trong `HistoryHieuSuat`. |
| 13/08/2026 | Thống nhất duy trì file Markdown này sau mỗi câu hỏi/quyết định để chia nhỏ bước code nhưng vẫn nhất quán. |
| 13/08/2026 | Đã tạo skill cá nhân `$maintain-project-decisions`; khi được gọi, skill phải đọc toàn bộ tài liệu nguồn trong workspace trước khi làm và cập nhật nội dung cốt lõi sau mỗi câu hỏi/quyết định liên quan. |

## 15. Skill duy trì tính nhất quán

Skill cá nhân đã được tạo với tên:

```text
$maintain-project-decisions
```

Mục đích:

- Tự động tìm và đọc tài liệu này trước khi phân tích hoặc sửa code liên quan.
- Giữ nguyên các quyết định đã chốt giữa nhiều task và nhiều giai đoạn triển khai.
- Cập nhật yêu cầu, quyết định, điểm chưa chốt, ảnh hưởng kỹ thuật và nhật ký sau mỗi câu hỏi liên quan.
- Phân biệt rõ nội dung `Đã chốt`, `Đề xuất`, `Chưa chốt` và `Đã triển khai`.
- Không coi một phương án là đã chốt nếu người dùng chưa xác nhận.
- Không coi chức năng là đã triển khai nếu chưa kiểm tra mã nguồn.

Tài liệu trong workspace luôn là nguồn sự thật mới nhất; skill chỉ chứa quy trình duy trì và không giữ bản sao nội dung có thể lỗi thời.
