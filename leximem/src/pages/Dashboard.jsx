import React from 'react';
import { useApp } from '../App';
import { getMemoryStats, getAllContracts } from '../memory/memoryStore';
import { RISK_LEVELS } from '../data/corporatePlaybook';
import {
  FileText, Database, CheckCircle, AlertTriangle, TrendingUp,
  Clock, Upload, ChevronRight, Shield, Zap
} from 'lucide-react';

export function Dashboard() {
  const { navigate, memoryStats } = useApp();
  const stats = memoryStats || getMemoryStats();
  const contracts = getAllContracts().slice(0, 5);

  const statCards = [
    {
      icon: Database, label: 'Total Precedents', value: stats.totalPrecedents,
      color: '#4f8ef5', bg: 'rgba(79,142,245,0.1)',
    },
    {
      icon: CheckCircle, label: 'Approved Outcomes', value: stats.approvedPrecedents,
      color: '#2ed573', bg: 'rgba(46,213,115,0.1)',
    },
    {
      icon: FileText, label: 'Contracts Analyzed', value: stats.totalContracts,
      color: '#7c5cfc', bg: 'rgba(124,92,252,0.1)',
    },
    {
      icon: Shield, label: 'Counterparties', value: stats.counterparties,
      color: '#ffa502', bg: 'rgba(255,165,2,0.1)',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <span className="page-header-title">🏠 Dashboard</span>
        <span className="page-header-subtitle">Legal Negotiation Intelligence · LexiMem AI</span>
      </div>
      <div className="page-body">

        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(79,142,245,0.12) 0%, rgba(124,92,252,0.12) 100%)',
          border: '1px solid rgba(79,142,245,0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 2.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4f8ef5 0%, #7c5cfc 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(79,142,245,0.4)',
              }}>
                <Zap size={22} color="white" />
              </div>
              <div>
                <h1 style={{ color: 'var(--text-primary)', fontSize: '1.4rem' }}>LexiMem AI Agent</h1>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  Persistent Legal Contract Lifecycle &amp; Precedent Memory
                </p>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 480, margin: 0 }}>
              Upload a contract to begin autonomous analysis. LexiMem will identify risks, 
              retrieve historical precedents, and generate AI-assisted redline recommendations 
              based on your corporate legal playbook.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('upload')} style={{ gap: '0.5rem' }}>
            <Upload size={16} />
            Analyze a Contract
          </button>
        </div>

        {/* AI Disclaimer */}
        <div className="ai-disclaimer" style={{ marginBottom: '1.5rem' }}>
          <Shield size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>AI-Assisted Legal Analysis — Not Legal Advice.</strong> LexiMem provides 
            AI-generated analysis for review purposes only. All recommendations must be reviewed 
            by qualified legal counsel before execution. Never automatically approve AI-generated redlines.
          </span>
        </div>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="stat-card">
                <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                  <Icon size={20} />
                </div>
                <div className="stat-info">
                  <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid-2">
          {/* Recent Contracts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><FileText size={16} /> Recent Contracts</span>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('memory')}>
                View All
              </button>
            </div>
            {contracts.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">📄</div>
                <h3>No Contracts Yet</h3>
                <p>Upload your first contract to begin analysis.</p>
                <button className="btn btn-primary" style={{ margin: '1rem auto 0', display: 'flex' }}
                  onClick={() => navigate('upload')}>
                  <Upload size={14} /> Upload Contract
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contracts.map(c => {
                  const level = c.riskLevel ? c.riskLevel.toLowerCase() : 'low';
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-elevated)', cursor: 'pointer',
                      transition: 'background var(--transition)',
                    }}
                      onClick={() => navigate('analysis')}
                    >
                      <FileText size={15} color="var(--text-muted)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{c.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {c.counterparty || 'Unknown'} · {new Date(c.analyzedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`risk-badge ${level}`}>{c.riskLevel || 'Low'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Memory Health */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Database size={16} /> Memory Health</span>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('memory')}>
                Browse Memory
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <MemoryHealthRow label="Total Precedents" value={stats.totalPrecedents} max={50} color="#4f8ef5" />
              <MemoryHealthRow label="Approved Outcomes" value={stats.approvedPrecedents} max={stats.totalPrecedents || 1} color="#2ed573" />
              <MemoryHealthRow label="Rejected Proposals" value={stats.rejectedPrecedents} max={stats.totalPrecedents || 1} color="#ff4757" />
              <MemoryHealthRow label="Pending Review" value={stats.pendingPrecedents} max={stats.totalPrecedents || 1} color="#ffa502" />
            </div>

            <div className="divider" />

            <div className="synthetic-banner">
              🧪 Knowledge base includes {stats.totalPrecedents} records ({stats.approvedPrecedents} approved, {stats.rejectedPrecedents} rejected, {stats.pendingPrecedents} pending).
              Initial records are <strong>synthetic demonstration data</strong>.
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title"><TrendingUp size={16} /> Quick Start</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {[
              { icon: '📄', title: 'Demo Contract 1', desc: 'Acme Technologies — Unlimited Liability', page: 'upload', action: 'demo1' },
              { icon: '🔄', title: 'Demo Contract 2', desc: 'Acme Technologies — Memory Test', page: 'upload', action: 'demo2' },
              { icon: '🗂️', title: 'Browse Precedents', desc: 'View historical negotiation memory', page: 'memory', action: null },
              { icon: '📋', title: 'Legal Playbook', desc: 'View corporate policy positions', page: 'playbook', action: null },
            ].map(item => (
              <button key={item.title} className="btn btn-secondary" style={{
                flexDirection: 'column', alignItems: 'flex-start', gap: '0.3rem',
                padding: '1rem', textAlign: 'left', height: 'auto',
              }}
                onClick={() => navigate(item.page, item.action ? { demoMode: item.action } : null)}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span style={{ fontWeight: 600 }}>{item.title}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function MemoryHealthRow({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: 140, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.78rem', color, fontWeight: 700, width: 20, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
