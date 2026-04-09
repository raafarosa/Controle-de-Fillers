const SHEET_ID = "1IhzmeXB9Dc7JRnOY3qGE1Ledbad8d7DW7MYCd-2xoY4";
const SHEET_NAME = "One Piece";

function doGet(e) {
  const params = e.parameter;
  const epNumber = Number(params.ep);
  const watched = params.watched === 'true';

  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const rows = sheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (Number(rows[i][0]) === epNumber) {
        // Altere o 4 para o número da sua coluna de "Status" (ex: 3 para C, 4 para D)
        sheet.getRange(i + 1, 4).setValue(watched ? "TRUE" : "FALSE");
        return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);
      }
    }
    return ContentService.createTextOutput("Episódio não encontrado").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Erro: " + err.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}