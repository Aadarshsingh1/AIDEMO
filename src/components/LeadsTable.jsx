import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Download, Search, ExternalLink,
  AlertTriangle, Database, ChevronLeft, ChevronRight, CheckCheck,
  X, Copy, Mail, Phone, MapPin, User, Sparkles, Check, Award,
} from 'lucide-react';
import { fetchSheetLeads } from '../services/sheetsService';

const PAGE_SIZE = 10;

// ─── Score color helper ───────────────────────────────────────────────────────
function scoreColor(score) {
  const n = Number(score);
  if (n >= 8) return 'var(--green)';
  if (n >= 5) return 'var(--orange)';
  return 'var(--red)';
}

// ─── Field Validation Helpers ─────────────────────────────────────────────────
function isValidPhone(val) {
  if (!val || val === '—' || val === 'NOT_FOUND' || val === 'NO_PHONE') return false;
  const str = String(val).trim();
  const digitCount = (str.match(/\d/g) || []).length;
  if (digitCount < 5) return false;
  if (/[a-zA-Z]{3,}/.test(str)) return false; // Contains words, not a phone
  return true;
}

function isValidEmail(val) {
  if (!val || val === '—' || val === 'NOT_FOUND' || val === 'NO_EMAIL') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
}

function isValidWebsite(val) {
  if (!val || val === '—' || val === 'NOT_FOUND' || val === 'NO_WEBSITE') return false;
  const str = String(val).trim();
  return /^https?:\/\//i.test(str) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(str);
}

// ─── Platform chip ────────────────────────────────────────────────────────────
function PlatformChip({ value, onClick }) {
  if (!value || value === 'NOT_FOUND' || !isValidWebsite(value)) return <span className="chip chip-gray">—</span>;
  const isUrl = value.startsWith('http');
  return (
    <a
      href={isUrl ? value : `https://${value}`}
      target="_blank"
      rel="noreferrer"
      className="chip chip-blue"
      onClick={onClick}
    >
      <ExternalLink size={10} /> Profile
    </a>
  );
}

// ─── LeadDetailDrawer ─────────────────────────────────────────────────────────
function LeadDetailDrawer({ lead, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!lead) return null;

  // Detect workflow / lead type
  const isCrm = !!(lead.CustomerName || lead.LeadID || lead.TEnquiryId || lead.ReasonForPriority || lead['Reason For Priority'] || lead.PreferredProject || lead.Budget || lead.LeadStatus || lead.DaysSinceLastInteraction);

  // Common / Google Maps fields
  const score = lead.leadScore || lead.score || '—';
  const name = lead.CustomerName || lead.businessName || lead.title || lead.name || 'Unnamed Opportunity';
  const email = isValidEmail(lead.email) ? lead.email : '';
  const phone = isValidPhone(lead.phone) ? lead.phone : '';
  const website = isValidWebsite(lead.website) ? lead.website : '';
  const address = lead.address && lead.address !== 'NOT_FOUND' ? lead.address : '';
  const owner = lead.ownerName && lead.ownerName !== 'NOT_FOUND' ? lead.ownerName : (lead.owner || '');
  const icebreaker = lead.icebreaker && lead.icebreaker !== 'NOT_FOUND' ? lead.icebreaker : '';
  const aiAnalysis = lead.aiAnalysis || lead.aianalysis || lead.AIANALYSIS || lead.ai_analysis || lead.ReasonForPriority || lead['Reason For Priority'] || '';

  // CRM specific fields
  const leadId = lead.LeadID || lead.TEnquiryId || lead['Lead ID'] || lead['TEnquiryId'] || '';
  const budget = lead.Budget || lead['Budget'] || '';
  const preferredProject = lead.PreferredProject || lead.PreferredProjectId || lead['Preferred Project'] || '';
  const leadStatus = lead.LeadStatus || lead['Lead Status'] || '';
  const source = lead.Source || lead['Source'] || '';
  const totalInteractions = lead.TotalInteractions || lead['Total Interactions'] || '';
  const daysIdle = lead.DaysSinceLastInteraction || lead['Days Since Last Interaction'] || '';
  const createdOn = lead.CreatedOn || lead['Created On'] || '';
  const reengagedOn = lead.ReengagedOn || lead['Reengaged On'] || '';

  // Cordiso-specific fields
  const postUrl = lead.post_url || '';

  function handleCopy(text, fieldName) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          height: '100%',
          background: '#ffffff',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: isCrm
            ? 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {isCrm ? (
                <>
                  {leadId && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', background: '#fee2e2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 20 }}>
                      ID: #{leadId}
                    </span>
                  )}
                  {leadStatus && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: 20 }}>
                      {leadStatus}
                    </span>
                  )}
                  {preferredProject && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#f3e8ff', border: '1px solid #e9d5ff', padding: '2px 8px', borderRadius: 20 }}>
                      {preferredProject}
                    </span>
                  )}
                </>
              ) : (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: scoreColor(score),
                  background: score >= 8 ? '#ecfdf5' : score >= 5 ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${scoreColor(score)}40`,
                  padding: '3px 10px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <Award size={12} /> AI Intent Score: {score}/10
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.25 }}>
              {name}
            </h2>

            {address && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {address}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* AI Reason for Priority / Risk Analysis */}
          {aiAnalysis && (
            <div style={{
              background: isCrm ? 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
              border: `1px solid ${isCrm ? '#fecaca' : '#cbd5e1'}`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: isCrm ? '#991b1b' : '#4338ca' }}>
                  <Sparkles size={14} color={isCrm ? '#dc2626' : '#6366f1'} /> {isCrm ? 'AI Risk & Opportunity Analysis' : 'AI Analysis'}
                </div>
                <button
                  onClick={() => handleCopy(aiAnalysis, 'aiAnalysis')}
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${isCrm ? '#fecaca' : '#cbd5e1'}`,
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {copiedField === 'aiAnalysis' ? <Check size={11} color="var(--green)" /> : <Copy size={11} />}
                  {copiedField === 'aiAnalysis' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 13, color: isCrm ? '#7f1d1d' : 'var(--text)', lineHeight: 1.6, margin: 0, fontWeight: isCrm ? 500 : 400 }}>
                {aiAnalysis}
              </p>
            </div>
          )}

          {/* AI Icebreaker Card (for Maps / Social) */}
          {icebreaker && !isCrm && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
              border: '1px solid #c7d2fe',
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#4338ca' }}>
                  <Sparkles size={14} color="#6366f1" /> Groq AI Personalization
                </div>
                <button
                  onClick={() => handleCopy(icebreaker, 'icebreaker')}
                  style={{ background: '#ffffff', border: '1px solid #c7d2fe', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#4338ca', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  {copiedField === 'icebreaker' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  {copiedField === 'icebreaker' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#1e1b4b', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                "{icebreaker}"
              </p>
            </div>
          )}

          {/* If CRM Lead -> Detailed CRM Opportunity Grid */}
          {isCrm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Opportunity Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {budget && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Budget</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginTop: 2 }}>{budget}</div>
                  </div>
                )}
                {preferredProject && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Preferred Project</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6b21a8', marginTop: 2 }}>{preferredProject}</div>
                  </div>
                )}
                {leadStatus && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Lead Status</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', marginTop: 2 }}>{leadStatus}</div>
                  </div>
                )}
                {source && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Source</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{source}</div>
                  </div>
                )}
                {totalInteractions && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Total Interactions</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{totalInteractions}</div>
                  </div>
                )}
                {daysIdle && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 10.5, color: '#991b1b', fontWeight: 600 }}>Days Since Last Contact</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#dc2626', marginTop: 2 }}>{daysIdle} days</div>
                  </div>
                )}
                {createdOn && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Created On</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-md)', marginTop: 2 }}>{createdOn}</div>
                  </div>
                )}
                {reengagedOn && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Re-engaged On</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-md)', marginTop: 2 }}>{reengagedOn}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Details Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Contact Details
            </div>

            {/* Email */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={15} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Email Address</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: email ? 'var(--text)' : 'var(--muted)' }}>
                    {email || 'Not available'}
                  </div>
                </div>
              </div>
              {email && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleCopy(email, 'email')}
                    style={{ background: '#fff', border: '1px solid var(--border)', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text)' }}
                  >
                    {copiedField === 'email' ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                  </button>
                  <a
                    href={`mailto:${email}`}
                    style={{ background: 'var(--primary)', color: '#fff', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Email
                  </a>
                </div>
              )}
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={15} color="var(--green)" />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Phone Number</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: phone ? 'var(--text)' : 'var(--muted)' }}>
                    {phone || 'Not available'}
                  </div>
                </div>
              </div>
              {phone && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleCopy(phone, 'phone')}
                    style={{ background: '#fff', border: '1px solid var(--border)', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text)' }}
                  >
                    {copiedField === 'phone' ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                  </button>
                  <a
                    href={`tel:${phone}`}
                    style={{ background: 'var(--green)', color: '#fff', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Call
                  </a>
                </div>
              )}
            </div>

            {/* Owner / Decision Maker (for Maps / Cordiso) */}
            {!isCrm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={15} color="var(--purple)" />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Owner / Key Person</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: owner ? 'var(--text)' : 'var(--muted)' }}>
                    {owner || 'Not identified'}
                  </div>
                </div>
              </div>
            )}

            {/* Website (if present) */}
            {website && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink size={15} color="var(--orange)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Website</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>
                      {website.replace(/^https?:\/\//, '')}
                    </div>
                  </div>
                </div>
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Visit <ExternalLink size={11} />
                </a>
              </div>
            )}

            {/* Post / Source Link (if present) */}
            {postUrl && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ExternalLink size={15} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 600 }}>Source / Post Link</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>
                      {postUrl.replace(/^https?:\/\//, '').slice(0, 32)}…
                    </div>
                  </div>
                </div>
                <a
                  href={postUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: 'var(--primary)', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Visit <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>

          {/* All Remaining CRM Fields Grid (so no data is ever missed) */}
          {isCrm && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                All Lead Attributes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                {Object.entries(lead).map(([key, val]) => {
                  if (!val || val === '—') return null;
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{key}:</span>
                      <span style={{ color: 'var(--text)', fontWeight: 500, textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word' }}>{String(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: '#fafafa',
          display: 'flex',
          gap: 10,
        }}>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ flex: 1, padding: '10px 0', justifyContent: 'center' }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(rows, columns) {
  if (!rows.length) return;
  const header = columns.join(',');
  const body   = rows.map(r => columns.map(c => `"${(r[c] || '').replace(/"/g, '""')}"`).join(','));
  const blob   = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
  const a      = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `leads_${Date.now()}.csv`;
  a.click();
}

// ─── LeadsTable ──────────────────────────────────────────────────────────────
export default function LeadsTable({ workflow, csvUrl, refreshTrigger }) {
  const [rows, setRows]         = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  // Track viewed / opened leads in localStorage
  const storageKey = `treos_viewed_${workflow.id}`;
  const [viewedLeads, setViewedLeads] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch (e) { return []; }
  });

  function markAsViewed(name) {
    if (!name || viewedLeads.includes(name)) return;
    const updated = [...viewedLeads, name];
    setViewedLeads(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); }
    catch (e) { /* ignore localStorage error */ }
  }

  function markAllAsViewed() {
    const allNames = rows.map(r => r.CustomerName || r.businessName || r.title || r.name || r.LeadID).filter(Boolean);
    setViewedLeads(allNames);
    try { localStorage.setItem(storageKey, JSON.stringify(allNames)); }
    catch (e) { /* ignore */ }
  }

  // Dynamically extract columns from actual CSV data if present, or fallback to workflow config
  const rawCols = rows.length > 0
    ? Object.keys(rows[0]).filter(k => rows.some(r => r[k] && r[k].trim() !== ''))
    : workflow.sheetColumns;

  // Hide AI Analysis, Keyword, Scraped At, Company, and detailed CRM fields from the main table grid
  const cols = rawCols.filter(col => !/^(ai_?analysis|keyword|scraped_at|company|tenquiryid|budget|preferredprojectid|source|createdon|reengagedon)$/i.test(col));

  const load = useCallback(async () => {
    if (!csvUrl) { setError('CSV URL not configured. Set VITE_MAPS_SHEET_CSV_URL in .env'); return; }
    setLoading(true); setError('');
    const res = await fetchSheetLeads(csvUrl);
    setLoading(false);
    if (res.success) {
      // Filter out invalid synthetic bullet rows from AI analysis
      const validLeads = res.data.filter(r => {
        const name = String(r.CustomerName || r.businessName || r.title || r.name || r.LeadID || Object.values(r)[0] || '').trim();
        if (!name) return false;
        if (name.startsWith('•') || name.startsWith('-')) return false;
        if (/^(Their|They|With a|The company|These|Target|Our)/i.test(name) && name.length > 25) return false;
        return true;
      });

      // Reverse array so NEWEST leads (appended at bottom of sheet) show FIRST at top!
      const reversed = [...validLeads].reverse();
      setRows(reversed);
      setFiltered(reversed);
      setCurrentPage(1);
      setLastRefresh(new Date().toLocaleTimeString());
    } else {
      setError(res.error);
    }
  }, [csvUrl]);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  // Filter rows by search
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on search
    if (!search.trim()) { setFiltered(rows); return; }
    const q = search.toLowerCase();
    setFiltered(rows.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    ));
  }, [search, rows]);

  // Count unread leads
  const unreadCount = filtered.filter(r => {
    const name = r.businessName || r.title || r.name;
    return name && !viewedLeads.includes(name);
  }).length;

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="leads-table-wrap">
      {/* Toolbar */}
      <div className="leads-table-toolbar">
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={14} style={{ verticalAlign: -2 }} />
          {workflow.name} — Leads
          <span style={{ fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
            {filtered.length} leads
          </span>

          {unreadCount > 0 && (
            <span style={{ fontSize: 11, background: 'var(--green-light)', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="pulse-dot" style={{ width: 6, height: 6 }} /> {unreadCount} new
            </span>
          )}
        </div>

        <div className="search-input-wrap">
          <Search size={14} />
          <input
            className="search-input"
            placeholder="Search leads…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {unreadCount > 0 && (
          <button className="btn btn-ghost" style={{ padding: '7px 10px', fontSize: 11.5 }} onClick={markAllAsViewed} title="Mark all as read">
            <CheckCheck size={13} color="var(--green)" /> Mark All Read
          </button>
        )}

        <button className="btn btn-ghost" style={{ padding: '7px 12px', fontSize: 12 }} onClick={load} disabled={loading}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>

        <button className="btn btn-outline" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => exportCSV(filtered, cols)}>
          <Download size={13} /> Export CSV
        </button>

        {lastRefresh && (
          <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
            Updated {lastRefresh}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center', color: '#92400e', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontSize: 12.5 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              {cols.map(col => <th key={col}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 && !loading ? (
              <tr>
                <td colSpan={cols.length + 1}>
                  <div className="table-empty">
                    <Database size={36} />
                    <p>
                      {rows.length === 0
                        ? 'No leads yet. Run the workflow to generate leads.'
                        : 'No results match your search.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => {
                const rowNum = startIndex + idx + 1;
                const leadName = row.CustomerName || row.businessName || row.title || row.name || row.LeadID || `lead_${rowNum}`;
                const isNew = !viewedLeads.includes(leadName);

                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      markAsViewed(leadName);
                      setSelectedLead(row);
                    }}
                    style={{
                      background: isNew ? 'rgba(236, 253, 245, 0.45)' : undefined,
                      transition: 'background 0.2s ease',
                      cursor: 'pointer',
                    }}
                    title="Click to view AI insights & full contact details"
                  >
                    <td style={{ color: 'var(--muted)', fontSize: 11 }}>{rowNum}</td>

                    {cols.map(col => {
                      const val = row[col] || '—';

                      // Business Name / Customer Name column gets NEW badge if unread
                      if (col === 'businessName' || col === 'CustomerName') return (
                        <td key={col} style={{ fontWeight: isNew ? 700 : 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isNew && (
                              <span style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                background: '#10b981',
                                color: '#fff',
                                padding: '2px 6px',
                                borderRadius: 4,
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                flexShrink: 0,
                                boxShadow: '0 1px 4px rgba(16,185,129,0.3)',
                              }}>
                                NEW
                              </span>
                            )}
                            <span>{val}</span>
                          </div>
                        </td>
                      );

                      if (col === 'leadScore') return (
                        <td key={col}>
                          <div className="lead-score-bar">
                            <div className="score-track">
                              <div className="score-fill" style={{ width: `${Number(val) * 10}%`, background: scoreColor(val) }} />
                            </div>
                            <span className="score-text">{val}/10</span>
                          </div>
                        </td>
                      );

                      if (col === 'socialLinks') return (
                        <td key={col}><PlatformChip value={val} onClick={() => markAsViewed(leadName)} /></td>
                      );

                      if (col.toLowerCase().includes('phone')) return (
                        <td key={col}>
                          <span style={{ fontSize: 12, color: isValidPhone(val) ? 'var(--text)' : 'var(--muted)' }}>
                            {isValidPhone(val) ? val : '—'}
                          </span>
                        </td>
                      );

                      if (col.toLowerCase().includes('website') || col.toLowerCase().includes('post_url') || col === 'url') return (
                        <td key={col}>
                          {val && val !== '—' && val !== 'NOT_FOUND' && val !== 'NO_WEBSITE' && (val.startsWith('http') || isValidWebsite(val)) ? (
                            <a
                              href={val.startsWith('http') ? val : `https://${val}`}
                              target="_blank"
                              rel="noreferrer"
                              className="chip chip-blue"
                              style={{ fontSize: 11 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsViewed(leadName);
                              }}
                            >
                              <ExternalLink size={9} /> Visit
                            </a>
                          ) : <span className="chip chip-gray">—</span>}
                        </td>
                      );

                      if (col.toLowerCase().includes('email')) return (
                        <td key={col}>
                          <span style={{ fontSize: 12, color: isValidEmail(val) ? 'var(--text)' : 'var(--muted)' }}>
                            {isValidEmail(val) ? val : '—'}
                          </span>
                        </td>
                      );

                      if (col === 'icebreaker') return (
                        <td key={col} style={{ maxWidth: 200 }}>
                          <span title={val} style={{ fontSize: 11.5, color: 'var(--text-md)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {val}
                          </span>
                        </td>
                      );

                      return <td key={col} style={{ fontSize: 12.5 }}>{val}</td>;
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filtered.length > 0 && (
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fafafa',
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Showing <strong style={{ color: 'var(--text)' }}>{startIndex + 1}</strong> to{' '}
            <strong style={{ color: 'var(--text)' }}>{Math.min(startIndex + PAGE_SIZE, filtered.length)}</strong> of{' '}
            <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> leads
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '1px solid',
                    borderColor: page === currentPage ? 'var(--primary)' : 'var(--border)',
                    background: page === currentPage ? 'var(--primary)' : '#fff',
                    color: page === currentPage ? '#fff' : 'var(--text)',
                    fontSize: 12, fontWeight: page === currentPage ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                  }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
}
