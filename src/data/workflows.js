// Workflow catalog — add more workflows here over time
// Each workflow maps to a card on the Dashboard
//
// ⚡ All account-specific values (webhookIds, sheet URLs) are read from configService
//    which prioritises Settings UI (localStorage) → .env fallback
//    To change accounts: use the Settings page in the UI — no file edits needed!

import { getConfig, CONFIG_KEYS } from '../services/configService';

/**
 * Returns the full workflow list with live config values injected.
 * Call this function (don't import WORKFLOWS directly) so values
 * always reflect the latest Settings UI overrides.
 */
export function getWorkflows() {
  return [
    {
      id: 'google-maps-leads',
      name: 'Google Maps Lead Scraper',
      category: 'Maps Scraping',
      description:
        'Scrape Google Maps for businesses by keyword & location, then enrich each lead with emails, owner names, social links, and an AI lead score via Groq.',
      color: 'green',
      icon: 'MapPin',
      iconImg: 'https://www.gstatic.com/images/branding/product/2x/maps_96dp.png',
      webhookId: getConfig(CONFIG_KEYS.WEBHOOK_GOOGLE_MAPS) || null,

      // Steps shown in the live-log panel during execution
      steps: [
        { key: 'form',    label: 'Form Submitted',           sub: 'Input received by N8n' },
        { key: 'apify',   label: 'Google Maps Scraping',     sub: 'Apify extractor running…' },
        { key: 'fields',  label: 'Extracting Fields',        sub: 'Business name, phone, address…' },
        { key: 'loop',    label: 'Processing Each Business', sub: 'Looping through results…' },
        { key: 'website', label: 'Scraping Websites',        sub: 'Fetching contact pages…' },
        { key: 'groq',    label: 'AI Enrichment (Groq)',     sub: 'Extracting emails, scores, icebreakers…' },
        { key: 'sheets',  label: 'Saving to Google Sheets',  sub: 'Appending enriched leads…' },
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
      sheetUrl:     getConfig(CONFIG_KEYS.MAPS_SHEET_EDIT_URL),
      sheetCsvUrl:  getConfig(CONFIG_KEYS.MAPS_SHEET_CSV_URL),
      sheetColumns: ['businessName','website','phone','address','email','ownerName','socialLinks','leadScore','icebreaker'],
    },

    // ── Cordiso Google Lead Scraper ────────────────────────────────────────────
    {
      id: 'cordiso-ai-leads',
      name: 'Google Lead Scraper',
      category: 'AI Lead Gen',
      description:
        'Generate qualified B2B leads for Cordiso products (CRM, HRMS, ERP). Searches Google via Apify, scrapes websites for emails, then AI filters — only real buyers reach your sheet.',
      color: 'blue',
      icon: 'Search',
      iconImg: 'https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png',
      webhookId: getConfig(CONFIG_KEYS.WEBHOOK_CORDISO_LEADS) || null,

      steps: [
        { key: 'form',    label: 'Form Submitted',             sub: 'Input received by N8n' },
        { key: 'query',   label: 'Building Search Queries',    sub: '5 targeted queries per product…' },
        { key: 'apify',   label: 'Apify Google Search',        sub: 'Searching for buyer signals…' },
        { key: 'filter',  label: 'Pre-Filtering Results',      sub: 'Removing jobs, sellers, noise…' },
        { key: 'loop',    label: 'Enriching Each Lead',        sub: 'Scraping websites for emails…' },
        { key: 'qualify', label: 'AI Qualification (ChatGPT)', sub: 'Scoring buyer intent & quality…' },
        { key: 'sheets',  label: 'Saving HOT & WARM Leads',    sub: 'Writing to Google Sheets…' },
      ],

      fields: [
        {
          key: 'Product Category',
          label: 'Product Category',
          type: 'select',
          options: ['CRM', 'HRMS', 'ERP', 'Accounting Software', 'Land & Liaising'],
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
          required: false,
        },
        {
          key: 'Number of Leads',
          label: 'Number of Leads',
          type: 'number',
          placeholder: 'e.g. 10',
          required: true,
        },
      ],

      // Google Sheet this workflow writes to (from configService)
      sheetUrl:     getConfig(CONFIG_KEYS.CORDISO_SHEET_EDIT_URL),
      sheetCsvUrl:  getConfig(CONFIG_KEYS.CORDISO_SHEET_CSV_URL),
      sheetColumns: ['platform','product_category','title','post_url','website','email','phone','followers','description','location','lead_quality','score','decision_maker','company_size','product_fit','buyer_intent_summary','suggested_outreach','scraped_at'],
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
        { key: 'trigger',  label: 'Trigger Received',        sub: 'Webhook invoked from Treos UI' },
        { key: 'sheets',   label: 'Reading Google Sheet',    sub: 'Fetching all CRM leads from Sheet…' },
        { key: 'ai',       label: 'AI Risk Analysis',        sub: 'GPT analyzing leads with no action planned…' },
        { key: 'save',     label: 'Saving At-Risk Leads',    sub: 'Appending prioritized leads to Output Sheet…' },
      ],

      fields: [],

      sheetColumns:  ['LeadID', 'CustomerName', 'LeadStatus', 'PreferredProject', 'TotalInteractions', 'DaysSinceLastInteraction', 'ReasonForPriority'],
      sheetUrl:      getConfig(CONFIG_KEYS.NO_ACTION_ALL_LEADS_SHEET_URL),
      sheetCsvUrl:   getConfig(CONFIG_KEYS.NO_ACTION_ALL_LEADS_CSV_URL),
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
        { key: 'trigger',  label: 'Trigger Received',        sub: 'Webhook invoked from Treos UI' },
        { key: 'sheets',   label: 'Reading Google Sheet',    sub: 'Fetching all leads from Input Sheet…' },
        { key: 'ai',       label: 'AI Lead Qualification',   sub: 'GPT scoring intent, fit & readiness…' },
        { key: 'save',     label: 'Saving Qualified Leads',  sub: 'Appending qualified leads to Output Sheet…' },
      ],

      fields: [],

      sheetColumns:  ['LeadID', 'CustomerName', 'LeadStatus', 'QualificationScore', 'LeadQuality', 'ReasonForQualification'],
      sheetUrl:      getConfig(CONFIG_KEYS.QUALIFICATION_ALL_LEADS_SHEET_URL),
      sheetCsvUrl:   getConfig(CONFIG_KEYS.QUALIFICATION_ALL_LEADS_CSV_URL),
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
