import axios from 'axios';
import { getConfig, CONFIG_KEYS } from './configService';

// N8N_BASE_URL is read live from configService (Settings UI → .env fallback)
function getBaseUrl() {
  return getConfig(CONFIG_KEYS.N8N_BASE_URL) || '';
}

/**
 * Smartly parse any user input (whether it's a raw UUID or a full URL like
 * https://amansinghhhhh.app.n8n.cloud/form-test/71a1b559...).
 */
function parseWebhookInput(input) {
  if (!input) return { id: '', baseUrl: '', candidates: [] };

  const str = input.trim();
  let id = str;
  let baseUrl = getBaseUrl();

  // If user pasted a full URL
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const parsedUrl = new URL(str);
      baseUrl = parsedUrl.origin;
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      id = pathParts[pathParts.length - 1] || str;
    } catch {
      /* ignore */
    }
  } else if (str.includes('/')) {
    const parts = str.split('/').filter(Boolean);
    id = parts[parts.length - 1];
  }

  const base = baseUrl || 'https://amansinghhhhh.app.n8n.cloud';
  const proxyBase = '/n8n-proxy';
  const rawCandidates = [];

  // Proxy candidates first (bypasses browser CORS policy on Vercel and local dev)
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const parsed = new URL(str);
      const proxiedUrl = `${proxyBase}${parsed.pathname}`;
      rawCandidates.push({ url: proxiedUrl, isFormData: str.includes('/form') });
    } catch {
      /* ignore */
    }
  }

  rawCandidates.push(
    { url: `${proxyBase}/form/${id}`, isFormData: true },
    { url: `${proxyBase}/form-test/${id}`, isFormData: true },
    { url: `${proxyBase}/webhook/${id}`, isFormData: false },
    { url: `${proxyBase}/webhook-test/${id}`, isFormData: false }
  );

  // Direct URL candidates fallback
  if (str.startsWith('http://') || str.startsWith('https://')) {
    rawCandidates.push({ url: str, isFormData: str.includes('/form') });
  }

  rawCandidates.push(
    { url: `${base}/form/${id}`, isFormData: true },
    { url: `${base}/form-test/${id}`, isFormData: true },
    { url: `${base}/webhook/${id}`, isFormData: false },
    { url: `${base}/webhook-test/${id}`, isFormData: false }
  );

  const seen = new Set();
  const candidates = rawCandidates.filter(c => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  return { id, baseUrl: base, candidates };
}

/**
 * Trigger an N8n workflow via its Form/Webhook Trigger URL.
 *
 * @param {string} webhookInput - Webhook ID or full n8n URL from Settings
 * @param {object} formData     - Form fields object
 */
export async function triggerWorkflow(webhookInput, formData) {
  if (!webhookInput) {
    return { success: false, error: 'No Webhook ID configured for this workflow in Settings.' };
  }

  const { baseUrl, candidates } = parseWebhookInput(webhookInput);

  // Build FormData payload
  const body = new FormData();
  Object.entries(formData || {}).forEach(([key, val]) => {
    body.append(key, String(val ?? ''));
  });

  let lastError = null;

  for (const candidate of candidates) {
    const targetUrl = import.meta.env.DEV && candidate.url.startsWith(baseUrl)
      ? candidate.url.replace(baseUrl, '/n8n-proxy')
      : candidate.url;

    try {
      console.log(`[n8nService] Sending ${candidate.isFormData ? 'multipart/form-data' : 'JSON'} to ${targetUrl}`);
      
      const payload = candidate.isFormData ? body : formData;
      const headers = candidate.isFormData
        ? undefined
        : { 'Content-Type': 'application/json' };

      const res = await axios.post(targetUrl, payload, {
        headers,
        timeout: 300_000,
      });

      console.log(`[n8nService] Workflow trigger success!`, res.data);
      return { success: true, data: res.data };
    } catch (err) {
      console.warn(`[n8nService] Endpoint ${targetUrl} error:`, err.response?.status, err.response?.data || err.message);
      lastError = err;
    }
  }

  const status = lastError?.response?.status;
  const n8nMsg = lastError?.response?.data?.message || lastError?.message;

  return {
    success: false,
    error: `N8n Error (${status || 'Network'}): ${n8nMsg || 'Unable to reach N8n webhook.'}`,
  };
}

/**
 * Trigger an N8n workflow that expects a FILE upload (multipart/form-data).
 *
 * @param {string} webhookInput - Webhook ID or full n8n URL from Settings
 * @param {File}   file         - The browser File object to upload
 * @param {string} fieldName    - The exact field label in n8n (e.g. "Lead Excel")
 */
export async function triggerWorkflowWithFile(webhookInput, file, fieldName = 'Lead Excel') {
  if (!webhookInput) {
    return { success: false, error: 'No Webhook ID configured for this workflow in Settings.' };
  }

  const { baseUrl, candidates } = parseWebhookInput(webhookInput);

  const body = new FormData();
  body.append(fieldName, file, file.name);

  let lastError = null;

  for (const candidate of candidates) {
    const targetUrl = import.meta.env.DEV && candidate.url.startsWith(baseUrl)
      ? candidate.url.replace(baseUrl, '/n8n-proxy')
      : candidate.url;

    try {
      console.log(`[n8nService] Uploading file "${file.name}" to ${targetUrl}`);
      const res = await axios.post(targetUrl, body, {
        timeout: 300_000,
      });
      console.log(`[n8nService] File upload success!`, res.data);
      return { success: true, data: res.data };
    } catch (err) {
      console.warn(`[n8nService] ${targetUrl} error:`, err.response?.status, err.response?.data || err.message);
      lastError = err;
    }
  }

  const status = lastError?.response?.status;
  const n8nMsg = lastError?.response?.data?.message || lastError?.message;
  return {
    success: false,
    error: `N8n Error (${status || 'Network'}): ${n8nMsg || 'Unable to reach N8n webhook.'}`,
  };
}
