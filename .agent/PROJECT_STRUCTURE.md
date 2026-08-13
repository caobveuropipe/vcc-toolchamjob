# Project Structure - Module hiệu suất (Tool thu nhập VCC)

> Tạo ngày: 2026-08-13  
> Cập nhật gần nhất: 2026-08-13  
> Mục đích: Lưu snapshot cấu trúc codebase để AI có thể onboard và resume nhanh.

---

## 1. Snapshot cây thư mục

```text
Module hiệu suất/
|-- .agent/                             # Bộ não dự án (docs, skills, plans)
|   |-- CONTEXT.md                      # Bản đồ onboard & quick navigation
|   |-- PROJECT_STRUCTURE.md            # Document này
|   |-- KNOWLEDGE_BASE.md               # Lưu các quyết định kiến trúc chiến lược
|   |-- architecture/
|   |   |-- MASTER.md                   # Kiến trúc tổng thể hệ thống GAS
|   |-- changelog/
|   |   |-- CHANGELOG-FE.md             # Lịch sử thay đổi Frontend UI
|   |   |-- CHANGELOG-BE.md             # Lịch sử thay đổi Backend GAS
|   |-- skills/                         # Skill pack hỗ trợ AI Agent
|-- client/                             # Module Web Application (Google Apps Script UI)
|   |-- .clasp.json                     # Cấu hình Clasp Script ID & Deployment ID cho Client
|   |-- appsscript.json                 # Manifest GAS Client (scopes, timeZone, webapp config)
|   |-- Approval_Client.html            # Main HTML template cho Web App
|   |-- Approval_Server.js              # Server-side GAS script (Phê duyệt, Phân quyền, DB interaction)
|   |-- general.js / generalLibrary.html# Common library & utilities
|   |-- pg_general_*.html               # Trang giao diện tổng quan, filter, quick sum
|   |-- modal_*.html / modal_*.js       # Các modal chức năng (Phê duyệt, Phân quyền, Tờ trình, Tổng hợp hiệu suất, So sánh...)
|   |-- FLOW_APPROVAL.md                # Quy trình phê duyệt nghiệp vụ
|   |-- PIPELINE.md                     # Tài liệu pipeline dữ liệu
|-- doPost/                             # Module API Endpoint (Google Apps Script doPost)
|   |-- .clasp.json                     # Cấu hình Clasp Script ID cho doPost
|   |-- appsscript.json                 # Manifest GAS doPost
|   |-- Code.js                         # Endpoint nhận payload HTTP POST
|-- deploy-all.ps1                      # Automated deploy script (local backup + clasp version + clasp deploy)
|-- push-all.ps1                        # Sync code local -> GAS cloud
|-- pull-all.ps1                        # Sync code GAS cloud -> local
```

## 2. Entry Points

| Loại | File/Path | Vai trò | Ghi chú |
|------|-----------|---------|---------|
| Frontend Web UI | [`client/Approval_Client.html`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/Approval_Client.html) | Bootstrap Web App UI | Được load qua `doGet()` |
| Backend Server Logic | [`client/Approval_Server.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/Approval_Server.js) | Server-side GAS handlers | Chứa các hàm `google.script.run` |
| Webhook / API Endpoint | [`doPost/Code.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/doPost/Code.js) | Tiếp nhận HTTP POST API | Xử lý payload gửi từ bên ngoài |
| Deploy Automation | [`deploy-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/deploy-all.ps1) | Quản lý backup local & release | Tự động tạo backup theo timestamp |

## 3. Services / Modules chính

| Module/Service | Path | Trách nhiệm | Phụ thuộc chính |
|----------------|------|-------------|------------------|
| Client Web App | `client/` | Cung cấp giao diện phê duyệt, quản lý tờ trình, tổng hợp hiệu suất và phân quyền | Google Apps Script HTML Service, SpreadsheetApp |
| Webhook API Service | `doPost/` | Tiếp nhận và ghi nhận các dữ liệu đẩy vào từ hệ thống bên ngoài | Google Apps Script Web App (doPost) |
| Clasp Deployment Automation | `./` (`*.ps1`) | Đồng bộ code và thực hiện deployment nhất quán giữa local và Google Cloud Script | `@google/clasp`, PowerShell |

## 4. Config / Infra quan trọng

| File | Nhóm | Ý nghĩa | Lưu ý khi chỉnh sửa |
|------|------|---------|---------------------|
| [`client/.clasp.json`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/.clasp.json) | Deploy | Chứa `scriptId` và `deploymentId` của client module | Không commit lầm scriptId của env khác |
| [`doPost/.clasp.json`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/doPost/.clasp.json) | Deploy | Chứa `scriptId` và `deploymentId` của doPost module | Không xóa file `.clasp.json` |
| [`client/appsscript.json`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/appsscript.json) | Manifest | Khai báo OAuth Scopes, execution API & runtime version | Cần cẩn trọng khi thêm OAuth Scopes |

## 5. Commands

| Mục đích | Lệnh | Điều kiện | Ghi chú |
|----------|------|-----------|---------|
| Push code local -> cloud | `.\push-all.ps1` | Đã install `clasp` toàn cục hoặc local | Push cả client & doPost |
| Pull code cloud -> local | `.\pull-all.ps1` | Đã login clasp (`clasp login`) | Tránh đè code chưa commit |
| Backup & Deploy toàn bộ | `.\deploy-all.ps1` | Quyền chạy PowerShell script | Tự động tạo thư mục backup local |

## 6. Luồng đọc nhanh cho AI

- Khi sửa UI Client (HTML/JS): đọc [`client/Approval_Client.html`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/Approval_Client.html) và các file `client/modal_*.html`.
- Khi sửa Backend Server GAS logic: đọc [`client/Approval_Server.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/Approval_Server.js).
- Khi sửa Webhook API doPost: đọc [`doPost/Code.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/doPost/Code.js).
- Khi sửa quy trình Deploy/Release: đọc [`deploy-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/deploy-all.ps1).

## 7. Ghi chú từ lần quét

- Package Manager / Tooling: `@google/clasp`, PowerShell scripts.
- Kiểu repo: Multi-project Google Apps Script (client + doPost).
- Điểm dễ nhầm: Mỗi folder (`client`, `doPost`) là một Google Apps Script project riêng với `.clasp.json` độc lập.
