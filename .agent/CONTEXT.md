# Module hiệu suất (Tool thu nhập VCC) - Context for AI Assistants

---

## 1. Project Overview

- **Tên dự án**: Module hiệu suất - Tool thu nhập VCC
- **Repo**: Local Workspace (`d:/Project_VCC/Tool thu nhập/Module hiệu suất`)
- **Trạng thái**: Reconciled & Operating (Google Apps Script multi-project setup)

### Tech Stack
- **Frontend / Web UI**: Google Apps Script HTML Service (HTML, CSS, JS Vanilla, Antd/Bootstrap components inside GAS modals)
- **Backend / API**: Google Apps Script JavaScript (`Approval_Server.js`, `doPost/Code.js`)
- **Deployment & Sync**: `@google/clasp` CLI, PowerShell scripts (`deploy-all.ps1`, `push-all.ps1`, `pull-all.ps1`)
- **Module Architecture**:
  - `client/`: Giao diện chính người dùng (Approval, Modal nhập liệu, Tờ trình, Tổng hợp hiệu suất, Phân quyền)
  - `doPost/`: Webhook & API HTTP POST handler phục vụ tích hợp bên ngoài

---

## 2. `.agent/` Directory Navigation

### Core Maps
| File | Mô tả |
|------|------|
| [CONTEXT.md](./CONTEXT.md) | Bản đồ nhanh để onboard và resume |
| [KNOWLEDGE_BASE.md](./KNOWLEDGE_BASE.md) | Quyết định kiến trúc và lý do chiến lược |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Snapshot cấu trúc thư mục, entry points, services và commands |

### Architecture
| File | Mô tả |
|------|------|
| [architecture/MASTER.md](./architecture/MASTER.md) | Kiến trúc tổng thể hệ thống Google Apps Script multi-module |

### Changelog
| File | Mô tả |
|------|------|
| [changelog/CHANGELOG-FE.md](./changelog/CHANGELOG-FE.md) | Thay đổi giao diện client HTML/JS |
| [changelog/CHANGELOG-BE.md](./changelog/CHANGELOG-BE.md) | Thay đổi logic server GAS & doPost handlers |

### Agent Skills
| Skill | Mô tả |
|------|------|
| [skills/README.md](./skills/README.md) | Tổng quan skill pack và flow chuẩn |
| [skills/project-init/SKILL.md](./skills/project-init/SKILL.md) | Chuẩn hóa, bổ sung, hoặc audit bộ `.agent/` |
| [skills/feature-plan/SKILL.md](./skills/feature-plan/SKILL.md) | Lập kế hoạch cho feature mới |
| [skills/feature-review/SKILL.md](./skills/feature-review/SKILL.md) | Review plan về kiến trúc, bảo mật, logic và rollout |
| [skills/feature-coordinator/SKILL.md](./skills/feature-coordinator/SKILL.md) | Triển khai feature theo phase và checklist |
| [skills/update-docs/SKILL.md](./skills/update-docs/SKILL.md) | Cập nhật docs sau khi code thay đổi |
| [skills/check-issue/SKILL.md](./skills/check-issue/SKILL.md) | Điều tra root cause của bug hoặc sự cố |
| [skills/docs-hygiene/SKILL.md](./skills/docs-hygiene/SKILL.md) | Rà soát sức khỏe hệ thống tài liệu và read-path |
| [skills/git-sync/SKILL.md](./skills/git-sync/SKILL.md) | Đồng bộ Git sau khi đã chốt docs và commit message |

---

## 3. Critical Files

| File | Mức độ | Ghi chú |
|------|------|---------|
| [`client/Approval_Server.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/Approval_Server.js) | CRITICAL | Logic server-side chính xử lý phê duyệt, phân quyền & cập nhật dữ liệu |
| [`client/Approval_Client.html`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/client/Approval_Client.html) | CRITICAL | Giao diện web app chính trên Google Apps Script |
| [`doPost/Code.js`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/doPost/Code.js) | HIGH | Endpoint tiếp nhận HTTP POST payload từ hệ thống ngoài |
| [`deploy-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/deploy-all.ps1) | CRITICAL | Script tự động backup local, tạo version trên clasp & deploy tất cả module |
| [`push-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/push-all.ps1) | HIGH | Push code từ local lên Google Apps Script cho tất cả module |
| [`pull-all.ps1`](file:///d:/Project_VCC/Tool%20thu%20nh%E1%BA%ADp/Module%20hi%E1%BB%87u%20su%E1%BA%A5t/pull-all.ps1) | HIGH | Pull code mới nhất từ Google Apps Script về local |

---

## 4. Quick Commands

```powershell
# Sync code từ local lên Cloud Google Apps Script
.\push-all.ps1

# Sync code mới nhất từ Cloud Google Apps Script về local
.\pull-all.ps1

# Backup local & Deploy toàn bộ module lên Cloud GAS
.\deploy-all.ps1
```

---

*Last updated: 2026-08-13 | Version 1.0 (GAS Reconciled)*
