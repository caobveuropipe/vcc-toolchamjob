//ĐOẠN CODE XỬ LÝ HIỆU SUẤT TỪ DATA THÀNH DỮ LIỆU ĐƯỢC TỔNG HỢP
function modal_tonghophieusuat_1_GetDataTongHop(khoiSelect, coCheSelect, thangSelect) {

    var result = pg_general_1_LayHieuSuatChiTiet(khoiSelect, coCheSelect, thangSelect)
    var arr = modal_tonghophieusuat_1_tongHopHieuSuat(result);
    return arr;
}
/**PHẦN 5 - TỔNG HỢP HIỆU SUẤT */
//ĐOẠN CODE CHO HÀM TỔNG HỢP HIỆU SUẤT
function modal_tonghophieusuat_1_tongHopHieuSuat(result) {
    var summary = {};
    var allDoKho = new Set();

    result.forEach(function (row) {
        var kyNghiemThu = row[1]; // KỲ NGHIỆM THU
        var khoi = row[2];        // KHỐI
        var maNhanSu = row[3];    // MÃ NHÂN SỰ
        var hoVaTen = row[4];     // HỌ VÀ TÊN
        var team = row[5];     // HỌ VÀ TÊN

        var doKho = row[11];       // ĐỘ KHÓ
        var hieuSuat = parseFloat(row[20]);
        if (isNaN(hieuSuat)) hieuSuat = 0;

        if (doKho) {
            allDoKho.add(doKho);
        }

        // Nếu kỳ nghiệm thu chưa tồn tại, khởi tạo
        if (!summary[kyNghiemThu]) {
            summary[kyNghiemThu] = {};
        }

        // Nếu mã nhân sự chưa tồn tại trong kỳ nghiệm thu, khởi tạo
        if (!summary[kyNghiemThu][maNhanSu]) {
            summary[kyNghiemThu][maNhanSu] = {
                khoi: khoi,
                team: team,
                hoVaTen: hoVaTen,
                tongHieuSuat: 0,
                phanLoaiDoKho: {}
            };
        }

        // Cập nhật tổng hiệu suất cho mã nhân sự trong kỳ nghiệm thu
        summary[kyNghiemThu][maNhanSu].tongHieuSuat += hieuSuat;

        // Nếu độ khó chưa tồn tại, khởi tạo
        if (!summary[kyNghiemThu][maNhanSu].phanLoaiDoKho[doKho]) {
            summary[kyNghiemThu][maNhanSu].phanLoaiDoKho[doKho] = 0;
        }

        // Cập nhật tổng hiệu suất theo độ khó
        summary[kyNghiemThu][maNhanSu].phanLoaiDoKho[doKho] += hieuSuat;
    });

    var doKhoColumns = Array.from(allDoKho).sort();
    var output = [
        ["KỲ NGHIỆM THU", "KHỐI", "TEAM", "MÃ NHÂN SỰ", "HỌ VÀ TÊN", "TỔNG HIỆU SUẤT"].concat(doKhoColumns)
    ];

    for (var kyNghiemThu in summary) {
        for (var maNhanSu in summary[kyNghiemThu]) {
            var nhanSu = summary[kyNghiemThu][maNhanSu];
            var row = [
                kyNghiemThu,       // KỲ NGHIỆM THU
                nhanSu.khoi,       // KHỐI
                nhanSu.team,        //Team
                maNhanSu,          // MÃ NHÂN SỰ
                nhanSu.hoVaTen,    // HỌ VÀ TÊN
                nhanSu.tongHieuSuat // TỔNG HIỆU SUẤT
            ];

            // Thêm giá trị tổng hiệu suất theo từng độ khó, nếu không có thì là 0
            doKhoColumns.forEach(function (doKho) {
                row.push(nhanSu.phanLoaiDoKho[doKho] || 0);
            });

            output.push(row);
        }
    }

    Logger.log(output.slice(0, 10)); // In mẫu 10 dòng đầu tiên
    return output;
}
//ĐOẠN CODE SUBMIT HIỆU SUẤT VÀO DATA
function modal_tonghophieusuat_1_SubmitHieuSuatToSheet(data, strCoChe, strThangChiTra) {

    var idFileHieuSuat = "1JBjVhNHbxR6yVFSaYtRz6TVkOi1FlJhOYz5M1tkit_s"

    var sheet = SpreadsheetApp.openById(idFileHieuSuat).getSheetByName('DataHieuSuat'); // Sheet DataHieuSuat trong file hiệu suất
    var lastRow = sheet.getLastRow() + 1; // Lấy dòng cuối trong data hiệu suất
    /**Cần check data trước khi ghi vào sheet theo các rule sau
     * Mã nhân sự + kỳ chi trả + tên cơ chế là key. Key này không được trùng với dữ liệu trong data hiệu suất.
    */

    // Thêm thông tin người dùng và Kỳ trả lương vào cuối mỗi dòng
    var userEmail = Session.getActiveUser().getEmail();
    data.forEach(row => {
        row[14] = userEmail;      // Cột 15: Email người dùng (Người ghi)
        row[15] = strThangChiTra; // Cột 16: Kỳ trả lương
    });

    //Ghi dữ liệu vào file hiệu suất
    sheet.getRange(lastRow, 1, data.length, data[0].length).setValues(data)

    return "Submit thành công"; // Trả về thông báo khi hoàn thành
}
