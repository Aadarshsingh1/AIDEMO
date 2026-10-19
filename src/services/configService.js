/**
 * configService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all runtime configuration.
 *
 * Priority (highest → lowest):
 *   1. Values saved via the Settings UI  (stored in localStorage)
 *   2. Values from .env                  (VITE_* variables baked in at build)
 *
 * This means:
 *   - Out of the box the app works with .env defaults.
 *   - Once you save something in the Settings page it overrides .env.
 *   - Resetting via the Settings page removes the localStorage override
 *     and falls back to .env again.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'treos_config';

/** Keys that the Settings UI can manage */
export const CONFIG_KEYS = {
  N8N_BASE_URL: 'n8nBaseUrl',
  WEBHOOK_GOOGLE_MAPS: 'webhookGoogleMaps',
  WEBHOOK_CORDISO_LEADS: 'webhookCordisoLeads',
  MAPS_SHEET_EDIT_URL: 'mapsSheetEditUrl',
  CORDISO_SHEET_EDIT_URL: 'cordisoSheetEditUrl',
  MAPS_SHEET_CSV_URL: 'mapsSheetCsvUrl',
  CORDISO_SHEET_CSV_URL: 'cordisoSheetCsvUrl',
  // RAG Knowledge Base workflows
  WEBHOOK_RAG_UPLOAD: 'webhookRagUpload',
  WEBHOOK_RAG_CHAT: 'webhookRagChat',
  // No Action Plan Leads workflow
  WEBHOOK_NO_ACTION_PLAN: 'webhookNoActionPlan',
  NO_ACTION_ALL_LEADS_SHEET_URL: 'noActionAllLeadsSheetUrl',
  NO_ACTION_ALL_LEADS_CSV_URL: 'noActionAllLeadsCsvUrl',
  NO_ACTION_AI_LEADS_CSV_URL: 'noActionAiLeadsCsvUrl',
  // Lead Qualification workflow
  WEBHOOK_LEAD_QUALIFICATION: 'webhookLeadQualification',
  QUALIFICATION_ALL_LEADS_SHEET_URL: 'qualificationAllLeadsSheetUrl',
  QUALIFICATION_ALL_LEADS_CSV_URL: 'qualificationAllLeadsCsvUrl',
  QUALIFICATION_AI_LEADS_CSV_URL: 'qualificationAiLeadsCsvUrl',
};

/** .env fallback values (baked in at build time by Vite) */
const ENV_DEFAULTS = {
  [CONFIG_KEYS.N8N_BASE_URL]: import.meta.env.VITE_N8N_BASE_URL || '',
  [CONFIG_KEYS.WEBHOOK_GOOGLE_MAPS]: import.meta.env.VITE_WEBHOOK_GOOGLE_MAPS || '',
  [CONFIG_KEYS.WEBHOOK_CORDISO_LEADS]: import.meta.env.VITE_WEBHOOK_CORDISO_LEADS || '',
  [CONFIG_KEYS.MAPS_SHEET_EDIT_URL]: import.meta.env.VITE_MAPS_SHEET_EDIT_URL || 'https://docs.google.com/spreadsheets/d/1qj-xYGnDzodwDRVAHsYoKFgNtShDTYnjy3uH4HbUKbE/edit?gid=0#gid=0',
  [CONFIG_KEYS.CORDISO_SHEET_EDIT_URL]: import.meta.env.VITE_CORDISO_SHEET_EDIT_URL || '',
  [CONFIG_KEYS.MAPS_SHEET_CSV_URL]: import.meta.env.VITE_MAPS_SHEET_CSV_URL || 'https://docs.google.com/spreadsheets/d/1qj-xYGnDzodwDRVAHsYoKFgNtShDTYnjy3uH4HbUKbE/export?format=csv&gid=0',
  [CONFIG_KEYS.CORDISO_SHEET_CSV_URL]: import.meta.env.VITE_CORDISO_SHEET_CSV_URL || '',
  [CONFIG_KEYS.WEBHOOK_RAG_UPLOAD]: import.meta.env.VITE_WEBHOOK_RAG_UPLOAD || 'b7430c49-07df-4ea8-971c-4340d99bc456',
  [CONFIG_KEYS.WEBHOOK_RAG_CHAT]: import.meta.env.VITE_WEBHOOK_RAG_CHAT || '911eeda3-33e7-42b7-8054-4cffc04f36a4',
  // No Action Plan
  [CONFIG_KEYS.WEBHOOK_NO_ACTION_PLAN]: import.meta.env.VITE_WEBHOOK_NO_ACTION_PLAN || '71a1b559-084e-46a1-94cb-6f158d17d2cc',
  [CONFIG_KEYS.NO_ACTION_ALL_LEADS_SHEET_URL]: import.meta.env.VITE_NO_ACTION_ALL_LEADS_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1zO7j2VMY0uwnNCEl__Ugf3xdg26locz2qgc9pmCrEPM/edit?gid=1959112082#gid=1959112082',
  [CONFIG_KEYS.NO_ACTION_ALL_LEADS_CSV_URL]: import.meta.env.VITE_NO_ACTION_ALL_LEADS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8QuJUoBvfGTzDnG-tylVs0403vtFKv_9APjTwWpAzzqTszjuyJ4JbR71Zg5KiwcRKCxcdk1m1haOZ/pub?gid=1959112082&single=true&output=csv',
  [CONFIG_KEYS.NO_ACTION_AI_LEADS_CSV_URL]: import.meta.env.VITE_NO_ACTION_AI_LEADS_CSV_URL || 'https://docs.google.com/spreadsheets/d/1RyMWMXGsJzJFfhWndADyRqCvtcarf4NdODfOtKroDjA/export?format=csv&gid=0',
  // Lead Qualification
  [CONFIG_KEYS.WEBHOOK_LEAD_QUALIFICATION]: import.meta.env.VITE_WEBHOOK_LEAD_QUALIFICATION || '37994882-3837-4254-b347-58d217c8db25',
  [CONFIG_KEYS.QUALIFICATION_ALL_LEADS_SHEET_URL]: import.meta.env.VITE_QUALIFICATION_ALL_LEADS_SHEET_URL || 'https://docs.google.com/spreadsheets/d/1Mxh_uGDv9WY_XiA8gnQbsN1c5nkVEsIMn6PLsCVmIgs/edit?gid=0#gid=0',
  [CONFIG_KEYS.QUALIFICATION_ALL_LEADS_CSV_URL]: import.meta.env.VITE_QUALIFICATION_ALL_LEADS_CSV_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRd6yDTCzHi5WM9ZzI0IqmRzXBM1HkDAu72JaUrQwCuEITBf3nSp-3QVqIa988GcHvLJrmla4Tuw0L8/pub?gid=0&single=true&output=csv',
  [CONFIG_KEYS.QUALIFICATION_AI_LEADS_CSV_URL]: import.meta.env.VITE_QUALIFICATION_AI_LEADS_CSV_URL || 'https://docs.google.com/spreadsheets/d/10pldJMQRNIbJMSqS0aNBFsSYWlvok6EiGDtph6-jseU/export?format=csv&gid=0',
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Load the full saved config object from localStorage */
function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);

    let changed = false;

    // Auto-correct stale wrong n8n base URL (amansinghhhh or aadarshh → aadarsh075)
    if (parsed.n8nBaseUrl && (parsed.n8nBaseUrl.includes('amansinghhhh.app.n8n.cloud') || parsed.n8nBaseUrl.includes('aadarshh.app.n8n.cloud'))) {
      parsed.n8nBaseUrl = 'https://aadarsh075.app.n8n.cloud';
      changed = true;
    }

    // Auto-correct stale Google Maps Lead Scraper webhook ID
    if (parsed.webhookGoogleMaps === 'a4651de5-023b-46b6-876c-d69102ea548a') {
      parsed.webhookGoogleMaps = '43162508-8e41-49a0-b50f-d476d7204b33';
      changed = true;
    }

    // Auto-correct stale Google Maps Lead Scraper sheet edit URL
    if (parsed.mapsSheetEditUrl && parsed.mapsSheetEditUrl.includes('1uN4Jl2-2kc3ACuV6wv1XA-2WOCS3r00hcHe08R7kxfY')) {
      parsed.mapsSheetEditUrl = 'https://docs.google.com/spreadsheets/d/1qj-xYGnDzodwDRVAHsYoKFgNtShDTYnjy3uH4HbUKbE/edit?gid=0#gid=0';
      changed = true;
    }

    // Auto-correct stale Google Maps Lead Scraper CSV URL
    if (parsed.mapsSheetCsvUrl && (parsed.mapsSheetCsvUrl.includes('2PACX-1vQd0uz4SeghsGbN7v2p9ZHQ02LEkWFUZmap4aCY9NUj9C4H2xSC3JUes_w9Bn5v9lQnV5gUFyh7M6Fx') || parsed.mapsSheetCsvUrl.includes('1uN4Jl2-2kc3ACuV6wv1XA-2WOCS3r00hcHe08R7kxfY'))) {
      parsed.mapsSheetCsvUrl = 'https://docs.google.com/spreadsheets/d/1qj-xYGnDzodwDRVAHsYoKFgNtShDTYnjy3uH4HbUKbE/export?format=csv&gid=0';
      changed = true;
    }

    // Auto-correct BOTH wrong RAG upload webhook ID variants → correct ID
    if (
      parsed.webhookRagUpload &&
      (parsed.webhookRagUpload.includes('b7430c49') ||
       parsed.webhookRagUpload.includes('b7438c49') ||
       parsed.webhookRagUpload.includes('1bf39e48'))
    ) {
      parsed.webhookRagUpload = '1bf39e40-86df-44a0-b9fb-f85b383ba3fd';
      changed = true;
    }

    if (changed) saveStored(parsed);
    return parsed;
  } catch {
    return {};
  }
}

/** Persist the full config object to localStorage */
function saveStored(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('[configService] Unable to save config to localStorage');
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a single config value.
 * Returns the localStorage override if set, otherwise the .env default.
 * @param {string} key  - one of CONFIG_KEYS values
 * @returns {string}
 */
export function getConfig(key) {
  const stored = loadStored();
  // Only use stored value if it was explicitly set (non-empty string)
  if (stored[key] !== undefined && stored[key] !== '') {
    return stored[key];
  }
  return ENV_DEFAULTS[key] || '';
}

/**
 * Get ALL config values merged (localStorage overrides .env defaults).
 * @returns {object}
 */
export function getAllConfig() {
  const stored = loadStored();
  const merged = { ...ENV_DEFAULTS };
  for (const [key, val] of Object.entries(stored)) {
    if (val !== undefined && val !== '') {
      merged[key] = val;
    }
  }
  return merged;
}

/**
 * Get ALL raw stored values (only what was saved via UI, no .env mixing).
 * Used by the Settings form to show what the user has explicitly set.
 * @returns {object}
 */
export function getStoredConfig() {
  return loadStored();
}

/**
 * Save a full config object to localStorage (replaces all stored overrides).
 * Pass only the keys you want to override; omit keys to use .env defaults.
 * @param {object} values  - partial or full config object
 */
export function saveConfig(values) {
  // Strip out empty strings so they fall back to .env defaults
  const cleaned = {};
  for (const [key, val] of Object.entries(values)) {
    if (val && val.trim() !== '') {
      cleaned[key] = val.trim();
    }
  }
  saveStored(cleaned);
}

/**
 * Reset ALL UI overrides — the app will fall back to .env defaults for everything.
 */
export function resetConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('[configService] Unable to clear config from localStorage');
  }
}

/**
 * Check if ANY config override has been saved via the UI.
 * Useful for showing a "custom config active" badge in the UI.
 * @returns {boolean}
 */
export function hasCustomConfig() {
  const stored = loadStored();
  return Object.keys(stored).length > 0;
}
