/**
 * طيور في بيتي — Google Sheets backend (Google Apps Script web app).
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Full steps: cloud/README.md.
 *
 * The app POSTs JSON as text/plain: { "sheet": "<tab name>", "row": { column: value, ... } }.
 * Tabs and their header rows are created automatically on first use; new columns added in a
 * later version are appended to the header of an existing tab.
 *
 * Gmail sign-in (optional): put the app's Web OAuth client ID in
 * Project Settings → Script Properties → GOOGLE_CLIENT_ID. The app then sends the Google
 * ID token once with the sign-up; this script asks Google whether the token is real and only
 * then stores the email. Without the property, emails are never stored.
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
    'email',
    'photo',
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
  Affiliate_Clicks: [
    'clicked_at',
    'product_id',
    'product',
    'category',
    'channel',
    'client_id',
    'app_version',
    'platform',
  ],
};

/** Columns the app may not write directly (set only from a verified Google token). */
const VERIFIED_ONLY = ['email', 'photo'];

/** Arabic labels for the message type column, so the sheet is easy to read. */
const TYPE_LABELS = {
  recommendation: 'طلب توصية خاصة',
  case: 'بلاغ عن حالة فنية',
  suggestion: 'اقتراح تطوير',
  complaint: 'شكوى',
};

/** Log of deletion requests (no personal data: when, which install, how many rows). */
const DELETION_LOG = 'Deletion_Log';
const DELETION_COLUMNS = ['deleted_at', 'client_id', 'rows_removed'];

const MAX_CELL = 2000;
/** Per-install rate limit: at most this many rows every 10 minutes. */
const MAX_ROWS_PER_10_MIN = 30;

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const tab = String(body.sheet || '');
    const row = body.row || {};
    if (tab === 'Delete') return reply(deleteInstall(String(row.client_id || '')));
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
  const cols = TABS[name];
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
  } else if (sheet.getLastColumn() < cols.length) {
    // A newer version added columns at the end: add their titles, old rows stay as they are.
    const from = sheet.getLastColumn() + 1;
    sheet
      .getRange(1, from, 1, cols.length - from + 1)
      .setValues([cols.slice(from - 1)])
      .setFontWeight('bold');
  }
  return sheet;
}

/**
 * Asks Google whether a Sign-In ID token is genuine and meant for this app.
 * Returns { email, picture } or null. Needs Script Property GOOGLE_CLIENT_ID.
 */
function verifyGoogle(idToken) {
  const allowed = String(PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '')
    .split(',')
    .map(function (s) {
      return s.trim();
    })
    .filter(String);
  if (!idToken || !allowed.length) return null;
  try {
    const res = UrlFetchApp.fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(idToken)),
      { muteHttpExceptions: true },
    );
    if (res.getResponseCode() !== 200) return null;
    const c = JSON.parse(res.getContentText());
    const issOk = c.iss === 'accounts.google.com' || c.iss === 'https://accounts.google.com';
    const fresh = Number(c.exp) * 1000 > Date.now();
    if (!issOk || !fresh || allowed.indexOf(c.aud) < 0 || String(c.email_verified) !== 'true') return null;
    return { email: String(c.email || ''), picture: String(c.picture || '') };
  } catch (err) {
    return null;
  }
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
    if (VERIFIED_ONLY.indexOf(col) >= 0) return '';
    return clean(row[col]);
  });
  sheet.appendRow(values);
}

/**
 * One row per install: update name/phone/kinds/last_seen and count visits.
 * email/photo change only when the row carries a Google token that verifyGoogle accepts.
 */
function upsertUser(sheet, row) {
  const cols = TABS.Users_Data;
  const id = clean(row.client_id);
  if (!id) throw new Error('missing client_id');
  const google = row.id_token ? verifyGoogle(row.id_token) : null;
  const unlink = String(row.unlink_google || '') === '1';
  const verified = unlink
    ? { email: '', photo: '' }
    : { email: google ? google.email : undefined, photo: google ? google.picture : undefined };
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
          if (VERIFIED_ONLY.indexOf(col) >= 0) return verified[col] === undefined ? clean(current[j]) : clean(verified[col]);
          return row[col] === undefined ? clean(current[j]) : clean(row[col]);
        });
        sheet.getRange(r, 1, 1, cols.length).setValues([next]);
        return;
      }
    }
  }
  sheet.appendRow(
    cols.map(function (col) {
      if (col === 'visits') return 1;
      if (VERIFIED_ONLY.indexOf(col) >= 0) return clean(verified[col]);
      return clean(row[col]);
    }),
  );
}

/**
 * "Delete my data" from the app: removes every row whose client_id matches, in every tab,
 * and logs the request. Google Play requires a way for users to delete their data.
 */
function deleteInstall(clientId) {
  const id = clean(clientId);
  if (!id || id.length < 8) return { ok: false, error: 'missing client_id' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let removed = 0;
    Object.keys(TABS).forEach(function (name) {
      const sheet = ss.getSheetByName(name);
      if (!sheet || sheet.getLastRow() < 2) return;
      const col = TABS[name].indexOf('client_id') + 1;
      const ids = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues();
      // Bottom-up so row numbers stay valid while deleting.
      for (let i = ids.length - 1; i >= 0; i--) {
        if (String(ids[i][0]) === id) {
          sheet.deleteRow(i + 2);
          removed++;
        }
      }
    });
    let log = ss.getSheetByName(DELETION_LOG);
    if (!log) {
      log = ss.insertSheet(DELETION_LOG);
      log.getRange(1, 1, 1, DELETION_COLUMNS.length).setValues([DELETION_COLUMNS]).setFontWeight('bold');
      log.setFrozenRows(1);
    }
    log.appendRow([new Date().toISOString(), id, removed]);
    return { ok: true, removed: removed };
  } finally {
    lock.releaseLock();
  }
}

/** Run once from the editor (▶ setup) to create the tabs before the first user arrives. */
function setup() {
  Object.keys(TABS).forEach(ensureTab);
}
