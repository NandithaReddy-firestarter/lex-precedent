import React, { useState } from 'react';
import { useApp } from '../App';
import {
  savePrecedent, approvePrecedent, rejectPrecedent, updatePrecedentClause, generateId
} from '../memory/memoryStore';
import { CORPORATE_PLAYBOOK, getRiskLevel } from '../data/corporatePlaybook';
import {
  FileText, AlertTriangle, Shield, Clock, Database, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Edit3, Save, AlertCircle, TrendingUp, ExternalLink
} from 'lucide-react';

export function AnalysisPage() {
  const { analysisResult, navigate, showToast, refreshStats } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [redlineStates, setRedlineStates] = useState({});
  const [expandedClause, setExpandedClause] = useState(null);
  const [editingRedline, setEditingRedline] = useState(null);
  const [editText, setEditText] = useState('');
  const [approverName, setApproverName] = useState('');

  if (!analysisResult) {
    return (
      <div>
        <div className="page-header">
          <span className="page-header-title">📊 Analysis Report</span>
        </div>
        <div className="page-body">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No Analysis Available</h3>
            <p>Upload a contract to generate an analysis report.</p>
            <button className="btn btn-primary" style={{ margin: '1rem auto 0', display: 'flex' }}
              onClick={() => navigate('upload')}>
              Upload a Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overview, risk, precedents, redlines, finalRecommendations, clauses } = analysisResult;

  function approveRedline(redline) {
    if (!approverName.trim()) {
      showToast('Please enter your name before approving.', 'error');
      return;
    }
    // Find the original clause
    const clause = clauses.find(c => c.id === redline.clauseId);
    // Save to persistent memory as an approved precedent
    const newPrecedent = {
      id: generateId('prec'),
      synthetic: false,
      counterparty: overview.counterparty || 'Unknown Counterparty',
      contractType: overview.contractType,
      contractDate: new Date().toISOString().split('T')[0],
      clauseType: redline.clauseType,
      clauseTitle: redline.clauseTitle,
      originalClause: redline.originalText,
      proposedClause: redlineStates[redline.id]?.editedText || redline.proposedText,
      outcome: 'APPROVED',
      approvedBy: approverName,
      approvedDate: new Date().toISOString().split('T')[0],
      negotiationNotes: `Approved during analysis of ${overview.title} on ${new Date().toLocaleDateString()}. AI confidence: ${redline.confidence}%.`,
      riskScore: clause?.riskScore || 0,
      precedentRelevance: 'High — Directly approved from contract analysis',
      tags: [redline.clauseType, overview.counterparty?.toLowerCase() || 'unknown', 'approved'],
      source: `LexiMem Analysis — ${overview.fileName}`,
    };

    savePrecedent(newPrecedent);
    setRedlineStates(prev => ({ ...prev, [redline.id]: { ...prev[redline.id], status: 'APPROVED', approvedPrecedentId: newPrecedent.id } }));
    refreshStats();
    showToast(`✅ Revision approved and saved to Precedent Memory!`, 'success');
  }

  function rejectRedlineItem(redline) {
    setRedlineStates(prev => ({ ...prev, [redline.id]: { ...prev[redline.id], status: 'REJECTED' } }));
    showToast(`Revision rejected. Recorded as rejected proposal.`, 'info');
  }

  function startEdit(redline) {
    setEditingRedline(redline.id);
    setEditText(redlineStates[redline.id]?.editedText || redline.proposedText);
  }

  function saveEdit(redline) {
    setRedlineStates(prev => ({ ...prev, [redline.id]: { ...prev[redline.id], editedText: editText } }));
    setEditingRedline(null);
    showToast('Revision edited. Click Approve to save to memory.', 'info');
  }

  const tabs = [
    { id: 'overview',    label: 'A. Overview',    icon: FileText },
    { id: 'risk',        label: 'B. Risk Report',  icon: AlertTriangle },
    { id: 'precedents',  label: 'C. Precedents',   icon: Database },
    { id: 'redlines',    label: 'D. Redlines',     icon: Edit3,     count: redlines.length },
    { id: 'final',       label: 'E. Recommendations', icon: TrendingUp },
  ];

  return (
    <div>
      <div className="page-header">
        <span className="page-header-title">📊 Analysis Report</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
          <span style={{
            fontSize: '0.78rem', color: 'var(--text-muted)',
            background: 'var(--bg-elevated)', padding: '0.25rem 0.75rem',
            borderRadius: 20, border: '1px solid var(--border)',
          }}>
            {overview.fileName}
          </span>
          <span className={`risk-badge ${risk.overallLevel?.label?.toLowerCase() || 'low'}`}>
            Score: {risk.overallScore}/100
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* AI Disclaimer */}
        <div className="ai-disclaimer" style={{ marginBottom: '1.25rem' }}>
          <Shield size={14} style={{ flexShrink: 0 }} />
          <span>
            <strong>AI-Generated Analysis — Not Legal Advice.</strong> All recommendations require 
            qualified legal counsel review. Never automatically approve AI-generated redlines. 
            Approvals are saved to persistent memory for future reference.
          </span>
        </div>

        {/* Approver Name */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0 }}>
            👤 Reviewing as:
          </span>
          <input
            type="text"
            placeholder="Enter your name to approve revisions..."
            value={approverName}
            onChange={e => setApproverName(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            (Required before approving any AI recommendation)
          </span>
        </div>

        {/* Tabs */}
        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <div className="tabs" style={{ width: 'fit-content' }}>
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}>
                  <Icon size={13} />
                  {t.label}
                  {t.count ? <span style={{
                    background: activeTab === t.id ? 'rgba(255,255,255,0.3)' : 'var(--critical)',
                    color: 'white', fontSize: '0.65rem', fontWeight: 700,
                    padding: '1px 5px', borderRadius: 10,
                  }}>{t.count}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── A. Overview ──────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title"><FileText size={16} /> Contract Overview</span>
              </div>
              <div className="grid-2">
                <InfoRow label="Contract Title" value={overview.title} />
                <InfoRow label="Contract Type" value={overview.contractType} />
                <InfoRow label="Parties" value={(overview.parties || []).join(' · ') || 'Not identified'} />
                <InfoRow label="Counterparty" value={overview.counterparty || 'Not identified'} accent />
                <InfoRow label="Effective Date" value={overview.effectiveDate || 'Not specified'} />
                <InfoRow label="Expiration Date" value={overview.expirationDate || 'Not specified'} />
                <InfoRow label="File" value={`${overview.fileName} (${overview.fileSize})`} />
                <InfoRow label="Word Count" value={`${(overview.wordCount || 0).toLocaleString()} words`} />
              </div>
            </div>

            {/* Overview Risk Summary */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><AlertTriangle size={16} /> Quick Risk Summary</span>
              </div>
              <div className="risk-ring-container">
                <RiskRing score={risk.overallScore} level={risk.overallLevel} />
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span className={`risk-badge ${risk.overallLevel?.label?.toLowerCase() || 'low'}`}
                      style={{ fontSize: '0.9rem', padding: '0.3rem 0.9rem' }}>
                      {risk.overallLevel?.label || 'Low'} Risk
                    </span>
                  </div>
                  <div className="grid-2">
                    <StatMini label="Total Clauses" value={risk.totalClauses} />
                    <StatMini label="Risky Clauses" value={risk.riskyCount} color="var(--critical)" />
                    <StatMini label="Missing Clauses" value={(risk.missingClauses || []).length} color="var(--medium)" />
                    <StatMini label="Redlines Generated" value={redlines.length} color="var(--brand-primary)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── B. Risk Assessment ───────────────────────────────── */}
        {activeTab === 'risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Overall Score */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Overall Risk Score</span>
              </div>
              <div className="risk-ring-container">
                <RiskRing score={risk.overallScore} level={risk.overallLevel} />
                <div>
                  <h3 style={{ color: risk.overallLevel?.color || 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {risk.overallLevel?.label || 'Low'} Risk Contract
                  </h3>
                  <p style={{ fontSize: '0.85rem' }}>
                    {risk.riskyCount} of {risk.totalClauses} analyzed clauses have risk factors. 
                    {risk.riskyCount > 0 ? ' Review and negotiate all flagged clauses before execution.' : ' Contract appears generally aligned with corporate policy.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Risky Clauses */}
            {risk.riskyClauses && risk.riskyClauses.length > 0 && (
              <div>
                <div className="section-header">
                  <span className="section-title"><AlertTriangle size={15} /> Risky Clauses
                    <span className="section-count">{risk.riskyClauses.length}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {risk.riskyClauses.map(clause => (
                    <ClauseItem
                      key={clause.id}
                      clause={clause}
                      expanded={expandedClause === clause.id}
                      onToggle={() => setExpandedClause(expandedClause === clause.id ? null : clause.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Missing Clauses */}
            {risk.missingClauses && risk.missingClauses.length > 0 && (
              <div>
                <div className="section-header">
                  <span className="section-title">⚠️ Missing Clauses
                    <span className="section-count">{risk.missingClauses.length}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {risk.missingClauses.map((mc, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      padding: '0.75rem 1rem', background: 'var(--bg-surface)',
                      border: `1px solid ${mc.severity === 'Critical' ? 'var(--critical-border)' : 'var(--medium-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '0.1rem' }}>
                        {mc.severity === 'Critical' ? '🚨' : '⚠️'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {mc.name}
                          <span className={`risk-badge ${mc.severity === 'Critical' ? 'critical' : 'medium'}`}
                            style={{ marginLeft: '0.5rem' }}>{mc.severity}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{mc.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── C. Precedent Intelligence ────────────────────────── */}
        {activeTab === 'precedents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Counterparty History */}
            {precedents.counterpartyHistory && !precedents.counterpartyHistory.isNewCounterparty ? (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">🏢 Counterparty History — {overview.counterparty}</span>
                </div>
                <div className="grid-2">
                  <StatMini label="Total Engagements" value={precedents.counterpartyHistory.summary?.totalEngagements} />
                  <StatMini label="Approved Outcomes" value={precedents.counterpartyHistory.summary?.approvedCount} color="var(--approved)" />
                  <StatMini label="Rejected Proposals" value={precedents.counterpartyHistory.summary?.rejectedCount} color="var(--rejected)" />
                  <StatMini label="Pending Items" value={precedents.counterpartyHistory.summary?.pendingCount} color="var(--pending)" />
                </div>
                {precedents.counterpartyHistory.summary?.negotiationPattern && (
                  <div style={{
                    marginTop: '1rem', background: 'rgba(79,142,245,0.07)',
                    border: '1px solid rgba(79,142,245,0.15)', borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)',
                  }}>
                    <strong style={{ color: 'var(--brand-primary)' }}>Negotiation Pattern:</strong>{' '}
                    {precedents.counterpartyHistory.summary.negotiationPattern}
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">🆕 New Counterparty</span>
                </div>
                <p style={{ fontSize: '0.875rem' }}>
                  No historical precedents found for <strong>{overview.counterparty || 'this counterparty'}</strong>. 
                  Approvals from this analysis will be saved as new precedents for future reference.
                </p>
              </div>
            )}

            {/* Per-Clause Precedents */}
            {Object.entries(precedents.clausePrecedents).map(([clauseId, clausePrecedents]) => {
              if (!clausePrecedents || clausePrecedents.length === 0) return null;
              const clause = clauses.find(c => c.id === clauseId);
              return (
                <div key={clauseId}>
                  <div className="section-header">
                    <span className="section-title">
                      📂 Precedents for: {clause?.title || clauseId}
                      <span className="section-count">{clausePrecedents.length}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {clausePrecedents.map(prec => (
                      <PrecedentCard key={prec.id} precedent={prec} />
                    ))}
                  </div>
                </div>
              );
            })}

            {precedents.totalRetrieved === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No Historical Precedents Found</h3>
                <p>Approve redlines from this analysis to build your precedent memory base.</p>
              </div>
            )}
          </div>
        )}

        {/* ── D. Redlines ──────────────────────────────────────── */}
        {activeTab === 'redlines' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="ai-disclaimer">
              <Edit3 size={14} style={{ flexShrink: 0 }} />
              <span>
                <strong>Human Review Required.</strong> Review each AI-generated redline carefully.
                You may edit the proposed text before approving. Approved redlines are saved to persistent 
                memory and will influence future contract analyses. <strong>Enter your name above before approving.</strong>
              </span>
            </div>

            {redlines.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>No Redlines Generated</h3>
                <p>No significant policy deviations requiring revision were detected.</p>
              </div>
            ) : redlines.map(redline => {
              const state = redlineStates[redline.id] || {};
              const status = state.status || 'PENDING_REVIEW';
              const displayText = state.editedText || redline.proposedText;
              const clause = clauses.find(c => c.id === redline.clauseId);
              const riskLevel = clause?.riskLevel;

              return (
                <div key={redline.id} className="redline-card" style={{
                  borderColor: status === 'APPROVED' ? 'var(--low-border)'
                    : status === 'REJECTED' ? 'var(--critical-border)'
                    : riskLevel?.color ? `${riskLevel.color}40` : 'var(--border)',
                }}>
                  <div className="redline-header">
                    <span className="redline-title">{redline.clauseTitle}</span>
                    <span className={`risk-badge ${riskLevel?.label?.toLowerCase() || 'medium'}`}>
                      Score: {clause?.riskScore || 0}
                    </span>
                    <span className={`outcome-badge ${status.toLowerCase().replace('_review', '')}`}>
                      {status === 'PENDING_REVIEW' ? 'Pending Review' : status}
                    </span>
                  </div>

                  <div className="redline-body">
                    {/* Original */}
                    <div className="diff-block">
                      <div className="diff-label original">❌ Original Clause</div>
                      <div className="diff-content">{redline.originalText}</div>
                    </div>

                    {/* Proposed */}
                    <div className="diff-block">
                      <div className="diff-label proposed">✅ Proposed Revision</div>
                      {editingRedline === redline.id ? (
                        <div style={{ padding: '0.5rem' }}>
                          <textarea
                            rows={6}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="diff-content">{displayText}</div>
                      )}
                    </div>

                    {/* Supporting Precedent */}
                    {redline.supportingPrecedent && (
                      <div style={{
                        background: 'rgba(79,142,245,0.05)', border: '1px solid rgba(79,142,245,0.15)',
                        borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', fontSize: '0.78rem',
                      }}>
                        <div style={{ color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                          📚 Supporting Precedent — {redline.supportingPrecedent.relevanceScore}% relevance
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <strong>{redline.supportingPrecedent.counterparty}</strong> · {redline.supportingPrecedent.contractType}
                          {' '}({redline.supportingPrecedent.date}) ·{' '}
                          <span className={`outcome-badge ${redline.supportingPrecedent.outcome.toLowerCase()}`}>
                            {redline.supportingPrecedent.outcome}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <details style={{ cursor: 'pointer' }}>
                      <summary style={{ fontSize: '0.78rem', color: 'var(--text-muted)', userSelect: 'none', marginBottom: '0.5rem' }}>
                        📋 View Explanation & Policy Basis
                      </summary>
                      <div style={{
                        background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)',
                        lineHeight: 1.6, whiteSpace: 'pre-wrap',
                      }}>
                        {redline.explanation}
                      </div>
                    </details>
                  </div>

                  {/* Actions */}
                  {status === 'PENDING_REVIEW' && (
                    <div className="redline-actions">
                      {editingRedline === redline.id ? (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingRedline(null)}>
                            Cancel
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(redline)}>
                            <Save size={12} /> Save Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => approveRedline(redline)}>
                            <CheckCircle size={13} /> Approve & Save to Memory
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => rejectRedlineItem(redline)}>
                            <XCircle size={13} /> Reject
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(redline)}>
                            <Edit3 size={13} /> Edit
                          </button>
                        </>
                      )}
                      <div className="confidence-indicator">
                        <span>Confidence: {redline.confidence}%</span>
                        <div className="confidence-bar">
                          <div className="confidence-fill" style={{ width: `${redline.confidence}%` }} />
                        </div>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                          {redline.confidenceLabel}
                        </span>
                      </div>
                    </div>
                  )}

                  {status === 'APPROVED' && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1.25rem', background: 'var(--approved-bg)',
                      borderTop: '1px solid var(--low-border)', fontSize: '0.82rem', color: 'var(--approved)',
                    }}>
                      <CheckCircle size={14} />
                      <strong>Approved and saved to Precedent Memory</strong> — Will influence future analyses for {overview.counterparty}.
                    </div>
                  )}

                  {status === 'REJECTED' && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1.25rem', background: 'var(--rejected-bg)',
                      borderTop: '1px solid var(--critical-border)', fontSize: '0.82rem', color: 'var(--rejected)',
                    }}>
                      <XCircle size={14} />
                      Rejected — Recorded as rejected proposal.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── E. Final Recommendations ─────────────────────────── */}
        {activeTab === 'final' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Critical Priorities */}
            {finalRecommendations.criticalPriorities.length > 0 && (
              <div className="card" style={{ borderColor: 'var(--critical-border)' }}>
                <div className="card-header">
                  <span className="card-title" style={{ color: 'var(--critical)' }}>🚨 Critical Negotiation Priorities</span>
                </div>
                {finalRecommendations.criticalPriorities.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    padding: '0.75rem 0', borderBottom: i < finalRecommendations.criticalPriorities.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span className={`risk-badge critical`}>{p.priority}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{p.action}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommended Actions */}
            <div className="card">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={16} /> Recommended Actions</span>
                <span className="section-count">{finalRecommendations.recommendedActions.length}</span>
              </div>
              {finalRecommendations.recommendedActions.length > 0 ? (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
                  {finalRecommendations.recommendedActions.map((action, i) => (
                    <li key={i} style={{
                      display: 'flex', gap: '0.75rem', fontSize: '0.875rem',
                      color: 'var(--text-secondary)', padding: '0.5rem 0',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{i + 1}.</span>
                      {action}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.875rem' }}>No specific actions required at this time.</p>
              )}
            </div>

            {/* Legal Review */}
            <div className="card" style={{ background: 'rgba(79,142,245,0.04)', borderColor: 'rgba(79,142,245,0.2)' }}>
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--brand-primary)' }}>
                  <Shield size={16} /> Items Requiring Legal Review
                </span>
              </div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
                {finalRecommendations.legalReviewItems.map((item, i) => (
                  <li key={i} style={{
                    display: 'flex', gap: '0.5rem', fontSize: '0.875rem',
                    color: 'var(--text-secondary)', alignItems: 'flex-start',
                  }}>
                    <span style={{ color: 'var(--brand-primary)', marginTop: '0.1rem' }}>⚖️</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Summary Metrics */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📊 Negotiation Summary</span>
              </div>
              <div className="grid-3">
                <StatMini label="Redlines Generated" value={finalRecommendations.pendingApprovals} color="var(--brand-primary)" />
                <StatMini label="Negotiation Points" value={finalRecommendations.totalNegotiationPoints} color="var(--medium)" />
                <StatMini label="Complexity" value={finalRecommendations.estimatedNegotiationComplexity} />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function InfoRow({ label, value, accent }) {
  return (
    <div style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.875rem', color: accent ? 'var(--brand-primary)' : 'var(--text-primary)', fontWeight: accent ? 600 : 400 }}>
        {value || '—'}
      </div>
    </div>
  );
}

function StatMini({ label, value, color }) {
  return (
    <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
    </div>
  );
}

function RiskRing({ score, level }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = level?.color || '#2ed573';

  return (
    <div className="risk-ring">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="risk-ring-text">
        <span className="risk-ring-score" style={{ color }}>{score}</span>
        <span className="risk-ring-label">/ 100</span>
      </div>
    </div>
  );
}

function ClauseItem({ clause, expanded, onToggle }) {
  return (
    <div className="clause-item">
      <div className="clause-header" onClick={onToggle}>
        <span className={`risk-badge ${clause.riskLevel?.label?.toLowerCase() || 'low'}`}>
          {clause.riskLevel?.label || 'Low'}
        </span>
        <span className="clause-title-text">{clause.title}</span>
        <span className="clause-score" style={{ color: clause.riskLevel?.color }}>
          {clause.riskScore}/100
        </span>
        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>
      {expanded && (
        <div className="clause-body">
          <div className="clause-text-block">{clause.text}</div>
          {clause.policyDeviations && clause.policyDeviations.length > 0 && (
            <div className="clause-deviations">
              {clause.policyDeviations.map((d, i) => (
                <div key={i} className="deviation-item">
                  <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {d}
                </div>
              ))}
            </div>
          )}
          {clause.preferredPosition && (
            <div style={{
              padding: '0.6rem 0.9rem', background: 'var(--low-bg)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--low-border)',
              fontSize: '0.78rem', color: 'var(--low)',
            }}>
              <strong>Policy Position:</strong> {clause.preferredPosition}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrecedentCard({ precedent }) {
  return (
    <div className="precedent-card">
      <div className="precedent-meta">
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {precedent.counterparty}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>·</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{precedent.contractType}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>·</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{precedent.contractDate}</span>
        <span className={`outcome-badge ${precedent.outcome?.toLowerCase()}`}>{precedent.outcome}</span>
        {precedent.relevanceScore && (
          <span className="precedent-relevance">{precedent.relevanceScore}% match</span>
        )}
      </div>
      <div className="precedent-text">
        <strong style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ORIGINAL:
        </strong>{' '}
        {precedent.originalClause}
      </div>
      <div className="precedent-text" style={{ borderLeft: '2px solid var(--low-border)', paddingLeft: '0.75rem' }}>
        <strong style={{ color: 'var(--low)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          NEGOTIATED:
        </strong>{' '}
        {precedent.proposedClause}
      </div>
      {precedent.negotiationNotes && (
        <div className="precedent-notes">{precedent.negotiationNotes}</div>
      )}
      {precedent.synthetic && (
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '0.1rem 0.5rem', borderRadius: 10 }}>
          🧪 Synthetic Demo Data
        </span>
      )}
    </div>
  );
}
