// ============================================================
// LexiMem Persistent Memory Store
// Backed by localStorage for client-side persistence across sessions
// Three memory tiers: Working, Long-Term, Corporate Knowledge
// ============================================================

import { INITIAL_KNOWLEDGE_BASE } from './initialKnowledgeBase';
import { CORPORATE_PLAYBOOK } from '../data/corporatePlaybook';

const STORAGE_KEYS = {
  PRECEDENTS: 'leximem_precedents_v1',
  CONTRACTS: 'leximem_contracts_v1',
  SESSIONS: 'leximem_sessions_v1',
  INITIALIZED: 'leximem_initialized_v1',
};

// ─── Initialization ────────────────────────────────────────────────────────

export function initializeMemoryStore() {
  if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    localStorage.setItem(STORAGE_KEYS.PRECEDENTS, JSON.stringify(INITIAL_KNOWLEDGE_BASE));
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('[LexiMem Memory] Initialized with', INITIAL_KNOWLEDGE_BASE.length, 'synthetic precedents');
  }
}

export function resetMemoryStore() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  initializeMemoryStore();
}

// ─── Long-Term Memory: Precedents ─────────────────────────────────────────

export function getAllPrecedents() {
  const raw = localStorage.getItem(STORAGE_KEYS.PRECEDENTS);
  return raw ? JSON.parse(raw) : [];
}

export function getPrecedentsByCounterparty(counterparty) {
  if (!counterparty) return [];
  const all = getAllPrecedents();
  return all.filter(p =>
    p.counterparty.toLowerCase().includes(counterparty.toLowerCase())
  );
}

export function getPrecedentsByClauseType(clauseType) {
  const all = getAllPrecedents();
  return all.filter(p => p.clauseType === clauseType);
}

export function savePrecedent(precedent) {
  const all = getAllPrecedents();
  // Avoid duplicates by ID
  const idx = all.findIndex(p => p.id === precedent.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...precedent };
  } else {
    all.push({ ...precedent, id: precedent.id || generateId('prec') });
  }
  localStorage.setItem(STORAGE_KEYS.PRECEDENTS, JSON.stringify(all));
  return precedent;
}

export function approvePrecedent(precedentId, approverName, notes) {
  const all = getAllPrecedents();
  const idx = all.findIndex(p => p.id === precedentId);
  if (idx >= 0) {
    all[idx].outcome = 'APPROVED';
    all[idx].approvedBy = approverName || 'User';
    all[idx].approvedDate = new Date().toISOString().split('T')[0];
    if (notes) all[idx].approvalNotes = notes;
    localStorage.setItem(STORAGE_KEYS.PRECEDENTS, JSON.stringify(all));
    return all[idx];
  }
  return null;
}

export function rejectPrecedent(precedentId, reason) {
  const all = getAllPrecedents();
  const idx = all.findIndex(p => p.id === precedentId);
  if (idx >= 0) {
    all[idx].outcome = 'REJECTED';
    all[idx].rejectedDate = new Date().toISOString().split('T')[0];
    if (reason) all[idx].rejectionReason = reason;
    localStorage.setItem(STORAGE_KEYS.PRECEDENTS, JSON.stringify(all));
    return all[idx];
  }
  return null;
}

export function updatePrecedentClause(precedentId, updatedClause) {
  const all = getAllPrecedents();
  const idx = all.findIndex(p => p.id === precedentId);
  if (idx >= 0) {
    all[idx].proposedClause = updatedClause;
    all[idx].userEdited = true;
    localStorage.setItem(STORAGE_KEYS.PRECEDENTS, JSON.stringify(all));
    return all[idx];
  }
  return null;
}

// ─── Long-Term Memory: Contracts ──────────────────────────────────────────

export function getAllContracts() {
  const raw = localStorage.getItem(STORAGE_KEYS.CONTRACTS);
  return raw ? JSON.parse(raw) : [];
}

export function saveContract(contract) {
  const all = getAllContracts();
  const withId = { ...contract, id: contract.id || generateId('ctr') };
  all.unshift(withId); // Most recent first
  localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(all));
  return withId;
}

export function getContractById(id) {
  return getAllContracts().find(c => c.id === id);
}

// ─── Working Memory: Sessions ─────────────────────────────────────────────

export function saveSession(session) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
  all.unshift({ ...session, savedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(all.slice(0, 50)));
}

// ─── Memory Statistics ────────────────────────────────────────────────────

export function getMemoryStats() {
  const precedents = getAllPrecedents();
  const contracts = getAllContracts();
  const approved = precedents.filter(p => p.outcome === 'APPROVED').length;
  const rejected = precedents.filter(p => p.outcome === 'REJECTED').length;
  const pending = precedents.filter(p => p.outcome === 'PENDING').length;
  const counterparties = [...new Set(precedents.map(p => p.counterparty))];

  return {
    totalPrecedents: precedents.length,
    approvedPrecedents: approved,
    rejectedPrecedents: rejected,
    pendingPrecedents: pending,
    totalContracts: contracts.length,
    counterparties: counterparties.length,
    lastUpdated: new Date().toISOString(),
    storageUsed: estimateStorageSize(),
  };
}

function estimateStorageSize() {
  let total = 0;
  Object.values(STORAGE_KEYS).forEach(key => {
    const val = localStorage.getItem(key);
    if (val) total += val.length * 2; // Rough bytes estimate
  });
  return formatBytes(total);
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─── Utilities ────────────────────────────────────────────────────────────

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export { CORPORATE_PLAYBOOK };
