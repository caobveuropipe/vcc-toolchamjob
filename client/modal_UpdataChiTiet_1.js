/**GHI DỮ LIỆU TỪ FORM UPLOAD XUỐNG SHEET */
/**FILE HIỆU SUẤT */

function modal_UpDataChiTiet_1_GhiDataHieuSuatVaoSheet(data, strCoChe, strKyNghiemThu, strKhoi) {

  var year = strKyNghiemThu.slice(-4);
  var tenFileHieuSuat = year + "-" + strCoChe;

  var idsFileHieuSuat = layIdsFileHieuSuatTuSheet();
  if (!idsFileHieuSuat || !(tenFileHieuSuat in idsFileHieuSuat)) {
    return "Không tìm thấy file hiệu suất với tên: " + tenFileHieuSuat;
  }
  var idFileHieuSuat = idsFileHieuSuat[tenFileHieuSuat];

  var khoiArray = strAllKhoi.toLowerCase().split(';');
  if (!khoiArray.includes(strKhoi.toLowerCase())) {
    return "Khối không hợp lệ: " + strKhoi;
  }

  var userEmail = Session.getActiveUser().getEmail();//LibLink.emailUser;
  const phanQuyen = pg_general_1_LayChuoiPhanQuyen(strCoChe, userEmail);

  if (!phanQuyen) {
    //throw new Error(`User với email ${userEmail} đang có phân quyền là: ${phanQuyen}`);
    return `Không tìm thấy phân quyền cho file: ${tenFileHieuSuat}`;
  } else if (phanQuyen !== "EDIT" && phanQuyen !== "ALL") {
    throw new Error(`User với email ${userEmail} không có quyền truy cập file: ${tenFileHieuSuat}`);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return "Dữ liệu đầu vào không hợp lệ.";
  }

  // **Chỉ chọn các cột cần ghi vào sheet**
  var selectedHeaders = ["Mã nhân sự", "Team", "Tên cơ chế", "Loại cơ chế", "ID Job", "Diễn giải công việc", "Kết quả thực hiện", "Link kết quả", "Số lượng", "Khối lượng công việc", "Tỷ lệ tham gia", "Tỷ lệ hưởng hiệu suất", "Hiệu suất", "Ghi chú", "Win-Fail", "Nội bộ - Khách hàng", "Dự án"];
  var fullHeaders = ["ID", "Kỳ nghiệm thu", "Khối"].concat(selectedHeaders, ["Email", "Update", "Mở rộng"]);

  var currentDate = new Date();
  var dateString = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  var formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');

  var allRows = [];

  data.forEach(function (row, index) {
    var rowData = [];
    var id = (index + 1) + "ID" + dateString;
    rowData.push(id); // ID
    rowData.push(strKyNghiemThu); // Kỳ nghiệm thu
    rowData.push(strKhoi); // Khối

    selectedHeaders.forEach(function (header) {
      rowData.push(row[header] || "");
    });

    rowData.push(userEmail);  // Email
    rowData.push(formattedDate);  // Ngày cập nhật
    rowData.push(row["Mở rộng"] || "");  // 🆕 Mở rộng (cuối cùng)

    allRows.push(rowData);
  });

  var spreadsheet = SpreadsheetApp.openById(idFileHieuSuat);
  var sheetName = strKyNghiemThu.split('.')[0];
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (allRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, allRows.length, fullHeaders.length).setValues(allRows);
  }

  return 'Success';
}


function modal_upDataChiTiet_1_getTenJob_KhungCoChe(strCoChe, range) {
  // Kiểm tra xem strCoChe có tồn tại trong idsFileKhung không
  var idsFileKhung = layIdsFileKhungTuSheet();
  if (!(strCoChe in idsFileKhung)) {
    return [];  // Trả về mảng rỗng nếu không tìm thấy
  }

  var idFileKhung = idsFileKhung[strCoChe];
  var list = readRecordWithID(idFileKhung, range);

  // Kiểm tra nếu list là mảng 2 chiều và sử dụng flat để dẹp thành mảng 1 chiều
  if (Array.isArray(list) && Array.isArray(list[0])) {
    list = list.flat();  // Dẹp mảng 2 chiều thành 1 chiều
  }

  return list;  // Trả về mảng 1 chiều các job
}

function modal_UpDataChiTiet_1_CheckDataExist(strCoChe, strKyNghiemThu) {
  try {
    var year = strKyNghiemThu.slice(-4);
    var tenFileHieuSuat = year + "-" + strCoChe;

    var idsFileHieuSuat = layIdsFileHieuSuatTuSheet();
    if (!idsFileHieuSuat || !(tenFileHieuSuat in idsFileHieuSuat)) {
      return false;
    }
    var idFileHieuSuat = idsFileHieuSuat[tenFileHieuSuat];

    var spreadsheet = SpreadsheetApp.openById(idFileHieuSuat);
    var sheetName = strKyNghiemThu.split('.')[0];
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return false;
    }

    return sheet.getLastRow() > 1;
  } catch (e) {
    return false;
  }
}






