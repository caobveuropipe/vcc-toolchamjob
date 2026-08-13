/**
 * Tạo file hiệu suất mới - v2
 * User KHÔNG CẦN quyền gì cả - Tất cả logic ở server
 */
function modal_taoData_1_taoFileHieuSuatMoi(fileName, year, strCoChe) {
  try {
    // ===== CẤU HÌNH API =====
    const API_URL = 'https://script.google.com/macros/s/AKfycbzuPLwCXz8P88hITrXII1wv3wzCIekDp5aAhHW_CI6500nB4LNkOiGmV1WmlJwV1swo/exec';
    const API_KEY = 'd4e7a9b3-1f5c-42d8-9e6a-7b3f1c8d2a5e';

    // ===== GỌI API - Tất cả logic ở server =====
    const payload = {
      apiKey: API_KEY,
      action: 'createNewFile',
      fileName: fileName,
      year: year,
      strCoChe: strCoChe
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(API_URL, options);
    const result = JSON.parse(response.getContentText());

    return result;

  } catch (error) {
    Logger.log('Lỗi khi gọi API: ' + error.toString());
    console.error('Lỗi khi gọi API:', error);
    return {
      success: false,
      message: 'Lỗi kết nối API: ' + error.message
    };
  }
}


function testTaoFile() {
  var year = "2027"
  var strCoChe = "CCL - ADM - Mua ngoài"
  var fileName = year + "-" + strCoChe
  Logger.log(modal_taoData_1_taoFileHieuSuatMoi(fileName, year, strCoChe))
}