# .agent/KNOWLEDGE_BASE.md - Bộ não của dự án Module hiệu suất (Tool thu nhập VCC)

Lưu trữ những **quyết định kiến trúc** quan trọng và **lý do chiến lược** của dự án.

> ⚠️ **QUY TẮC GHI:**
> - Chỉ ghi quyết định kiến trúc và lý do chiến lược (high-level decisions)
> - Tuyệt đối tránh liệt kê tính năng, changelog chi tiết, hoặc mô tả cấu hình thuần túy
> - Mỗi dòng phải trả lời được câu hỏi: "Tại sao chúng ta quyết định làm vậy?"

---

## Initial Decisions From Repo Scan

- [2026-08-13] Phân tách thành 2 dự án Google Apps Script độc lập (`client` và `doPost`) riêng biệt với 2 file `.clasp.json` khác nhau. Why: Để cô lập hoàn toàn giữa luồng giao diện người dùng Web App UI (`client`) và webhook tiếp nhận API POST độc lập (`doPost`), tránh ảnh hưởng permissions và quota giữa UI và API.
- [2026-08-13] Sử dụng PowerShell scripts (`deploy-all.ps1`, `push-all.ps1`, `pull-all.ps1`) kết hợp `@google/clasp`. Why: Tự động hóa quá trình sync và deploy cho multi-module GAS, đồng thời bắt buộc tạo bản backup mã nguồn local theo timestamp trước mỗi lần release clasp deploy.
- [2026-08-13] Kiến trúc UI Modularization bằng HTML templates (`modal_*.html`, `pg_general_*.html`). Why: Tách nhỏ giao diện phức tạp thành các file modal/page chuyên biệt trong GAS HTML Service giúp dễ bảo trì và tối ưu tốc độ render.

---

## Ongoing Decisions

- [2026-08-13] Áp dụng Strict Preflight Check (`APP_ENV`) & Fail-Closed cho API Key, kết hợp Object Array Schema khi tích hợp API HR Backend Snapshot. Why: Đảm bảo an toàn môi trường production, ngăn chặn nguy cơ rò rỉ hoặc fallback nhầm sang dev URL, đồng thời loại bỏ hoàn toàn rủi ro vỡ layout/sai lệch chỉ số cột mảng 2D legacy khi schema API nâng cấp.

