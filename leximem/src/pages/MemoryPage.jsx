import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import {
  getAllPrecedents, approvePrecedent, rejectPrecedent, getMemoryStats, resetMemoryStore
} from '../memory/memoryStore';
import { Database, Search, Filter, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

export function MemoryPage() {
  const { showToast, refreshStats } = useApp();
  const [precedents, setPrecedents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadPrecedents(); }, []);

  function loadPrecedents() {
    setPrecedents(getAllPrecedents());
  }

  function handleApprove(id) {
    const name = prompt('Enter your name to approve this precedent:');
    if (!name) return;
    approvePrecedent(id, name);
    loadPrecedents();
    refreshStats();
    showToast('Precedent approved and added to active memory.', 'success');
  }

  function handleReject(id) {
    rejectPrecedent(id, 'Manual rejection from Memory page');
    loadPrecedents();
    refreshStats();
    showToast('Precedent marked as rejected.', 'info');
  }

  function handleReset() {
    if (!confirm('Reset ALL memory to initial synthetic data? This cannot be undone.')) return;
    resetMemoryStore();
    loadPrecedents();
    refreshStats();
    showToast('Memory reset to initial knowledge base.', 'info');
  }

  const clauseTypes = ['ALL', ...new Set(precedents.map(p => p.clauseType))];

  const filtered = precedents.filter(p => {
    const matchSearch = !search || (
      p.counterparty.toLowerCase().includes(search.toLowerCase()) ||
      p.clauseTitle.toLowerCase().includes(search.toLowerCase()) ||
      p.contractType.toLowerCase().includes(search.toLowerCase()) ||
      (p.originalClause || '').toLowerCase().includes(search.toLowerCase())
    );
    const matchOutcome = filterOutcome === 'ALL' || p.outcome === filterOutcome;
    const matchType = filterType === 'ALL' || p.clauseType === filterType;
    return matchSearch && matchOutcome && matchType;
  });

  const stats = getMemoryStats();

  return (
    <div>
      <div className="page-header">
        <span className="page-header-title">🗂️ Precedent Memory</span>
        <span className="page-header-subtitle">Persistent legal negotiation intelligence store</span>
      </div>
      <div className="page-body">

        {/* Stats Row */}
        <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Records', value: stats.totalPrecedents, color: 'var(--brand-primary)', icon: Database },
            { label: 'Approved', value: stats.approvedPrecedents, color: 'var(--approved)', icon: CheckCircle },
            { label: 'Rejected', value: stats.rejectedPrecedents, color: 'var(--rejected)', icon: XCircle },
            { label: 'Pending', value: stats.pendingPrecedents, color: 'var(--pending)', icon: Clock },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: `${s.color}18`, color: s.color }}>
                  <Icon size={18} />
                </div>
                <div className="stat-info">
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{
              position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input type="text" placeholder="Search counterparty, clause, contract type..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem' }} />
          </div>

          <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.9rem', fontFamily: 'inherit', cursor: 'pointer',
          }}>
            <option value="ALL">All Outcomes</option>
            <option value="APPROVED">✅ Approved</option>
            <option value="REJECTED">❌ Rejected</option>
            <option value="PENDING">⏳ Pending</option>
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.9rem', fontFamily: 'inherit', cursor: 'pointer',
          }}>
            {clauseTypes.map(t => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Clause Types' : t}</option>
            ))}
          </select>

          <button className="btn btn-secondary btn-sm" onClick={loadPrecedents}>
            <RefreshCw size={13} /> Refresh
          </button>

          <button className="btn btn-danger btn-sm" onClick={handleReset}>
            Reset Memory
          </button>
        </div>

        <div className="synthetic-banner" style={{ marginBottom: '1rem' }}>
          🧪 Initial records ({stats.totalPrecedents - stats.totalContracts} of {stats.totalPrecedents}) are <strong>synthetic demonstration data</strong> for testing. 
          Approved analysis outcomes will appear here with real labels.
        </div>

        {/* Precedent Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span className="card-title"><Database size={15} /> Memory Store</span>
            <span className="section-count">{filtered.length} records</span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No Records Found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div>
              {filtered.map(prec => (
                <div key={prec.id} style={{
                  borderBottom: '1px solid var(--border)',
                  transition: 'background var(--transition)',
                }}>
                  {/* Row */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.9rem 1.25rem', cursor: 'pointer',
                    }}
                    onClick={() => setExpanded(expanded === prec.id ? null : prec.id)}
                  >
                    <span className={`outcome-badge ${prec.outcome?.toLowerCase()}`}>{prec.outcome}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {prec.clauseTitle}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {prec.counterparty} · {prec.contractType} · {prec.contractDate}
                        {prec.synthetic && ' · 🧪 Synthetic'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)',
                      padding: '0.15rem 0.5rem', borderRadius: 10, flexShrink: 0,
                    }}>{prec.clauseType}</span>
                  </div>

                  {/* Expanded Detail */}
                  {expanded === prec.id && (
                    <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="diff-block">
                        <div className="diff-label original">Original</div>
                        <div className="diff-content">{prec.originalClause}</div>
                      </div>
                      <div className="diff-block">
                        <div className="diff-label proposed">Negotiated / Proposed</div>
                        <div className="diff-content">{prec.proposedClause}</div>
                      </div>
                      {prec.negotiationNotes && (
                        <div style={{
                          background: 'rgba(79,142,245,0.05)', borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(79,142,245,0.15)', padding: '0.75rem 1rem',
                          fontSize: '0.78rem', color: 'var(--text-secondary)',
                        }}>
                          <strong style={{ color: 'var(--brand-primary)' }}>Negotiation Notes:</strong>{' '}
                          {prec.negotiationNotes}
                        </div>
                      )}
                      {prec.approvedBy && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Approved by: <strong style={{ color: 'var(--approved)' }}>{prec.approvedBy}</strong>
                          {prec.approvedDate && ` on ${prec.approvedDate}`}
                        </div>
                      )}
                      {prec.outcome === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleApprove(prec.id)}>
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleReject(prec.id)}>
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      )}
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Source: {prec.source}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Persistence Note */}
        <div style={{
          marginTop: '1.5rem', background: 'rgba(79,142,245,0.05)',
          border: '1px solid rgba(79,142,245,0.15)', borderRadius: 'var(--radius-sm)',
          padding: '1rem 1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)',
        }}>
          <div style={{ fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.4rem' }}>
            🧠 Persistence: localStorage
          </div>
          Memory is stored in your browser's localStorage and persists across page refreshes and new sessions 
          on this device. Storage used: <strong style={{ color: 'var(--text-primary)' }}>{stats.storageUsed}</strong>.
          Memory survives page reload (simulating long-term storage) but would require a backend database 
          (e.g., PostgreSQL + pgvector) for true multi-user enterprise persistence.
        </div>
      </div>
    </div>
  );
}
