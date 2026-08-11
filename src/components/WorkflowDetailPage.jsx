import { useState, useRef, useEffect } from 'react';
import {
  Play, CheckCircle2, XCircle, Loader2,
  ChevronDown, AlertTriangle,
  ArrowLeft, Database, BarChart3, Activity,
} from 'lucide-react';
import { triggerWorkflow } from '../services/n8nService';
import LeadsTable from './LeadsTable';

import { getWorkflows } from '../data/workflows';

// ─── Published CSV URL is now read from workflow.sheetCsvUrl (set via .env) ──
// No hardcoded fallbacks — all URLs come from .env exclusively

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
        const delay = 3000 + Math.random() * 5000;
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

// ─── WorkflowDetailPage ───────────────────────────────────────────────────────
export default function WorkflowDetailPage({ workflow: initialWorkflow, n8nConfigured, onBack, onDone }) {
  const workflow = getWorkflows().find(w => w.id === initialWorkflow?.id) || initialWorkflow;

  const [activeTab, setActiveTab] = useState('run');
  const [formValues, setFormValues] = useState({});
  const [status, setStatus]         = useState('idle');
  const [errorMsg, setErrorMsg]     = useState('');
  const [leadsRefreshKey, setLeadsRefreshKey] = useState(0);

  const isRunning = status === 'running';
  const isDone    = status === 'done';
  const isError   = status === 'error';
  const csvUrl    = workflow.sheetCsvUrl || '';

  const completedStepIdx = useSimulatedSteps(
    workflow.steps,
    isRunning,
    () => {
      setStatus('done');
      setLeadsRefreshKey(k => k + 1);
      onDone?.();
    }
  );

  // Pre-fill default field values (e.g. Location: 'India')
  useEffect(() => {
    if (workflow?.fields) {
      const defaults = {};
      workflow.fields.forEach(f => {
        if (f.defaultValue !== undefined) defaults[f.key] = String(f.defaultValue);
      });
      setFormValues(prev => ({ ...defaults, ...prev }));
    }
  }, [workflow]);

  function handleChange(key, value) {
    setFormValues(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'Product Category' && (value === 'Flat in Pune' || value === 'Flat in Mumbai')) {
        next['Location'] = 'India';
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const missing = workflow.fields.filter(f => f.required && !formValues[f.key]?.trim());
    if (missing.length > 0) {
      setErrorMsg(`Please fill: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setErrorMsg('');
    setStatus('running');

    if (!n8nConfigured) return; // demo mode — simulated steps handle the rest

    const result = await triggerWorkflow(workflow.webhookId, formValues, workflow.fields);
    if (!result.success) {
      setStatus('error');
      setErrorMsg(result.error);
    }
  }

  function getStepState(idx) {
    if (isDone) return 'done';
    if (idx < completedStepIdx) return 'done';
    if (idx === completedStepIdx) return 'running';
    return 'pending';
  }

  const COLOR_MAP = {
    green: '#10b981', blue: '#3b82f6', purple: '#8b5cf6',
    teal: '#14b8a6', orange: '#f59e0b', red: '#ef4444',
  };
  const iconColor = COLOR_MAP[workflow.color] || '#6366f1';

  // Overall progress %
  const totalSteps = workflow.steps.length;
  const doneSteps  = isDone ? totalSteps : Math.max(0, completedStepIdx + 1);
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  return (
    <div className="page" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Page Header ── */}
      <div style={{
        padding: '18px 28px',
        borderBottom: '1px solid var(--border)',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
      }}>
        <button
          className="btn btn-ghost"
          onClick={onBack}
          style={{ padding: '7px 12px', fontSize: 12.5, gap: 5 }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${iconColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {workflow.iconImg
            ? <img src={workflow.iconImg} alt={workflow.name} style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4 }} />
            : <span style={{ color: iconColor }}>⚡</span>}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{workflow.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{workflow.category} · N8n Workflow</div>
        </div>

        {status !== 'idle' && (
          <span className={`wf-status-badge ${status}`} style={{ fontSize: 12 }}>
            {isRunning && <span className="pulse-dot" style={{ marginRight: 5 }} />}
            {status === 'running' ? 'Running…' : status === 'done' ? 'Done ✓' : 'Error'}
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: '#fff',
        paddingLeft: 28,
        flexShrink: 0,
      }}>
        {[
          { id: 'run',   label: 'Run Workflow', icon: <Play size={13} /> },
          { id: 'leads', label: 'Leads Table',  icon: <Database size={13} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '11px 20px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: 'auto' }}>

        {/* ── RUN TAB ── */}
        {activeTab === 'run' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
            minHeight: '100%',
          }}>

            {/* Left: Form */}
            <div style={{
              padding: '28px 32px',
              borderRight: '1px solid var(--border)',
              overflowY: 'auto',
            }}>
              {!n8nConfigured && (
                <div className="config-banner" style={{ marginBottom: 20 }}>
                  <AlertTriangle size={15} />
                  <div>
                    <strong>Demo Mode</strong> — N8n URL not set in <code>.env</code>.<br />
                    Add <code>VITE_N8N_BASE_URL=https://your-name.app.n8n.cloud</code> to connect for real.
                  </div>
                </div>
              )}

              <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
                {workflow.description}
              </div>

              <form onSubmit={handleSubmit}>
                {workflow.fields.map(field => (
                  <div key={field.key} className="form-group">
                    <label className="form-label">
                      {field.label}
                      {field.required && <span>*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <div className="form-select-wrap">
                        <select
                          className="form-select"
                          value={formValues[field.key] || ''}
                          onChange={e => handleChange(field.key, e.target.value)}
                          disabled={isRunning}
                        >
                          <option value="">Select…</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="form-select-arrow" />
                      </div>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        className="form-input"
                        placeholder={field.placeholder}
                        value={formValues[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        disabled={isRunning}
                      />
                    )}
                  </div>
                ))}

                {errorMsg && (
                  <div style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 14, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isRunning || isDone}
                  style={{ marginTop: 8 }}
                >
                  {isRunning ? (
                    <><span className="spinner" /> Workflow Running…</>
                  ) : isDone ? (
                    <><CheckCircle2 size={15} /> Done — Leads Saved!</>
                  ) : (
                    <><Play size={14} /> Execute Workflow</>
                  )}
                </button>

                {isDone && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-full"
                      style={{ marginTop: 10 }}
                      onClick={() => { setStatus('idle'); setFormValues({}); }}
                    >
                      Run Again
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-full"
                      style={{ marginTop: 8 }}
                      onClick={() => setActiveTab('leads')}
                    >
                      <BarChart3 size={13} /> View Leads Table →
                    </button>
                  </>
                )}
              </form>
            </div>

            {/* Right: Execution Activity Panel */}
            <div style={{
              padding: '28px 32px',
              overflowY: 'auto',
              background: 'var(--bg)',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.9px', color: 'var(--muted)',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Activity size={13} /> Workflow Activity
              </div>

              {/* Idle state */}
              {status === 'idle' && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '60px 20px', gap: 12,
                  color: 'var(--muted)', textAlign: 'center',
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                  }}>⚡</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ready to run</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 220 }}>
                    Fill in the form and click <strong>Execute Workflow</strong> to see step-by-step progress here.
                  </div>
                </div>
              )}

              {/* Running / Done / Error */}
              {status !== 'idle' && workflow.steps.length > 0 && (
                <>
                  {/* Progress bar */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
                        {isDone ? 'All steps completed' : isError ? 'Execution stopped' : `Step ${Math.min(completedStepIdx + 1, totalSteps)} of ${totalSteps}`}
                      </span>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: isDone ? 'var(--green)' : isError ? 'var(--red)' : 'var(--primary)',
                      }}>
                        {progressPct}%
                      </span>
                    </div>
                    <div style={{
                      height: 6, borderRadius: 99,
                      background: 'var(--border)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        borderRadius: 99,
                        background: isDone ? 'var(--green)' : isError ? 'var(--red)' : 'var(--primary)',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  {/* Step list */}
                  <div className="progress-steps">
                    {workflow.steps.map((step, idx) => {
                      const state = getStepState(idx);
                      return (
                        <div key={step.key} className="progress-step" style={{
                          padding: '10px 14px',
                          marginBottom: 8,
                          borderRadius: 10,
                          background: state === 'running' ? 'rgba(99,102,241,.06)' : '#fff',
                          border: `1px solid ${state === 'running' ? 'rgba(99,102,241,.25)' : 'var(--border)'}`,
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
                            {state === 'running' && (
                              <div style={{
                                marginTop: 6, fontSize: 11, color: 'var(--primary)',
                                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <span className="pulse-dot" style={{ background: 'var(--primary)' }} />
                                Processing…
                              </div>
                            )}
                            {state === 'done' && (
                              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                                ✓ Completed
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isDone && (
                    <div style={{
                      marginTop: 16, padding: '14px 18px', borderRadius: 12,
                      background: 'rgba(16,185,129,.08)',
                      border: '1px solid rgba(16,185,129,.25)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <CheckCircle2 size={18} color="var(--green)" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                          Workflow completed!
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          Leads have been saved to your Google Sheet.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── LEADS TAB ── */}
        {activeTab === 'leads' && (
          <div style={{ padding: 24 }}>
            {csvUrl ? (
              <LeadsTable
                workflow={workflow}
                csvUrl={csvUrl}
                refreshTrigger={leadsRefreshKey}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                <Database size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 14 }}>No Google Sheet connected for this workflow yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
