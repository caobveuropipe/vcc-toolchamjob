# TÀI LIỆU QUY TRÌNH TRÌNH KÝ VÀ DUYỆT TỜ TRÌNH (APPROVAL FLOW)

**LƯU Ý QUAN TRỌNG: KHÔNG ĐƯỢC TỰ Ý GỌI TERMINAL HAY COMMAND LINE TRONG QUÁ TRÌNH THỰC HIỆN.**

Tài liệu này mô tả chi tiết quy trình người dùng trình ký và quy trình lãnh đạo phê duyệt tờ trình trong **Module Hiệu suất**. Tài liệu này dùng để tham chiếu logic nghiệp vụ và ghi lại các thay đổi liên quan đến luồng duyệt.

---

## 1. Quy trình Chi tiết (Cập nhật mới nhất)

### A. Luồng Trình Ký (Người dùng submit)

**Bước 1: Chuẩn bị dữ liệu**
*   Người dùng vào modal **Tổng hợp hiệu suất**.
*   Thực hiện các thao tác: Chọn *Kỳ trả lương*, *Kỳ nghiệm thu*, *Loại hiệu suất*.
*   Bấm nút **Tính** -> Chọn dòng nhân sự/bộ phận muốn trình ký.
*   Chọn **Loại tờ trình** (Hiệu suất/Thưởng) -> Bấm nút **Trình ký**.

**Bước 2: Kiểm tra và Gửi duyệt**
*   Modal Tờ trình hiện ra (Preview). Người dùng kiểm tra lại số liệu.
*   Bấm nút **Gửi duyệt**.
*   **Hệ thống kiểm tra trạng thái của tờ trình này (dựa trên Key định danh):**
    *   **Tình huống 1 (Chưa từng gửi):** Hệ thống cho phép gửi -> Chuyển sang Bước 3.
    *   **Tình huống 2 (Đã duyệt):** Hệ thống thông báo *"Tờ trình này đã được phê duyệt"*. **Chặn**, không cho gửi lại.
    *   **Tình huống 3 (Đã gửi nhưng bị Từ chối):**
        *   Hệ thống cho phép gửi lại (tạo tờ trình mới). -> Chuyển sang Bước 3.
        *   Đồng thời hiển thị nút **"Xem lịch sử từ chối"** để người dùng biết lý do các lần trước.
    *   **Tình huống 4 (Đang chờ duyệt):**
        *   Hệ thống phát hiện đã có tờ trình đang chờ duyệt.
        *   Hiển thị thông báo hỏi người dùng:
            *   **Xem lại:** Tải dữ liệu của tờ trình đã gửi đó để xem lại nội dung.
            *   **Ghi đè:** Hủy tờ trình cũ và thay thế bằng nội dung hiện tại -> Chuyển sang Bước 3.
            *   **Hủy:** Không làm gì cả.

**Bước 3: Nhập thông tin người duyệt**
*   Popup yêu cầu nhập:
    *   **Email người duyệt:** (Có gợi ý từ danh sách Admin/Lãnh đạo).
    *   **Vị trí ký duyệt:** (Ví dụ: Lãnh đạo phê duyệt, Trưởng BP...).
*   **Lưu ý:** Bỏ bước popup xác nhận *"Bạn có chắc chắn muốn gửi?"* (để giảm thao tác thừa). Bấm là gửi luôn.

---

### B. Luồng Ký Duyệt (Lãnh đạo duyệt)

**Nguyên tắc hiển thị thông báo (Notification):**
*   Hệ thống chỉ hiển thị thông báo (số lượng chờ duyệt) cho **đúng tài khoản Email được chỉ định duyệt**.
*   Những người không liên quan (không được assign) sẽ không thấy thông báo này.

**Bước 1: Vào danh sách**
*   Người dùng (Lãnh đạo) mở modal **Danh sách chờ duyệt**.

**Bước 2: Xem chi tiết**
*   Bấm vào icon **Mắt (Xem)** trên dòng tờ trình cần xử lý.
*   **Tính năng bổ sung:** Nếu tờ trình này là bản gửi lại sau khi bị từ chối nhiều lần trước đó:
    *   Hiển thị thông báo (hoặc badge): *"Có X lần bị từ chối trước đây"*.
    *   Cung cấp nút **"Xem lịch sử từ chối"** để lãnh đạo tham khảo lý do cũ.

**Bước 3: Ra quyết định**
*   Lãnh đạo nhập **Ghi chú** (nếu cần).
*   Bấm **Phê duyệt** (Ký số, đóng dấu) HOẶC **Từ chối** (Nhập lý do bắt buộc).

---

## 2. Phân tích & Phương án Triển khai (Technical Plan)

Để đáp ứng luồng nghiệp vụ trên, dưới đây là phương án kỹ thuật dự kiến:

### 2.1. Định danh Tờ trình (Unique Key Formulation)
Để thực hiện việc kiểm tra ở **Bước 2 (Luồng trình ký)**, ta cần một "Key" để biết tờ trình này là tờ trình nào.
*   **Cấu trúc Key:** `LoaiToTrinh` + `KyLuong` + `BoPhan` + `Khoi`.
    *   *Ví dụ:* `TOTRINH_HIEUSUAT_T11-2024_P.TECH_K.CONGNGHE`
*   **Logic lưu trữ:** Mỗi lần gửi là một dòng mới (Record mới) trong Database, nhưng dùng chung các trường thông tin trên để truy vấn lịch sử.

### 2.2. Logic Server (Approval_Server.js)
1.  **Hàm `sv_checkProposalStatus(payload)`**:
    *   **Input:** Thông tin tờ trình (Loại, Kỳ, Bộ phận, Khối).
    *   **Xử lý:** Quét toàn bộ sheet `ToTrinh_Main`, lọc ra các dòng khớp với Input.
    *   **Output:** Trả về Object chưa:
        *   `status`: 'NEW' (chưa có), 'APPROVED' (đã có bản duyệt), 'REJECTED' (bản mới nhất bị từ chối), 'PENDING' (đang có bản chờ duyệt).
        *   `history`: Danh sách các lần từ chối trước đó (Ngày, Người từ chối, Lý do).
2.  **Hàm `sv_submitProposal`**:
    *   Giữ nguyên logic tạo dòng mới. Tờ trình bị từ chối gửi lại sẽ sinh ra `ID_ToTrinh` mới (để lưu vết riêng), nhưng nội dung Key vẫn khớp cũ.

### 2.3. Logic Client (Approval_Client / modal_totrinh_3)
1.  **Sự kiện click "Gửi duyệt"**:
    *   Gọi `sv_checkProposalStatus` trước.
    *   Nếu `APPROVED`: `Swal.fire` báo lỗi, return.
    *   Nếu `PENDING`: Cảnh báo "Đang có tờ trình chờ duyệt, bạn có muốn gửi đè/gửi thêm không?".
    *   Nếu `REJECTED` hoặc `NEW`: Mở popup nhập người duyệt (Bước 3).
2.  **Giao diện "Lịch sử từ chối"**:
    *   Thêm nút (Button) nhỏ cạnh tiêu đề hoặc dưới footer.
    *   Click vào hiển thị Modal/List danh sách lý do và ngày giờ từ chối cũ.

---

## 3. Cấu trúc Dữ liệu & File liên quan
*   **Database**: Google Sheet (File ID: `ID_FILE_TOTRINH`).
*   **File xử lý chính**: `Approval_Server.js`, `Approval_Client.html`, `modal_totrinh_3.html`.

---

## 4. Lịch sử Thay đổi (Changelog)

| Ngày | Người thực hiện | Nội dung Thay đổi |
| :--- | :--- | :--- |
| **2025-12-22** | Antigravity | Cập nhật tài liệu theo yêu cầu mới: Logic check trạng thái trước khi gửi, bỏ bước confirm thừa, thêm tính năng xem lịch sử từ chối. |

---
**END OF DOCUMENT**
