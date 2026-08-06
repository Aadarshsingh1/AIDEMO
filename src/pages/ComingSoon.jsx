import { Lock, Rocket } from 'lucide-react';

export default function ComingSoonPage({ title, subtitle, icon }) {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Rocket size={32} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          {title || 'Coming Soon'}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>
          {subtitle || 'This workflow is being set up. Go to the Dashboard to run the Google Maps workflow for now.'}
        </p>
        <div style={{
          marginTop: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 11, color: 'var(--muted)',
        }}>
          <Lock size={11} /> Locked — coming in the next sprint
        </div>
      </div>
    </div>
  );
}
