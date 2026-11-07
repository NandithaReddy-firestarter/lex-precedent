// ============================================================
// LexiMem Workflow Orchestrator
// 13-step autonomous contract analysis workflow
// ============================================================

import { parseDocument, parseRawText } from './documentParser';
import { classifyClauses } from './clauseClassifier';
import { evaluateRisks, calculateOverallRisk } from './riskEvaluator';
import { findRelevantPrecedents, getCounterpartyHistory } from './precedentEngine';
import { generateAllRedlines } from './redlineGenerator';
import { saveContract, generateId } from '../memory/memoryStore';

/**
 * Execute the full 13-step contract analysis workflow.
 * @param {File|string} input - File object or raw text string
 * @param {function} onProgress - Callback(step, message) for progress updates
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeContract(input, onProgress = () => {}) {
  const steps = [
    'Receiving contract input',
    'Extracting text and metadata',
    'Identifying and classifying clauses',
    'Identifying the counterparty',
    'Searching persistent memory',
    'Retrieving relevant precedents',
    'Comparing with corporate legal playbook',
    'Identifying risks and calculating scores',
    'Generating context-aware recommendations',
    'Generating proposed redlines',
    'Assembling analysis report',
    'Preparing for user review',
    'Analysis complete — awaiting decisions',
  ];

  const progress = (stepIdx, detail) => {
    onProgress(stepIdx, steps[stepIdx], detail);
  };

  // ── STEP 1: Receive contract ─────────────────────────────────────────
  progress(0, 'Processing input...');
  await delay(300);

  // ── STEP 2: Extract text ────────────────────────────────────────────
  progress(1, 'Parsing document...');
  let parsed;
  try {
    if (typeof input === 'string') {
      parsed = parseRawText(input);
    } else {
      parsed = await parseDocument(input);
    }
  } catch (err) {
    throw new Error(`Document parsing failed: ${err.message}`);
  }
  await delay(400);

  // ── STEP 3: Classify clauses ────────────────────────────────────────
  progress(2, `Analyzing ${parsed.wordCount.toLocaleString()} words...`);
  const { clauses, missingClauses } = classifyClauses(parsed.text);
  await delay(500);

  // ── STEP 4: Identify counterparty ───────────────────────────────────
  progress(3, 'Identifying counterparty...');
  const counterparty = extractCounterparty(parsed);
  await delay(300);

  // ── STEP 5: Search persistent memory ────────────────────────────────
  progress(4, `Querying memory for ${counterparty || 'unknown counterparty'}...`);
  const counterpartyHistory = getCounterpartyHistory(counterparty);
  await delay(600);

  // ── STEP 6: Retrieve relevant precedents ────────────────────────────
  progress(5, `Found ${counterpartyHistory.precedents.length} historical records...`);
  const precedentMap = {};
  for (const clause of clauses) {
    if (clause.policyKey) {
      precedentMap[clause.id] = findRelevantPrecedents(clause, counterparty, 3);
    }
  }
  await delay(400);

  // ── STEP 7: Compare with playbook ───────────────────────────────────
  progress(6, 'Comparing against corporate legal playbook...');
  const evaluatedClauses = evaluateRisks(clauses);
  await delay(500);

  // ── STEP 8: Calculate risk scores ───────────────────────────────────
  progress(7, 'Computing risk scores...');
  const overallRisk = calculateOverallRisk(evaluatedClauses);
  await delay(400);

  // ── STEP 9: Generate recommendations ────────────────────────────────
  progress(8, `${overallRisk.riskyCount} risky clauses identified...`);
  await delay(300);

  // ── STEP 10: Generate redlines ──────────────────────────────────────
  progress(9, 'Generating AI redline recommendations...');
  const redlines = generateAllRedlines(evaluatedClauses, precedentMap);
  await delay(600);

  // ── STEP 11: Assemble report ─────────────────────────────────────────
  progress(10, 'Assembling comprehensive analysis report...');
  const contractId = generateId('ctr');
  await delay(300);

  // ── STEP 12: Prepare for review ──────────────────────────────────────
  progress(11, 'Preparing final recommendations...');
  const finalRecommendations = generateFinalRecommendations(evaluatedClauses, redlines, counterpartyHistory);
  await delay(300);

  // ── STEP 13: Complete ────────────────────────────────────────────────
  progress(12, 'Analysis complete. Awaiting your review and decisions.');

  const result = {
    id: contractId,
    analyzedAt: new Date().toISOString(),

    // A. Contract Overview
    overview: {
      title: parsed.metadata.title,
      parties: parsed.metadata.parties,
      counterparty,
      contractType: parsed.metadata.contractType,
      effectiveDate: parsed.metadata.effectiveDate,
      expirationDate: parsed.metadata.expirationDate,
      fileName: parsed.fileName,
      fileSize: parsed.fileSize,
      wordCount: parsed.wordCount,
      characterCount: parsed.characterCount,
    },

    // B. Risk Assessment
    risk: {
      overallScore: overallRisk.score,
      overallLevel: overallRisk.level,
      riskyClauses: overallRisk.riskyClauses,
      totalClauses: evaluatedClauses.length,
      riskyCount: overallRisk.riskyCount || 0,
      missingClauses,
    },

    // C. Historical Precedent Intelligence
    precedents: {
      counterpartyHistory,
      clausePrecedents: precedentMap,
      totalRetrieved: Object.values(precedentMap).flat().length,
    },

    // D. Redline Recommendations
    redlines,

    // E. Final Recommendations
    finalRecommendations,

    // Raw data
    clauses: evaluatedClauses,
    rawText: parsed.text,
    metadata: parsed.metadata,
  };

  // Save contract to persistent memory (without sensitive raw text)
  saveContract({
    id: contractId,
    title: result.overview.title,
    counterparty,
    contractType: result.overview.contractType,
    riskScore: overallRisk.score,
    riskLevel: overallRisk.level?.label,
    analyzedAt: result.analyzedAt,
    fileName: parsed.fileName,
    clauseCount: evaluatedClauses.length,
    redlineCount: redlines.length,
  });

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractCounterparty(parsed) {
  const parties = parsed.metadata.parties || [];
  if (parties.length >= 2) {
    // The counterparty is typically the second listed party
    const second = parties[1];
    if (second && second !== '[Counterparty not identified]') {
      // Clean up the name
      return second.replace(/\s+(Inc\.|Ltd\.|LLC|Corp\.|Co\.)\s*$/i, match => match.trim()).trim();
    }
  }
  return null;
}

function generateFinalRecommendations(evaluatedClauses, redlines, counterpartyHistory) {
  const critical = redlines.filter(r => {
    const clause = evaluatedClauses.find(c => c.id === r.clauseId);
    return clause && clause.riskScore >= 80;
  });
  const high = redlines.filter(r => {
    const clause = evaluatedClauses.find(c => c.id === r.clauseId);
    return clause && clause.riskScore >= 60 && clause.riskScore < 80;
  });

  const priorities = critical.map(r => ({
    priority: 'Critical',
    action: `Negotiate ${r.policyBasis}: ${r.correctedActions[0] || 'Revise clause per corporate policy'}`,
    redlineId: r.id,
  }));

  const recommendations = [
    ...critical.map(r => `Immediately address ${r.clauseTitle} — critical risk to company.`),
    ...high.map(r => `Prioritize revision of ${r.clauseTitle} before contract execution.`),
  ];

  const legalReviewItems = [
    ...(critical.length > 0 ? [`${critical.length} critical clause(s) require legal counsel review.`] : []),
    ...(counterpartyHistory.isNewCounterparty ? ['New counterparty — full legal due diligence recommended.'] : []),
    'All AI-generated redlines must be reviewed by qualified legal counsel before execution.',
  ];

  return {
    criticalPriorities: priorities,
    recommendedActions: recommendations,
    legalReviewItems,
    pendingApprovals: redlines.length,
    totalNegotiationPoints: redlines.length,
    estimatedNegotiationComplexity: critical.length > 2 ? 'High' : critical.length > 0 ? 'Medium' : 'Low',
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
