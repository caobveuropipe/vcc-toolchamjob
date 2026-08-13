/**
 * API SERVICE v2 - Xử lý TOÀN BỘ logic tạo file
 * File này cần được tạo trong một Google Apps Script project riêng biệt
 * và deploy as Web App với quyền "Execute as: Me" và "Who has access: Anyone"
 * Phân quyền phase 1 dùng cho mọi người tạo thêm 1 file data khi cần đề upload data
 */

// ID của file và thư mục
const DANH_MUC_FILE_ID = '1zyp2-zzMnSrnhappsvKYjAg_1J_G2JeBq49-9SLNncY';
const SHEET_NAME = 'DanhMucFileHieuSuat';
const TEMPLATE_FILE_ID = '1l8DZyxeODr7NO3gKWzB-AcLbJ3JbzMLtIgYBt-Bf0Ow';
const DEST_FOLDER_ID = '19OiqQztbv69w4I0Ou1VNa2MH8Cq3vyPo';

// API Key để bảo mật
const API_KEY = 'd4e7a9b3-1f5c-42d8-9e6a-7b3f1c8d2a5e';

/**
 * Hàm doPost - Nhận request từ dự án khác
 */
function doPost(e) {
  try {
    // Parse dữ liệu từ request
    const params = JSON.parse(e.postData.contents);
    
    // Xác thực API Key
    if (params.apiKey !== API_KEY) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Unauthorized: Invalid API Key'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Xử lý theo action
    switch (params.action) {
      case 'createNewFile':
        return createNewFile(params.fileName, params.year, params.strCoChe);
      
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          message: 'Invalid action'
        })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Server error: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Tạo file mới - TOÀN BỘ logic ở đây
 */
function createNewFile(fileName, year, strCoChe) {
  try {
    // BƯỚC 1: Kiểm tra file đã tồn tại chưa
    const danhMucSheet = SpreadsheetApp.openById(DANH_MUC_FILE_ID).getSheetByName(SHEET_NAME);
    const fileName_list = danhMucSheet.getRange('A2:A').getValues().flat();
    
    if (fileName_list.includes(fileName)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Tên file hiệu suất đã tồn tại.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // BƯỚC 2: Tạo bản sao file mẫu
    const templateFile = DriveApp.getFileById(TEMPLATE_FILE_ID);
    const destFolder = DriveApp.getFolderById(DEST_FOLDER_ID);
    const newFile = templateFile.makeCopy(fileName, destFolder);
    const newFileId = newFile.getId();
    const newUrl = newFile.getUrl();

    // BƯỚC 3: Sao chép phân quyền từ file gốc
    const newFileObj = DriveApp.getFileById(newFileId);

    // Sao chép quyền chỉnh sửa
    templateFile.getEditors().forEach(editor => {
      newFileObj.addEditor(editor.getEmail());
    });

    // Sao chép quyền xem
    templateFile.getViewers().forEach(viewer => {
      newFileObj.addViewer(viewer.getEmail());
    });

    // Cấp quyền "Anyone with the link can edit"
    newFileObj.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT);

    // BƯỚC 4: Cập nhật danh mục
    const lastRow = danhMucSheet.getLastRow() + 1;
    danhMucSheet.getRange(lastRow, 1, 1, 6).setValues([
      [fileName, year, strCoChe, "", newUrl, newFileId]
    ]);

    // Trả về thành công
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Tạo file hiệu suất mới thành công.',
      fileId: newFileId,
      fileUrl: newUrl
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in createNewFile: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error creating file: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Hàm doGet - Để test API
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'API Service v2 is running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Hàm test local
 */
function testAPI() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        apiKey: API_KEY,
        action: 'createNewFile',
        fileName: '2025-TEST-CCL',
        year: '2025',
        strCoChe: 'TEST'
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}


