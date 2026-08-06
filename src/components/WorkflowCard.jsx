import {
  MapPin, BrainCircuit, Share2, Globe, MessageSquare,
  Play, Clock, CheckCircle, XCircle, Loader2, Lock,
} from 'lucide-react';

const ICON_MAP = {
  MapPin, BrainCircuit, Share2, Globe, MessageSquare,
};

const STATUS_CONFIG = {
  idle:    { label: 'Idle',    cls: 'idle' },
  running: { label: 'Running', cls: 'running' },
  done:    { label: 'Done',    cls: 'done' },
  error:   { label: 'Error',   cls: 'error' },
};

export default function WorkflowCard({ workflow, status = 'idle', lastRun, onRun }) {
  const Icon = ICON_MAP[workflow.icon] || Globe;
  const st   = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const isRunning = status === 'running';
  const isLocked  = workflow.comingSoon;

  return (
    <div
      className={`workflow-card color-${workflow.color}`}
      onClick={() => !isLocked && !isRunning && onRun(workflow)}
      style={{ cursor: isLocked ? 'default' : 'pointer' }}
    >
      {/* Card Header */}
      <div className="wf-card-header">
        <div className={`wf-icon ${workflow.color}`}>
          {workflow.iconImg
            ? <img src={workflow.iconImg} alt={workflow.name} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />
            : <Icon size={22} />}
        </div>

        <div className="wf-info">
          <div className="wf-name">{workflow.name}</div>
          <div className="wf-category">{workflow.category}</div>
        </div>

        {/* Status badge */}
        {isLocked ? (
          <span className="wf-status-badge idle" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={9} /> Soon
          </span>
        ) : (
          <span className={`wf-status-badge ${st.cls}`}>
            {isRunning && <span className="pulse-dot" style={{ marginRight: 5 }} />}
            {st.label}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="wf-desc">{workflow.description}</p>

      {/* Card footer */}
      <div className="wf-card-meta">
        <div className="wf-meta-stat">
          {status === 'done' ? (
            <><CheckCircle size={12} color="var(--green)" /> Last run done</>
          ) : status === 'error' ? (
            <><XCircle size={12} color="var(--red)" /> Last run failed</>
          ) : status === 'running' ? (
            <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} color="var(--orange)" /> Running now…</>
          ) : lastRun ? (
            <><Clock size={12} /> {lastRun}</>
          ) : (
            <><Clock size={12} /> Never run</>
          )}
        </div>

        {!isLocked && (
          <button
            className={`wf-run-btn btn ${isRunning ? 'running' : ''}`}
            onClick={e => { e.stopPropagation(); if (!isRunning) onRun(workflow); }}
            disabled={isRunning}
          >
            {isRunning
              ? <><span className="spinner" /> Running</>
              : <><Play size={12} /> Run</>}
          </button>
        )}

        {isLocked && (
          <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Coming soon</span>
        )}
      </div>
    </div>
  );
}
