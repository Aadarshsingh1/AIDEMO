import {
  LayoutDashboard, Settings, ChevronRight, Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      {/* Logo Header */}
      <div style={{
        padding: '18px 20px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 10,
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: '#ffffff',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          flexShrink: 0,
        }}>
          <img
            src="https://truimages.blob.core.windows.net/projectstatus/Document/Marketing/6b576dc5-4fdb-4091-a7b5-454685b442dchdimage.png"
            alt="TREOS Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
        <div>
          <div style={{
            fontSize: 17,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.3px',
            lineHeight: 1.1,
          }}>
            TREOS
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.45)',
            fontWeight: 500,
            marginTop: 3,
            letterSpacing: '0.2px',
          }}>
            Automation Hub
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-nav-item${activePage === id ? ' active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={16} />
            {label}
            {activePage === id && <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
          </button>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 12 }}>System</div>
        <button
          className={`sidebar-nav-item${activePage === 'settings' ? ' active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <Settings size={16} />
          Settings
          {activePage === 'settings' && <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}>
          <Zap size={13} color="#f59e0b" />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', lineHeight: 1.4 }}>
            Powered by N8n Cloud<br />
            <span style={{ color: 'rgba(255,255,255,.2)' }}>Free Trial</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
