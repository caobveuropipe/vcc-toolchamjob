function getDocumentData() {
  var sheet = SpreadsheetApp.openById("1ectNnvCzDrOMiQJui6NLBlh6ArKi5dTEDY6-Q_Mzpik").getSheetByName("T1");
  var lastRow = sheet.getLastRow()
  var data = sheet.getRange("A1:D"+lastRow).getValues(); // Lấy dữ liệu từ A đến E
  return data;
}