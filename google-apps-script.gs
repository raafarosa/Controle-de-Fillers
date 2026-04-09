// Google Apps Script para atualizar o status no Google Sheets.
// Publique como Web App: "Executar como: Eu" e "Quem tem acesso: Qualquer pessoa, até anônima".

const SHEET_ID = "1IhzmeXB9Dc7JRnOY3qGE1Ledbad8d7DW7MYCd-2xoY4";
const SHEET_NAME = "One Piece";

function doPost(e) {
  return handleRequest(e.parameter || {});
}

function doGet(e) {
  return handleRequest(e.parameter || {});
}

function handleRequest(params) {
  try {
    const epNumber = Number(params.ep);
    const watched = params.watched === 'true';

    if (!epNumber || Number.isNaN(epNumber)) {
      return jsonResponse({ success: false, message: "Episódio inválido" });
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const rows = sheet.getDataRange().getValues();

    // Assumindo coluna A = EP, coluna D = Status (índice 0, 3)
    const epCol = 0; // Coluna A
    const statusCol = 3; // Coluna D

    for (let i = 1; i < rows.length; i++) { // Começa da linha 2 (índice 1)
      if (Number(rows[i][epCol]) === epNumber) {
        sheet.getRange(i + 1, statusCol + 1).setValue(watched ? "TRUE" : "FALSE");
        return jsonResponse({ success: true, ep: epNumber, status: watched ? "TRUE" : "FALSE" });
      }
    }

    return jsonResponse({ success: false, message: "Episódio não encontrado" });
  } catch (error) {
    return jsonResponse({ success: false, message: error.toString() });
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
