/**
 * طيور في بيتي — Google Sheets backend (Google Apps Script web app).
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Full steps: cloud/README.md.
 *
 * The app POSTs JSON as text/plain: { "sheet": "<tab name>", "row": { column: value, ... } }.
 * Tabs and their header rows are created automatically on first use.
 */

const TABS = {
  Users_Data: [
    'client_id',
    'name',
    'phone',
    'governorate',
    'bird_kinds',
    'first_seen',
    'last_seen',
    'visits',
    'app_version',
    'platform',
  ],
  Feedback_and_Reports: [
    'sent_at',
    'type',
    'message',
    'name',
    'phone',
    'governorate',
    'bird_kinds',
    'screen',
    'client_id',
    'app_version',
    'platform',
    'status',
    'reply',
  ],
  Flock_News: [
    'sent_at',
    'date',
    'tag',
    'group',
    'note',
    'name',
    'governorate',
    'client_id',
    'app_version',
  ],
};

/** Arabic labels for the message type column, so the sheet is easy to read. */
const TYPE_LABELS = {
  recommendation: 'طلب توصية خاصة',
  case: 'بلاغ عن حالة فنية',
  suggestion: 'اقتراح تطوير',
  complaint: 'شكوى',
};

const MAX_CELL = 2000;
/** Per-install rate limit: at most this many rows every 10 minutes. */
const MAX_ROWS_PER_10_MIN = 30;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const tab = String(body.sheet || '');
    const row = body.row || {};
    if (!Object.prototype.hasOwnProperty.call(TABS, tab)) return reply({ ok: false, error: 'unknown sheet' });
    if (typeof row !== 'object' || Array.isArray(row)) return reply({ ok: false, error: 'bad row' });
    if (!allowed(String(row.client_id || 'anon'))) return reply({ ok: false, error: 'rate limited' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = ensureTab(tab);
      if (tab === 'Users_Data') upsertUser(sheet, row);
      else appendRow(sheet, tab, row);
    } finally {
      lock.releaseLock();
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

/** Opening the web-app URL in a browser shows this — handy to check the deployment works. */
function doGet() {
  return reply({ ok: true, app: 'tuyuri', tabs: Object.keys(TABS) });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function allowed(clientId) {
  const cache = CacheService.getScriptCache();
  const key = 'rate:' + clientId.slice(0, 64);
  const n = Number(cache.get(key) || 0);
  if (n >= MAX_ROWS_PER_10_MIN) return false;
  cache.put(key, String(n + 1), 600);
  return true;
}

function ensureTab(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, TABS[name].length).setValues([TABS[name]]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
  }
  return sheet;
}

/** Text only, length-limited, and never starting with = + - @ (stops formula injection). */
function clean(v) {
  let s = v === undefined || v === null ? '' : String(v);
  if (s.length > MAX_CELL) s = s.slice(0, MAX_CELL);
  // Formula injection, and phone numbers like 010… that Sheets would turn into numbers.
  if (/^[=+\-@]/.test(s) || /^0\d+$/.test(s)) s = "'" + s;
  return s;
}

function appendRow(sheet, tab, row) {
  const values = TABS[tab].map(function (col) {
    if (col === 'type') return TYPE_LABELS[row.type] || clean(row.type);
    if (col === 'reply') return '';
    return clean(row[col]);
  });
  sheet.appendRow(values);
}

/** One row per install: update name/phone/kinds/last_seen and count visits. */
function upsertUser(sheet, row) {
  const cols = TABS.Users_Data;
  const id = clean(row.client_id);
  if (!id) throw new Error('missing client_id');
  const last = sheet.getLastRow();
  if (last >= 2) {
    const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === id) {
        const r = i + 2;
        const current = sheet.getRange(r, 1, 1, cols.length).getValues()[0];
        const next = cols.map(function (col, j) {
          if (col === 'visits') return Number(current[j] || 0) + 1;
          if (col === 'first_seen') return current[j] || clean(row.first_seen);
          if (col === 'phone' && !row.phone) return clean(current[j]);
          return row[col] === undefined ? clean(current[j]) : clean(row[col]);
        });
        sheet.getRange(r, 1, 1, cols.length).setValues([next]);
        return;
      }
    }
  }
  sheet.appendRow(
    cols.map(function (col) {
      return col === 'visits' ? 1 : clean(row[col]);
    }),
  );
}

/** Run once from the editor (▶ setup) to create the tabs before the first user arrives. */
function setup() {
  Object.keys(TABS).forEach(ensureTab);
}
