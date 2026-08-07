import { useState, useCallback, useMemo } from 'react';
import Sidebar             from './components/Sidebar';
import Topbar              from './components/Topbar';
import Dashboard           from './pages/Dashboard';
import ComingSoon          from './pages/ComingSoon';
import SettingsPage        from './pages/SettingsPage';
import RagChatPage         from './pages/RagChatPage';
import WorkflowDetailPage  from './components/WorkflowDetailPage';
import NoActionPlanPage    from './components/NoActionPlanPage';
import LeadQualificationPage from './components/LeadQualificationPage';
import { getConfig, CONFIG_KEYS } from './services/configService';
import { getWorkflows } from './data/workflows';

const PAGE_META = {
  dashboard:            { title: '',                      subtitle: '' },
  ai:                   { title: 'AI Lead Generator',     subtitle: 'Cordiso B2B lead generation powered by AI' },
  social:               { title: 'Social Media Leads',    subtitle: 'Leads scraped from Reddit, Instagram & more' },
  rag:                  { title: 'RAG Chat',              subtitle: 'Chat with your document knowledge base' },
  'no-action-plan':     { title: 'No Action Plan Leads',  subtitle: 'AI identifies CRM leads at risk with no future action' },
  'lead-qualification': { title: 'Lead Qualification',    subtitle: 'AI qualifies intent, budget, fit & readiness from Google Sheet' },
  settings:             { title: 'Settings',              subtitle: 'Configure N8n account, webhooks, and Google Sheet URLs' },
};

export default function App() {
  const [activePage,     setActivePage]     = useState('dashboard');
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [configRev,      setConfigRev]      = useState(0);

  const n8nConfigured = !!(getConfig(CONFIG_KEYS.N8N_BASE_URL));

  const noActionWorkflow = useMemo(
    () => activeWorkflow?.id === 'no-action-plan'
      ? activeWorkflow
      : getWorkflows().find(w => w.id === 'no-action-plan'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeWorkflow, configRev]
  );

  const leadQualificationWorkflow = useMemo(
    () => activeWorkflow?.id === 'lead-qualification'
      ? activeWorkflow
      : getWorkflows().find(w => w.id === 'lead-qualification'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeWorkflow, configRev]
  );

  // Called when user clicks Run on a workflow card
  function handleRunWorkflow(workflow) {
    if (workflow.type === 'rag') { setActivePage('rag'); return; }
    if (workflow.type === 'no-action-plan') {
      setActiveWorkflow(workflow);
      setActivePage('no-action-plan');
      return;
    }
    if (workflow.type === 'lead-qualification') {
      setActiveWorkflow(workflow);
      setActivePage('lead-qualification');
      return;
    }
    setActiveWorkflow(workflow);
  }

  // Back from any detail page → go back to dashboard
  function handleBackToDashboard() {
    setActiveWorkflow(null);
    setActivePage('dashboard');
  }

  // Called by SettingsPage after saving
  const handleConfigSaved = useCallback(() => {
    setConfigRev(r => r + 1);
    setActiveWorkflow(null);
  }, []);

  // Sidebar navigation
  function handleNavigate(id) {
    if (id !== 'no-action-plan' && id !== 'lead-qualification') setActiveWorkflow(null);
    setActivePage(id);
  }

  // If a generic workflow detail page is open, render it full-screen
  if (activeWorkflow && activePage !== 'no-action-plan' && activePage !== 'lead-qualification') {
    return (
      <div className="app-layout">
        <Sidebar activePage={activePage} onNavigate={(id) => { setActiveWorkflow(null); setActivePage(id); }} />
        <div className="main-content">
          <WorkflowDetailPage
            workflow={activeWorkflow}
            n8nConfigured={n8nConfigured}
            onBack={handleBackToDashboard}
            onDone={() => {}}
          />
        </div>
      </div>
    );
  }

  const meta = PAGE_META[activePage] || PAGE_META.dashboard;

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <div className="main-content">
        <Topbar title={meta.title} subtitle={meta.subtitle} />

        {activePage === 'dashboard' && (
          <Dashboard key={configRev} onRunWorkflow={handleRunWorkflow} />
        )}
        {activePage === 'ai' && (
          <ComingSoon
            title="AI Lead Generator"
            subtitle="The Cordiso AI Lead Generator workflow (CRM, HRMS, ERP) is being wired up. Come back soon!"
          />
        )}
        {activePage === 'social' && (
          <ComingSoon
            title="Social Media Leads"
            subtitle="Reddit, LinkedIn, Instagram scrapers are being connected. The Google Maps workflow is fully live!"
          />
        )}
        {activePage === 'rag' && <RagChatPage onBack={handleBackToDashboard} />}

        {/* No Action Plan — always renders from catalog, never blank */}
        {activePage === 'no-action-plan' && noActionWorkflow && (
          <NoActionPlanPage
            key={configRev}
            workflow={noActionWorkflow}
            n8nConfigured={n8nConfigured}
            onBack={handleBackToDashboard}
          />
        )}

        {/* Lead Qualification */}
        {activePage === 'lead-qualification' && leadQualificationWorkflow && (
          <LeadQualificationPage
            key={configRev}
            workflow={leadQualificationWorkflow}
            n8nConfigured={n8nConfigured}
            onBack={handleBackToDashboard}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage onConfigSaved={handleConfigSaved} />
        )}
      </div>
    </div>
  );
}
