/**CODE BỔ TRỢ CONTROL PANEL */
function pgHieuSuatGs_taoKhungMoi(fileName, loaiCoChe) {
  try {
    // IDs của file và thư mục
    const TEMPLATE_FILE_ID = '1qf1JGMEzwF0KdkKCKfdNPHaE0Kpgu3r3RimlXyi0Q_g';//'ID-CUA-FILE-MAU';
    const DEST_FOLDER_ID = '1o1UYdnKTyEdctKjUpRDLcDmii5-AgUWG';//'ID-FOLDER-MAU';
    const DANH_MUC_FILE_ID = '1zyp2-zzMnSrnhappsvKYjAg_1J_G2JeBq49-9SLNncY'//'ID-File-Danh-Muc';
    const SHEET_NAME = 'DanhMucFileKhung'//'Danh-Muc';

    // Hành động 1: Tạo bản sao file mẫu
    const templateFile = DriveApp.getFileById(TEMPLATE_FILE_ID);
    const destFolder = DriveApp.getFolderById(DEST_FOLDER_ID);
    const newFile = templateFile.makeCopy(fileName, destFolder);
    const newFileId = newFile.getId(); // Lấy ID của file mới

    // Hành động 2: Điền tên file vào cột A
    const danhMucSheet = SpreadsheetApp.openById(DANH_MUC_FILE_ID).getSheetByName(SHEET_NAME);
    const lastRow = danhMucSheet.getLastRow() + 1; // Tìm dòng cuối
    danhMucSheet.getRange(lastRow, 1).setValue(fileName);

    //Hành động 3: điền tên file mới vào tệp mẫu
    var fileMau_SheetMaster = SpreadsheetApp.openById('1Z_GtevnOW4aBajtUuhbFrL_PHIkWamxRxgfOjhD-Dz4').getSheetByName('MasterSheet');
    var dongCuoi_FileMau = fileMau_SheetMaster.getLastRow() + 1; // Tìm dòng cuối
    fileMau_SheetMaster.getRange(dongCuoi_FileMau, 3, 1, 2).setValues([[fileName, loaiCoChe]]);

    // Hành động 4: Điền ID của file vào cột B
    danhMucSheet.getRange(lastRow, 4).setValue(newFileId);

    // Trả về thành công
    return { success: true, message: 'Tạo khung cơ chế mới thành công.', fileId: newFileId };
  } catch (error) {
    // Trả về lỗi
    return { success: false, message: 'Đã xảy ra lỗi: ' + error.message };
  }
}
/**FILE KHUNG */
function pgKhung_GhiDataKhungVaoSheet(data, strCoChe) {
  /** Kiểm tra xem strCoChe có tồn tại trong idsFileKhung không*/
  var idsFileKhung = layIdsFileKhungTuSheet();
  if (!(strCoChe in idsFileKhung)) {
    return "Không tìm thấy file Khung của cơ chế hiệu suất: " + strCoChe;
  } else {
    var idFileKhung = idsFileKhung[strCoChe];
  }

  /** Tiếp tục xử lý dữ liệu ở đây...*/
  var fullHeaders = ["ID", "STT", "NHÓM CÔNG VIỆC", "TÊN JOB", "ĐỘ KHÓ", "MÔ TẢ", "OUTPUT", "ĐƠN VỊ TÍNH", "CHẤT LƯỢNG", "TIÊU CHÍ CHẤT LƯỢNG", "SỐ LƯỢNG JOB QUY ĐỔI", "ĐƠN GIÁ", "GHI CHÚ", "NGÀY BẮT ĐẦU", "NGÀY HẾT HẠN", "Email", "Update"];
  var newheaders = ["STT", "NHÓM CÔNG VIỆC", "TÊN JOB", "ĐỘ KHÓ", "MÔ TẢ", "OUTPUT", "ĐƠN VỊ TÍNH", "CHẤT LƯỢNG", "TIÊU CHÍ CHẤT LƯỢNG", "SỐ LƯỢNG JOB QUY ĐỔI", "ĐƠN GIÁ", "GHI CHÚ", "NGÀY BẮT ĐẦU"];

  var currentDate = new Date();
  var dateString = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  var formattedDate = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');

  var allRows = [];
  var ngayhethan = "";
  var userEmail = Session.getActiveUser().getEmail();

  data.forEach(function (row, index) {
    var rowData = [];
    var id = (index + 1) + "ID" + dateString;
    rowData.push(id);

    /*newheaders.forEach(function (header) {
        if (header === "SỐ LƯỢNG JOB QUY ĐỔI" || header === "ĐƠN GIÁ") {
            // Định dạng lại số: ngăn cách hàng nghìn là dấu '.' và hàng thập phân là dấu ','
            var value = row[header] ? parseFloat(row[header].toString().replace(/,/g, '').replace(/\./g, '.')) : 0;
            rowData.push(value.toLocaleString('vi-VN'));
        } else {
            rowData.push(row[header] || "");
        }
    });*/
    newheaders.forEach(function (header) {
      if (header === "SỐ LƯỢNG JOB QUY ĐỔI" || header === "ĐƠN GIÁ") {
        // Chuyển đổi thành số và định dạng lại
        var value = row[header] ? parseFloat(row[header].toString().replace(/,/g, '').replace(/\./g, '.')) : 0;
        rowData.push(value.toString().replace('.', ',')); // Chỉ giữ dấu ',' làm ngăn cách thập phân
      } else {
        rowData.push(row[header] || "");
      }
    });


    rowData.push(ngayhethan);
    rowData.push(userEmail);
    rowData.push(formattedDate);

    allRows.push(rowData);
  });

  var spreadsheet = SpreadsheetApp.openById(idFileKhung);
  var sheet = spreadsheet.getSheetByName("DatabaseKhung");

  // Ghi tất cả dữ liệu vào bảng tính
  if (allRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, allRows.length, fullHeaders.length).setValues(allRows);
  }

  return 'Success';
}

function updateExpiryDateInGoogleSheet(ids, expiryDate, strCoChe) {
  Logger.log("IDs nhận được: " + ids); // Log ids nhận được
  Logger.log("Ngày hết hạn nhận được: " + expiryDate); // Log ngày hết hạn
  var idsFileKhung = layIdsFileKhungTuSheet();
  if (!(strCoChe in idsFileKhung)) {
    // Nếu không tồn tại, trả về thông báo
    //Logger.log("Không tìm thấy file hiệu suất với tên: " + strCoChe);
    return "Không tìm thấy file Khung của cơ chế hiệu suất: " + strCoChe;
  } else {
    // Nếu tồn tại, khai báo và gán giá trị từ idsFileKhung
    var idFileKhung = idsFileKhung[strCoChe];
  }

  var sheet = SpreadsheetApp.openById(idFileKhung).getSheetByName('DatabaseKhung'); // Thay Sheet1 bằng tên sheet của bạn
  var range = sheet.getDataRange(); // Lấy toàn bộ dữ liệu
  var values = range.getValues(); // Lấy các giá trị trong sheet

  // Duyệt qua các dòng và kiểm tra nếu id trùng khớp
  for (var i = 0; i < values.length; i++) {
    var id = values[i][0]; // Giả sử cột đầu tiên là cột ID
    if (ids.indexOf(id) !== -1) {
      // Ghi ngày hết hạn vào cột thứ 10 (vị trí này có thể thay đổi tùy thuộc vào cấu trúc bảng của bạn)
      sheet.getRange(i + 1, 15).setValue(expiryDate); // i + 1 vì chỉ số mảng bắt đầu từ 0
      Logger.log("Cập nhật ngày hết hạn cho ID " + id + " tại dòng " + (i + 1));
    }
  }

  return "Cập nhật thành công"; // Trả về thông báo khi hoàn thành
}

function modal_khung_1_viewKhungTheoCoChe(strCoChe) {
  const TEST_IGNORE_HIEU_LUC = false; // 🔁 Đặt thành true để TẮT lọc hiệu lực → test xem có đủ 156 dòng không

  try {
    Logger.log(`\n===== 🚀 BẮT ĐẦU TEST: modal_khung_1_viewKhungTheoCoChe('${strCoChe}') =====`);

    // --- Bước 1: Kiểm tra tồn tại cơ chế ---
    var idsFileKhung = layIdsFileKhungTuSheet();
    if (!(strCoChe in idsFileKhung)) {
      Logger.log(`❌ Cơ chế '${strCoChe}' KHÔNG tồn tại.`);
      return [];
    }
    var idFileKhung = idsFileKhung[strCoChe];
    Logger.log(`✅ Cơ chế tồn tại. ID file: ${idFileKhung}`);

    // --- Bước 2: Kiểm tra phân quyền ---
    var userEmail = Session.getActiveUser().getEmail();
    var phanQuyen = pg_general_1_LayChuoiPhanQuyen(strCoChe, userEmail);
    Logger.log(`📧 User: ${userEmail}`);
    Logger.log(`🔑 Phân quyền: ${phanQuyen}`);

    if (phanQuyen === "Không tìm thấy chuỗi phân quyền cho cơ chế này" ||
      phanQuyen === "Email không có phân quyền") {
      Logger.log(`🚫 Không có quyền → trả về []`);
      return [];
    }

    // --- Bước 3: Lấy dữ liệu từ sheet ---
    var ss = SpreadsheetApp.openById(idFileKhung);
    var sheet = ss.getSheetByName('DatabaseKhung');
    if (!sheet) {
      Logger.log(`❌ Không tìm thấy sheet 'DatabaseKhung'`);
      return [];
    }

    // ✅ Lấy lastRow AN TOÀN (dựa trên cột B — cột ID thường có dữ liệu đầy)
    var lastRow = sheet.getRange("A:A").getValues()
      .reduce((max, row, i) => row[0] !== "" ? i + 1 : max, 0);
    if (lastRow === 0) lastRow = sheet.getLastRow();

    Logger.log(`📊 Tổng dòng (theo cột B): ${lastRow}`);
    var data = sheet.getRange(1, 1, lastRow, 17).getValues(); // A-Q
    Logger.log(`📥 Đã lấy ${data.length} dòng từ sheet.`);

    // --- Log dòng cuối để debug ---
    if (data.length > 0) {
      var last = data[data.length - 1];
      Logger.log(`\n📎 DÒNG CUỐI (index ${data.length - 1}):`);
      Logger.log(`   Cột O (index 14) = [${typeof last[14]}] "${last[14]}"`);
      Logger.log(`   Trim? → "${(typeof last[14] === 'string') ? last[14].trim() : '—'}"`);
    }

    // --- Xử lý dữ liệu ---
    var result = [];
    var skipped = 0;

    for (var i = 1; i < data.length; i++) { // i=0 là header → bỏ qua
      var row = data[i];

      // ✅ Điều kiện "còn hiệu lực" — SỬA CHÍNH Ở ĐÂY
      var colO = row[14];
      var conHieuLuc =
        colO == null ||
        colO === "" ||
        (typeof colO === "string" && colO.trim() === "");

      // 🔁 Tạm thời tắt lọc để test?
      if (TEST_IGNORE_HIEU_LUC) conHieuLuc = true;

      if (conHieuLuc) {
        // Sao chép cột A-O (0→14), format ngày ở cột N,O (13,14)
        var newRow = [];
        for (var j = 0; j <= 14; j++) {
          var val = row[j];
          if ((j === 13 || j === 14) && val instanceof Date) {
            val = Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy");
          }
          newRow.push(val || "");
        }
        result.push(newRow);
      } else {
        skipped++;
        if (skipped <= 5) { // Chỉ log 5 dòng đầu bị loại để tránh tràn log
          Logger.log(`❌ Bị loại (dòng ${i + 1}): cột O = [${typeof colO}] "${colO}"`);
        }
      }
    }

    // --- Tổng kết ---
    Logger.log(`\n✅ KẾT QUẢ:`);
    Logger.log(`   - Tổng dòng dữ liệu (sau header): ${data.length - 1}`);
    Logger.log(`   - Bị loại do cột O ≠ trống: ${skipped}`);
    Logger.log(`   - ĐƯỢC LẤY: ${result.length}`);
    if (TEST_IGNORE_HIEU_LUC) {
      Logger.log(`   💡 (Đang ở chế độ TEST — TẮT lọc hiệu lực)`);
    }
    if (result.length === 0 && data.length > 1) {
      Logger.log(`   ⚠️ Cảnh báo: Không có dòng nào được lấy → kiểm tra lại cột hiệu lực!`);
    }

    Logger.log(`\n===== ✅ HOÀN TẤT — Trả về ${result.length} dòng =====\n`);
    return result;

  } catch (e) {
    Logger.log(`💥 LỖI: ${e.message}\n${e.stack}`);
    return [];
  }
}
function testKhung_2() {
  try {
    var strCoChe = 'CCL - ADM - Sale Admin Adsponser';
    Logger.log('Start function');

    var data = modal_khung_1_viewKhungTheoCoChe(strCoChe);
    Logger.log('data raw: ' + JSON.stringify(data));

    if (!data || !Array.isArray(data) || data.length === 0) {
      Logger.log('Data empty or invalid');
      return;
    }
    if (!Array.isArray(data[0])) {
      Logger.log('First row is not array');
      return;
    }

    var sheet = SpreadsheetApp
      .openById('1iIzb60ud2mtS0ELb3sIGGKfsdr1OahRVcZ-h-NfpJNs')
      .getSheetByName('Test');

    if (!sheet) {
      Logger.log('Sheet "Khung" not found');
      return;
    }

    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    Logger.log('Rows written: ' + data.length);
  } catch (e) {
    Logger.log('Error: ' + e);
  }
}
