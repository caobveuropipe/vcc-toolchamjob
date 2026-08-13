function modal_phanquyen_1_getData(email) {
    var sheet = SpreadsheetApp.openById(phanquyenId).getSheetByName("HieuSuat");
    var lastRow = dongCuoiPhanQuyen(sheet.getName(), "A");
    var data = sheet.getRange("HieuSuat!A2:C" + lastRow).getValues();
    var result = [];

    for (var i = 0; i < data.length; i++) {
        var quyenList = data[i][1].split(";"); // Tách danh sách quyền
        var found = false;
        var quyenEmail = "Other"; // Giá trị mặc định nếu không tìm thấy email

        for (var j = 0; j < quyenList.length; j++) {
            var parts = quyenList[j].split("/"); // Tách email và phân quyền
            if (parts.length === 2 && parts[0].trim() === email) {
                quyenEmail = parts[1].trim();
                found = true;
                break;
            }
        }

        result.push([data[i][0], quyenEmail, data[i][2]]);
    }

    return result;
}

// Hàm lấy danh sách email duy nhất từ cột phân quyền
function modal_phanquyen_1_getEmailList() {
    var sheet = SpreadsheetApp.openById(phanquyenId).getSheetByName("HieuSuat");
    var lastRow = dongCuoiPhanQuyen(sheet.getName(), "A");
    var data = sheet.getRange("B2:B" + lastRow).getValues();
    var emailSet = new Set(); // Sử dụng Set để tránh trùng lặp

    for (var i = 0; i < data.length; i++) {
        if (!data[i][0]) continue; // Bỏ qua dòng trống

        var quyenList = data[i][0].split(";"); // Tách danh sách quyền
        for (var j = 0; j < quyenList.length; j++) {
            var parts = quyenList[j].split("/"); // Tách email và phân quyền
            if (parts.length === 2 && parts[0].trim()) {
                emailSet.add(parts[0].trim()); // Thêm email vào Set
            }
        }
    }

    // Chuyển Set thành mảng và sắp xếp
    var emailList = Array.from(emailSet).sort();
    return emailList;
}


function modal_phanquyen_1_saveData(data) {
    var sheet = SpreadsheetApp.openById(phanquyenId).getSheetByName("HieuSuat");
    var lastRow = dongCuoiPhanQuyen(sheet.getName(), "A");
    var range = sheet.getRange("HieuSuat!A2:C" + lastRow)
    var values = range.getValues().slice(1); // Bỏ tiêu đề

    var updates = []; // Mảng chứa dữ liệu mới để ghi

    data.forEach(row => {
        var tenCoCheMoi = row[0];
        var email = row[1].split("/")[0]; // Lấy email từ chuỗi phân quyền
        var quyenMoi = row[1].endsWith(";") ? row[1] : row[1] + ";";
        var maNhanSuMoi = row[2].endsWith(";") ? row[2] : row[2] + ";";

        var rowIndex = values.findIndex(r => r[0] === tenCoCheMoi);
        if (rowIndex === -1) return; // Nếu không tìm thấy, bỏ qua

        var chuoiPhanQuyenHienTai = values[rowIndex][1];

        // Nếu phân quyền là "Other" (không phân biệt hoa thường)
        if (row[1].split("/")[1]?.toLowerCase() === "other") {
            var chuoiMoi = chuoiPhanQuyenHienTai.replace(new RegExp(email + "/\\w+", "gi"), "").replace(/;;+/g, ";").replace(/^;|;$/g, "");
        } else {
            var chuoiMoi = modal_phanquyen_1_capNhatChuoiPhanQuyen(chuoiPhanQuyenHienTai, email, quyenMoi);
        }

        // Đưa vào mảng cập nhật
        updates.push([rowIndex + 2, tenCoCheMoi, chuoiMoi, maNhanSuMoi]);
    });

    // Cập nhật dữ liệu một lần duy nhất để tối ưu
    updates.forEach(update => {
        sheet.getRange(update[0], 1, 1, 3).setValues([[update[1], update[2], update[3]]]);
    });

    return "Cập nhật thành công " + updates.length + " dòng!";
}

function modal_phanquyen_1_delPer(email) {
    var sheet = SpreadsheetApp.openById(phanquyenId).getSheetByName("HieuSuat");
    var lastRow = dongCuoiPhanQuyen(sheet.getName(), "A");
    var range = sheet.getRange("B2:B" + lastRow); // Lấy toàn bộ cột B từ dòng 2 trở đi
    var values = range.getValues();

    var regex = new RegExp(email + "/\\w+;", "gi"); // Regex tìm email + phân quyền

    var updates = [];
    values.forEach((row, index) => {
        var chuoiPhanQuyen = row[0];
        if (chuoiPhanQuyen.includes(email + "/")) {
            var chuoiMoi = chuoiPhanQuyen.replace(regex, "").replace(/;;+/g, ";").replace(/^;|;$/g, "");
            updates.push([chuoiMoi]);
        } else {
            updates.push([chuoiPhanQuyen]); // Không thay đổi nếu không có email
        }
    });

    range.setValues(updates); // Cập nhật lại toàn bộ cột B
    return "Đã xóa phân quyền của " + email + " trong " + updates.length + " dòng!";
}

// Hàm xử lý chuỗi phân quyền
function modal_phanquyen_1_capNhatChuoiPhanQuyen(chuoiHienTai, email, quyenMoi) {
    var regex = new RegExp(email + "/\\w+", "g");
    var chuoiMoi = chuoiHienTai.replace(regex, "").replace(/;;+/g, ";").replace(/^;|;$/g, "");

    if (!chuoiMoi.includes(email)) {
        chuoiMoi = chuoiMoi ? chuoiMoi + ";" + quyenMoi : quyenMoi;
    }

    return chuoiMoi;
}



function testPQ() {
    var data = ['CCL - ADM - Inbound Marketing', 'caobuivan@vccorp.vn/VIEW', '110402']
    var email = "caobuivan@vccorp.vn"
    Logger.log(modal_phanquyen_1_saveData(data, email))
}
