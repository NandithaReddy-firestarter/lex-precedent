import React, { useState } from 'react';
import { CORPORATE_PLAYBOOK, RISK_LEVELS } from '../data/corporatePlaybook';
import { BookOpen, ChevronDown, ChevronUp, Shield } from 'lucide-react';

export function PlaybookPage() {
  const [expanded, setExpanded] = useState(null);

  const policies = Object.values(CORPORATE_PLAYBOOK);

  return (
    <div>
      <div className="page-header">
        <span className="page-header-title">📋 Corporate Legal Playbook</span>
        <span className="page-header-subtitle">Standard policy positions used for risk evaluation</span>
      </div>
      <div className="page-body">
        {/* Intro */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(79,142,245,0.08) 0%, rgba(124,92,252,0.08) 100%)', borderColor: 'rgba(79,142,245,0.2)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 44, height: 44, background: 'var(--brand-gradient)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <h2 style={{ marginBottom: '0.4rem' }}>LexiMem Corporate Legal Playbook</h2>
              <p style={{ fontSize: '0.875rem' }}>
                These are the company's standard preferred positions for key contractual provisions. 
                LexiMem evaluates every clause against these policies and flags deviations for review. 
                All risk scoring is based on these thresholds.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Level Legend */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <span className="card-title">Risk Classification</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(RISK_LEVELS).map(([key, level]) => (
              <div key={key} style={{
                padding: '0.6rem 1.1rem', borderRadius: 'var(--radius-sm)',
                background: level.bg, border: `1px solid ${level.color}40`,
                display: 'flex', flexDirection: 'column', gap: '0.1rem',
              }}>
                <span style={{ fontWeight: 700, color: level.color }}>{level.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Score: {level.min}–{key === 'CRITICAL' ? '100' : Object.values(RISK_LEVELS).find(l => l.min > level.min)?.min - 1 || '100'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Policy List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {policies.map(policy => {
            const isOpen = expanded === policy.id;
            return (
              <div key={policy.id} className="clause-item">
                <div className="clause-header" onClick={() => setExpanded(isOpen ? null : policy.id)}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                    background: 'rgba(79,142,245,0.12)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                  }}>
                    {getPolicyEmoji(policy.id)}
                  </div>
                  <span className="clause-title-text">{policy.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    Weight: {policy.defaultRiskWeight}
                  </span>
                  {isOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                {isOpen && (
                  <div style={{ padding: '0 1.1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Preferred Position */}
                    <div style={{
                      padding: '0.75rem 1rem', background: 'var(--low-bg)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--low-border)',
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--low)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                        ✅ Preferred Position
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{policy.preferredPosition}</div>
                    </div>

                    {/* Red Flag */}
                    <div style={{
                      padding: '0.75rem 1rem', background: 'var(--critical-bg)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--critical-border)',
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--critical)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                        🚨 Red Flag
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{policy.redFlag}</div>
                    </div>

                    {/* Thresholds */}
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Acceptance Thresholds:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {Object.entries(policy.thresholds).map(([level, text]) => (
                          <div key={level} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-elevated)',
                          }}>
                            <span style={{
                              width: 90, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize',
                              color: level === 'acceptable' ? 'var(--low)' : level === 'negotiable' ? 'var(--medium)' : 'var(--critical)',
                            }}>{level}</span>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Standard Text */}
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Standard Policy Language:</div>
                      <div style={{
                        background: 'var(--bg-base)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem',
                        color: 'var(--text-secondary)', lineHeight: 1.6,
                      }}>
                        {policy.policyText}
                      </div>
                    </div>

                    {/* Risk Keywords */}
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Risk Trigger Keywords:</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {policy.riskKeywords.map(kw => (
                          <span key={kw} style={{
                            background: 'var(--critical-bg)', color: 'var(--critical)',
                            border: '1px solid var(--critical-border)',
                            borderRadius: 20, padding: '0.1rem 0.5rem', fontSize: '0.72rem', fontWeight: 500,
                          }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getPolicyEmoji(id) {
  const map = {
    liability: '⚖️', payment: '💳', termination: '🔚',
    confidentiality: '🔒', indemnification: '🛡️',
    intellectualProperty: '💡', dataProtection: '🔐', governingLaw: '🏛️',
  };
  return map[id] || '📋';
}
