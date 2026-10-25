import { useState } from 'react';
import { OverviewDashboard } from './components/OverviewDashboard';
import { PlanSetupForm } from './components/PlanSetupForm';
import { StudyPlanView } from './components/StudyPlanView';
import { StudyPlanProvider, useStudyPlan } from './context/StudyPlanProvider';
import { SubjectsView } from './components/SubjectsView';
import { ProgressInsights } from './components/ProgressInsights';
import { SettingsView } from './components/SettingsView';
import { EmptyState } from './components/EmptyState';

type View = 'overview' | 'plan' | 'subjects' | 'insights' | 'settings';

const navigation: { id: View; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◫' },
  { id: 'plan', label: 'My Study Plan', icon: '▦' },
  { id: 'subjects', label: 'Subjects', icon: '▤' },
  { id: 'insights', label: 'Progress & Insights', icon: '◌' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  return <StudyPlanProvider><DashboardApp /></StudyPlanProvider>;
}

function DashboardApp() {
  const { plan, savePlan, storageMessage, clearStorageMessage } = useStudyPlan();
  const [view, setView] = useState<View>('overview');
  const [showSetup, setShowSetup] = useState(false);

  return (
    <div className="app-root">
      <div className="ambient ambient-a" /><div className="ambient ambient-b" />
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); setView('overview'); setShowSetup(false); }} aria-label="StudyPilot AI overview">
          <span className="brand-mark"><span>✦</span></span><span className="brand-copy"><strong>study<span>pilot</span></strong><small>YOUR STUDY SPACE</small></span>
        </a>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">{navigation.map((item) => {
          const available = true;
          const active = view === item.id && !showSetup;
          return <button className={`nav-item ${active ? 'active' : ''}`} key={item.id} type="button" aria-label={item.label} aria-current={active ? 'page' : undefined} onClick={() => {
            setShowSetup(false);
            setView(item.id);
          }}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.id === 'plan' && plan && <span className="nav-count">{plan.sessions.filter((session) => session.status === 'planned').length}</span>}{!available && <span className="nav-soon">SOON</span>}</button>;
        })}</nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><span className="tip-sparkle">✦</span><strong>Small steps add up.</strong><p>Your study plan will meet you where you are.</p></div>
        <div className="sidebar-footer"><span className="avatar">S</span><div><strong>Student workspace</strong><small>Saved on this device</small></div><span className="online-indicator" title="Local workspace" /></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><span>✦</span></span><strong>study<span>pilot</span></strong></div><div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>{showSetup ? 'Create a plan' : navigation.find((item) => item.id === view)?.label}</strong></div><div className="topbar-right"><span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="topbar-avatar" aria-label="Student workspace">S</span></div></header>
        {storageMessage && <div className="storage-banner" role="alert"><span>{storageMessage}</span><button type="button" aria-label="Dismiss storage warning" onClick={clearStorageMessage}>×</button></div>}
        {showSetup ? <PlanSetupForm onCancel={() => setShowSetup(false)} onGenerated={(newPlan) => {
          if (plan && !window.confirm('You already have a saved study plan. Generating this plan will replace it. Continue?')) return;
          savePlan(newPlan);
          setShowSetup(false);
          setView('plan');
        }} /> : view === 'overview' ? <OverviewDashboard plan={plan} onCreatePlan={() => setShowSetup(true)} onOpenPlan={() => { setShowSetup(false); setView(plan ? 'plan' : 'overview'); if (!plan) setShowSetup(true); }} /> : view === 'plan' ? plan ? <StudyPlanView plan={plan} onBack={() => setView('overview')} /> : <div className="dashboard-content"><EmptyState eyebrow="MY STUDY PLAN" title="Create your first timetable" description="Add your subjects and exam dates to see a realistic schedule here." actionLabel="Create My Study Plan" onAction={() => setShowSetup(true)} /></div> : view === 'subjects' ? <SubjectsView plan={plan} onCreatePlan={() => setShowSetup(true)} /> : view === 'insights' ? <ProgressInsights plan={plan} onCreatePlan={() => setShowSetup(true)} /> : <SettingsView plan={plan} onCreatePlan={() => setShowSetup(true)} onSavePlan={savePlan} />}
        <footer className="app-footer"><span>Made for the goals you're working toward.</span><span>Deterministic planning · Privacy-first, on this device</span></footer>
      </main>
    </div>
  );
}
