const SHEET_NAME = 'RSVPs';
const SPREADSHEET_ID = '1ITgmhRQirDSe9y3zy8P9MkPbr5TkHpCM-RBfSls01AA';

function doPost(e) {
  const sheet = getSheet();
  const params = e.parameter || {};
  const attending = normalizeAttending(params.attending);
  const lock = LockService.getScriptLock();

  lock.waitLock(10000);
  try {
    sheet.appendRow([
      new Date(),
      params.name || '',
      params.email || '',
      params.phone || '',
      attending,
      params.guestCount || '',
      params.guestNames || '',
      params.notes || '',
      params.submittedAt || ''
    ]);
  } finally {
    lock.releaseLock();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeAttending(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'yes') return 'Yes';
  if (normalized === 'no') return 'No';
  if (normalized === 'maybe') return 'Maybe';

  return '';
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'RSVP endpoint' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Received At',
      'Name',
      'Email',
      'Phone',
      'Attending',
      'Guest Count',
      'Additional Guest Names',
      'Message for the Couple',
      'Browser Submitted At'
    ]);
  }

  return sheet;
}
