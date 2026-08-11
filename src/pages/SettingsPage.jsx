import { useState, useEffect } from 'react';
import {
  Settings, Save, RotateCcw, CheckCircle2, ArrowLeft,
  Webhook, FileSpreadsheet, Globe, MessageSquare, Eye, EyeOff,
  AlertTriangle, Info, ChevronRight, CheckCircle, XCircle, Zap,
} from 'lucide-react';
import {
  getAllConfig, saveConfig, resetConfig,
  hasCustomConfig, CONFIG_KEYS,
} from '../services/configService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSet(val) {
  return val && val.trim().length > 0;
}

function StatusDot({ value }) {
  return isSet(value)
    ? <CheckCircle size={14} color="#16a34a" />
    : <XCircle size={14} color="#dc2626" />;
}

function InputField({ label, hint, placeholder, value, onChange, isSecret = false, isUrl = false }) {
  const [show, setShow] = useState(false);
  const invalid = isUrl && value && !value.startsWith('http');

  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isSecret && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#f8fafc',
            border: `1.5px solid ${invalid ? '#ef4444' : isSet(value) ? '#6366f1' : '#e2e8f0'}`,
            borderRadius: 10, padding: isSecret ? '10px 42px 10px 14px' : '10px 14px',
            fontSize: 13, color: '#0f172a', fontFamily: 'monospace',
            outline: 'none', transition: 'all 0.2s',
          }}
          onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; e.target.style.background = '#fff'; }}
          onBlur={e => { e.target.style.borderColor = invalid ? '#ef4444' : isSet(value) ? '#6366f1' : '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
        />
        {isSecret && (
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 5, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

// ─── Overview Card ────────────────────────────────────────────────────────────
function OverviewCard({ icon: Icon, iconColor, iconBg, title, subtitle, fields, configured, onClick }) {
  const configuredCount = fields.filter(f => isSet(f.value)).length;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 18,
        padding: '22px 24px', cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.boxShadow = `0 6px 24px rgba(0,0,0,0.10)`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Accent bar top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${iconColor}, ${iconColor}88)`, borderRadius: '18px 18px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginTop: 4 }}>
        {/* Icon */}
        <div style={{ width: 46, height: 46, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={22} color={iconColor} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{subtitle}</div>

          {/* Field status row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {fields.map(f => (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: isSet(f.value) ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${isSet(f.value) ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 500,
                color: isSet(f.value) ? '#15803d' : '#b91c1c',
              }}>
                <StatusDot value={f.value} />
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
            color: configuredCount === fields.length ? '#15803d' : '#dc2626',
            background: configuredCount === fields.length ? '#dcfce7' : '#fef2f2',
            border: `1px solid ${configuredCount === fields.length ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 99, padding: '3px 10px',
          }}>
            {configuredCount}/{fields.length} Set
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ marginTop: 8 }} />
        </div>
      </div>
    </div>
  );
}
// ─── Detail View (opened when card is clicked) ────────────────────────────────
function DetailView({ config, onBack, onSave }) {
  const [form, setForm] = useState({ ...config.initialValues });
  const [saved, setSaved] = useState(false);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, color: '#4f46e5',
          marginBottom: 22, padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to Settings
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: config.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <config.icon size={24} color={config.iconColor} />
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{config.title}</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>{config.subtitle}</p>
        </div>
      </div>

      {/* Fields */}
      <div style={{
        background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 18,
        padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        {config.fields.map(field => (
          <InputField
            key={field.key}
            label={field.label}
            hint={field.hint}
            placeholder={field.placeholder}
            value={form[field.key] || ''}
            onChange={val => set(field.key, val)}
            isSecret={field.isSecret}
            isUrl={field.isUrl}
          />
        ))}
      </div>

      {/* Info */}
      {config.info && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 12, padding: '12px 16px', marginTop: 16,
        }}>
          <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.6 }}>{config.info}</p>
        </div>
      )}

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, gap: 12 }}>
        <button type="button" onClick={handleSave} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px',
          borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
          background: saved ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
          color: '#fff',
          boxShadow: saved ? '0 4px 14px rgba(16,185,129,0.35)' : '0 4px 14px rgba(79,70,229,0.3)',
          transition: 'all 0.3s',
        }}>
          {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? 'Saved Successfully!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────
export default function SettingsPage({ onConfigSaved }) {
  const [cfg, setCfg] = useState({});
  const [hasCustom, setHasCustom] = useState(false);
  const [activeView, setActiveView] = useState(null); // null = overview

  useEffect(() => {
    const all = getAllConfig();
    setCfg(all);
    setHasCustom(hasCustomConfig());
  }, []);

  function handleSave(values) {
    const current = getAllConfig();
    const merged = { ...current, ...values };
    saveConfig(merged);
    setCfg(getAllConfig());
    setHasCustom(hasCustomConfig());
    onConfigSaved?.();
  }

  function handleResetAll() {
    if (!window.confirm('Reset ALL settings back to .env defaults?')) return;
    resetConfig();
    setCfg(getAllConfig());
    setHasCustom(false);
    onConfigSaved?.();
  }

  // ── Config definitions for each "account" ──────────────────────────────────
  const CK = CONFIG_KEYS;

  const ACCOUNTS = [
    {
      id: 'n8n-global',
      icon: Globe,
      iconColor: '#4f46e5',
      iconBg: '#e0e7ff',
      title: 'N8n Cloud Account',
      subtitle: 'Global instance URL used by all workflows',
      fields: [
        {
          key: CK.N8N_BASE_URL,
          label: 'N8n Cloud Base URL',
          placeholder: 'https://yourname.app.n8n.cloud',
          hint: 'Your n8n Cloud URL. Found in the browser address bar when logged in. No trailing slash.',
          isUrl: true,
        },
      ],
      info: 'This URL is shared across all workflows. Change it here when switching to a different n8n account.',
    },
    {
      id: 'google-maps',
      icon: Webhook,
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
      title: 'Lead Scraper',
      subtitle: 'Webhook trigger + Google Sheet for Maps scraping workflow',
      fields: [
        {
          key: CK.WEBHOOK_GOOGLE_MAPS,
          label: 'Webhook ID',
          placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          hint: 'Open this workflow in n8n → click the Form Trigger node → copy the ID from the URL (after /form/ or /webhook/).',
          isSecret: true,
        },
        {
          key: CK.MAPS_SHEET_EDIT_URL,
          label: 'Google Sheet Edit URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/YOUR_ID/edit',
          hint: 'The regular browser URL when viewing your Google Sheet. Used for the "Open Sheet" button.',
          isUrl: true,
        },
        {
          key: CK.MAPS_SHEET_CSV_URL,
          label: 'Published CSV URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/e/LONG_ID/pub?gid=0&single=true&output=csv',
          hint: 'Go to: File → Share → Publish to web → Sheet1 → CSV → Publish → copy the URL here.',
          isUrl: true,
        },
      ],
      info: 'Webhook ID changes every time you import this workflow into a new n8n account. Always update it after switching accounts.',
    },
    {
      id: 'cordiso-leads',
      icon: FileSpreadsheet,
      iconColor: '#2563eb',
      iconBg: '#dbeafe',
      title: 'Market Research Assistant (Cordiso)',
      subtitle: 'Webhook trigger + Google Sheet for Cordiso B2B lead workflow',
      fields: [
        {
          key: CK.WEBHOOK_CORDISO_LEADS,
          label: 'Webhook ID',
          placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          hint: 'Open this workflow in n8n → click the Form Trigger node → copy the ID from the URL (after /form/ or /webhook/).',
          isSecret: true,
        },
        {
          key: CK.CORDISO_SHEET_EDIT_URL,
          label: 'Google Sheet Edit URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/YOUR_ID/edit',
          hint: 'The regular browser URL when viewing your Google Sheet. Used for the "Open Sheet" button.',
          isUrl: true,
        },
        {
          key: CK.CORDISO_SHEET_CSV_URL,
          label: 'Published CSV URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/e/LONG_ID/pub?gid=0&single=true&output=csv',
          hint: 'Go to: File → Share → Publish to web → Sheet1 → CSV → Publish → copy the URL here.',
          isUrl: true,
        },
      ],
      info: 'Webhook ID changes every time you import this workflow into a new n8n account. Always update it after switching accounts.',
    },
    {
      id: 'rag-knowledge',
      icon: MessageSquare,
      iconColor: '#7c3aed',
      iconBg: '#f5f3ff',
      title: 'RAG Knowledge Base',
      subtitle: 'Webhook IDs for the document upload & AI chat workflows',
      fields: [
        {
          key: CK.WEBHOOK_RAG_UPLOAD,
          label: 'Document Upload Webhook ID',
          placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          hint: 'Copy from the Form Trigger node of your Document Ingestion workflow in n8n.',
          isSecret: true,
        },
        {
          key: CK.WEBHOOK_RAG_CHAT,
          label: 'RAG Chat Webhook ID',
          placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
          hint: 'Copy from the Webhook Trigger node of your RAG Chat workflow in n8n.',
          isSecret: true,
        },
      ],
      info: 'Add both webhook IDs to activate the RAG Chat page. Documents uploaded via the chat will be indexed into Pinecone using Workflow 1, and questions will be answered via Workflow 2.',
    },

    // ── No Action Plan Leads ──────────────────────────────────────────────────
    {
      id: 'no-action-plan',
      icon: AlertTriangle,
      iconColor: '#ef4444',
      iconBg: '#fef2f2',
      title: 'No Action Plan Leads',
      subtitle: 'Upload Excel → AI identifies at-risk CRM leads with no follow-up planned',
      fields: [
        {
          key: CK.WEBHOOK_NO_ACTION_PLAN,
          label: 'Form Trigger Webhook ID',
          placeholder: '71a1b559-084e-46a1-94cb-6f158d17d2cc',
          hint: 'Open the "No Action Plan Leads" workflow in n8n → click the Form Trigger node → copy the webhook ID.',
          isSecret: true,
        },
        {
          key: CK.NO_ACTION_ALL_LEADS_SHEET_URL,
          label: 'All Leads Google Sheet Edit URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/YOUR_ID/edit',
          hint: 'The full browser URL of your main leads Google Sheet.',
          isUrl: true,
        },
        {
          key: CK.NO_ACTION_ALL_LEADS_CSV_URL,
          label: 'All Leads Published CSV URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/e/LONG_ID/pub?gid=0&single=true&output=csv',
          hint: 'File → Share → Publish to web → CSV → Publish → copy URL. Used for the "All Leads" tab.',
          isUrl: true,
        },
        {
          key: CK.NO_ACTION_AI_LEADS_CSV_URL,
          label: 'AI Priority Leads Published CSV URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/e/LONG_ID/pub?gid=0&single=true&output=csv',
          hint: 'Published CSV of the sheet where n8n saves AI-prioritized leads. Used for the "At-Risk Leads" tab.',
          isUrl: true,
        },
      ],
      info: 'Webhook ID to use for No Action Plan. Add a Google Sheets node in n8n after the AI code step to save AI results, then publish that sheet as CSV and paste the URL above.',
    },

    // ── Lead Qualification ────────────────────────────────────────────────────
    {
      id: 'lead-qualification',
      icon: Zap,
      iconColor: '#0d9488',
      iconBg: '#ccfbf1',
      title: 'Lead Qualification',
      subtitle: 'Input Google Sheet → AI qualifies intent & readiness → Output Google Sheet',
      fields: [
        {
          key: CK.WEBHOOK_LEAD_QUALIFICATION,
          label: 'Form Trigger Webhook ID',
          placeholder: 'Copy from Form Trigger node of your Lead Qualification workflow in n8n',
          hint: 'Open the "Lead Qualification" workflow in n8n → click the Form Trigger node → copy the webhook ID (or full URL).',
          isSecret: true,
        },
        {
          key: CK.QUALIFICATION_ALL_LEADS_SHEET_URL,
          label: 'Input Google Sheet Edit URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/YOUR_INPUT_SHEET_ID/edit',
          hint: 'The browser URL of your main leads Google Sheet that n8n reads from.',
          isUrl: true,
        },
        {
          key: CK.QUALIFICATION_ALL_LEADS_CSV_URL,
          label: 'Input Sheet Published CSV URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/e/LONG_ID/pub?gid=0&single=true&output=csv',
          hint: 'File → Share → Publish to web → CSV → Publish → copy URL. Used for the "All Leads" tab.',
          isUrl: true,
        },
        {
          key: CK.QUALIFICATION_AI_LEADS_CSV_URL,
          label: 'Qualified Leads Published CSV URL',
          placeholder: 'https://docs.google.com/spreadsheets/d/YOUR_OUTPUT_SHEET_ID/export?format=csv&gid=0',
          hint: 'Published CSV of the Output Google Sheet where n8n saves AI-qualified leads. Used for the "Qualified Leads" tab.',
          isUrl: true,
        },
      ],
      info: 'Paste your Webhook ID and Output Sheet CSV URL above. When you click Execute Workflow, n8n reads your Input Sheet, qualifies leads via AI, and appends results to your Output Sheet!',
    },
  ];

  // ── If a detail view is active, show it ────────────────────────────────────
  if (activeView) {
    const account = ACCOUNTS.find(a => a.id === activeView);
    return (
      <div className="page" style={{ padding: '24px 32px 48px' }}>
        <DetailView
          config={{
            ...account,
            initialValues: Object.fromEntries(
              account.fields.map(f => [f.key, cfg[f.key] || ''])
            ),
          }}
          onBack={() => setActiveView(null)}
          onSave={handleSave}
        />
      </div>
    );
  }

  // ── Overview (cards grid) ───────────────────────────────────────────────────
  return (
    <div className="page" style={{ padding: '24px 32px 48px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
              }}>
                <Settings size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Settings
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                  Click any workflow card below to configure it
                </p>
              </div>
            </div>

            {/* Reset All */}
            {hasCustom && (
              <button type="button" onClick={handleResetAll} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 10, padding: '8px 16px',
                fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}>
                <RotateCcw size={13} />
                Reset All to .env
              </button>
            )}
          </div>

          {/* Global Status Badge */}
          <div style={{ marginTop: 16 }}>
            {hasCustom ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 99, padding: '5px 14px', fontSize: 12, color: '#92400e', fontWeight: 600,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                Custom Configuration Active — Overriding .env defaults
              </div>
            ) : (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#dcfce7', border: '1px solid #bbf7d0',
                borderRadius: 99, padding: '5px 14px', fontSize: 12, color: '#15803d', fontWeight: 600,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                Using .env Default Configuration
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 12, padding: '12px 16px', marginTop: 14,
          }}>
            <Info size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: '#1e40af', margin: 0, lineHeight: 1.7 }}>
              Settings are saved to your browser's <strong>localStorage</strong> and instantly override .env values — no server restart needed.
              Click <strong>Reset All to .env</strong> to go back to defaults.
            </p>
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ACCOUNTS.map(account => (
            <OverviewCard
              key={account.id}
              icon={account.icon}
              iconColor={account.iconColor}
              iconBg={account.iconBg}
              title={account.title}
              subtitle={account.subtitle}
              fields={account.fields.map(f => ({ label: f.label, value: cfg[f.key] || '' }))}
              onClick={() => setActiveView(account.id)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
