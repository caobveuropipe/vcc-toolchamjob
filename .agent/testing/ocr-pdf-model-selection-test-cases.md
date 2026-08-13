# Test Cases: Tích hợp đọc PDF và lựa chọn Model AI cho OCR

Bộ test cases chi tiết để xác thực luồng hoạt động, các trường hợp biên và các invariant bảo mật cho tính năng trích xuất thông tin OCR từ tài liệu PDF/Hình ảnh và chọn model AI.

---

## 1. Happy Path Test Cases (Luồng chạy thành công)

### TC-01: Đọc OCR thành công từ file ảnh (JPEG/PNG) bằng model mặc định
*   **Mô tả:** HR tải lên ảnh quyết định tiếp nhận (.png) và bấm "AI Đọc Giấy Tờ" mà không truyền model cụ thể.
*   **Các bước thực hiện:**
    1. Upload file ảnh quyết định lên hệ thống qua UI.
    2. Bấm nút "AI Đọc Giấy Tờ".
*   **Kết quả mong đợi:**
    *   API Backend `/documents/:id/ocr` trả về trạng thái 200 OK.
    *   Sử dụng model mặc định `gemini-3.5-flash`.
    *   Kết quả trả về JSON chứa đầy đủ các trường thông tin chung và lương đã được làm sạch.
    *   Cờ `cache_hit` trong `_ai_meta` trả về `false`.

### TC-02: Đọc OCR thành công từ file PDF với model Gemini
*   **Mô tả:** HR tải lên file PDF bảng lương (.pdf) dưới 5 trang và bấm "AI Đọc Giấy Tờ".
*   **Các bước thực hiện:**
    1. Upload file PDF hợp lệ 1 trang lên hệ thống.
    2. Bấm nút "AI Đọc Giấy Tờ".
*   **Kết quả mong đợi:**
    *   API Backend trả về 200 OK.
    *   Đọc thành công magic bytes PDF, đếm trang hợp lệ qua `pdf-parse`.
    *   Chuyển đổi thành công sang Base64 và gọi proxy AI trích xuất thông tin đầy đủ.
    *   Form được tự điền chính xác khi bấm nút "Tự điền thông tin".

### TC-03: Trả về kết quả từ Cache khi gọi lại cùng tài liệu & model
*   **Mô tả:** Đảm bảo kết quả OCR được cache lại trong DB để tránh phát sinh chi phí gọi AI nhiều lần.
*   **Các bước thực hiện:**
    1. Gọi API OCR lần 1 cho tài liệu `doc_A` với model `gemini-3.5-flash` -> Trả về kết quả mới.
    2. Gọi lại API OCR lần 2 cho tài liệu `doc_A` với cùng model `gemini-3.5-flash`.
*   **Kết quả mong đợi:**
    *   Lần 2 trả về 200 OK ngay lập tức (không gọi sang AI proxy).
    *   Cờ `cache_hit` trong `_ai_meta` trả về `true`.

---

## 2. Edge Cases (Trường hợp biên)

### TC-04: PDF có số trang vượt quá giới hạn (PDF Guardrail)
*   **Mô tả:** HR tải lên tệp PDF quá dài nhằm bảo vệ tài nguyên hệ thống và chi phí token.
*   **Các bước thực hiện:**
    1. Tải lên tệp PDF có 6 trang.
    2. Bấm nút "AI Đọc Giấy Tờ".
*   **Kết quả mong đợi:**
    *   API Backend trả về trạng thái 400 Bad Request.
    *   Thông điệp lỗi trả về: `File PDF vượt quá giới hạn 5 trang`.

### TC-05: Tệp tin giả mạo đuôi mở rộng PDF
*   **Mô tả:** Tệp tin tải lên có đuôi là `.pdf` nhưng nội dung thực tế là ảnh hoặc file text đổi tên.
*   **Các bước thực hiện:**
    1. Đổi đuôi một file text `hello.txt` thành `hello.pdf` và upload lên hệ thống.
    2. Bấm nút "AI Đọc Giấy Tờ".
*   **Kết quả mong đợi:**
    *   API Backend chặn lại ngay tại bước kiểm tra Magic Bytes và trả về trạng thái 400 Bad Request.
    *   Thông điệp lỗi: `Định dạng PDF không hợp lệ (Sai magic bytes)`.

### TC-06: Bỏ qua cache khi thay đổi model AI hoặc phiên bản Prompt
*   **Mô tả:** Đảm bảo hệ thống nạp lại kết quả AI mới nếu người dùng thay đổi model hoặc prompt version thay đổi.
*   **Các bước thực hiện:**
    1. Gọi OCR tài liệu `doc_A` với model `gemini-3.5-flash` -> Lưu cache thành công.
    2. Gọi lại OCR tài liệu `doc_A` nhưng đổi sang model `gemini-2.5-flash`.
*   **Kết quả mong đợi:**
    *   Backend nhận diện model khác cache cũ, bỏ qua cache và gọi trực tiếp AI proxy để lấy kết quả mới.
    *   Cập nhật lại `ocr_result` trong DB với thông tin model mới.

---

## 3. Negative & Security Test Cases (Lỗi và Bảo mật)

### TC-07: Model không nằm trong allowlist (Model Validation)
*   **Mô tả:** Kẻ tấn công hoặc client gửi request yêu cầu sử dụng một model AI đắt đỏ không được phép (ví dụ `gpt-4o` hoặc `gpt-5.4`).
*   **Các bước thực hiện:**
    1. Gửi request POST tới endpoint `/api/documents/:id/ocr` với body `{"model": "gpt-4o"}`.
*   **Kết quả mong đợi:**
    *   Backend validate schema thất bại và trả về trạng thái 400 Bad Request.
    *   Thông điệp lỗi trả về rõ ràng: `Model không được hỗ trợ hoặc không hợp lệ`.

### TC-08: Redact dữ liệu nhạy cảm trong log lỗi AI (PII/Base64 Redaction)
*   **Mô tả:** Khi AI proxy trả về lỗi 4xx/5xx có chứa base64 payload của ảnh, logger phải tự động ẩn đi để tránh rò rỉ dữ liệu lên Cloud Logging.
*   **Các bước thực hiện:**
    1. Giả lập AI proxy trả về lỗi 400 với thông điệp chứa chuỗi base64 dài.
    2. Kiểm tra log hệ thống.
*   **Kết quả mong đợi:**
    *   Trong logs, phần `error` hoặc `rawContent` đã được che bằng cụm `[BASE64_PAYLOAD]` và chỉ giữ lại thông điệp lỗi ngắn gọn.

### TC-09: Xử lý timeout khi gọi AI proxy quá lâu (AbortController 30s)
*   **Mô tả:** Tránh treo kết nối server nếu AI proxy bị nghẽn mạng.
*   **Các bước thực hiện:**
    1. Giả lập mạng bị trễ > 30 giây khi gọi completions.
*   **Kết quả mong đợi:**
    *   Request bị ngắt kết nối chính xác ở giây thứ 30.
    *   Backend trả về trạng thái 504 Gateway Timeout với thông điệp: `Yêu cầu gọi AI OCR bị quá thời gian (Timeout 30s)`.
