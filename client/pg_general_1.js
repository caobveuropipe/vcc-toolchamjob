/**
 * @file client/pg_general_1.js
 * @contract
 * - Trách nhiệm: Đọc cấu hình preflight API_CONFIG, giao tiếp API backend HR Snapshot (/api/snapshots/employees-detail), quản lý ScriptCache (600s) và map dữ liệu dạng Object Array.
 * - Không chịu trách nhiệm: Rendering UI, quản lý state modal, hoặc tính toán tỷ lệ tổng hợp phía Client.
 * - Invariant: APP_ENV không phải 'production'|'development' hoặc thiếu key prod -> throw Exception ngay (fail-closed). Khi API lỗi HTTP non-200 -> throw Exception (không trả mảng rỗng) để Client kích hoạt withFailureHandler.
 */

/**TỔNG HỢP DATA CHI TIẾT */
function testLayDuLieuHieuSuat() {
  var khoiSelect = "ADM"
  var coCheSelect = "CCL - ADM - Đối soát Inventory"
  var thangSelect = "T1.2025"
  Logger.log(pg_general_1_LayHieuSuatChiTiet(khoiSelect, coCheSelect, thangSelect))
}

/*function pg_general_1_LayHieuSuatChiTiet(khoiSelect, coCheSelect, thangSelect) {
    //Logger.log("=== BẮT ĐẦU XỬ LÝ DỮ LIỆU HIỆU SUẤT ===");
    
    // 1. Lấy dữ liệu hiệu suất
    var dataHieuSuat = pg_general_1getDataHieuSuat(khoiSelect, coCheSelect, thangSelect);
    if (!dataHieuSuat.length) {
        //Logger.log("Không có dữ liệu hiệu suất.");
        return [];
    }
    //Logger.log("Số dòng dữ liệu hiệu suất: " + dataHieuSuat.length);
    //Logger.log("Mẫu dữ liệu hiệu suất:", JSON.stringify(dataHieuSuat.slice(0, 5), null, 2));

    // 2. Lấy danh sách nhân sự
    //Logger.log("=== LẤY DANH SÁCH NHÂN SỰ ===");
    var danhSachNhanSu = pg_general_1_LayDataNhanSu();
    var nhanSuMap = new Map(danhSachNhanSu.map(row => [String(row[0]).trim(), row[1]]));
    //Logger.log("Tổng số nhân sự:", nhanSuMap.size);
    //Logger.log("Mẫu dữ liệu nhân sự:", JSON.stringify([...nhanSuMap.entries()].slice(0, 5), null, 2));

    // 3. Chèn tên nhân sự vào data hiệu suất
    //Logger.log("=== CHÈN TÊN NHÂN SỰ VÀO HIỆU SUẤT ===");
    dataHieuSuat = dataHieuSuat.map((row, index) => {
        var maNhanSu = String(row[3]).trim(); // Cột 4 là mã nhân sự
        var tenNhanSu = nhanSuMap.get(maNhanSu) || "Không tìm thấy";
        var newRow = [...row.slice(0, 4), tenNhanSu, ...row.slice(4)];
        
        //Logger.log(`Row ${index + 1}: Mã nhân sự = ${maNhanSu}, Tên nhân sự = ${tenNhanSu}`);
        return newRow;
    });

    // 4. Lấy khung cơ chế
    //Logger.log("=== LẤY DỮ LIỆU KHUNG CƠ CHẾ ===");
    var dataKhung = modal_khung_1_viewKhungTheoCoChe(coCheSelect);
    var khungMap = new Map();
    
    dataKhung.forEach(khungRow => {
        var idJobKhung = String(khungRow[0]).trim();
        //Logger.log(`Giá trị của khungRow[8]: ${khungRow[8]}`); // Log riêng giá trị cột 9
        var khungData = khungRow.slice(2, 5).concat(khungRow[8]); // Lấy cột 3, 4, 5 + cột 9
        khungMap.set(idJobKhung, khungData);

        //Logger.log(`Thêm vào khungMap: ID = ${idJobKhung}, Data =`, khungData);
    });

    //Logger.log("Tổng số ID job trong khungMap:", khungMap.size);
    //Logger.log("Mẫu dữ liệu khungMap:", JSON.stringify([...khungMap.entries()].slice(0, 5), null, 2));

    // 5. Chèn dữ liệu khung vào data hiệu suất
    //Logger.log("=== GHÉP DỮ LIỆU KHUNG VÀO HIỆU SUẤT ===");
    dataHieuSuat = dataHieuSuat.map((row, index) => {
        var idJob = String(row[8]).trim(); // Cột 9 là ID job
        var khungData = khungMap.get(idJob) || ["Không có", "Không có", "Không có", "Không có"];
        
        var newRow = [...row.slice(0, 9), ...khungData.slice(0, 3), ...row.slice(9, 15), khungData[3], ...row.slice(15)];
        
        //Logger.log(`Row ${index + 1}: ID Job = ${idJob}, Khung Data =`, khungData);
        //Logger.log("Row sau khi ghép:", newRow);

        return newRow;
    });

    //Logger.log("=== HOÀN THÀNH XỬ LÝ ===");
    //Logger.log("Kết quả cuối cùng:", JSON.stringify(dataHieuSuat.slice(0, 5), null, 2));

    return dataHieuSuat;
}*/
function pg_general_1_LayHieuSuatChiTiet(khoiSelect, coCheSelect, thangSelect) {
  // 1. Lấy dữ liệu hiệu suất
  var dataHieuSuat = pg_general_1getDataHieuSuat(khoiSelect, coCheSelect, thangSelect);
  if (!dataHieuSuat.length) {
    return [];
  }

  // 2. Lấy danh sách nhân sự
  var danhSachNhanSu = pg_general_1_LayDataNhanSu();
  var nhanSuMap = new Map(danhSachNhanSu.map(row => [String(row[0]).trim(), row[1]]));

  // 3. Chèn tên nhân sự vào data hiệu suất
  dataHieuSuat = dataHieuSuat.map((row) => {
    var maNhanSu = String(row[3]).trim(); // Cột 4 là mã nhân sự
    var tenNhanSu = nhanSuMap.get(maNhanSu) || "Không tìm thấy";
    return [...row.slice(0, 4), tenNhanSu, ...row.slice(4)];
  });

  // 4. Lấy khung cơ chế
  var dataKhung = modal_khung_1_viewKhungTheoCoChe(coCheSelect);
  var khungMap = new Map();

  dataKhung.forEach(khungRow => {
    var idJobKhung = String(khungRow[0]).trim();
    var khungData = khungRow.slice(2, 5).concat(khungRow[8]);
    khungMap.set(idJobKhung, khungData);
  });

  // 5. Chèn dữ liệu khung vào data hiệu suất
  dataHieuSuat = dataHieuSuat.map((row) => {
    var idJob = String(row[8]).trim(); // Cột 9 là ID job
    var khungData = khungMap.get(idJob) || ["Không có", "Không có", "Không có", "Không có"];
    return [...row.slice(0, 9), ...khungData.slice(0, 3), ...row.slice(9, 15), khungData[3], ...row.slice(15)];
  });

  // 🆕 6. Xử lý cột "Mở rộng" - Tách thành các cột động
  var maxExpandColumns = 0; // Số cột mở rộng tối đa

  console.log("🔍 Bắt đầu xử lý cột mở rộng...");
  console.log("📊 Số dòng dữ liệu:", dataHieuSuat.length);
  console.log("📝 Mẫu dòng đầu tiên (trước khi xử lý):", dataHieuSuat[0]);

  // Tìm số cột mở rộng tối đa trong toàn bộ dữ liệu
  dataHieuSuat.forEach((row, idx) => {
    var moRongData = String(row[26] || "").trim(); // Cột "Mở rộng" ở index 26 (trước "PHÂN QUYỀN")
    if (moRongData) {
      var expandedCols = moRongData.split("||");
      console.log(`📋 Dòng ${idx}: Cột Mở rộng = "${moRongData}" → ${expandedCols.length} cột`);
      if (expandedCols.length > maxExpandColumns) {
        maxExpandColumns = expandedCols.length;
      }
    }
  });

  console.log(`✅ Tìm thấy tối đa ${maxExpandColumns} cột mở rộng trong dữ liệu`);

  // 🆕 Tách cột "Mở rộng" và thêm vào cuối mỗi dòng
  dataHieuSuat = dataHieuSuat.map((row, idx) => {
    var moRongData = String(row[26] || "").trim(); // Cột "Mở rộng" ở index 26
    var expandedCols = [];

    if (moRongData) {
      expandedCols = moRongData.split("||");
      if (idx === 0) {
        console.log(`🔧 Dòng ${idx}: Tách "${moRongData}" → [${expandedCols.join(", ")}]`);
      }
    }

    // Đảm bảo số cột mở rộng đồng nhất (thêm chuỗi rỗng nếu thiếu)
    while (expandedCols.length < maxExpandColumns) {
      expandedCols.push("");
    }

    // 🆕 Loại bỏ cột EMAIL (25), MỞ RỘNG gốc (26), UPDATE (28)
    // Chỉ giữ: [0-24] + [27: PHÂN QUYỀN] + [expandedCols]
    var newRow = [...row.slice(0, 25), row[27], ...expandedCols];

    if (idx === 0) {
      console.log(`📝 Dòng ${idx} sau khi xử lý (${newRow.length} cột):`, newRow);
      console.log(`   - Bỏ: EMAIL (${row[25]}), MỞ RỘNG gốc (${row[26]}), UPDATE (${row[28]})`);
      console.log(`   - Giữ: PHÂN QUYỀN (${row[27]})`);
      console.log(`   - Thêm: ${expandedCols.length} cột mở rộng`);
    }

    return newRow;
  });

  // 🆕 7. Tạo header động cho các cột mở rộng
  var dynamicHeaders = [];
  for (var i = 1; i <= maxExpandColumns; i++) {
    dynamicHeaders.push(`MỞ RỘNG ${i}`);
  }

  console.log(`🏷️ Headers động:`, dynamicHeaders);

  // 8. Thêm dòng header (đã bỏ EMAIL và UPDATE)
  const fixedHeader = [
    'ID', 'KỲ NGHIỆM THU', 'KHỐI', 'MÃ NHÂN SỰ', 'HỌ VÀ TÊN', 'TEAM', 'TÊN CƠ CHẾ', 'LOẠI CƠ CHẾ', 'ID JOB',
    'NHÓM CÔNG VIỆC', 'TÊN JOB', 'ĐỘ KHÓ', 'DIỄN GIẢI CÔNG VIỆC', 'KẾT QUẢ THỰC HIỆN', 'LINK OUTPUT', 'SỐ LƯỢNG',
    'KHỐI LƯỢNG CV', 'TỶ LỆ THAM GIA', 'CHẤT LƯỢNG', 'TỶ LỆ HƯỞNG', 'HIỆU SUẤT', 'GHI CHÚ',
    'WIN-FAIL', "KHÁCH HÀNG - NỘI BỘ", 'DỰ ÁN', 'PHÂN QUYỀN'
  ];

  // 🆕 Kết hợp header cố định + header động
  const header = fixedHeader.concat(dynamicHeaders);

  dataHieuSuat.unshift(header);

  console.log(`✅ Trả về ${dataHieuSuat.length - 1} dòng dữ liệu với ${header.length} cột`);
  console.log(`📋 Header cuối cùng (${header.length} cột):`, header);
  console.log(`📝 Dòng dữ liệu đầu tiên (${dataHieuSuat[1] ? dataHieuSuat[1].length : 0} cột):`, dataHieuSuat[1]);

  // Trả về kết quả
  return dataHieuSuat;
}



/**PHẦN 1 - TABLE */
//Lấy dữ liệu từ data lên để vẽ Table
function pg_general_1getDataHieuSuat(khoiSelect, coCheSelect, thangSelect) {
  // Giá trị mặc định cho khoiSelect nếu rỗng
  if (!khoiSelect) {
    khoiSelect = strAllKhoi;
  }

  // Lấy tháng và năm hiện tại nếu thangSelect rỗng
  if (!thangSelect) {
    var currentDate = new Date();
    var currentMonth = currentDate.getMonth() + 1; // Tháng trong JavaScript bắt đầu từ 0
    var currentYear = currentDate.getFullYear();  // Lấy năm hiện tại
    thangSelect = "T" + currentMonth + "." + currentYear;
  }
  var userEmail = Session.getActiveUser().getEmail();

  var arrKhoiSelect = khoiSelect ? khoiSelect.split(';') : []; // Tách khối thành mảng
  var thangArray = thangSelect ? thangSelect.split(';') : []; // Tách tháng thành mảng
  var strPhanQuyen = pg_general_1_LayChuoiPhanQuyen(coCheSelect, userEmail);
  var userPermission = strPhanQuyen || 'VIEW'; // Nếu strPhanQuyen trống thì gán là VIEW
  var checkCoCheSelect = !!coCheSelect; // Xác định có cần kiểm tra cơ chế hay không
  var result = [];

  thangArray.forEach(function (sheetName) {
    var parts = sheetName.split('.');
    if (parts.length !== 2 || !/^(T\d{1,2}|Q\d)$/.test(parts[0]) || !/^\d{4}$/.test(parts[1])) {
      return "Định dạng kỳ lương không hợp lệ!";
    }

    var year = parts[1]; // phần năm
    var key = year + "-" + coCheSelect;
    var general_dataIds = layIdsFileHieuSuatTuSheet();
    var spreadsheetId = general_dataIds[key];

    if (!spreadsheetId) {
      Logger.log("Không tìm thấy file Data cho năm " + year + " của cơ chế " + coCheSelect);
      return;
    }

    var ss = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheetByName(parts[0]);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var columnIndexCoChe = headers.indexOf("TÊN CƠ CHẾ");
      var columnIndexKhoi = headers.indexOf("KHỐI");
      var columnIndexKyNghiemTHu = headers.indexOf("KỲ NGHIỆM THU");

      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var coCheValue = row[columnIndexCoChe];
        var khoiValue = columnIndexKhoi !== -1 ? row[columnIndexKhoi] : null;
        var kyNghiemThuValue = columnIndexKyNghiemTHu !== -1 ? row[columnIndexKyNghiemTHu] : null;

        // Kiểm tra điều kiện cơ chế
        var isCoCheValid = !checkCoCheSelect || coCheSelect === coCheValue;

        // Kiểm tra điều kiện khối
        var isKhoiValid = !khoiSelect || (arrKhoiSelect.includes(khoiValue));

        // Kiểm tra điều kiện kỳ nghiệm thu
        var isThangValid = !thangSelect || (thangArray.includes(kyNghiemThuValue));

        // Nếu tất cả điều kiện hợp lệ, thêm dòng dữ liệu vào kết quả
        if (isCoCheValid && isKhoiValid && isThangValid) {
          result.push(row.concat(userPermission));
        }
      }

    } else {
      Logger.log("Sheet " + "DatabaseHieuSuat" + " không tồn tại trong năm " + year);
    }
  });

  Logger.log("Kết quả là: " + result);

  return result;

}

//LẤY DANH SÁCH NHÂN SỰ
function pg_general_1_LayDataNhanSu() {
  const sheetName = "DataNhanSu";
  const sheet = SpreadsheetApp.openById(idFileThongTinNhanSu).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Không tìm thấy sheet có tên "${sheetName}". Vui lòng kiểm tra ID và tên sheet.`);
  }

  const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2); // Lấy cột A và B
  const data = range.getValues();

  const danhSachNhanSu = data
    .map(row => [String(row[0] || "").trim(), String(row[1] || "").trim()])
    .filter(row => row[0] && row[1]); // Loại bỏ dòng trống

  if (danhSachNhanSu.length === 0) {
    console.warn("Danh sách nhân sự từ sheet 'DanhSach' rỗng. Hãy kiểm tra dữ liệu.");
  }

  Logger.log(danhSachNhanSu);
  return danhSachNhanSu;
}
function testLayDataNhanSu() {
  Logger.log(pg_general_1_LayDataNhanSu());
}

function calculateDateRange(monthString) {
  // Tách tháng và năm từ chuỗi dạng "T1.2024"
  var month = parseInt(monthString.slice(1, -5), 10); // Lấy phần tháng sau ký tự 'T'
  var year = parseInt(monthString.slice(-4), 10); // Lấy phần năm

  // Tính toán ngày bắt đầu và kết thúc
  var startDate, endDate;

  if (month === 1) {
    // Nếu là tháng 1, thì tháng trước là tháng 12 của năm trước
    startDate = new Date(year - 1, 11, 26); // 26/12 của năm trước
    endDate = new Date(year, 0, 25); // 25/1 của năm hiện tại
  } else {
    // Các tháng khác
    startDate = new Date(year, month - 2, 26); // 26 của tháng trước
    endDate = new Date(year, month - 1, 25); // 25 của tháng hiện tại
  }

  return { startDate: startDate, endDate: endDate };
}

function printDatatoSh() {
  console.time("ThoiGianLayData"); // Bắt đầu đo thời gian
  var strCoChe = "Marketing Bizfly";
  var arr = downloadKhungTheoCoChe(strCoChe);
  Logger.log(arr)
  // Kiểm tra nếu không phải là mảng
  if (!Array.isArray(arr)) {
    Logger.log("Dữ liệu không hợp lệ: " + arr);
    return; // Thoát nếu không phải mảng
  }

  if (arr.length === 0) {
    Logger.log("Dữ liệu rỗng.");
    return;
  }

  // Đảm bảo số lượng cột đồng nhất
  var expectedColumnCount = arr[0].length;
  for (var i = 0; i < arr.length; i++) {
    while (arr[i].length < expectedColumnCount) {
      arr[i].push(""); // Thêm giá trị rỗng nếu thiếu cột
    }
  }

  console.timeEnd("ThoiGianLayData"); // Kết thúc đo thời gian

  // Ghi dữ liệu vào sheet
  var sheet = SpreadsheetApp.openById('1iIzb60ud2mtS0ELb3sIGGKfsdr1OahRVcZ-h-NfpJNs').getSheetByName('Sheet2');
  try {
    sheet.getRange(1, 1, arr.length, expectedColumnCount).setValues(arr);
  } catch (e) {
    Logger.log("Lỗi khi ghi dữ liệu vào sheet: " + e.message);
  }
}


function pg_general_1_LayChuoiPhanQuyen(coCheSelect, userEmail) {
  var valuesPhanQuyen = pg_general_1GetRngPhanQuyen('HieuSuat').getValues();
  Logger.log("Chuỗi phân quyền: " + valuesPhanQuyen)
  // Tìm dòng chứa chuỗi phân quyền
  var rowIndex = valuesPhanQuyen.map(function (row) { return row[0]; }).indexOf(coCheSelect);

  if (rowIndex !== -1) { // Nếu tìm thấy chuỗi phân quyền
    var stringValue = valuesPhanQuyen[rowIndex][1]; // Lấy giá trị chuỗi phân quyền
    Logger.log("Giá trị chuỗi phân quyền: " + stringValue)
    var emailPermissions = stringValue.split(';'); // Tách từng email và quyền
    Logger.log("Email phân quyền: " + emailPermissions)
    // Kiểm tra xem userEmail có nằm trong danh sách phân quyền hay không
    for (var i = 0; i < emailPermissions.length; i++) {
      var emailPermission = emailPermissions[i].split('/'); // Tách email và quyền
      Logger.log("Email pẻmisssion: " + emailPermission)
      if (emailPermission[0] === userEmail) {

        return emailPermission[1]; // Trả về chuỗi phân quyền
      }
    }

    return "Email " + userEmail + " không có phân quyền cho cơ chế " + coCheSelect; // Nếu không tìm thấy userEmail
  } else {
    return "Không tìm thấy chuỗi phân quyền cơ chế " + coCheSelect; // Nếu không tìm thấy coCheSelect
  }
}
function pg_general_1_LayChuoiPhanQuyen2(coCheSelect) {
  var userEmail = Session.getActiveUser().getEmail(); // Lấy email người dùng đang đăng nhập
  var valuesPhanQuyen = pg_general_1GetRngPhanQuyen('HieuSuat').getValues();

  // Tìm dòng chứa chuỗi phân quyền
  var rowIndex = valuesPhanQuyen.map(function (row) { return row[0]; }).indexOf(coCheSelect);

  if (rowIndex !== -1) { // Nếu tìm thấy chuỗi phân quyền
    var stringValue = valuesPhanQuyen[rowIndex][1]; // Lấy giá trị chuỗi phân quyền
    var emailPermissions = stringValue.split(';'); // Tách từng email và quyền

    // Kiểm tra xem userEmail có nằm trong danh sách phân quyền hay không
    for (var i = 0; i < emailPermissions.length; i++) {
      var emailPermission = emailPermissions[i].split('/'); // Tách email và quyền
      if (emailPermission[0] === userEmail) {
        return userEmail + " có phân quyền là: " + emailPermission[1]; // Trả về chuỗi phân quyền
      }
    }

    return "Email không có phân quyền cho cơ chế " + coCheSelect;
  } else {
    return "Không tìm thấy chuỗi phân quyền cho cơ chế " + coCheSelect;
  }
}
function pgStaffInfo_GetStrPhanQuyen() {
  var valuesPhanQuyen = pgStaffInfo_GetRngPhanQuyen('StaffInfo2').getValues();

  // Sử dụng indexOf để tìm kiếm email của người dùng trong mảng valuesPhanQuyen
  var rowIndex = valuesPhanQuyen.map(function (row) { return row[0]; }).indexOf(userEmail);

  if (rowIndex !== -1) { // Nếu tìm thấy email
    var stringValue = valuesPhanQuyen[rowIndex][4]; // Lấy giá trị tương ứng từ cột thứ 5 (index 4)
    //Logger.log(stringValue);

    return stringValue; // Trả về chuỗi phân quyền
  } else {
    return "Không tìm thấy chuỗi phân quyền cho email này"; // Trả về thông báo nếu không tìm thấy email
  }
}


function pg_general_1GetRngPhanQuyen(sheetName) {
  var ssPhanQuyen = SpreadsheetApp.openById(phanquyenId);
  var sheet = ssPhanQuyen.getSheetByName(sheetName);
  var lastRow = dongCuoiPhanQuyen(sheetName, 'A')
  var rngPhanQuyen = sheet.getRange('A2:E' + lastRow); // Phạm vi của cột A (từ hàng 2 đến hàng cuối cùng)

  return rngPhanQuyen;
}

/** PHẦN 2 - FORM */
//Hàm check mã nhân sự
//VALIDATE ID
/*function checkIdNhanSu(id) {
  const idList = readRecordFrDataNhanSu(idNhanSuRange).flat();
  return idList.includes(id);
}*/

//Hàm lấy range khi biết ID
//GET DATA RANGE IN A1 NOTATION FOR GIVEN ID
/*function layVungThongTinNhanSu(id) {

  if (!id) {
    return null;
  }
  const idList = readRecordFrDataNhanSu(idNhanSuRange);
  const rowIndex = idList.findIndex(item => item[0] === id);
  if (rowIndex === -1) {
    return null;
  }
  const range = `DataNhanSu!A${rowIndex + 1}:${LASTCOL}${rowIndex + 1}`;
  return range;
}*/
/*function layThongTinNhanSu(id) {
  if (!id) {
    return null;
  }

  // Đảm bảo rằng bạn đã xác định đúng phạm vi idNhanSuRange trước khi gọi hàm này
  const idList = readRecordFrDataNhanSu(idNhanSuRange);  // Kiểm tra lại idNhanSuRange
  const rowIndex = idList.findIndex(item => item[0] === id);
  if (rowIndex === -1) {
    return null;
  }

  // Tạo phạm vi (range) để lấy dữ liệu
  const range = `DataNhanSu!A${rowIndex + 1}:${LASTCOL}${rowIndex + 1}`;
  const sheet = SpreadsheetApp.openById(idFileThongTinNhanSu).getSheetByName("DataNhanSu");
  const data = sheet.getRange(range).getValues();  // Dùng getRange() đúng cách

  return data;
}*/

/* function getRangeDcByIdNhanSu(id) {

 if (!id) {
   return null;
 }
 const idList = readRecordFrDataNhanSu(idNhanSuRange);
 const rowIndex = idList.findIndex(item => item[0] === id);
 if (rowIndex === -1) {
   return null;
 }
 const range = `DataNhanSu!S${rowIndex + 1}`;
 return range;
}*/
/*function testGetrang(){
  var id = '110402'
  Logger.log(layThongTinNhanSu(id))
}*/


/** ĐỌC DỮ LIỆU TỪ FILE THÔNG TIN NHÂN SỰ */
/*  function readRecordFrDataNhanSu(range) {
    try {
      let result = Sheets.Spreadsheets.Values.get(idFileThongTinNhanSu, range);
      return result.values;
    } catch (err) {
      console.log('Failed with error %s', err.message);
    }
  }*/
/** ĐỌC DỮ LIỆU TỪ FILE DATA TIỀN LƯƠNG */
//Lưu ý: có thể phải dùng 1 đoạn code giải mã ở đây thay vì ở các đoạn khác
/*function readRecordFrDataLuong(range) {
  try {
    let result = Sheets.Spreadsheets.Values.get(idDataLuong, range);
    return result.values;
  } catch (err) {
    console.log('Failed with error %s', err.message);
  }
}*/

/*function processString(str) {
  // Kiểm tra nếu `str` không phải là chuỗi, trả về mảng rỗng
  if (typeof str !== 'string') return [];

  // Tách chuỗi theo dấu ';' và lọc bỏ phần tử trống
  var items = str.split(';').filter(item => item.trim() !== '');

  var results = items.map(function(item) {
    var parts = item.split(':');
    if (parts.length > 1) {
      var value = parts[1].trim();

      // Kiểm tra xem giá trị có phải là phần trăm
      if (value.endsWith('%')) {
        value = value.replace(',', '.');
        value = parseFloat(value) / 100;
      } 
      // Kiểm tra xem giá trị có phải là số tiền (có chữ 'đ' ở cuối)
      else if (value.endsWith('đ')) {
        value = value.replace('đ', '').replace(/\./g, '');
        value = parseFloat(value);
      } 
      // Chuyển đổi giá trị số thông thường
      else {
        value = parseFloat(value.replace(',', '.'));
      }

      // Nếu giá trị là NaN sau khi xử lý, trả về chuỗi rỗng
      return isNaN(value) ? '' : value;
    }
    return ''; // Nếu không có dấu ':' thì trả về chuỗi rỗng
  });

  return results;
}*/


/*function getThongTinLuongTheoId(id) {
  var allRecords = getAllRecordsTTL();
  var record = allRecords.find(function(row) {
    return row[0] === id;
  });
  if (record) {
      var str = record[26]; // Thành phần thứ 26 của row (vị trí mảng là 25)
      
      // Kiểm tra nếu str rỗng hoặc undefined, thay bằng mảng 30 phần tử trống
      var valuesArray = str ? processString(str) : Array(40).fill('');
      
      var indexToRemove = record.length - 4; // Vị trí của giá trị thứ 4 từ cuối lên
      record.splice(indexToRemove, 1, ...valuesArray); // Xóa giá trị và thêm các giá trị từ valuesArray
      
      return record;
  } else {
      return null;
  }
}*/
/*function testGetThongTinLuong(){
  console.time("Thời gian thực thi"); // Bắt đầu ghi thời gian thực thi
  var id = '110432'
  Logger.log(getThongTinLuongTheoId(id))

  console.timeEnd("Thời gian thực thi"); // Kết thúc ghi thời gian và in ra console
}*/

/** CÁC HÀM BỔ TRỢ KHÁC */
//LẤY LIST TẠO DROPDOWN
function getDropdownList(range) {
  var list = readRecordWithID(phanquyenId, range);
  return list;
}
function tesstrange() {
  Logger.log(phanquyenId)
  Logger.log(getDropdownList("Master!B2:B"))
  Logger.log(pg_general_1_layDsKyNghiemThu())
}
function pg_general_1_layDsKyNghiemThu() {
  try {
    Logger.log("Executing pg_general_1_layDsKyNghiemThu...");
    var data = getDropdownList("Master!Q2:Q");
    Logger.log("Data fetched from Master!Q2:Q: " + JSON.stringify(data));
    return data;
  } catch (e) {
    Logger.log("Error in pg_general_1_layDsKyNghiemThu: " + e.toString());
    throw e;
  }
}
function getDropdownList_KhungCoChe(strCoChe) {
  var range = "DatabaseKhung!A2:L";

  // Kiểm tra xem strCoChe có tồn tại trong idsFileKhung không
  var idsFileKhung = layIdsFileKhungTuSheet();
  if (!(strCoChe in idsFileKhung)) {
    return []; // Trả về mảng rỗng nếu không tìm thấy
  }

  var idFileKhung = idsFileKhung[strCoChe];
  var list = readRecordWithID(idFileKhung, range);

  // Loại bỏ các giá trị trùng lặp
  var uniqueList = Array.from(
    new Set(list.map(item => JSON.stringify(item))) // Biến từng phần tử thành chuỗi
  ).map(item => JSON.parse(item)); // Chuyển chuỗi trở lại thành dạng ban đầu

  return uniqueList;
}



function pgHieuSuatGs_layDanhSachKyNghiemThu() {
  const sheetName = "HieuSuat";
  const sheet = SpreadsheetApp.openById(phanquyenId).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Không tìm thấy sheet có tên "${sheetName}". Vui lòng kiểm tra ID và tên sheet.`);
  }

  const range = sheet.getRange(2, 7, sheet.getLastRow() - 1, 3); // Lấy dữ liệu từ cột F đến H
  const data = range.getValues();

  //console.log("Dữ liệu từ sheet:", data); // Kiểm tra dữ liệu lấy từ sheet

  const danhSachKyNghiemThu = [];
  for (const row of data) {
    //console.log("Dòng dữ liệu hiện tại:", row); // Xem dữ liệu từng dòng

    if (row[0] === undefined || row[0] === null) {
      console.warn(`Cảnh báo: Giá trị row[0] bị ${row[0]} tại dòng ${JSON.stringify(row)}`);
      continue;
    }

    const kyNghiemThu = String(row[0]).trim(); // Chuyển thành chuỗi trước khi gọi .trim()
    const ngayBatDau = row[1] instanceof Date ? row[1].toISOString().split('T')[0] : null;
    const ngayKetThuc = row[2] instanceof Date ? row[2].toISOString().split('T')[0] : null;

    if (kyNghiemThu && ngayBatDau && ngayKetThuc) {
      danhSachKyNghiemThu.push([kyNghiemThu, ngayBatDau, ngayKetThuc]);
    }
  }

  if (danhSachKyNghiemThu.length === 0) {
    console.warn("Danh sách kỳ nghiệm thu rỗng. Hãy kiểm tra dữ liệu trong sheet.");
  }

  //console.log("Danh sách kỳ nghiệm thu:", danhSachKyNghiemThu);
  return danhSachKyNghiemThu;
}


function pg_general_1_KhungCoChe(strCoChe, strKyNghiemThu) {
  var range = "DatabaseKhung!A2:O";

  // Lấy danh sách kỳ nghiệm thu
  var danhSachKyNghiemThu = pgHieuSuatGs_layDanhSachKyNghiemThu();

  // Tìm ngày bắt đầu và ngày kết thúc của strKyNghiemThu
  var kyInfo = danhSachKyNghiemThu.find(row => row[0] === strKyNghiemThu);
  if (!kyInfo) {
    console.warn(`Không tìm thấy thông tin cho kỳ nghiệm thu: ${strKyNghiemThu}`);
    return [];
  }
  var ngayBatDau = kyInfo[1]; // Ngày bắt đầu
  var ngayKetThuc = kyInfo[2]; // Ngày kết thúc
  //console.log(`Lọc dữ liệu với khoảng thời gian: ${ngayBatDau} & ${ngayKetThuc}`);

  // Kiểm tra xem strCoChe có tồn tại trong idsFileKhung không
  var idsFileKhung = layIdsFileKhungTuSheet();
  if (!(strCoChe in idsFileKhung)) {
    return []; // Trả về mảng rỗng nếu không tìm thấy
  }

  var idFileKhung = idsFileKhung[strCoChe];
  var list = readRecordWithID(idFileKhung, range);
  Logger.log(list)
  // Lọc dữ liệu: Cột O (index 14) phải >= ngày bắt đầu
  var filteredList = list.filter(row => {
    var ngayO = row[14]; // Lấy giá trị cột O
    Logger.log("Giá trị cột O trước khi chuyển đổi: " + ngayO);

    var ngayOFormatted = null;
    if (typeof ngayO === "string" && ngayO.includes("/")) {
      var parts = ngayO.split("/"); // Tách ngày, tháng, năm
      if (parts.length === 3) {
        ngayOFormatted = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    Logger.log(`Giá trị O sau khi chuyển đổi: ${ngayOFormatted}, so sánh với ngayBatDau: ${ngayBatDau}`);

    // Giữ lại dòng nếu ngayOFormatted là null hoặc >= ngayBatDau
    return ngayOFormatted === null || ngayOFormatted >= ngayBatDau;
  });


  // Loại bỏ các giá trị trùng lặp
  var uniqueList = Array.from(new Set(filteredList.map(item => JSON.stringify(item))))
    .map(item => JSON.parse(item));

  return uniqueList;
}

function readRecordWithID(SPREADSHEETID, range) {
  try {
    let result = Sheets.Spreadsheets.Values.get(SPREADSHEETID, range);
    return result.values;
  } catch (err) {
    console.log('Failed with error %s', err.message);
  }
}

/**PHẦN 2 - SỬA DỮ LIỆU DÒNG HIỆU SUẤT CHI TIẾT ĐÃ UPLOAD SAI SÓT */

/** PHẦN 3 - XÓA DỮ LIỆU DÒNG HIỆU SUẤT CHI TIẾT*/
function pg_general_1_XoaDong(recordId, kyLuong, coCheSelect) {
  var parts = kyLuong.split('.');
  if (parts.length !== 2 || !/^(T\d{1,2}|Q\d)$/.test(parts[0]) || !/^\d{4}$/.test(parts[1])) {
    return "Định dạng kỳ lương không hợp lệ!";
  }

  var year = parts[1];
  var key = year + "-" + coCheSelect;
  var general_dataIds = layIdsFileHieuSuatTuSheet();
  var spreadsheetId = general_dataIds[key];

  if (!spreadsheetId) {
    return "Không tìm thấy file Data cho năm " + year + " của cơ chế " + coCheSelect;
  }

  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(parts[0]);
  if (!sheet) {
    return "Sheet không tồn tại trong năm " + year;
  }

  var data = sheet.getDataRange().getValues();
  var found = false;

  for (var i = data.length - 1; i > 0; i--) { // Duyệt ngược để tránh lỗi khi xóa
    if (data[i][0] == recordId) { // Giả sử recordId nằm ở cột A (index 0)
      sheet.deleteRow(i + 1); // Google Sheets dùng chỉ mục bắt đầu từ 1
      found = true;
      break;
    }
  }

  return found ? "Record deleted successfully!" : "Record not found!";
}


/** PHẦN 4 - ĐƯA THÔNG TIN VIEW LÊN FORM */
//Phân quyền Input
function pg_general_1GetStrPhanQuyenInput() {
  var valuesPhanQuyen = pg_general_1GetRngPhanQuyen('StaffInfo2').getValues();
  var userEmail = Session.getActiveUser().getEmail();
  // Sử dụng indexOf để tìm kiếm email của người dùng trong mảng valuesPhanQuyen
  var rowIndex = valuesPhanQuyen.map(function (row) { return row[0]; }).indexOf(userEmail);

  if (rowIndex !== -1) { // Nếu tìm thấy email
    var stringValue = valuesPhanQuyen[rowIndex][1]; // Lấy giá trị tương ứng từ cột thứ 2 (index 1)
    //Logger.log(stringValue);

    return stringValue; // Trả về chuỗi phân quyền
  } else {
    return "Không tìm phân quyền cho email này"; // Trả về thông báo nếu không tìm thấy email
  }
}
function pg_general_1GetStrPhanQuyenTaoFileData() {
  var valuesPhanQuyen = pg_general_1GetRngPhanQuyen('HieuSuat').getValues();
  var userEmail = Session.getActiveUser().getEmail();
  // Sử dụng indexOf để tìm kiếm email của người dùng trong mảng valuesPhanQuyen
  var rowIndex = valuesPhanQuyen.map(function (row) { return row[3]; }).indexOf(userEmail);

  if (rowIndex !== -1) { // Nếu tìm thấy email
    var stringValue = valuesPhanQuyen[rowIndex][4]; // Lấy giá trị tương ứng từ cột thứ 2 (index 1)
    Logger.log(stringValue);

    return stringValue; // Trả về chuỗi phân quyền
  } else {
    return "Không tìm phân quyền cho email này"; // Trả về thông báo nếu không tìm thấy email
  }
}

//Code phân quyền tổng
function getUserPermissions() {
  return {
    inputPermission: pg_general_1GetStrPhanQuyenInput(),
    taoDataFilePermission: pg_general_1GetStrPhanQuyenTaoFileData(),
    setupPermission: pg_general_1GetStrPhanQuyenTaoFileData()
  };
}



/**PHẦN 6 CACHED */
function pg_general_1_getEmployeeCodesByEmail(email) {
  var sheet = SpreadsheetApp.openById(phanquyenId).getSheetByName("HieuSuat");
  var data = sheet.getDataRange().getValues();
  var employeeSet = new Set();

  for (var i = 1; i < data.length; i++) { // Bỏ qua hàng tiêu đề
    var permissions = data[i][1]; // Cột B - Phân quyền
    var employeeCodes = data[i][2]; // Cột C - Mã nhân sự

    if (permissions.includes(email + "/")) { // Kiểm tra email trong phân quyền
      var codes = String(employeeCodes || "").split(";");
      codes.forEach(code => employeeSet.add(code));
    }
  }

  return Array.from(employeeSet); // Trả về mảng không trùng lặp
}
function pg_general_1_layDanhSachMaNhanSu() {
  var email = Session.getActiveUser().getEmail();
  var data = pg_general_1_getEmployeeCodesByEmail(email)
  Logger.log("pg_general_1_layDanhSachMaNhanSu")
  Logger.log(data)
  return data;
}
function pg_general_1_DanhSachNhanSu() {
  var email = Session.getActiveUser().getEmail();
  const allowedEmployeeCodes = new Set(pg_general_1_getEmployeeCodesByEmail(email)); // Lấy danh sách mã nhân sự hợp lệ

  const sheetName = "DataNhanSu";
  const sheet = SpreadsheetApp.openById(idFileThongTinNhanSu).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Không tìm thấy sheet có tên "${sheetName}". Vui lòng kiểm tra ID và tên sheet.`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; // Không có dữ liệu (chỉ có tiêu đề)

  const range = sheet.getRange(2, 1, lastRow - 1, 2); // Lấy cột A (mã nhân sự) và B (tên nhân sự)
  const data = range.getValues();

  const danhSachNhanSu = data
    .map(row => [String(row[0] || "").trim(), String(row[1] || "").trim()])
    .filter(ns => ns[0] && ns[1] && allowedEmployeeCodes.has(ns[0])); // Lọc chỉ nhân sự có trong danh sách hợp lệ

  if (danhSachNhanSu.length === 0) {
    console.warn("Danh sách nhân sự từ sheet 'DataNhanSu' rỗng hoặc không có nhân sự nào hợp lệ. Hãy kiểm tra dữ liệu.");
  }
  Logger.log("pg_general_1_DanhSachNhanSu")
  Logger.log(danhSachNhanSu);
  return danhSachNhanSu;
}

function testpg_general_1_DanhSachNhanSu() {
  var email = "caobuivan@vccorp.vn"
  Logger.log("Danh sách nhân sự của hàm pg_general_1_DanhSachNhanSu: " + pg_general_1_DanhSachNhanSu())
  Logger.log("Danh sách nhân sự của hàm Filter: " + pg_general_1_getEmployeeCodesByEmail(email))
}

/**
 * Hàm hỗ trợ cài đặt nhanh ScriptProperties cho môi trường Dev (Chạy 1 lần trong Apps Script Editor)
 */
function setupScriptProperties_Dev() {
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.setProperty('APP_ENV', 'development');
  scriptProps.setProperty('API_BASE_URL', 'https://vcc-hr-backend-dev-69050732080.asia-southeast1.run.app');
  Logger.log("=== Đã cài đặt ScriptProperties cho môi trường DEVELOPMENT ===");
  Logger.log("APP_ENV: " + scriptProps.getProperty('APP_ENV'));
  Logger.log("API_BASE_URL: " + scriptProps.getProperty('API_BASE_URL'));
}

/**
 * Hàm hỗ trợ cài đặt ScriptProperties cho môi trường Production
 */
function setupScriptProperties_Prod(apiUrl, apiKey) {
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.setProperty('APP_ENV', 'production');
  if (apiUrl) scriptProps.setProperty('API_BASE_URL', apiUrl);
  if (apiKey) scriptProps.setProperty('INTERNAL_API_KEY', apiKey);
  Logger.log("=== Đã cài đặt ScriptProperties cho môi trường PRODUCTION ===");
  Logger.log("APP_ENV: " + scriptProps.getProperty('APP_ENV'));
  Logger.log("API_BASE_URL: " + scriptProps.getProperty('API_BASE_URL'));
}

function getApiConfig() {
  const scriptProps = PropertiesService.getScriptProperties();
  const appEnv = (scriptProps.getProperty('APP_ENV') || '').toLowerCase().trim();

  if (appEnv !== 'production' && appEnv !== 'development') {
    throw new Error("Lỗi cấu hình hệ thống: `APP_ENV` Script Property phải được thiết lập tường minh là 'production' hoặc 'development'.");
  }

  let baseUrl = scriptProps.getProperty('API_BASE_URL');
  let apiKey = scriptProps.getProperty('INTERNAL_API_KEY');

  if (appEnv === 'production') {
    if (!baseUrl || !apiKey) {
      throw new Error("Lỗi cấu hình Production: `API_BASE_URL` và `INTERNAL_API_KEY` bắt buộc phải có trong ScriptProperties.");
    }
  } else if (appEnv === 'development') {
    if (!baseUrl) {
      baseUrl = 'https://vcc-hr-backend-dev-69050732080.asia-southeast1.run.app';
    }
  }

  return { baseUrl, apiKey, appEnv };
}

function getPreviousThangString(strThang) {
  const match = String(strThang || '').match(/^T(0?[1-9]|1[0-2])\.(\d{4})$/i);
  if (!match) return null;
  let m = parseInt(match[1], 10);
  let y = parseInt(match[2], 10);

  m = m - 1;
  if (m < 1) {
    m = 12;
    y = y - 1;
  }
  return `T${m}.${y}`;
}

function fetchSnapshotRawFromAPI(strThang) {
  const { baseUrl, apiKey } = getApiConfig();
  const url = `${baseUrl.replace(/\/$/, '')}/api/snapshots/employees-detail?thang=${encodeURIComponent(strThang)}`;

  const headers = {};
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: headers,
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 200) {
    throw new Error(`Lỗi từ API Snapshot (${statusCode}): ${responseText || 'Không kết nối được server'}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (err) {
    throw new Error("Phản hồi từ API Snapshot không phải JSON hợp lệ.");
  }

  const hasExplicitFailureStatus =
    typeof result.status === 'string' && result.status.toLowerCase() !== 'success';
  const hasExplicitFailureFlag = result.success === false;

  if (hasExplicitFailureStatus || hasExplicitFailureFlag) {
    throw new Error(`API Snapshot báo lỗi: ${result.message || result.error || 'Lỗi không xác định'}`);
  }

  if (!Array.isArray(result.data)) {
    const responseKeys = result && typeof result === 'object'
      ? Object.keys(result).join(', ')
      : typeof result;
    throw new Error(`API Snapshot trả về sai định dạng: trường data phải là mảng. Các trường nhận được: ${responseKeys || '(không có)'}`);
  }

  return result.data;
}

function getSnapshotEmployeesDetailFromAPI(strThang) {
  if (!strThang) {
    throw new Error("Kỳ nghiệm thu (thang) không được để rỗng khi truy xuất API Snapshot.");
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = "SNAPSHOT_EMP_DETAIL_" + String(strThang).replace(/[^a-zA-Z0-9_-]/g, "_");
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    try {
      return JSON.parse(cachedData);
    } catch (e) {
      Logger.log("Lỗi parse cache: " + e.message);
    }
  }

  let rawData = fetchSnapshotRawFromAPI(strThang);

  // Nếu tháng yêu cầu chưa có snapshot (data rỗng []), tự động lùi kỳ gần nhất có dữ liệu (tối đa 6 tháng)
  if (!rawData || rawData.length === 0) {
    let currentSearchThang = strThang;
    for (let attempts = 0; attempts < 6; attempts++) {
      currentSearchThang = getPreviousThangString(currentSearchThang);
      if (!currentSearchThang) break;
      try {
        const prevData = fetchSnapshotRawFromAPI(currentSearchThang);
        if (Array.isArray(prevData) && prevData.length > 0) {
          Logger.log(`[FALLBACK SNAPSHOT] Kỳ ${strThang} chưa có dữ liệu, tự động lấy dữ liệu snapshot kỳ gần nhất: ${currentSearchThang}`);
          rawData = prevData;
          break;
        }
      } catch (errFallback) {
        Logger.log(`Lỗi khi thử fallback kỳ ${currentSearchThang}: ${errFallback.message}`);
      }
    }
  }

  // Chuẩn hóa dữ liệu mảng đối tượng nhân sự
  const normalizedData = (rawData || []).map(item => {
    const targetGT = Number(item.luong_target_gt || 0);
    const targetCC = Number(item.luong_target_cc || 0);
    const luongTarget = targetCC > 0 ? targetCC : targetGT;
    const luongCoDinh = Number(item.luong_co_dinh ?? item.lcd_gt ?? 0);

    return {
      ma_nhan_su: String(item.ma_nhan_su || '').trim(),
      ho_va_ten: item.ho_va_ten || '',
      khoi: item.khoi || '',
      phong_ban: item.phong_ban || '',
      nhom_team: item.nhom_team || '',
      chuc_danh: item.chuc_danh || '',
      luong_target_gt: targetGT,
      luong_target_cc: targetCC,
      luongTarget: luongTarget,
      luongCoDinh: luongCoDinh,
      raw: item
    };
  });

  try {
    cache.put(cacheKey, JSON.stringify(normalizedData), 600);
  } catch (cacheErr) {
    Logger.log("Không thể ghi ScriptCache (quá dung lượng): " + cacheErr.message);
  }

  return normalizedData;
}

function pg_general_1_laythongtinnhansu() {
  // Legacy compatibility wrapper
  return getSnapshotEmployeesDetailFromAPI("T6.2026");
}

function timKiemNhanSuTheoMa(filteredData, maNS_Input) {
  if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0) return [];

  let danhSachMa = [];
  if (Array.isArray(maNS_Input)) {
    danhSachMa = maNS_Input.map(ma => String(ma).trim()).filter(ma => ma !== '');
  } else if (typeof maNS_Input === 'string' && maNS_Input.trim() !== '') {
    danhSachMa = maNS_Input.split(';').map(ma => String(ma).trim()).filter(ma => ma !== '');
  }

  if (danhSachMa.length === 0) {
    return filteredData;
  }

  const ketQua = filteredData.filter(item => {
    const maNS = String(item.ma_nhan_su || '').replace(/\.0$/, '');
    return danhSachMa.includes(maNS);
  });

  return ketQua;
}

function pg_general_1_LayDataLuong(maNS_String, kyNghiemThu) {
  if (!kyNghiemThu) {
    throw new Error("Kỳ nghiệm thu (kyNghiemThu) không được để trống.");
  }
  const filteredData = getSnapshotEmployeesDetailFromAPI(kyNghiemThu);
  const data = timKiemNhanSuTheoMa(filteredData, maNS_String);
  return data;
}

/**
 * Lấy danh sách kỳ nghiệm thu bao gồm cả Tháng và Quý
 * Kết hợp dữ liệu từ Master!B2:B (tháng) và tự động generate Quý
 */
function pg_general_1_layDsKyNghiemThuDayDu() {
  try {
    // Lấy danh sách tháng từ Master!B2:B
    var danhSachThang = getDropdownList("Master!B2:B");

    if (!danhSachThang || danhSachThang.length === 0) {
      Logger.log("Không có dữ liệu tháng từ Master!B2:B");
      return [];
    }

    // Flatten array nếu cần (vì getDropdownList có thể trả về mảng 2 chiều)
    var thangList = danhSachThang.map(function (item) {
      return Array.isArray(item) ? item[0] : item;
    }).filter(function (item) {
      return item && String(item).trim() !== '';
    });

    // Tạo Set để lưu các năm duy nhất
    var namSet = new Set();
    thangList.forEach(function (thang) {
      var parts = String(thang).split('.');
      if (parts.length === 2) {
        namSet.add(parts[1]); // Lấy phần năm
      }
    });

    // Generate danh sách Quý cho mỗi năm
    var quyList = [];
    Array.from(namSet).forEach(function (nam) {
      for (var q = 1; q <= 4; q++) {
        quyList.push("Q" + q + "." + nam);
      }
    });

    // Kết hợp Tháng và Quý, sau đó sắp xếp
    var ketQua = thangList.concat(quyList);

    // Sắp xếp theo năm và kỳ
    ketQua.sort(function (a, b) {
      var partsA = String(a).split('.');
      var partsB = String(b).split('.');

      var yearA = parseInt(partsA[1]);
      var yearB = parseInt(partsB[1]);

      // So sánh năm trước
      if (yearA !== yearB) {
        return yearA - yearB;
      }

      // Cùng năm, so sánh kỳ
      var periodA = partsA[0];
      var periodB = partsB[0];

      // Chuyển đổi sang số để so sánh
      var numA = periodA.startsWith('T') ? parseInt(periodA.substring(1)) : parseInt(periodA.substring(1)) * 3;
      var numB = periodB.startsWith('T') ? parseInt(periodB.substring(1)) : parseInt(periodB.substring(1)) * 3;

      return numA - numB;
    });

    Logger.log("Danh sách kỳ nghiệm thu đầy đủ (Tháng + Quý): " + JSON.stringify(ketQua));
    return ketQua.map(function (item) { return [item]; }); // Trả về dạng mảng 2 chiều

  } catch (e) {
    Logger.log("Error in pg_general_1_layDsKyNghiemThuDayDu: " + e.toString());
    return [];
  }
}
