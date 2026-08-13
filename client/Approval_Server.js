/**
 * MODULE DUYỆT TỜ TRÌNH (APPROVAL SYSTEM)
 * ------------------------------------------------------------------
 */

// ⚠️ NGƯỜI DÙNG CẦN ĐIỀN ID FILE GOOGLE SHEET VÀO ĐÂY
var ID_FILE_TOTRINH = "1iIzb60ud2mtS0ELb3sIGGKfsdr1OahRVcZ-h-NfpJNs"; // Ví dụ: "1AbCdEfGhIjK..."
var ADMIN_LIST = ["loi.quantrihethong@gmail.com.vn", "loi.quantrihethong@gmail.com", "caobuivan@vccorp.vn"]; // Thêm email admin vào đây

// var ADMIN_LIST... is defined above

/**
 * Hàm lấy danh sách người duyệt (Admin List) để Client hiển thị suggest
 */
/*function sv_getApproverList() {
    return ADMIN_LIST;
}*/
// Code.gs
// Code.gs
function sv_getApproverList() {
    const DEBUG = true; // Tắt khi production

    try {
        // 🔑 Kiểm tra: phanquyenId có tồn tại không?
        if (typeof phanquyenId === 'undefined' || !phanquyenId) {
            throw new Error("Biến 'phanquyenId' chưa được khai báo trong Apps Script");
        }

        const ss = SpreadsheetApp.openById(phanquyenId);
        const configSheet = ss.getSheetByName("Home");

        if (!configSheet) {
            throw new Error(`Sheet 'Home' không tồn tại trong spreadsheet ID: ${phanquyenId}`);
        }

        const lastRow = configSheet.getLastRow();
        if (lastRow < 2) {
            if (DEBUG) console.log("Không có dữ liệu trong Home!A2:A");
            return [];
        }

        const values = configSheet.getRange("A2:A" + lastRow).getValues();
        const emails = values
            .flat()
            .map(e => String(e || "").trim())
            .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

        if (DEBUG) console.log("sv_getApproverList →", emails);

        return emails;
    } catch (err) {
        // 🔥 Ghi log lỗi rõ ràng vào Execution Log (View > Logs)
        console.error("[sv_getApproverList] Lỗi:", err.toString());
        // Trả về [] để client không crash
        return [];
    }
}

/**
 * Hàm kiểm tra quyền duyệt (Tạm thời cho phép tất cả để test, hoặc bỏ comment để filter)
 */
function checkUserPermission(email) {
    // return ADMIN_LIST.includes(email);
    return true; //  <-- ĐANG BẬT CHẾ ĐỘ DEBUG: AI CŨNG LÀ ADMIN
}

/**
 * 1. Hàm tạo Database (Chạy 1 lần đầu tiên để tạo cấu trúc sheet nếu chưa có)
 * Bạn có thể chạy hàm này thủ công từ trình soạn thảo App Script
 */
function setupApprovalDatabase() {
    if (!ID_FILE_TOTRINH) {
        throw new Error("Vui lòng điền ID_FILE_TOTRINH trước khi chạy setup!");
    }

    var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);

    // 1.1 Tạo Sheet ToTrinh_Main
    var sheetMain = ss.getSheetByName("ToTrinh_Main");
    if (!sheetMain) {
        sheetMain = ss.insertSheet("ToTrinh_Main");
        sheetMain.appendRow([
            "ID_ToTrinh", "LoaiToTrinh", "TieuDe", "NguoiTao_Email", "NguoiTao_Ten",
            "NgayTao", "TrangThai", "NguoiDuyet_Email", "NguoiDuyet_Ten", "NgayDuyet", "GhiChuDuyet",
            "BoPhan", "Khoi", "KyLuong", "ThoiGianNghiemThu"
        ]);
        sheetMain.setFrozenRows(1);
    }

    // 1.2 Tạo Sheet ToTrinh_Details
    var sheetDetails = ss.getSheetByName("ToTrinh_Details");
    if (!sheetDetails) {
        sheetDetails = ss.insertSheet("ToTrinh_Details");
        sheetDetails.appendRow([
            "ID_ToTrinh", "STT", "NoiDung_Cot1", "NoiDung_Cot2", "NoiDung_Cot3",
            "NoiDung_Cot4", "NoiDung_Cot5", "NoiDung_Cot6", "NoiDung_Cot7", "NoiDung_Cot8", "GhiChu"
        ]); // Tùy chỉnh số cột theo dữ liệu thực tế
        sheetDetails.setFrozenRows(1);
    }
}

// 2. Hàm Gửi Tờ Trình (Gọi từ Client khi bấm Submit)
function sv_submitProposal(data) {
    try {
        if (!ID_FILE_TOTRINH) return { success: false, message: "Chưa cấu hình ID File Database!" };

        var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);
        var sheetMain = ss.getSheetByName("ToTrinh_Main");
        var sheetDetails = ss.getSheetByName("ToTrinh_Details");

        if (!sheetMain) {
            sheetMain = ss.insertSheet("ToTrinh_Main");
            sheetMain.appendRow([
                "ID_ToTrinh", "LoaiToTrinh", "TieuDe", "NguoiTao_Email", "NguoiTao_Ten",
                "NgayTao", "TrangThai", "NguoiDuyet_Email", "NguoiDuyet_Ten", "NgayDuyet", "GhiChuDuyet",
                "BoPhan", "Khoi", "KyLuong", "ThoiGianNghiemThu"
            ]);
            sheetMain.setFrozenRows(1);
        }

        if (!sheetDetails) {
            sheetDetails = ss.insertSheet("ToTrinh_Details");
            sheetDetails.appendRow([
                "ID_ToTrinh", "STT", "NoiDung_Cot1", "NoiDung_Cot2", "NoiDung_Cot3",
                "NoiDung_Cot4", "NoiDung_Cot5", "NoiDung_Cot6", "NoiDung_Cot7", "NoiDung_Cot8", "GhiChu"
            ]);
            sheetDetails.setFrozenRows(1);
        }

        // --- XỬ LÝ GHI ĐÈ (OVERWRITE) ---
        if (data.overwriteId) {
            var dataMain = sheetMain.getDataRange().getValues();
            for (var i = 1; i < dataMain.length; i++) {
                if (String(dataMain[i][0]).trim() === String(data.overwriteId).trim()) {
                    // Update trạng thái thành ĐÃ THU HỒI -> coi như đã bị ghi đè
                    sheetMain.getRange(i + 1, 7).setValue("DA_THU_HOI");
                    break;
                }
            }
        }

        var idToTrinh = "TT_" + new Date().getTime();
        var userEmail = Session.getActiveUser().getEmail();
        var now = new Date();

        var targetEmail = (data.approverEmail || "").trim();
        var targetRole = (data.approverRole || "").trim();

        sheetMain.appendRow([
            idToTrinh,
            data.loaiToTrinh,
            data.tieuDe,
            userEmail,
            data.nguoiTaoTen || userEmail,
            now,
            "CHO_DUYET",
            targetEmail,
            "", "", "",
            data.boPhan || "",
            data.khoi || "",
            data.kyLuong || "",
            data.thoiGianNghiemThu || "",
            targetRole
        ]);

        if (data.details && Array.isArray(data.details)) {
            var detailRows = data.details.map(function (row, index) {
                return [
                    idToTrinh,
                    index + 1,
                    row.col1 || "",
                    row.col2 || "",
                    row.col3 || "",
                    row.col4 || "",
                    row.col5 || "",
                    row.col6 || "",
                    row.col7 || "",
                    row.col8 || "",
                    row.ghiChu || ""
                ];
            });

            if (detailRows.length > 0) {
                sheetDetails.getRange(sheetDetails.getLastRow() + 1, 1, detailRows.length, detailRows[0].length).setValues(detailRows);
            }
        }

        return { success: true, message: "Gửi tờ trình thành công!", id: idToTrinh };

    } catch (e) {
        Logger.log(e);
        return { success: false, message: "Lỗi: " + e.message };
    }
}

// ... giu nguyen sv_countPendingProposals ...

// ... sv_checkProposalStatus update ...
function sv_checkProposalStatus(keyData) {
    // keyData: { loaiToTrinh, kyLuong, boPhan, khoi }
    if (!ID_FILE_TOTRINH) return { status: 'ERROR', message: "Missing Config" };

    var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);
    var sheetMain = ss.getSheetByName("ToTrinh_Main");
    var data = sheetMain.getDataRange().getValues();

    var relatedProposals = [];
    var searchLoai = String(keyData.loaiToTrinh || "").trim();
    var searchKy = String(keyData.kyLuong || "").trim();
    var searchBP = String(keyData.boPhan || "").trim();
    var searchKhoi = String(keyData.khoi || "").trim();

    // 1. Quét tìm
    for (var i = 1; i < data.length; i++) {
        var rLoai = String(data[i][1] || "").trim().toLowerCase();
        var rBoPhan = String(data[i][11] || "").trim().toLowerCase();
        var rKhoi = String(data[i][12] || "").trim().toLowerCase();
        var rKy = String(data[i][13] || "").trim().toLowerCase();
        var rNghiemThu = String(data[i][14] || "").trim().toLowerCase();

        // Normalize search keys
        var sLoai = searchLoai.toLowerCase();
        var sKy = searchKy.toLowerCase();
        var sBP = searchBP.toLowerCase();
        var sKhoi = searchKhoi.toLowerCase();
        var sNghiemThu = String(keyData.thoiGianNghiemThu || "").trim().toLowerCase();

        if (rLoai === sLoai && rKy === sKy && rBoPhan === sBP && rKhoi === sKhoi && rNghiemThu === sNghiemThu) {
            relatedProposals.push({
                id: data[i][0], // ID
                status: String(data[i][6] || "").trim(),
                dateTao: data[i][5],
                dateDuyet: data[i][9],
                nguoiDuyet: data[i][8],
                lyDo: data[i][10]
            });
        }
    }

    // 2. Sort Descending Date
    relatedProposals.sort(function (a, b) {
        return new Date(b.dateTao).getTime() - new Date(a.dateTao).getTime();
    });

    if (relatedProposals.length === 0) return { status: 'NEW', history: [] };

    // Lọc lịch sử từ chối
    var rejectedHistory = relatedProposals
        .filter(function (item) { return item.status === 'TU_CHOI'; })
        .map(function (item) {
            var d = new Date(item.dateDuyet);
            return {
                date: d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN'),
                approver: item.nguoiDuyet,
                reason: item.lyDo
            };
        });

    // Check Approved
    if (relatedProposals.some(function (i) { return i.status === 'DA_DUYET'; })) {
        return { status: 'APPROVED', history: rejectedHistory };
    }

    var latest = relatedProposals[0];
    // Check Pending - Trả về thêm pendingId để client xử lý (Xem/Ghi đè)
    if (latest.status === 'CHO_DUYET') {
        return { status: 'PENDING', history: rejectedHistory, pendingId: latest.id };
    }

    if (latest.status === 'TU_CHOI') {
        return { status: 'REJECTED', history: rejectedHistory };
    }

    return { status: 'NEW', history: [] };
}


/**
 * 3. Hàm Đếm Số Tờ Trình Chờ Duyệt (Cho Nút Chuông)
 */
function sv_countPendingProposals() {
    try {
        if (!ID_FILE_TOTRINH) return 0;

        var userEmail = Session.getActiveUser().getEmail();
        var isAdmin = false;
        if (typeof ADMIN_LIST !== 'undefined' && ADMIN_LIST.includes(userEmail)) {
            isAdmin = true;
        }

        var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);
        var sheetMain = ss.getSheetByName("ToTrinh_Main");
        var data = sheetMain.getDataRange().getValues();

        var count = 0;
        // Bỏ qua header, duyệt từ dòng 1
        for (var i = 1; i < data.length; i++) {
            var status = String(data[i][6] || "").trim();
            var assignedEmail = String(data[i][7] || "").trim(); // Col index 7 is 8th col (NguoiDuyet_Email)

            if (status.toUpperCase() === "CHO_DUYET") {
                // Chỉ đếm nếu là Admin HOẶC được assign cho mình
                if (isAdmin || assignedEmail === userEmail) {
                    count++;
                }
            }
        }
        return count;

    } catch (e) {
        return 0;
    }
}

/**
 * 4. Lấy Danh Sách Tờ Trình (Pending hoặc History)
 * @param {string} viewMode - 'PENDING' | 'HISTORY'
 */
function sv_getProposalList(viewMode) {
    if (!ID_FILE_TOTRINH) return [];

    var userEmail = Session.getActiveUser().getEmail();
    var isAdmin = false;
    if (typeof ADMIN_LIST !== 'undefined' && ADMIN_LIST.includes(userEmail)) {
        isAdmin = true;
    }

    // Check permission logic can stay or be removed if handled inside loop
    // if (!checkUserPermission(userEmail)) return []; 

    var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);
    var sheetMain = ss.getSheetByName("ToTrinh_Main");
    var data = sheetMain.getDataRange().getValues();
    var result = [];

    viewMode = viewMode || 'PENDING';

    for (var i = 1; i < data.length; i++) {
        var status = String(data[i][6] || "").trim().toUpperCase();
        var assignedEmail = String(data[i][7] || "").trim(); // Target/Approver Email
        var creatorEmail = String(data[i][3] || "").trim(); // Creator Email

        var isMatch = false;

        if (viewMode === 'PENDING') {
            if (status === 'CHO_DUYET') {
                // Chỉ hiện nếu mình là người được assign hoặc Admin
                // (Optional: Người tạo có thấy bản Pending của mình không? Thường là có để track tiến độ, nhưng ko phải để duyệt)
                // Theo yêu cầu "Email được chọn ... mới được notification", có thể danh sách "Chờ duyệt" của người duyệt chỉ nên hiện cái cần duyệt.
                // Nhưng người tạo vào xem danh sách "Chờ duyệt" thì cũng nên thấy cái mình mới tạo.
                // Let's allow: Admin OR Assignee OR Creator
                if (isAdmin || assignedEmail === userEmail || creatorEmail === userEmail) {
                    isMatch = true;
                }
            }
        } else { // HISTORY
            if (status !== 'CHO_DUYET') {
                // History: Show all for now, or filter similarly (Admin/Assignee/Creator) if privacy needed.
                // For now, let's keep History generally visible or filter by involvement
                if (isAdmin || assignedEmail === userEmail || creatorEmail === userEmail || String(data[i][7] || "").trim() === userEmail) { // Approver might be stored in col 7 (actually col 8 is NguoiDuyet_Email)
                    isMatch = true;
                }
            }
        }

        if (isMatch) {
            // Safely format date
            var dateVal = data[i][5];
            var dateStr = "";
            if (dateVal instanceof Date) {
                dateStr = dateVal.toISOString();
            } else {
                dateStr = String(dateVal);
            }

            result.push({
                id: data[i][0],
                loai: data[i][1],
                tieuDe: data[i][2],
                nguoiTao: data[i][4],
                ngayTao: dateStr,
                trangThai: status,
                boPhan: data[i][11] || "",
                khoi: data[i][12] || "",
                kyLuong: data[i][13] || ""
            });
        }
    }
    // Đảo ngược để thấy mới nhất trước
    return result.reverse();
}

/**
 * 5. Lấy Chi Tiết Một Tờ Trình
 */
function sv_getProposalDetail(idToTrinh) {
    if (!ID_FILE_TOTRINH) return null;

    var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);
    var sheetMain = ss.getSheetByName("ToTrinh_Main");
    var sheetDetails = ss.getSheetByName("ToTrinh_Details");

    var searchId = String(idToTrinh).trim();

    // Tìm Header
    var dataMain = sheetMain.getDataRange().getValues();
    var mainInfo = null;
    for (var i = 1; i < dataMain.length; i++) {
        var rowId = String(dataMain[i][0]).trim();
        if (rowId === searchId) {
            // Safely serialize dates
            var dTao = dataMain[i][5] instanceof Date ? dataMain[i][5].toISOString() : String(dataMain[i][5]);
            var dDuyet = dataMain[i][9] instanceof Date ? dataMain[i][9].toISOString() : String(dataMain[i][9]);

            mainInfo = {
                id: rowId,
                loai: dataMain[i][1],
                tieuDe: dataMain[i][2],
                nguoiTaoEmail: dataMain[i][3],
                nguoiTaoTen: dataMain[i][4],
                ngayTao: dTao,
                trangThai: dataMain[i][6],
                nguoiDuyetTen: dataMain[i][8],
                ngayDuyet: dDuyet,
                ghiChuDuyet: dataMain[i][10],
                // Lấy thêm metadata (Cột 12, 13, 14, 15 -> Index 11, 12, 13, 14, 15)
                boPhan: dataMain[i][11] || "",
                khoi: dataMain[i][12] || "",
                kyLuong: dataMain[i][13] || "",
                thoiGianNghiemThu: dataMain[i][14] || "",
                viTriDuyet: dataMain[i][15] || "",
                nguoiDuyetEmail: dataMain[i][7] || "" // Lấy email người được chỉ định duyệt
            };
            break;
        }
    }

    if (!mainInfo) return null;

    // Tìm Details
    var dataDetails = sheetDetails.getDataRange().getValues();
    var details = [];
    for (var j = 1; j < dataDetails.length; j++) {
        var detId = String(dataDetails[j][0]).trim();
        if (detId === searchId) {
            details.push({
                stt: dataDetails[j][1],
                col1: dataDetails[j][2],
                col2: dataDetails[j][3],
                col3: dataDetails[j][4],
                col4: dataDetails[j][5],
                col5: dataDetails[j][6],
                col6: dataDetails[j][7],
                col7: dataDetails[j][8],
                col8: dataDetails[j][9],
                ghiChu: dataDetails[j][10]
            });
        }
    }

    return { info: mainInfo, details: details };
}

/**
 * 6. Phê Duyệt Tờ Trình
 */
function sv_approveProposal(idToTrinh, action, note, role) {
    // action: 'APPROVE' hoặc 'REJECT'
    if (!ID_FILE_TOTRINH) return { success: false, message: "Missing Config" };

    var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);
    var sheetMain = ss.getSheetByName("ToTrinh_Main");
    var data = sheetMain.getDataRange().getValues();

    var userEmail = Session.getActiveUser().getEmail();
    var now = new Date();
    var newStatus = (action === 'APPROVE') ? "DA_DUYET" : "TU_CHOI";

    for (var i = 1; i < data.length; i++) {
        if (data[i][0] == idToTrinh) {

            // --- LOGIC THU HỒI (RECALL) ---
            if (action === 'RECALL') {
                var creatorEmail = data[i][3]; // Col 4 (Index 3)
                if (userEmail !== creatorEmail) {
                    return { success: false, message: "Bạn không phải người tạo, không thể thu hồi!" };
                }
                sheetMain.getRange(i + 1, 7).setValue("DA_THU_HOI");
                return { success: true, message: "Đã thu hồi tờ trình!" };
            }

            // --- LOGIC BỎ DUYỆT (UNAPPROVE) ---
            if (action === 'UNAPPROVE') {
                if (!checkUserPermission(userEmail)) return { success: false, message: "Không có quyền bỏ duyệt!" };

                sheetMain.getRange(i + 1, 7).setValue("CHO_DUYET");

                // Clear approval info
                sheetMain.getRange(i + 1, 8).setValue("");
                sheetMain.getRange(i + 1, 9).setValue("");
                sheetMain.getRange(i + 1, 10).setValue("");
                sheetMain.getRange(i + 1, 11).setValue("");
                sheetMain.getRange(i + 1, 16).setValue("");

                return { success: true, message: "Đã bỏ duyệt. Tờ trình trở về trạng thái Chờ duyệt." };
            }

            // --- LOGIC DUYỆT / TỪ CHỐI THÔNG THƯỜNG ---
            // Update cột TrangThai (G - index 6)
            sheetMain.getRange(i + 1, 7).setValue(newStatus);
            // Update Người duyệt (H - index 7)
            sheetMain.getRange(i + 1, 8).setValue(userEmail);
            // Update Tên người duyệt (I - index 8)
            var approverRealName = sv_helper_getUserNameByEmail(userEmail);
            sheetMain.getRange(i + 1, 9).setValue(approverRealName || userEmail);

            // Update Ngày duyệt (J - index 9)
            sheetMain.getRange(i + 1, 10).setValue(now);
            // Update Ghi chú (K - index 10)
            sheetMain.getRange(i + 1, 11).setValue(note);

            // Update Vị trí duyệt (P - index 15 / col 16)
            if (role) sheetMain.getRange(i + 1, 16).setValue(role);

            return { success: true, message: "Đã cập nhật trạng thái: " + newStatus };
        }
    }

    return { success: false, message: "Không tìm thấy tờ trình" };
}

/**
 * Helper: Tìm tên nhân sự từ Email
 * Ưu tiên tìm trong StaffInfo2 của file Master
 */
function sv_helper_getUserNameByEmail(email) {
    try {
        if (!email) return "";
        var ss = SpreadsheetApp.openById(phanquyenId);
        var sheet = ss.getSheetByName("StaffInfo2");
        if (!sheet) return "";
        var data = sheet.getDataRange().getValues();
        for (var i = 1; i < data.length; i++) {
            if (String(data[i][0]).toLowerCase().trim() === email.toLowerCase().trim()) {
                // Giả sử cột E (index 4) là tên, hoặc cột B (index 1) tùy cấu trúc sheet
                // Thử lấy cột chứa tên (thường là cột 2 hoặc cột cuối)
                return data[i][1] || data[i][4] || "";
            }
        }
    } catch (e) {
        return "";
    }
    return "";
}

/**
 * 7. Kiểm tra trạng thái tờ trình (Dựa trên Key định danh)
 * Key = LoaiToTrinh + KyLuong + BoPhan + Khoi
 */
function sv_checkProposalStatus(keyData) {
    // keyData: { loaiToTrinh, kyLuong, boPhan, khoi }
    if (!ID_FILE_TOTRINH) return { status: 'ERROR', message: "Missing Config" };

    var ss = SpreadsheetApp.openById(ID_FILE_TOTRINH);
    var sheetMain = ss.getSheetByName("ToTrinh_Main");
    var data = sheetMain.getDataRange().getValues();

    var history = [];
    var relatedProposals = [];

    var searchLoai = String(keyData.loaiToTrinh || "").trim();
    var searchKy = String(keyData.kyLuong || "").trim();
    var searchBP = String(keyData.boPhan || "").trim();
    var searchKhoi = String(keyData.khoi || "").trim();

    // 1. Quét tìm các tờ trình khớp Key
    for (var i = 1; i < data.length; i++) {
        var rLoai = String(data[i][1] || "").trim();
        var rBoPhan = String(data[i][11] || "").trim();
        var rKhoi = String(data[i][12] || "").trim();
        var rKy = String(data[i][13] || "").trim();

        if (rLoai === searchLoai && rKy === searchKy && rBoPhan === searchBP && rKhoi === searchKhoi) {
            // Found match
            var status = String(data[i][6] || "").trim();
            var dateTao = data[i][5];
            var dateDuyet = data[i][9];
            var nguoiDuyet = data[i][8];
            var lyDo = data[i][10];
            var userTao = data[i][4];

            relatedProposals.push({
                id: data[i][0],
                status: status,
                dateTao: dateTao,
                dateDuyet: dateDuyet,
                nguoiDuyet: nguoiDuyet,
                lyDo: lyDo,
                userTao: userTao
            });
        }
    }

    // 2. Sắp xếp theo ngày tạo giảm dần (Mới nhất lên đầu)
    relatedProposals.sort(function (a, b) {
        var da = new Date(a.dateTao).getTime();
        var db = new Date(b.dateTao).getTime();
        return db - da; // Descending
    });

    // 3. Phân tích trạng thái hiện tại
    if (relatedProposals.length === 0) {
        return { status: 'NEW', history: [] };
    }

    var latestDetails = relatedProposals[0];
    var latestStatus = latestDetails.status; // CHO_DUYET, DA_DUYET, TU_CHOI, DA_THU_HOI

    // Lọc lấy lịch sử bị từ chối phục vụ hiển thị
    var rejectedHistory = relatedProposals
        .filter(function (item) { return item.status === 'TU_CHOI'; })
        .map(function (item) {
            var d = new Date(item.dateDuyet);
            var dStr = d.toLocaleDateString('vi-VN') + " " + d.toLocaleTimeString('vi-VN');
            return {
                date: dStr,
                approver: item.nguoiDuyet,
                reason: item.lyDo
            };
        });

    // Logic trả về Status tổng quan
    // Nếu có BẤT KỲ tờ trình nào (của kỳ này) ĐÃ DUYỆT -> Coi như đã xong -> APPROVED
    // (Bởi vì có thể có bản cũ bị từ chối, bản mới đã duyệt. Ta ưu tiên trạng thái hoàn thành cuối cùng)
    var hasApproved = relatedProposals.some(function (item) { return item.status === 'DA_DUYET'; });
    if (hasApproved) {
        return { status: 'APPROVED', history: rejectedHistory };
    }

    // Nếu bản MỚI NHẤT đang CHO_DUYET -> PENDING
    if (latestStatus === 'CHO_DUYET') {
        return { status: 'PENDING', history: rejectedHistory };
    }

    // Nếu bản MỚI NHẤT bị TU_CHOI -> REJECTED
    if (latestStatus === 'TU_CHOI') {
        return { status: 'REJECTED', history: rejectedHistory };
    }

    // Nếu bản MỚI NHẤT bị Thu Hồi -> Xem như chưa có gì (hoặc coi như REJECTED để cho gửi lại) -> Lets say NEW/RECALL
    if (latestStatus === 'DA_THU_HOI') {
        return { status: 'NEW', history: rejectedHistory }; // Cho phép gửi lại
    }

    return { status: 'NEW', history: [] };
}


