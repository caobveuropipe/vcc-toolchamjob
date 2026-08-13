/**Quy trình xử lý dữ liệu upload hiệu suất
 * Bước 1 - Xử lý trong server: Upload từ excel lên form
 * Bước 2 - Xử lý trong server: Kiểm tra các điều kiện trên form: Kỳ nghiệm thu, năm nghiệm thu
 * Bước 3 - Xử lý trong server: 
 * Bước 4 - Xử lý trong server: Kiểm tra các keyword
 */
///KHAI BÁO
const strAllKhoi = LibLink.strAllKhoi;

const phanquyenId = LibLink.idFileMaster;
const idFileThongTinNhanSu = LibLink.idFileThongTinNhanSu;


const fileDanhMuc_Id = '1zyp2-zzMnSrnhappsvKYjAg_1J_G2JeBq49-9SLNncY';//ID của file danh mục

const general_webapp_thongtinnhansu = 'https://script.google.com/macros/s/AKfycbzDraUijcOHUVmgoBfR2EN7hO3QemvMcW4xzEnJamA2oxj-pow7zqqTkTtszLKqrJW-WA/exec'//QuanTriHeThong_Dopost + https://script.google.com/home/projects/13PxEgFT1KZcYF81nn1IFtTTYLKbcvfDeMV21RRwZXcD5BnwVVnLOiwtq/edit




const danhMucFileHieuSuat = 'DanhMucFileHieuSuat';//Tên sheet trong file danh mục
const danhMucFileKhung = 'DanhMucFileKhung';//Tên sheet trong file danh mục

//đây là id file chốt, được định nghĩa là file A
  //const general_dataIds = layIdsFileHieuSuatTuSheet();
  function layIdsFileHieuSuatTuSheet() {
    var sheetName = danhMucFileHieuSuat;

    // Mở Google Sheet và truy cập sheet
    const sheet = SpreadsheetApp.openById(fileDanhMuc_Id).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Không tìm thấy sheet có tên "${sheetName}".`);
    }

    // Lấy tất cả dữ liệu từ sheet
    const data = sheet.getDataRange().getValues();

    // Tạo object general_dataIds
    const idsFileHieuSuat = {};
    for (let i = 1; i < data.length; i++) { // Bỏ qua hàng đầu tiên (tiêu đề)
      const key = data[i][0]; // Cột A
      const value = data[i][5]; // Cột F
      if (key && value) { // Bỏ qua các dòng không có key hoặc value
        idsFileHieuSuat[key] = value;
      }
    }

    // Log kết quả để kiểm tra
    //console.log(idsFileHieuSuat);

    return idsFileHieuSuat;
  }
  function layPhanQuyenSua_FileHieuSuatTuSheet() {
    var sheetName = danhMucFileHieuSuat;

    // Mở Google Sheet và truy cập sheet
    const sheet = SpreadsheetApp.openById(fileDanhMuc_Id).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Không tìm thấy sheet có tên "${sheetName}".`);
    }

    // Lấy tất cả dữ liệu từ sheet
    const data = sheet.getDataRange().getValues();

    // Tạo object general_dataIds
    const phanQuyenFileHieuSuat = {};
    for (let i = 1; i < data.length; i++) { // Bỏ qua hàng đầu tiên (tiêu đề)
      const key = data[i][0]; // Cột A
      const value = data[i][6]; // Cột F
      if (key && value) { // Bỏ qua các dòng không có key hoặc value
        phanQuyenFileHieuSuat[key] = value;
      }
    }

    // Log kết quả để kiểm tra
    //console.log(phanQuyenFileHieuSuat);

    return phanQuyenFileHieuSuat;
  }
  function layIdsFileKhungTuSheet() {
    var sheetName = danhMucFileKhung;

    // Mở Google Sheet và truy cập sheet
    const sheet = SpreadsheetApp.openById(fileDanhMuc_Id).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Không tìm thấy sheet có tên "${sheetName}".`);
    }

    // Lấy tất cả dữ liệu từ sheet
    const data = sheet.getDataRange().getValues();

    // Tạo object general_dataIds
    const idsFileKhung = {};
    for (let i = 1; i < data.length; i++) { // Bỏ qua hàng đầu tiên (tiêu đề)
      const key = data[i][0]; // Cột A
      const value = data[i][3]; // Cột F
      if (key && value) { // Bỏ qua các dòng không có key hoặc value
        idsFileKhung[key] = value;
      }
    }

    // Log kết quả để kiểm tra
    //console.log(idsFileKhung);

    return idsFileKhung;
  }
    
    /*function modal_khung_1_DanhSachNhanSu() {
        const sheetName = "DanhSach";
        const sheet = SpreadsheetApp.openById(fileDanhMuc_Id).getSheetByName(sheetName);
        if (!sheet) {
            throw new Error(`Không tìm thấy sheet có tên "${sheetName}". Vui lòng kiểm tra ID và tên sheet.`);
        }

        const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3); // Chỉ lấy cột A đến C
        const data = range.getValues();

        const danhSachMaNhanSu = {};
        for (const row of data) {
            const maNhanSu = row[0]?.trim();
            const value = row[2]?.trim();
            if (maNhanSu && value) {
                danhSachMaNhanSu[maNhanSu] = value;
            }
        }

        if (Object.keys(danhSachMaNhanSu).length === 0) {
            console.warn("Danh sách mã nhân sự từ sheet 'DanhSach' rỗng. Hãy kiểm tra dữ liệu.");
        }
        Logger.log(danhSachMaNhanSu)
        return danhSachMaNhanSu;
    }*/


function dongCuoi(sheet,column){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(sheet)
  var lastRow = sh.getMaxRows();
  var rngArr = sh.getRange(column + "1:" + column + lastRow).getValues();
    for (; rngArr[lastRow - 1] == "" && lastRow > 0; lastRow--) {}
    
    return lastRow;
}
function dongCuoiPhanQuyen(sheet,column){
  var ss=SpreadsheetApp.openById(phanquyenId);
  var sh = ss.getSheetByName(sheet)
  var lastRow = sh.getMaxRows();
  var rngArr = sh.getRange(column + "1:" + column + lastRow).getValues();
    for (; rngArr[lastRow - 1] == "" && lastRow > 0; lastRow--) {}
    
    return lastRow;
}
function dongCuoiFileLuongB(sheet,column){
  var ss=SpreadsheetApp.openById(idDataLuong);
  var sh = ss.getSheetByName(sheet)
  var lastRow = sh.getMaxRows();
  var rngArr = sh.getRange(column + "1:" + column + lastRow).getValues();
    for (; rngArr[lastRow - 1] == "" && lastRow > 0; lastRow--) {}
    
    return lastRow;
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


function render(file,argsObject){
  var tmpHtml = HtmlService.createTemplateFromFile(file);

  if(argsObject){
    var keys = Object.keys(argsObject);

    keys.forEach(function(key){
      tmpHtml[key] = argsObject[key];
    });
  }
  
  return tmpHtml.evaluate().setTitle('Tool hiệu suất V2.1').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

var Route = {};
Route.path = function(route,callback){
  Route[route] = callback;
}

function doGet(e) {
  var userEmail = Session.getEffectiveUser().getEmail();
  if (!userEmail) {
    return HtmlService.createHtmlOutput("Bạn chưa đăng nhập.");
  } else {
    return render('pg_general_2');
  }
}


function myURL() {
   return ScriptApp.getService().getUrl();
}
function formatNumber(number) {
  return number.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
