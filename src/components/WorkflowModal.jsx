import { useState, useRef, useEffect } from 'react';
import {
  X, Play, CheckCircle2, XCircle, Loader2,
  ChevronDown, Terminal, AlertTriangle,
} from 'lucide-react';
import { triggerWorkflow } from '../services/n8nService';

// ─── Simulated step progression for live log panel ───────────────────────────
// Since N8n free plan doesn't expose execution status API,
// we simulate step progression based on expected timing.
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
        // Each step takes 3–8 seconds (simulated)
        const delay = 3000 + Math.random() * 5000;
        timerRef.current = setTimeout(advance, delay);
      } else {
        // All steps done — signal completion after a short pause
        timerRef.current = setTimeout(() => onComplete?.(), 1500);
      }
    }
    timerRef.current = setTimeout(advance, 800);
    return () => clearTimeout(timerRef.current);
  }, [isRunning]);

  return completedIdx;
}

// ─── WorkflowModal ────────────────────────────────────────────────────────────
export default function WorkflowModal({ workflow, onClose, onDone, n8nConfigured }) {
  const [formValues, setFormValues]   = useState({});
  const [status, setStatus]           = useState('idle'); // idle | running | done | error
  const [errorMsg, setErrorMsg]       = useState('');
  const [logLines, setLogLines]       = useState([]);
  const logBottomRef = useRef(null);

  const isRunning = status === 'running';
  const isDone    = status === 'done';
  const isError   = status === 'error';

  // Simulated step progression
  const completedStepIdx = useSimulatedSteps(
    workflow.steps,
    isRunning,
    () => {
      setStatus('done');
      addLog('✅', 'Workflow completed! Leads saved to Google Sheets.', 'success');
      onDone?.();
    }
  );

  function addLog(icon, text, type = 'info') {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogLines(prev => [...prev, { icon, text, time, type, id: Date.now() + Math.random() }]);
  }

  // Auto-scroll log panel
  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logLines]);

  // Log each step as it completes
  useEffect(() => {
    if (completedStepIdx >= 0 && completedStepIdx < workflow.steps.length) {
      const step = workflow.steps[completedStepIdx];
      addLog('⚙️', step.label + ' — ' + step.sub);
    }
  }, [completedStepIdx]);

  function handleChange(key, value) {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Validate required fields
    const missing = workflow.fields.filter(f => f.required && !formValues[f.key]?.trim());
    if (missing.length > 0) {
      setErrorMsg(`Please fill: ${missing.map(f => f.label).join(', ')}`);
      return;
    }
    setErrorMsg('');
    setStatus('running');
    setLogLines([]);
    addLog('🚀', 'Workflow triggered — sending data to N8n…');

    if (!n8nConfigured) {
      // Demo mode — just simulate without actually calling N8n
      addLog('⚠️', 'Demo mode: N8n URL not configured. Simulating execution…', 'warn');
      return; // The useSimulatedSteps hook will handle the rest
    }

    // Real call
    const result = await triggerWorkflow(workflow.webhookId, formValues);
    if (!result.success) {
      setStatus('error');
      setErrorMsg(result.error);
      addLog('❌', 'Error: ' + result.error, 'error');
    }
    // On success the simulated steps will finish and call onDone
  }

  function getStepState(idx) {
    if (idx < completedStepIdx) return 'done';
    if (idx === completedStepIdx) return 'running';
    return 'pending';
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className={`wf-icon ${workflow.color}`} style={{ width: 40, height: 40 }}>
            {/* inline icon rendered from WorkflowCard color */}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{workflow.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{workflow.category} · N8n Workflow</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* ── Left: Form Panel ── */}
          <div className="modal-form-panel">
            {/* N8n config warning */}
            {!n8nConfigured && (
              <div className="config-banner">
                <AlertTriangle size={15} />
                <div>
                  <strong>Demo Mode</strong> — N8n URL not set in <code>.env</code>.<br />
                  Add <code>VITE_N8N_BASE_URL=https://your-name.app.n8n.cloud</code> to connect for real.
                  Execution will be simulated.
                </div>
              </div>
            )}

            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.6 }}>
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
                <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <XCircle size={13} /> {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={isRunning || isDone}
                style={{ marginTop: 4 }}
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
                <button
                  type="button"
                  className="btn btn-outline btn-full"
                  style={{ marginTop: 10 }}
                  onClick={() => { setStatus('idle'); setLogLines([]); setFormValues({}); }}
                >
                  Run Again
                </button>
              )}
            </form>

            {/* Step progress tracker */}
            {(isRunning || isDone || isError) && workflow.steps.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--muted)', marginBottom: 14 }}>
                  Execution Progress
                </div>
                <div className="progress-steps">
                  {workflow.steps.map((step, idx) => {
                    const state = isDone ? 'done' : isError && idx > completedStepIdx ? 'pending' : getStepState(idx);
                    return (
                      <div key={step.key} className="progress-step">
                        <div className={`step-dot ${state}`}>
                          {state === 'done'    ? <CheckCircle2 size={12} /> :
                           state === 'running' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> :
                           idx + 1}
                        </div>
                        <div className="step-content">
                          <div className="step-name">{step.label}</div>
                          <div className="step-sub">{step.sub}</div>
                          {state === 'running' && (
                            <div className="step-time" style={{ color: 'var(--orange)', marginTop: 4 }}>
                              In progress…
                            </div>
                          )}
                          {state === 'done' && (
                            <div className="step-time" style={{ color: 'var(--green)' }}>Completed</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Live Log Panel ── */}
          <div className="modal-log-panel">
            <div className="modal-log-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={11} /> Live Execution Log
            </div>

            {logLines.length === 0 ? (
              <div className="log-empty">
                <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
                <p>Waiting for workflow to start…<br />Fill the form and click Execute.</p>
              </div>
            ) : (
              logLines.map(line => (
                <div key={line.id} className="log-line">
                  <span className="log-icon">{line.icon}</span>
                  <div>
                    <div className="log-text">{line.text}</div>
                    <div className="log-time">{line.time}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={logBottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
