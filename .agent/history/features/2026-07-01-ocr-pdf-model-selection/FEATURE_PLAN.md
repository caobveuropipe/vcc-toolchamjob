# Feature Plan: Tích hợp đọc PDF và lựa chọn Model AI cho OCR

> **Trạng thái**: ✅ ĐÃ DUYỆT
> **Review gate**: Đã thông qua Expert Review (Round 5 hội tụ)
> **Feature slug**: ocr-pdf-model-selection
> **Tạo bởi**: feature-plan
> **Ngày tạo**: 2026-07-01

---

## 1. Bối cảnh và mục tiêu

- **Bối cảnh:** Hiện tại tool HR VCC sử dụng dịch vụ AI OCR (OpenAI proxy qua `proxycli.playai.vn`) để trích xuất dữ liệu từ các chứng từ lương / tuyển dụng. Tuy nhiên, hệ thống hiện tại bị giới hạn:
  - Chỉ cho phép tải lên và xử lý các định dạng ảnh (`image/jpeg`, `image/png`, `image/webp`).
  - Model AI đang bị hardcode cứng là `gpt-5.4` (hoặc model mặc định của proxy), người dùng không thể tự chọn model rẻ hơn hoặc thông minh hơn (như `gpt-4o-mini`, `gemini-1.5-flash`, v.v.).
- **Vấn đề cần giải quyết:** 
  - Mở rộng hỗ trợ đọc các file tài liệu dạng **PDF** (thường là định dạng phổ biến của quyết định tuyển dụng, bảng lương xuất ra).
  - Cho phép người dùng tùy chọn Model từ giao diện trước khi thực hiện gọi AI OCR.
- **Mục tiêu:**
- **Mục tiêu:**
  - Frontend cho phép tải lên file PDF (mime type `application/pdf`).
  - API Backend `/api/documents/:id/ocr` xử lý file PDF (áp dụng adapter động theo MIME type sau khi đã probe thành công; chỉ hỗ trợ PDF native thông qua proxy, không thực hiện fallback render từng trang thành ảnh để tránh thêm thư viện native phức tạp). Cố định model tối ưu nhất ở backend (mặc định là `gemini-3.5-flash`, fallback là `gemini-2.5-flash` hoặc `gpt-4o-mini` nếu proxy chưa hỗ trợ định danh mới). <!-- Sửa theo EFR-01: Đảm bảo payload PDF hợp lệ --> <!-- Sửa theo EFR-03: Thêm backend model validation --> <!-- Sửa theo EFR-06: Đưa fallback render PDF thành out of scope -->
- **Kết quả mong đợi:** Người dùng có thể upload file PDF, nhấn "AI Đọc Giấy Tờ" và nhận về kết quả JSON đã trích xuất thành công. Cache kết quả được lưu và kiểm tra hợp lệ theo model cấu hình và prompt_version để tránh trả cache sai nếu backend đổi model. <!-- Sửa theo EFR-02: Thiết lập cache hợp lệ theo model -->



## 2. Phạm vi

### In scope
- **Frontend:**
  - Cập nhật [DocumentUpload.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/DocumentUpload.tsx) để chấp nhận định dạng `.pdf` (mime type `application/pdf`).
  - Gửi request lên API `/api/documents/${docId}/ocr` (không cần truyền model từ FE, backend tự quyết định).
- **Backend:**
  - Cập nhật route [documents.ts](file:///d:/ToolNhanSuVcc/backend/src/routes/documents.ts) để gọi `processDocumentOCR` với cấu hình mặc định.
  - Cập nhật [ocrService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/ocrService.ts):
    - Hỗ trợ xử lý tệp PDF: tải về từ R2, kiểm tra số trang bằng `pdf-parse`, chuyển thành base64 với MIME type `application/pdf` và truyền sang Vision API.
    - Cố định sử dụng model tối ưu (mặc định `gemini-3.5-flash` hoặc các model fallback đã probe thành công) được cấu hình tập trung ở backend.



### Out of scope
- Trích xuất nội dung văn bản (text parsing) offline từ file PDF trên server backend (do không có thư viện parse PDF cài sẵn).
- Quản lý/Thêm bớt danh sách model động từ database (chỉ hardcode danh sách model thông dụng ở Frontend/Backend config).
- Fallback render tài liệu PDF thành từng ảnh trang đơn (để tránh phải cài đặt các thư viện hệ thống cồng kềnh như canvas/poppler trên Cloud Run Docker image). Hỗ trợ PDF sẽ hoàn toàn phụ thuộc vào việc kiểm chứng API native của proxy. <!-- Sửa theo EFR-06: Fallback render PDF ra ngoài scope -->


## 3. Đối chiếu Knowledge Base

- **Quyết định kế thừa:**
  - `[2026-04-01] AI OCR Base64 Strategy`: Tiếp tục truyền file dưới dạng Base64 data URI để tránh lỗi Egress/DNS của proxy.
  - `[2026-04-15] AI OCR Streaming Strategy`: Tiếp tục sử dụng `stream: true` khi gọi OpenAI Vision qua proxy để tránh lỗi trả về `content: null` ở chế độ non-streaming.
- **"Cấm kỵ" cần tránh:**
  - Không được phá vỡ cấu trúc JSON trả về của OCR.
  - Không lưu thông tin nhạy cảm vào log hệ thống (bao gồm việc log raw error body từ OCR provider/proxy, phải redact/truncate thông tin PII/base64 payload). <!-- Sửa theo EFR-08: Redact error body log -->


## 4. Giả định và câu hỏi mở

### Giả định
- Máy chủ proxy `proxycli.playai.vn` và các model đích hỗ trợ xử lý input có kiểu dữ liệu `application/pdf` truyền qua cấu trúc API tương thích. Việc này sẽ được xác nhận thông qua task probe trước khi bắt đầu code core logic. <!-- Sửa theo EFR-01: Spike task xác nhận proxy contract -->

### Thiết kế Giới hạn & An toàn (PDF Guardrails) <!-- Sửa theo EFR-05: Giới hạn an toàn PDF -->
- **Giới hạn số trang:** Tối đa 5 trang cho mỗi file PDF để tránh quá tải token và chi phí. Để đếm số trang một cách chính xác và an toàn trên môi trường production, dự án sẽ tích hợp thư viện `pdf-parse` (thư viện thuần JavaScript, không yêu cầu native system binary hay dependency cồng kềnh như canvas/poppler). <!-- Sửa theo EFR-09: Tích hợp thư viện lightweight để đếm trang PDF -->
- **Xác thực định dạng:** Kiểm tra magic bytes của PDF (`%PDF-`) thay vì chỉ tin vào MIME type từ client.
- **Timeout/Cancel:** Thiết lập timeout 30 giây sử dụng `AbortController` khi request tới proxy.
- **Bộ nhớ đệm:** Stream dữ liệu hoặc tối ưu hóa quá trình chuyển base64 để tránh peak memory trên Cloud Run (giới hạn 512MiB).



## 5. Acceptance Criteria

- [ ] File PDF tải lên thành công và hiển thị trong danh sách tài liệu minh chứng của Frontend.
- [ ] Khi click "AI Đọc Giấy Tờ", hệ thống tự động sử dụng cấu hình model tối ưu cố định (`gemini-3.5-flash` hoặc model fallback được chọn ở cấu hình backend).

- [ ] Nếu model cấu hình ở backend thay đổi so với model đã lưu trong cache, hệ thống sẽ thực hiện cuộc gọi OCR mới và cập nhật cache tương ứng. <!-- Sửa theo EFR-02: Rerun khi đổi model cấu hình -->
- [ ] AI xử lý thành công file PDF dạng base64 gửi trực tiếp đến proxy và trả về JSON kết quả đúng schema cùng metadata `_ai_meta` gồm `provider`, `model`, `prompt_version`, `cache_hit`. <!-- Sửa theo EFR-01: Định dạng payload và EFR khuyến nghị --> <!-- Sửa theo EFR-06: Bỏ fallback ảnh ở AC -->
- [ ] Các loại file ảnh (.png, .jpg, .webp) vẫn hoạt động hoàn hảo như cũ.
- [ ] File PDF vượt quá 5 trang hoặc sai magic bytes hoặc request bị timeout (>30s) được bắt và trả về thông báo lỗi chi tiết cho user. <!-- Sửa theo EFR-05: Validation giới hạn PDF -->
- [ ] API OCR giữ tương thích ngược hoàn toàn, hoạt động bình thường kể cả khi request không gửi kèm JSON body hoặc body rỗng. <!-- Sửa theo EFR-07: Bảo toàn backward compatibility -->




## 6. Files và modules bị ảnh hưởng

| File/Module | Hành động | Lý do chạm vào | Rủi ro | Contract |
|-------------|-----------|----------------|--------|----------|
| [DocumentUpload.tsx](file:///d:/ToolNhanSuVcc/frontend/src/components/DocumentUpload.tsx) | Sửa | Cho phép chọn PDF, thêm Dropdown chọn Model và gửi request kèm model. | 🟢 Thấp | Chưa |
| [documents.ts](file:///d:/ToolNhanSuVcc/backend/src/routes/documents.ts) | Sửa | Nhận biến `model` từ body gửi từ FE và truyền cho service OCR. | 🟢 Thấp | Có |
| [ocrService.ts](file:///d:/ToolNhanSuVcc/backend/src/services/ocrService.ts) | Sửa | Hỗ trợ mime type `application/pdf`, nhận động `model` trong API payload. Tích hợp `pdf-parse` để validate trang. | 🟡 Trung bình | Có |
| `backend/package.json` | Sửa | Thêm dependency `pdf-parse` làm thư viện lightweight để đọc metadata trang PDF. | 🟢 Thấp | Không |
| [pnpm-lock.yaml](file:///d:/ToolNhanSuVcc/pnpm-lock.yaml) | Sửa | Cập nhật lock file ở repo root khi cài đặt `pdf-parse`. <!-- Sửa theo EFR-10: Sửa vị trí lockfile trong monorepo --> | 🟢 Thấp | Không |



## 7. Risk Triage và Review Focus

- **Review required:** Yes
- **Risk hotspots:** Khả năng tương thích của Proxy với định dạng `application/pdf` truyền qua `image_url`. Nếu proxy từ chối định dạng PDF, cần có phương án fallback hoặc điều chỉnh cách truyền payload.
- **Review focus areas:** Cách cấu trúc payload gửi đến AI khi tệp tin là PDF.

## 8. Chiến lược triển khai

- **Phase strategy:**
  - **Phase 1: Backend Update** - Cập nhật API nhận tham số model và hỗ trợ xử lý PDF. Viết test script kiểm tra.
  - **Phase 2: Frontend Integration** - Cho phép upload file PDF, hiển thị dropdown chọn Model và gọi API.
- **Thứ tự triển khai:** Backend trước, Frontend sau.

## 9. Test Strategy

- **Automated tests:** <!-- Sửa theo EFR-04: Test Strategy robust -->
  - Viết unit tests mock `fetch` để kiểm tra payload gửi đi đối với ảnh và PDF (bao gồm cả stream collector).
  - Viết contract tests cho route để kiểm tra các trường hợp: model hợp lệ, không hợp lệ, không truyền model, và request hoàn toàn không có body. <!-- Sửa theo EFR-07: Test request ko body -->
  - Viết tests cho cache validator (lần đầu, cùng model, đổi model, prompt version thay đổi).
  - Viết tests cho các điều kiện biên của PDF: file > 5 trang, magic bytes giả mạo, timeout và lỗi API.
  - Viết unit test giả lập provider/proxy trả về lỗi (non-2xx) để kiểm chứng logger đã redact/truncate error body thành công, không lưu thông tin nhạy cảm hoặc base64 string. <!-- Sửa theo EFR-08: Test redact logging -->
  - Live integration test thật với proxy được cấu hình như một test suite opt-in riêng biệt (phải fail thật khi chạy nếu có lỗi).

- **Manual verification:**
  - Tải lên 1 file PDF và 1 file ảnh trên giao diện, chọn các model khác nhau và kiểm tra xem dữ liệu có được tự điền vào Form chính xác hay không.


## 10. Rollback Plan

- Revert các thay đổi trên Git của `DocumentUpload.tsx`, `documents.ts`, `ocrService.ts`, `backend/package.json` và `pnpm-lock.yaml` ở repo root. <!-- Sửa theo EFR-10: Rollback root lockfile -->



## 11. Tham chiếu thực thi

- Checklist chi tiết theo phase: `FEATURE_TASKS.md`
