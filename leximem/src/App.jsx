import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeMemoryStore, getMemoryStats } from './memory/memoryStore';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { MemoryPage } from './pages/MemoryPage';
import { PlaybookPage } from './pages/PlaybookPage';
import {
  LayoutDashboard, Upload, FileSearch, Database, BookOpen, Scale, Bell
} from 'lucide-react';

// ─── App Context ──────────────────────────────────────────────────────────
export const AppContext = createContext(null);
export function useApp() { return useContext(AppContext); }

// ─── Toast System ─────────────────────────────────────────────────────────
let toastId = 0;

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  // Initialize memory store on first load
  useEffect(() => {
    initializeMemoryStore();
    refreshStats();
  }, []);

  function refreshStats() {
    const stats = getMemoryStats();
    setMemoryStats(stats);
    // Count pending redlines from recent analysis
  }

  function showToast(message, type = 'info', duration = 4000) {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }

  function navigate(newPage, data = null) {
    if (newPage === 'analysis' && data) {
      setAnalysisResult(data);
    }
    setPage(newPage);
  }

  const ctxValue = {
    navigate,
    showToast,
    analysisResult,
    setAnalysisResult,
    memoryStats,
    refreshStats,
    pendingApprovals,
    setPendingApprovals,
  };

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="app-shell">
        <Sidebar currentPage={page} onNavigate={setPage} pendingApprovals={pendingApprovals} />
        <div className="main-content">
          {page === 'dashboard'  && <Dashboard />}
          {page === 'upload'     && <UploadPage />}
          {page === 'analysis'   && <AnalysisPage />}
          {page === 'memory'     && <MemoryPage />}
          {page === 'playbook'   && <PlaybookPage />}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span style={{ fontSize: '1rem' }}>
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

function Sidebar({ currentPage, onNavigate, pendingApprovals }) {
  const { memoryStats } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'upload',    label: 'Analyze Contract', icon: Upload },
    { id: 'analysis',  label: 'Analysis Report',  icon: FileSearch },
    { id: 'memory',    label: 'Precedent Memory', icon: Database,  badge: pendingApprovals || null },
    { id: 'playbook',  label: 'Legal Playbook',   icon: BookOpen },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Scale size={18} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">LexiMem</span>
          <span className="sidebar-logo-tagline">Legal AI Agent</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="nav-label">Navigation</span>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="nav-icon" size={18} />
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </button>
          );
        })}
      </nav>

      {/* Footer — Memory Status */}
      <div className="sidebar-footer">
        <div className="sidebar-memory-status">
          <div className="memory-dot" />
          <span>
            Memory: {memoryStats?.totalPrecedents || 0} precedents · {memoryStats?.totalContracts || 0} contracts
          </span>
        </div>
      </div>
    </aside>
  );
}
