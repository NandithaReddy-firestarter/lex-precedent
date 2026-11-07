// ============================================================
// LexiMem Redline Generator
// Generates AI redline recommendations for risky clauses
// Based on corporate playbook + historical precedents
// ============================================================

import { CORPORATE_PLAYBOOK } from '../data/corporatePlaybook';
import { generateId } from '../memory/memoryStore';

/**
 * Generate a redline recommendation for a risky clause.
 * Returns the original, proposed revision, reasoning, and confidence.
 */
export function generateRedline(clause, precedents = []) {
  const policy = CORPORATE_PLAYBOOK[clause.policyKey];
  if (!policy) return null;

  const approvedPrecedents = precedents.filter(p => p.outcome === 'APPROVED');
  const relevantPrecedent = approvedPrecedents[0] || null;

  // Build proposed clause text
  const proposedText = buildProposedText(clause, policy, relevantPrecedent);

  // Build explanation
  const explanation = buildExplanation(clause, policy, relevantPrecedent);

  // Calculate confidence
  const confidence = calculateConfidence(clause, relevantPrecedent, precedents);

  return {
    id: generateId('redline'),
    clauseId: clause.id,
    clauseType: clause.policyKey || clause.clauseType,
    clauseTitle: clause.title,
    originalText: clause.text.trim(),
    proposedText,
    explanation,
    confidence,
    confidenceLabel: getConfidenceLabel(confidence),
    supportingPrecedent: relevantPrecedent ? {
      id: relevantPrecedent.id,
      contractType: relevantPrecedent.contractType,
      counterparty: relevantPrecedent.counterparty,
      date: relevantPrecedent.contractDate,
      outcome: relevantPrecedent.outcome,
      relevanceScore: relevantPrecedent.relevanceScore,
    } : null,
    policyBasis: policy.name,
    policyText: policy.policyText,
    correctedActions: clause.correctedActions || [],
    status: 'PENDING_REVIEW', // Never auto-approve
    createdAt: new Date().toISOString(),
    // ⚠ IMPORTANT: This is AI-generated analysis, not a verified legal opinion.
    disclaimer: 'AI-GENERATED RECOMMENDATION — Requires human legal review before approval.',
  };
}

/**
 * Generate redlines for all risky clauses in a contract.
 */
export function generateAllRedlines(evaluatedClauses, precedentMap) {
  return evaluatedClauses
    .filter(c => c.hasRisk && c.policyKey)
    .map(clause => {
      const precedents = precedentMap[clause.id] || [];
      return generateRedline(clause, precedents);
    })
    .filter(Boolean);
}

// ─── Internal builders ────────────────────────────────────────────────────

function buildProposedText(clause, policy, precedent) {
  // Start with the corporate policy standard text
  let proposed = policy.policyText;

  // If we have an approved precedent with this counterparty, adapt from that
  if (precedent && precedent.proposedClause) {
    const policyText = policy.policyText;
    // Blend: use precedent language as the base, enrich with policy
    proposed = precedent.proposedClause;

    // Add a note if precedent differs from pure policy
    if (precedent.proposedClause !== policyText) {
      proposed = precedent.proposedClause;
    }
  }

  // ─── Clause-type specific enhancements ───────────────────
  switch (clause.policyKey) {
    case 'liability':
      proposed = `Each party's aggregate liability arising out of or related to this Agreement, whether based on contract, tort, or any other legal theory, shall not exceed the total fees paid by Company to ${getCounterpartyName(clause)} in the twelve (12) months immediately preceding the event giving rise to such claim. In no event shall either party be liable for indirect, consequential, special, exemplary, or punitive damages, even if advised of the possibility of such damages.`;
      break;
    case 'payment':
      proposed = `All undisputed invoices shall be due and payable within thirty (30) days of receipt of a valid invoice. Any disputed amounts shall be subject to a good-faith dispute resolution process. Late payment on undisputed amounts shall accrue interest at the rate of one and one-half percent (1.5%) per month or the maximum rate permitted by law, whichever is less.`;
      break;
    case 'termination':
      proposed = `Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice to the other party. Either party may terminate this Agreement for material breach if the breaching party fails to cure such breach within thirty (30) days of receiving written notice specifying the breach in reasonable detail.`;
      break;
    case 'confidentiality':
      proposed = `Each party (as "Receiving Party") agrees to maintain the confidentiality of the other party's (as "Disclosing Party") Confidential Information using at least the same degree of care used to protect its own confidential information, but no less than reasonable care. These obligations shall survive the termination or expiration of this Agreement for a period of three (3) years.`;
      break;
    case 'indemnification':
      proposed = `Each party shall indemnify, defend, and hold harmless the other party from and against third-party claims arising from: (a) the indemnifying party's infringement or misappropriation of any third-party intellectual property rights; or (b) the indemnifying party's gross negligence or willful misconduct. Each party's indemnification obligation shall be subject to the liability cap set forth in this Agreement.`;
      break;
    case 'intellectualProperty':
      proposed = `Each party shall retain exclusive ownership of all intellectual property owned by it prior to the effective date of this Agreement ("Pre-Existing IP"). Nothing in this Agreement shall be construed as a transfer or assignment of Pre-Existing IP. Any intellectual property developed jointly by the parties shall require a separate written joint development agreement prior to commencement of such development.`;
      break;
    case 'dataProtection':
      proposed = `Each party shall comply with all applicable data protection laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). In the event of a confirmed personal data breach, the affected party shall notify the other party within seventy-two (72) hours of becoming aware of the breach. Personal data shall not be used for any purpose other than performance of this Agreement.`;
      break;
    case 'governingLaw':
      proposed = `This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration in accordance with the Commercial Arbitration Rules of the American Arbitration Association ("AAA"), and judgment on the award may be entered in any court having jurisdiction.`;
      break;
  }

  return proposed;
}

function buildExplanation(clause, policy, precedent) {
  const parts = [];

  // Describe the problem
  parts.push(`**Problem Identified:** The current clause deviates from corporate policy on ${policy.name}.`);

  if (clause.policyDeviations && clause.policyDeviations.length > 0) {
    parts.push(`**Policy Deviations:**`);
    clause.policyDeviations.forEach(d => parts.push(`- ${d}`));
  }

  parts.push(`**Corporate Policy Requires:** ${policy.preferredPosition}.`);

  if (precedent) {
    parts.push(`**Historical Precedent (${precedent.outcome}):** In the ${precedent.contractType} with ${precedent.counterparty} dated ${precedent.contractDate}, this clause was successfully negotiated. ${precedent.negotiationNotes}`);
  }

  parts.push(`**Risk Score:** ${clause.riskScore}/100 — ${clause.riskLevel?.label || 'N/A'} risk.`);
  parts.push(`⚠️ This recommendation requires legal team review before incorporation into the contract.`);

  return parts.join('\n\n');
}

function calculateConfidence(clause, relevantPrecedent, allPrecedents) {
  let confidence = 50; // Baseline

  // Boost for approved precedent with same counterparty
  if (relevantPrecedent) {
    if (relevantPrecedent.outcome === 'APPROVED') {
      confidence += 25;
      if (relevantPrecedent.relevanceScore >= 70) confidence += 10;
    }
    if (relevantPrecedent.outcome === 'REJECTED') {
      confidence -= 10; // Known resistance
    }
  }

  // Boost for high clause classification confidence
  if (clause.confidenceScore >= 80) confidence += 10;
  else if (clause.confidenceScore >= 50) confidence += 5;

  // Boost for multiple supporting precedents
  const approvedCount = allPrecedents.filter(p => p.outcome === 'APPROVED').length;
  confidence += Math.min(15, approvedCount * 5);

  return Math.min(95, Math.max(20, confidence));
}

function getConfidenceLabel(score) {
  if (score >= 85) return 'Very High';
  if (score >= 70) return 'High';
  if (score >= 55) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Very Low';
}

function getCounterpartyName(clause) {
  // Try to extract counterparty from clause context, fallback to generic
  return 'the Counterparty';
}
