// Workflow catalog — add more workflows here over time
// Each workflow maps to a card on the Dashboard
//
// ⚡ All account-specific values (webhookIds, sheet URLs) are read from configService
//    which prioritises Settings UI (localStorage) → .env fallback
//    To change accounts: use the Settings page in the UI — no file edits needed!

import { getConfig, CONFIG_KEYS } from '../services/configService';

const MULTI_PLATFORM_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="%230f172a"/><line x1="20" y1="20" x2="44" y2="44" stroke="%23334155" stroke-width="2"/><line x1="44" y1="20" x2="20" y2="44" stroke="%23334155" stroke-width="2"/><circle cx="32" cy="32" r="16" fill="none" stroke="%2338bdf8" stroke-width="1.5" stroke-dasharray="3 2"/><circle cx="20" cy="20" r="10" fill="%230A66C2"/><text x="20" y="24" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23ffffff" text-anchor="middle">in</text><circle cx="44" cy="20" r="10" fill="%23FF4500"/><circle cx="44" cy="19" r="4.5" fill="%23ffffff"/><circle cx="42" cy="18.5" r="1" fill="%23FF4500"/><circle cx="46" cy="18.5" r="1" fill="%23FF4500"/><circle cx="20" cy="44" r="10" fill="%231877F2"/><text x="20" y="48.5" font-family="sans-serif" font-size="13" font-weight="900" fill="%23ffffff" text-anchor="middle">f</text><circle cx="44" cy="44" r="10" fill="%23E1306C"/><rect x="39.5" y="39.5" width="9" height="9" rx="2.5" fill="none" stroke="%23ffffff" stroke-width="1.5"/><circle cx="44" cy="44" r="2.2" fill="none" stroke="%23ffffff" stroke-width="1.2"/><circle cx="32" cy="32" r="7" fill="%230284c7" stroke="%23ffffff" stroke-width="1.5"/><path d="M30 30 L34 34 M33 30 A 2 2 0 1 0 29 30 A 2 2 0 1 0 33 30" stroke="%23ffffff" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>`;

/**
 * Returns the full workflow list with live config values injected.
 * Call this function (don't import WORKFLOWS directly) so values
 * always reflect the latest Settings UI overrides.
 */
export function getWorkflows() {
  return [
    {
      id: 'google-maps-leads',
      name: 'Lead Scraper',
      category: 'Maps Scraping',
      description:
        'Scrape Google Maps for businesses by keyword & location, then enrich each lead with emails, owner names, social links, and an AI lead score via Groq.',
      color: 'green',
      icon: 'MapPin',
      iconImg: 'https://www.gstatic.com/images/branding/product/2x/maps_96dp.png',
      webhookId: getConfig(CONFIG_KEYS.WEBHOOK_GOOGLE_MAPS) || null,

      // Steps shown in the live-log panel during execution
      steps: [
        { key: 'form', label: 'Form Submitted', sub: 'Input received by N8n' },
        { key: 'apify', label: 'Google Maps Scraping', sub: 'Apify extractor running…' },
        { key: 'fields', label: 'Extracting Fields', sub: 'Business name, phone, address…' },
        { key: 'loop', label: 'Processing Each Business', sub: 'Looping through results…' },
        { key: 'website', label: 'Scraping Websites', sub: 'Fetching contact pages…' },
        { key: 'groq', label: 'AI Enrichment (Groq)', sub: 'Extracting emails, scores, icebreakers…' },
        { key: 'sheets', label: 'Saving to Google Sheets', sub: 'Appending enriched leads…' },
      ],

      // Form fields rendered in the run modal
      fields: [
        {
          key: 'Business keyword',
          label: 'Business Keyword',
          type: 'text',
          placeholder: 'e.g. dentist, gym, roofing company',
          required: true,
        },
        {
          key: 'Target location',
          label: 'Target Location',
          type: 'text',
          placeholder: 'e.g. Pune, Maharashtra',
          required: true,
        },
        {
          key: 'Maximum number of results',
          label: 'Maximum Results',
          type: 'number',
          placeholder: 'e.g. 20',
          required: true,
        },
      ],

      // Google Sheet this workflow writes to (from configService)
      sheetUrl: getConfig(CONFIG_KEYS.MAPS_SHEET_EDIT_URL),
      sheetCsvUrl: getConfig(CONFIG_KEYS.MAPS_SHEET_CSV_URL),
      sheetColumns: ['businessName', 'website', 'phone', 'address', 'email', 'ownerName', 'socialLinks', 'leadScore', 'icebreaker'],
    },

    // ── Cordiso Market Research Assistant ─────────────────────────────────────
    {
      id: 'cordiso-ai-leads',
      name: 'Market Research Assistant',
      category: 'AI Lead Gen',
      description:
        'Generate qualified B2B leads for Cordiso products & real estate buyers (CRM, HRMS, ERP, Pune/Mumbai Flats). Searches Google via Apify, scrapes websites for emails, then AI filters — only real buyers reach your sheet.',
      color: 'blue',
      icon: 'Search',
      iconImg: MULTI_PLATFORM_LOGO,
      webhookId: getConfig(CONFIG_KEYS.WEBHOOK_CORDISO_LEADS) || null,

      steps: [
        { key: 'form', label: 'Form Submitted', sub: 'Input received by N8n' },
        { key: 'query', label: 'Building Search Queries', sub: '5 targeted queries per product…' },
        { key: 'apify', label: 'Apify Google Search', sub: 'Searching for buyer signals…' },
        { key: 'filter', label: 'Pre-Filtering Results', sub: 'Removing jobs, sellers, noise…' },
        { key: 'loop', label: 'Enriching Each Lead', sub: 'Scraping websites for emails…' },
        { key: 'qualify', label: 'AI Qualification (ChatGPT)', sub: 'Scoring buyer intent & quality…' },
        { key: 'sheets', label: 'Saving HOT & WARM Leads', sub: 'Writing to Google Sheets…' },
      ],

      fields: [
        {
          key: 'Product Category',
          label: 'Product Category',
          type: 'select',
          options: ['CRM', 'HRMS', 'ERP', 'Land & Liaising', 'Flat in Pune', 'Flat in Mumbai'],
          required: true,
        },
        {
          key: 'Platform',
          label: 'Platform',
          type: 'select',
          options: ['linkedin', 'reddit', 'quora', 'facebook', 'instagram'],
          required: true,
        },
        {
          key: 'Location',
          label: 'Location',
          type: 'text',
          placeholder: 'e.g. India, Pune, Mumbai, USA (leave blank for global)',
          defaultValue: 'India',
          required: false,
        },
        {
          key: 'Number of Leads',
          label: 'Number of Leads',
          type: 'number',
          placeholder: 'e.g. 10',
          defaultValue: 10,
          required: true,
        },
      ],

      // Google Sheet this workflow writes to (from configService)
      sheetUrl: getConfig(CONFIG_KEYS.CORDISO_SHEET_EDIT_URL),
      sheetCsvUrl: getConfig(CONFIG_KEYS.CORDISO_SHEET_CSV_URL),
      sheetColumns: ['platform', 'product_category', 'title', 'post_url', 'website', 'email', 'phone', 'followers', 'description', 'location', 'lead_quality', 'score', 'decision_maker', 'company_size', 'product_fit', 'buyer_intent_summary', 'suggested_outreach', 'bhk_type', 'preferred_area', 'budget_range', 'urgency', 'scraped_at'],
    },

    {
      id: 'rag-chat',
      name: 'RAG Document Chat',
      category: 'AI / Pinecone',
      description: 'Upload documents from your laptop → index into Pinecone → chat with your knowledge base using AI.',
      color: 'orange',
      icon: 'MessageSquare',
      webhookId: null,
      steps: [],
      fields: [],
      sheetColumns: [],
      type: 'rag', // Special flag — opens RagChatPage instead of WorkflowDetailPage
    },
    {
      id: 'no-action-plan',
      name: 'No Action Plan Leads',
      category: 'CRM Analysis',
      description:
        'Reads leads directly from your main Google Sheet → AI identifies high-risk opportunities with no future follow-up planned → automatically appends prioritized results to your AI Output Google Sheet.',
      color: 'red',
      icon: 'AlertTriangle',
      webhookId: getConfig(CONFIG_KEYS.WEBHOOK_NO_ACTION_PLAN) || null,
      type: 'no-action-plan',

      steps: [
        { key: 'trigger', label: 'Trigger Received', sub: 'Webhook invoked from Treos UI' },
        { key: 'sheets', label: 'Reading Google Sheet', sub: 'Fetching all CRM leads from Sheet…' },
        { key: 'ai', label: 'AI Risk Analysis', sub: 'GPT analyzing leads with no action planned…' },
        { key: 'save', label: 'Saving At-Risk Leads', sub: 'Appending prioritized leads to Output Sheet…' },
      ],

      fields: [],

      sheetColumns: ['LeadID', 'CustomerName', 'LeadStatus', 'PreferredProject', 'TotalInteractions', 'DaysSinceLastInteraction', 'ReasonForPriority'],
      sheetUrl: getConfig(CONFIG_KEYS.NO_ACTION_ALL_LEADS_SHEET_URL),
      sheetCsvUrl: getConfig(CONFIG_KEYS.NO_ACTION_ALL_LEADS_CSV_URL),
      aiSheetCsvUrl: getConfig(CONFIG_KEYS.NO_ACTION_AI_LEADS_CSV_URL),
    },
    {
      id: 'lead-qualification',
      name: 'Lead Qualification',
      category: 'AI Scoring',
      description:
        'Reads leads directly from your Input Google Sheet → AI qualifies intent, budget, fit & readiness → automatically appends qualified leads to your Output Google Sheet.',
      color: 'teal',
      icon: 'Zap',
      webhookId: getConfig(CONFIG_KEYS.WEBHOOK_LEAD_QUALIFICATION) || null,
      type: 'lead-qualification',

      steps: [
        { key: 'trigger', label: 'Trigger Received', sub: 'Webhook invoked from Treos UI' },
        { key: 'sheets', label: 'Reading Google Sheet', sub: 'Fetching all leads from Input Sheet…' },
        { key: 'ai', label: 'AI Lead Qualification', sub: 'GPT scoring intent, fit & readiness…' },
        { key: 'save', label: 'Saving Qualified Leads', sub: 'Appending qualified leads to Output Sheet…' },
      ],

      fields: [],

      sheetColumns: ['LeadID', 'CustomerName', 'LeadStatus', 'QualificationScore', 'LeadQuality', 'ReasonForQualification'],
      sheetUrl: getConfig(CONFIG_KEYS.QUALIFICATION_ALL_LEADS_SHEET_URL),
      sheetCsvUrl: getConfig(CONFIG_KEYS.QUALIFICATION_ALL_LEADS_CSV_URL),
      aiSheetCsvUrl: getConfig(CONFIG_KEYS.QUALIFICATION_AI_LEADS_CSV_URL),
    },
  ];
}

// ── Live export proxy for components that import WORKFLOWS directly ──────────
// Uses a Proxy so accessing WORKFLOWS automatically calls getWorkflows()
// and always returns the latest Settings UI overrides without needing page reloads.
export const WORKFLOWS = new Proxy([], {
  get(target, prop) {
    const list = getWorkflows();
    if (prop === Symbol.iterator) {
      return list[Symbol.iterator].bind(list);
    }
    const val = list[prop];
    return typeof val === 'function' ? val.bind(list) : val;
  },
});
