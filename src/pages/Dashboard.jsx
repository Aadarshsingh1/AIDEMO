import { getWorkflows } from '../data/workflows';
import WorkflowCard  from '../components/WorkflowCard';

const N8N_CONFIGURED = !!(import.meta.env.VITE_N8N_BASE_URL);

// Animated floating orb decoration
function Orb({ style }) {
  return <div style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(60px)', ...style }} />;
}

export default function Dashboard({ onRunWorkflow }) {
  const workflows = getWorkflows();

  function handleRun(workflow) {
    if (workflow.comingSoon) return;
    onRunWorkflow?.(workflow);
  }

  const activeCount = workflows.filter(w => !w.comingSoon).length;


  return (
    <div className="page dashboard-page" style={{ padding: 0 }}>

      {/* ── Hero Banner ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)',
        padding: '24px 32px 28px',
        color: '#fff',
      }}>
        {/* Decorative orbs */}
        <Orb style={{ width: 320, height: 320, background: 'rgba(99,102,241,0.35)', top: -80, right: -60 }} />
        <Orb style={{ width: 200, height: 200, background: 'rgba(37,99,235,0.4)', bottom: -60, left: 30 }} />
        <Orb style={{ width: 160, height: 160, background: 'rgba(139,92,246,0.3)', top: 20, right: 280 }} />

        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 700 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(99,102,241,0.4)',
            borderRadius: 99, padding: '4px 12px',
            fontSize: 11.5, fontWeight: 600,
            color: '#a5b4fc',
            marginBottom: 10,
            backdropFilter: 'blur(4px)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#818cf8',
              boxShadow: '0 0 8px #818cf8',
              animation: 'pulse-glow 2s infinite',
            }} />
            N8n Automation Platform
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 28, fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: 0,
            background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Welcome to TREOS
          </h1>


        </div>
      </div>

      {/* ── Workflow Grid ── */}
      <div style={{ padding: '20px 32px 24px' }}>
        <div className="section-header" style={{ marginBottom: 14 }}>
          <div>
            <div className="section-title">Automation Workflows</div>
            <div className="section-subtitle">Click any workflow card to open and run it</div>
          </div>
          {!N8N_CONFIGURED && (
            <span style={{
              fontSize: 11, color: '#92400e',
              background: '#fef9c3', border: '1px solid #fde68a',
              padding: '4px 10px', borderRadius: 20, fontWeight: 600,
            }}>
              ⚠ Demo Mode — add N8n URL in .env
            </span>
          )}
        </div>

        <div className="workflow-grid">
          {workflows.map(wf => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              status="idle"
              onRun={handleRun}
            />
          ))}
        </div>
      </div>

      {/* pulse-glow keyframe */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px #818cf8; opacity: 1; }
          50%       { box-shadow: 0 0 16px #818cf8; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
