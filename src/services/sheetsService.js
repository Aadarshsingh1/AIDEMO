import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Google Sheets — Published CSV approach (no credentials needed)
//
// To enable: In your Google Sheet → File → Share → Publish to web
//            → Sheet1 → CSV → Publish. Paste the CSV URL in .env
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_CSV_URL = import.meta.env.VITE_MAPS_SHEET_CSV_URL || '';

/**
 * Robust CSV parser that handles:
 * - Quoted fields containing newlines (\n) or commas
 * - Escaped quotes ("")
 * - Trimmed fields & clean line endings
 */
function parseCSV(csv) {
  if (!csv || !csv.trim()) return [];

  const rows = [];
  let currentRow = [''];
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentRow[currentRow.length - 1] += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push('');
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // skip \n in \r\n
      if (currentRow.length > 1 || currentRow[0] !== '') {
        rows.push(currentRow);
      }
      currentRow = [''];
    } else {
      currentRow[currentRow.length - 1] += char;
    }
  }

  if (currentRow.length > 1 || currentRow[0] !== '') {
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().replace(/^"|"$/g, ''));

  return rows.slice(1).map(rowValues => {
    return Object.fromEntries(
      headers.map((h, i) => [h, rowValues[i]?.trim().replace(/^"|"$/g, '') ?? ''])
    );
  }).filter(obj => Object.values(obj).some(v => v !== ''));
}

/**
 * Automatically converts any standard Google Sheet URL (edit, view, share)
 * into a direct CSV export URL format.
 */
export function formatGoogleSheetCsvUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const url = rawUrl.trim();

  if (url.includes('/export?format=csv') || url.includes('output=csv')) {
    return url;
  }

  // Extract spreadsheet ID
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) return url;

  const id = idMatch[1];
  const gidMatch = url.match(/[?#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

/**
 * Fetch leads from a published Google Sheet CSV URL.
 * @returns {Promise<Array>}
 */
export async function fetchSheetLeads(csvUrl) {
  const raw = csvUrl || SHEET_CSV_URL;
  if (!raw) return { success: false, error: 'No CSV URL configured', data: [] };
  const baseUrl = formatGoogleSheetCsvUrl(raw);
  const cacheBustUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
  try {
    const res = await axios.get(cacheBustUrl, { timeout: 15000 });
    const rows = parseCSV(res.data);
    return { success: true, data: rows };
  } catch (err) {
    return { success: false, error: err.message, data: [] };
  }
}
