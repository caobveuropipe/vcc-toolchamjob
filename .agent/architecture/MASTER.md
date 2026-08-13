---
description: Kiến trúc tổng thể của dự án Module hiệu suất (Tool thu nhập VCC)
last_updated: 2026-08-13
---

# Module hiệu suất - Architecture Master

## Tổng quan kiến trúc

```text
               ┌───────────────────────────────┐
               │    Google Workspace / Sheet   │
               └───────────────┬───────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│     Module: client      │           │     Module: doPost      │
│  Google Apps Script UI  │           │   Google Apps Script    │
│  HTML Service / Modals  │           │  HTTP POST API Endpoint │
│  Approval_Server.js     │           │  Code.js                │
└───────────┬─────────────┘           └───────────┬─────────────┘
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
               ┌───────────────────────────────┐
               │     Clasp / Deployment CLI    │
               │   push-all / deploy-all.ps1   │
               └───────────────────────────────┘
```

---

## 1. Thành phần hệ thống

### A. Module Client (`client/`)
- **Giao diện Web App**: Sử dụng HTML Service của Google Apps Script, render dynamic HTML template (`Approval_Client.html`) kết hợp với CSS/JS và các modal component (`modal_*.html`, `modal_*.js`).
- **Xử lý Backend GAS**: File `Approval_Server.js` chứa các hàm server-side thực hiện phê duyệt, tra cứu, tổng hợp hiệu suất và làm việc với Google Sheet DB.

### B. Module doPost (`doPost/`)
- **API Hook Service**: Cung cấp hàm `doPost(e)` nhận payload HTTP POST từ các hệ thống hoặc workflow tự động bên ngoài.
- **Cách ly môi trường**: Thiết lập dự án GAS riêng biệt giúp giới hạn scope OAuth và phân quyền bảo mật API độc lập với Web UI.

### C. Quản lý mã nguồn & Release (`deploy-all.ps1`, `push-all.ps1`, `pull-all.ps1`)
- **@google/clasp**: Quản lý sync code hai chiều giữa file local (`.js`, `.html`, `.json`) và Google Apps Script Cloud.
- **PowerShell Automation**: Tự động tạo bản lưu trữ local `backup/<timestamp>` trước khi đẩy code (`clasp version`, `clasp deploy`) lên môi trường production.

---

## 2. Quy trình dữ liệu & Luồng làm việc (Data & Workflow)

1. **Phê duyệt & Nghiệp vụ (Client Web App)**:
   - Người dùng truy cập qua link Web App GAS -> Load `Approval_Client.html`.
   - Trình duyệt tương tác với server GAS qua `google.script.run`.
   - Backend `Approval_Server.js` kiểm tra quyền, xử lý dữ liệu và cập nhật dữ liệu.

2. **Tiếp nhận dữ liệu tự động (doPost API)**:
   - Hệ thống bên ngoài gửi HTTP POST request đến Web App URL của `doPost`.
   - `Code.js` parse JSON payload, kiểm tra xác thực và lưu vết.
