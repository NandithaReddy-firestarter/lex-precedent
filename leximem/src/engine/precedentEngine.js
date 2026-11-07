// ============================================================
// LexiMem Precedent Engine
// Semantic similarity search using TF-IDF cosine similarity
// Retrieves historically relevant precedents for current clauses
// ============================================================

import { getAllPrecedents, getPrecedentsByCounterparty } from '../memory/memoryStore';

/**
 * Find relevant precedents for a clause using counterparty + TF-IDF similarity.
 * Returns precedents sorted by relevance score.
 */
export function findRelevantPrecedents(clause, counterparty, limit = 5) {
  const allPrecedents = getAllPrecedents();

  if (allPrecedents.length === 0) return [];

  // Score each precedent for relevance
  const scored = allPrecedents.map(precedent => {
    let score = 0;

    // 1. Counterparty match (highest weight)
    if (counterparty && precedent.counterparty.toLowerCase().includes(counterparty.toLowerCase())) {
      score += 50;
    }

    // 2. Clause type match (high weight)
    if (precedent.clauseType === clause.policyKey || precedent.clauseType === clause.clauseType) {
      score += 30;
    }

    // 3. TF-IDF cosine similarity of clause text
    const textSimilarity = cosineSimilarity(
      tokenize(clause.text),
      tokenize(precedent.originalClause + ' ' + precedent.proposedClause)
    );
    score += textSimilarity * 20;

    // 4. Approved outcomes rank higher
    if (precedent.outcome === 'APPROVED') score += 5;

    return { precedent, score, textSimilarity };
  });

  // Filter out low-relevance results
  const relevant = scored
    .filter(s => s.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => ({
      ...s.precedent,
      relevanceScore: Math.round(s.score),
      textSimilarity: Math.round(s.textSimilarity * 100),
      relevanceLabel: getRelevanceLabel(s.score),
    }));

  return relevant;
}

/**
 * Find precedents specifically for a counterparty.
 */
export function getCounterpartyHistory(counterparty) {
  if (!counterparty) return { precedents: [], summary: null };

  const precedents = getPrecedentsByCounterparty(counterparty);

  if (precedents.length === 0) {
    return { precedents: [], summary: null, isNewCounterparty: true };
  }

  const approved = precedents.filter(p => p.outcome === 'APPROVED');
  const rejected = precedents.filter(p => p.outcome === 'REJECTED');
  const pending = precedents.filter(p => p.outcome === 'PENDING');

  const clauseTypes = [...new Set(precedents.map(p => p.clauseType))];

  return {
    precedents,
    summary: {
      counterparty,
      totalEngagements: precedents.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      pendingCount: pending.length,
      clauseTypesNegotiated: clauseTypes,
      firstEngagement: precedents.reduce((min, p) => p.contractDate < min ? p.contractDate : min, precedents[0].contractDate),
      latestEngagement: precedents.reduce((max, p) => p.contractDate > max ? p.contractDate : max, precedents[0].contractDate),
      approvedClauses: approved.map(p => p.clauseTitle),
      negotiationPattern: analyzeNegotiationPattern(approved, rejected),
    },
    isNewCounterparty: false,
  };
}

/**
 * Find semantically similar approved clauses for a given clause text.
 */
export function findSimilarApprovedClauses(clauseText, clauseType) {
  const all = getAllPrecedents();
  const approved = all.filter(p => p.outcome === 'APPROVED');

  const scores = approved.map(p => ({
    precedent: p,
    similarity: cosineSimilarity(
      tokenize(clauseText),
      tokenize(p.originalClause + ' ' + p.proposedClause)
    ),
  }));

  return scores
    .filter(s => s.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3)
    .map(s => ({ ...s.precedent, similarity: Math.round(s.similarity * 100) }));
}

// ─── TF-IDF Similarity ────────────────────────────────────────────────────

function tokenize(text) {
  if (!text) return {};
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'shall', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'such', 'any', 'all', 'each', 'every', 'both', 'either', 'neither', 'not',
    'no', 'nor', 'as', 'if', 'then', 'than', 'so', 'also', 'just', 'more',
  ]);

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));

  // Build term frequency map
  const tf = {};
  for (const word of words) {
    tf[word] = (tf[word] || 0) + 1;
  }
  return tf;
}

function cosineSimilarity(tf1, tf2) {
  const terms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
  if (terms.size === 0) return 0;

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (const term of terms) {
    const v1 = tf1[term] || 0;
    const v2 = tf2[term] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

function getRelevanceLabel(score) {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function analyzeNegotiationPattern(approved, rejected) {
  const patterns = [];
  if (approved.length > 0) {
    patterns.push(`Historically accepted ${approved.length} negotiated term(s).`);
  }
  if (rejected.length > 0) {
    patterns.push(`Rejected ${rejected.length} proposal(s) — expect pushback.`);
    const rejectedTypes = [...new Set(rejected.map(p => p.clauseType))];
    patterns.push(`Resistance areas: ${rejectedTypes.join(', ')}.`);
  }
  if (approved.length === 0 && rejected.length === 0) {
    patterns.push('No negotiation history available for this counterparty.');
  }
  return patterns.join(' ');
}
