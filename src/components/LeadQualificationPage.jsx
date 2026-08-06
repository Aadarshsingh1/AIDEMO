import { useState, useRef, useEffect } from 'react';
import {
  Play, CheckCircle2, XCircle, Loader2,
  AlertTriangle, ArrowLeft, Database,
  Activity, Upload, FileSpreadsheet, Zap,
  Award, BarChart3,
} from 'lucide-react';
import { triggerWorkflow, triggerWorkflowWithFile } from '../services/n8nService';
import { formatGoogleSheetCsvUrl } from '../services/sheetsService';
import LeadsTable from './LeadsTable';

// ─── Simulated step progression ───────────────────────────────────────────────
function useSimulatedSteps(steps, isRunning, onComplete) {
  const [completedIdx, setCompletedIdx] = useState(-1);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isRunning) { setCompletedIdx(-1); return; }
    let idx = -1;
    function advance() {
      idx++;
      setCompletedIdx(idx);
      if (idx < steps.length - 1) {
        const delay = 4000 + Math.random() * 6000;
        timerRef.current = setTimeout(advance, delay);
      } else {
        timerRef.current = setTimeout(() => onComplete?.(), 1500);
      }
    }
    timerRef.current = setTimeout(advance, 800);
    return () => clearTimeout(timerRef.current);
  }, [isRunning]);

  return completedIdx;
}

function getStepStateHelper(idx, completedStepIdx, isDone) {
  if (isDone) return 'done';
  if (idx < completedStepIdx) return 'done';
  if (idx === completedStepIdx) return 'running';
  return 'pending';
}

// ─── LeadQualificationPage ──────────────────────────────────────────────────
export default function LeadQualificationPage({ workflow, n8nConfigured, onBack }) {
  const [activeTab, setActiveTab]       = useState('run');
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus]             = useState('idle');
  const [errorMsg, setErrorMsg]         = useState('');
  const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);
  const fileInputRef = useRef(null);

  const isRunning = status === 'running';
  const isDone    = status === 'done';
  const isError   = status === 'error';

  const allLeadsCsvUrl = workflow.sheetCsvUrl || formatGoogleSheetCsvUrl(workflow.sheetUrl) || '';
  const aiLeadsCsvUrl  = formatGoogleSheetCsvUrl(workflow.aiSheetCsvUrl || '') || '';

  const completedStepIdx = useSimulatedSteps(
    workflow.steps,
    isRunning,
    () => { setStatus('done'); setLeadsRefreshKey(k => k + 1); }
  );

  const totalSteps  = workflow.steps.length;
  const doneSteps   = isDone ? totalSteps : Math.max(0, completedStepIdx + 1);
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (f) setSelectedFile(f);
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setStatus('running');

    if (!n8nConfigured) return; // demo mode

    const result = selectedFile
      ? await triggerWorkflowWithFile(workflow.webhookId, selectedFile, 'Lead Excel')
      : await triggerWorkflow(workflow.webhookId, { source: 'google_sheet' });

    if (!result.success) {
      setStatus('error');
      setErrorMsg(result.error);
    }
  }

  const TABS = [
    { id: 'run',       label: 'Run Workflow',    icon: <Play size={13} /> },
    { id: 'leads',     label: 'All Leads',       icon: <Database size={13} /> },
    { id: 'qualified', label: 'Qualified Leads', icon: <Award size={13} />, badge: 'AI' },
  ];

  const iconColor = '#0d9488'; // teal theme

  return (
    <div className="page" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Page Header ── */}
      <div style={{
        padding: '18px 28px', borderBottom: '1px solid var(--border)', background: '#fff',
        display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
      }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ padding: '7px 12px', fontSize: 12.5, gap: 5 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: '#ccfbf1',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Zap size={18} color={iconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{workflow.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{workflow.category} · N8n Workflow</div>
        </div>
        {status !== 'idle' && (
          <span className={`wf-status-badge ${status}`} style={{ fontSize: 12 }}>
            {isRunning && <span className="pulse-dot" style={{ marginRight: 5 }} />}
            {isRunning ? 'Running…' : isDone ? 'Done ✓' : 'Error'}
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: '#fff', paddingLeft: 28, flexShrink: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '11px 20px', fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
              background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon} {tab.label}
            {tab.badge && (
              <span style={{
                fontSize: 9, fontWeight: 800, background: '#0d9488',
                color: '#fff', padding: '1px 6px', borderRadius: 20,
              }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: 'auto' }}>

        {/* ────────── RUN TAB ────────── */}
        {activeTab === 'run' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, minHeight: '100%' }}>

            {/* LEFT: Form */}
            <div style={{ padding: '28px 32px', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
              {!n8nConfigured && (
                <div className="config-banner" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={15} />
                  <div>
                    <strong>Demo Mode</strong> — N8n URL not set.<br />
                    Add <code>VITE_N8N_BASE_URL</code> in Settings to connect for real. Execution will be simulated.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Optional Excel Upload Section */}
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Optional Excel File Override</label>
                    {selectedFile && (
                      <button type="button" onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                        Clear File
                      </button>
                    )}
                  </div>
                  <div
                    onClick={() => !isRunning && fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && !isRunning) setSelectedFile(f); }}
                    style={{
                      border: `1.5px dashed ${selectedFile ? iconColor : 'var(--border)'}`,
                      borderRadius: 10, padding: '16px 14px', textAlign: 'center',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      background: selectedFile ? '#f0fdf4' : 'var(--bg)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {selectedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <FileSpreadsheet size={18} color={iconColor} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{selectedFile.name}</span>
                        <CheckCircle2 size={16} color={iconColor} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Upload size={14} /> Click to upload Excel file instead of Google Sheets
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>

                {/* Info */}
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                  padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#166534', lineHeight: 1.6,
                }}>
                  <Zap size={14} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Clicking <strong>Execute Workflow</strong> will run AI qualification on all leads in your Input Sheet and append qualified leads to your Output Sheet.</span>
                </div>

                {errorMsg && (
                  <div style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 14, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {errorMsg}
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-full" disabled={isRunning || isDone} style={{ marginTop: 4 }}>
                  {isRunning ? <><span className="spinner" /> Qualifying Leads…</>
                   : isDone  ? <><CheckCircle2 size={15} /> Lead Qualification Done!</>
                             : <><Play size={14} /> Execute Workflow</>}
                </button>

                {isDone && (
                  <>
                    <button type="button" className="btn btn-outline btn-full" style={{ marginTop: 10 }}
                      onClick={() => { setStatus('idle'); setSelectedFile(null); }}>Run Again</button>
                    <button type="button" className="btn btn-ghost btn-full" style={{ marginTop: 8 }}
                      onClick={() => setActiveTab('qualified')}>
                      <Award size={13} /> View Qualified Leads →
                    </button>
                  </>
                )}
              </form>
            </div>

            {/* RIGHT: Activity Panel */}
            <div style={{ padding: '28px 32px', overflowY: 'auto', background: 'var(--bg)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.9px', color: 'var(--muted)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={13} /> Workflow Activity
              </div>

              {status === 'idle' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12, color: 'var(--muted)', textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={26} color={iconColor} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ready to qualify leads</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 240 }}>Click <strong>Execute Workflow</strong> to start AI qualification on your Google Sheet leads.</div>
                </div>
              )}

              {status !== 'idle' && workflow.steps.length > 0 && (
                <>
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                        {isDone ? 'All steps completed' : isError ? 'Execution stopped' : `Step ${Math.min(completedStepIdx + 1, totalSteps)} of ${totalSteps}`}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? 'var(--green)' : isError ? 'var(--red)' : iconColor }}>
                        {progressPct}%
                      </span>
                    </div>
                    <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, borderRadius: 99, background: isDone ? 'var(--green)' : isError ? 'var(--red)' : iconColor, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div className="progress-steps">
                    {workflow.steps.map((step, idx) => {
                      const state = getStepStateHelper(idx, completedStepIdx, isDone);
                      return (
                        <div key={step.key} className="progress-step" style={{
                          padding: '10px 14px', marginBottom: 8, borderRadius: 10,
                          background: state === 'running' ? 'rgba(13,148,136,.05)' : '#fff',
                          border: `1px solid ${state === 'running' ? 'rgba(13,148,136,.25)' : 'var(--border)'}`,
                          transition: 'all 0.3s ease',
                        }}>
                          <div className={`step-dot ${state}`}>
                            {state === 'done'    ? <CheckCircle2 size={12} /> :
                             state === 'running' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> :
                             idx + 1}
                          </div>
                          <div className="step-content">
                            <div className="step-name">{step.label}</div>
                            <div className="step-sub">{step.sub}</div>
                            {state === 'running' && <div style={{ marginTop: 6, fontSize: 11, color: iconColor, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><span className="pulse-dot" style={{ background: iconColor }} /> Processing…</div>}
                            {state === 'done' && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ Completed</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isDone && (
                    <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 12, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={18} color="var(--green)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>Qualification complete!</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Qualified leads saved to your Output Google Sheet.</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ────────── ALL LEADS TAB ────────── */}
        {activeTab === 'leads' && (
          <div style={{ padding: 24 }}>
            {allLeadsCsvUrl ? (
              <LeadsTable
                workflow={{ ...workflow, name: 'Input Sheet Leads' }}
                csvUrl={allLeadsCsvUrl}
                refreshTrigger={leadsRefreshKey}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
                <Database size={44} style={{ opacity: 0.25, marginBottom: 14 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No Input Sheet Connected</div>
                <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto', lineHeight: 1.7 }}>
                  Go to <strong>Settings → Lead Qualification</strong> and paste your Input Google Sheet Published CSV URL to show all leads here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ────────── QUALIFIED LEADS TAB ────────── */}
        {activeTab === 'qualified' && (
          <div style={{ padding: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1px solid #a7f3d0', borderRadius: 12,
              padding: '12px 18px', marginBottom: 20,
            }}>
              <Award size={18} color={iconColor} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>AI-Qualified Leads</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Leads scored by AI for buyer intent, budget, fit &amp; readiness</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, background: '#0d9488', color: '#fff', padding: '3px 10px', borderRadius: 20 }}>AI QUALIFIED</div>
            </div>

            {aiLeadsCsvUrl ? (
              <LeadsTable
                workflow={{
                  ...workflow,
                  name: 'Qualified Leads',
                  sheetColumns: ['LeadID', 'CustomerName', 'LeadStatus', 'QualificationScore', 'LeadQuality', 'ReasonForQualification'],
                }}
                csvUrl={aiLeadsCsvUrl}
                refreshTrigger={leadsRefreshKey}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
                <BarChart3 size={44} style={{ opacity: 0.25, marginBottom: 14 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No Output Sheet Connected</div>
                <p style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
                  Go to <strong>Settings → Lead Qualification</strong> and paste the
                  <strong> Qualified Leads Sheet Published CSV URL</strong> to view qualified leads here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
