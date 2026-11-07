// ============================================================
// LexiMem Risk Evaluator
// Scores each clause against the corporate legal playbook
// Returns risk scores (0-100), severity levels, and policy deviations
// ============================================================

import { CORPORATE_PLAYBOOK, getRiskLevel } from '../data/corporatePlaybook';

/**
 * Evaluate a list of clauses for risk.
 * Returns enriched clause objects with risk scores, severity, and recommendations.
 */
export function evaluateRisks(clauses) {
  return clauses.map(clause => evaluateClause(clause));
}

/**
 * Calculate overall contract risk score from all clause scores.
 */
export function calculateOverallRisk(evaluatedClauses) {
  const riskyClauses = evaluatedClauses.filter(c => c.riskScore > 20);
  if (riskyClauses.length === 0) return { score: 10, level: getRiskLevel(10), riskyClauses: [] };

  // Weighted average — heavier weight for critical/high risk clauses
  let weightedSum = 0;
  let totalWeight = 0;

  for (const clause of riskyClauses) {
    const weight = clause.riskScore >= 80 ? 3 : clause.riskScore >= 60 ? 2 : 1;
    weightedSum += clause.riskScore * weight;
    totalWeight += weight;
  }

  const score = Math.round(weightedSum / totalWeight);
  return {
    score,
    level: getRiskLevel(score),
    riskyClauses,
    totalClauses: evaluatedClauses.length,
    riskyCount: riskyClauses.length,
  };
}

function evaluateClause(clause) {
  if (!clause.policyKey || !CORPORATE_PLAYBOOK[clause.policyKey]) {
    return { ...clause, riskScore: 0, riskLevel: getRiskLevel(0), policyDeviations: [], hasRisk: false };
  }

  const policy = CORPORATE_PLAYBOOK[clause.policyKey];
  const lowerText = clause.text.toLowerCase();

  let riskScore = 0;
  const policyDeviations = [];
  const riskFactors = [];

  // ─── Check for risk keywords ─────────────────────────────
  const foundRiskKeywords = policy.riskKeywords.filter(kw =>
    lowerText.includes(kw.toLowerCase())
  );

  if (foundRiskKeywords.length > 0) {
    const keywordRisk = Math.min(60, foundRiskKeywords.length * 20);
    riskScore += keywordRisk;
    riskFactors.push({
      factor: 'Risk Keywords Detected',
      detail: `Found: ${foundRiskKeywords.map(k => `"${k}"`).join(', ')}`,
      impact: keywordRisk,
    });
    policyDeviations.push(`Language contains risk indicators: ${foundRiskKeywords.join(', ')}`);
  }

  // ─── Clause-specific evaluations ─────────────────────────
  const specificRisk = evaluateClauseSpecific(clause.policyKey, lowerText, policy);
  if (specificRisk.score > 0) {
    riskScore += specificRisk.score;
    riskFactors.push(...specificRisk.factors);
    policyDeviations.push(...specificRisk.deviations);
  }

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  // If some keywords present but no major risks, set a baseline
  if (riskScore === 0 && clause.policyKey && clause.confidenceScore > 20) {
    riskScore = 15; // Baseline — clause present and classified, minor review needed
  }

  const riskLevel = getRiskLevel(riskScore);

  return {
    ...clause,
    riskScore,
    riskLevel,
    policyDeviations,
    riskFactors,
    hasRisk: riskScore >= 35,
    preferredPosition: policy.preferredPosition,
    policyText: policy.policyText,
    correctedActions: generateCorrectiveActions(clause.policyKey, lowerText, policy),
  };
}

function evaluateClauseSpecific(policyKey, lowerText, policy) {
  const factors = [];
  const deviations = [];
  let score = 0;

  switch (policyKey) {
    case 'liability': {
      if (lowerText.includes('unlimited') || lowerText.includes('without limit') || lowerText.includes('full extent')) {
        score += 40;
        factors.push({ factor: 'Unlimited Liability', detail: 'No cap on liability exposure', impact: 40 });
        deviations.push('Policy requires liability cap at 12 months of fees; contract has unlimited liability.');
      } else if (lowerText.includes('consequential') && !lowerText.includes('no consequential')) {
        score += 25;
        factors.push({ factor: 'Consequential Damages', detail: 'Consequential damages not waived', impact: 25 });
        deviations.push('Policy excludes consequential damages; this clause may allow them.');
      }
      if (!lowerText.includes('cap') && !lowerText.includes('maximum') && !lowerText.includes('not exceed')) {
        score += 15;
        factors.push({ factor: 'Missing Cap Language', detail: 'No explicit liability cap found', impact: 15 });
      }
      break;
    }

    case 'payment': {
      const netMatch = lowerText.match(/net\s+(\d+)/);
      if (netMatch) {
        const days = parseInt(netMatch[1]);
        if (days < 15) {
          score += 40;
          factors.push({ factor: 'Short Payment Window', detail: `Net ${days} days is below minimum acceptable (Net 30)`, impact: 40 });
          deviations.push(`Payment terms of Net ${days} days violate policy requiring Net 30 days.`);
        } else if (days < 30) {
          score += 20;
          factors.push({ factor: 'Compressed Payment Terms', detail: `Net ${days} days is below preferred (Net 30)`, impact: 20 });
        }
      }
      const penaltyMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:per|a)\s*month/);
      if (penaltyMatch && parseFloat(penaltyMatch[1]) > 1.5) {
        score += 25;
        factors.push({ factor: 'Excessive Late Penalty', detail: `${penaltyMatch[1]}% per month exceeds policy limit of 1.5%`, impact: 25 });
      }
      break;
    }

    case 'termination': {
      if (lowerText.includes('immediate') || lowerText.includes('without notice')) {
        score += 35;
        factors.push({ factor: 'Immediate Termination', detail: 'Contract allows termination without notice period', impact: 35 });
        deviations.push('Policy requires 30-day written notice; immediate termination is unacceptable.');
      }
      if (lowerText.includes('sole discretion')) {
        score += 25;
        factors.push({ factor: 'Sole Discretion Right', detail: 'One-sided termination trigger at sole discretion', impact: 25 });
        deviations.push('Termination at sole discretion without objective cause violates mutual termination policy.');
      }
      break;
    }

    case 'confidentiality': {
      if (!lowerText.includes('mutual') && !lowerText.includes('both parties') && !lowerText.includes('each party')) {
        score += 25;
        factors.push({ factor: 'Potentially One-Sided', detail: 'Confidentiality may not be mutual', impact: 25 });
        deviations.push('Policy requires mutual confidentiality; clause may impose one-sided obligations.');
      }
      if (!lowerText.includes('surviv') || lowerText.includes('no surviv')) {
        score += 20;
        factors.push({ factor: 'Missing Survival Clause', detail: 'Post-termination survival not specified', impact: 20 });
        deviations.push('Policy requires 3-year post-termination confidentiality survival.');
      }
      break;
    }

    case 'indemnification': {
      if (!lowerText.includes('mutual') && !lowerText.includes('each party') && !lowerText.includes('both parties')) {
        score += 30;
        factors.push({ factor: 'Unilateral Indemnification', detail: 'Indemnification appears one-sided', impact: 30 });
        deviations.push('Policy requires mutual indemnification with limited scope.');
      }
      if (lowerText.includes('any and all') || lowerText.includes('without limitation')) {
        score += 25;
        factors.push({ factor: 'Broad Indemnification Scope', detail: 'Indemnification covers all claims without limitation', impact: 25 });
      }
      break;
    }

    case 'intellectualProperty': {
      if (lowerText.includes('work for hire') || lowerText.includes('assign') || lowerText.includes('transfer')) {
        score += 35;
        factors.push({ factor: 'IP Assignment Risk', detail: 'Potential assignment or transfer of company IP', impact: 35 });
        deviations.push('Policy requires each party to retain its own IP; assignment clauses are unacceptable.');
      }
      if (lowerText.includes('irrevocable') && lowerText.includes('license')) {
        score += 20;
        factors.push({ factor: 'Irrevocable License', detail: 'Grants irrevocable license which may exceed permitted scope', impact: 20 });
      }
      break;
    }

    case 'dataProtection': {
      if (!lowerText.includes('gdpr') && !lowerText.includes('ccpa') && !lowerText.includes('data protection')) {
        score += 30;
        factors.push({ factor: 'Missing Compliance Reference', detail: 'No explicit GDPR/CCPA compliance language', impact: 30 });
        deviations.push('Policy requires GDPR/CCPA compliance language.');
      }
      const noticeMatch = lowerText.match(/(\d+)\s*(?:day|hour|business day)/);
      if (noticeMatch) {
        const days = parseInt(noticeMatch[1]);
        if (days > 72 && lowerText.includes('breach')) {
          score += 25;
          factors.push({ factor: 'Slow Breach Notification', detail: `${days} days notification exceeds 72-hour policy`, impact: 25 });
        }
      }
      break;
    }

    case 'governingLaw': {
      const foreignIndicators = ['england', 'uk', 'united kingdom', 'china', 'singapore', 'cayman'];
      const found = foreignIndicators.filter(f => lowerText.includes(f));
      if (found.length > 0 && !lowerText.includes('arbitration')) {
        score += 30;
        factors.push({ factor: 'Foreign Jurisdiction', detail: `Non-US jurisdiction without arbitration: ${found.join(', ')}`, impact: 30 });
        deviations.push('Policy requires Delaware law with arbitration; foreign courts without arbitration are unacceptable.');
      }
      break;
    }
  }

  return { score, factors, deviations };
}

function generateCorrectiveActions(policyKey, lowerText, policy) {
  const actions = [];

  switch (policyKey) {
    case 'liability':
      if (lowerText.includes('unlimited') || !lowerText.includes('cap')) {
        actions.push('Add a liability cap equal to fees paid in the preceding 12 months.');
        actions.push('Include mutual waiver of consequential, special, and punitive damages.');
      }
      break;
    case 'payment':
      actions.push('Revise payment terms to Net 30 days from valid invoice receipt.');
      actions.push('Limit late payment interest to 1.5% per month maximum.');
      break;
    case 'termination':
      actions.push('Replace immediate termination rights with 30-day written notice requirement.');
      actions.push('Add cure period of 30 days for material breach termination.');
      break;
    case 'confidentiality':
      actions.push('Ensure mutual confidentiality obligations for both parties.');
      actions.push('Add 3-year post-termination survival clause.');
      break;
    case 'indemnification':
      actions.push('Narrow indemnification scope to specific triggers: IP infringement and gross negligence.');
      actions.push('Add mutual reciprocal indemnification language.');
      break;
    case 'intellectualProperty':
      actions.push('Replace work-for-hire/assignment language with retain-own-IP clause.');
      actions.push('Require separate written agreement for any jointly developed IP.');
      break;
    case 'dataProtection':
      actions.push('Add explicit GDPR and CCPA compliance obligations.');
      actions.push('Specify 72-hour breach notification requirement.');
      break;
    case 'governingLaw':
      actions.push('Change governing law to State of Delaware, USA.');
      actions.push('Add binding arbitration clause under AAA Commercial Rules.');
      break;
  }

  return actions;
}
