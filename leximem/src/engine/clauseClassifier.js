// ============================================================
// LexiMem Clause Classifier
// Identifies, segments, and classifies contract clauses by type
// Uses keyword patterns and structural heuristics
// ============================================================

import { CORPORATE_PLAYBOOK } from '../data/corporatePlaybook';

/**
 * Extract and classify all clauses from contract text.
 * Returns an array of classified clause objects.
 */
export function classifyClauses(text) {
  // 1. Split into sections/paragraphs
  const sections = splitIntoSections(text);

  // 2. Classify each section
  const classified = sections.map((section, idx) => classifySection(section, idx));

  // 3. Identify missing expected clauses
  const presentTypes = new Set(classified.map(c => c.clauseType).filter(t => t !== 'other'));
  const missing = findMissingClauses(presentTypes);

  return { clauses: classified, missingClauses: missing };
}

function splitIntoSections(text) {
  const sections = [];

  // Try to split by numbered sections (e.g., "1.", "2.", "Section 1", "ARTICLE I")
  const numberedSectionPattern = /(?:^|\n)(?:(?:SECTION|ARTICLE|CLAUSE)\s+[\dIVXivx]+\.?|(?:\d+)\.(?:\d+\.)*)\s+[A-Z][^\n]{0,80}/gm;

  const matches = [...text.matchAll(numberedSectionPattern)];

  if (matches.length >= 2) {
    // Use numbered sections
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const sectionText = text.slice(start, end).trim();
      if (sectionText.length > 30) {
        sections.push(sectionText);
      }
    }
  } else {
    // Fall back to paragraph splitting
    const paragraphs = text.split(/\n\s*\n+/);
    let currentSection = '';
    for (const para of paragraphs) {
      const cleaned = para.trim();
      if (!cleaned) continue;
      // Check if this looks like a heading
      if (cleaned.length < 100 && cleaned.match(/^[A-Z\s\d\.:]+$/) && cleaned.length > 5) {
        if (currentSection.length > 50) sections.push(currentSection);
        currentSection = cleaned + '\n';
      } else {
        currentSection += cleaned + '\n\n';
        if (currentSection.length > 1500) {
          sections.push(currentSection);
          currentSection = '';
        }
      }
    }
    if (currentSection.length > 50) sections.push(currentSection);
  }

  // Ensure we have at least one section
  if (sections.length === 0) {
    // Split by chunk size
    const chunkSize = 500;
    for (let i = 0; i < text.length; i += chunkSize) {
      sections.push(text.slice(i, i + chunkSize));
    }
  }

  return sections;
}

function classifySection(text, index) {
  const lowerText = text.toLowerCase();
  let bestMatch = { type: 'other', score: 0 };

  for (const [typeId, policy] of Object.entries(CORPORATE_PLAYBOOK)) {
    let score = 0;
    for (const keyword of policy.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    // Check for risk keywords too (more weight)
    for (const keyword of policy.riskKeywords || []) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { type: typeId, score };
    }
  }

  // Extract the title of the section (first line)
  const firstLine = text.split('\n')[0].trim();
  const title = firstLine.length < 100 ? firstLine : extractSectionTitle(text, bestMatch.type);

  return {
    id: `clause-${index}`,
    index,
    clauseType: bestMatch.score >= 2 ? bestMatch.type : 'other',
    title: title || `Section ${index + 1}`,
    text: text.trim(),
    confidenceScore: Math.min(100, bestMatch.score * 15),
    policyKey: bestMatch.score >= 2 ? bestMatch.type : null,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

function extractSectionTitle(text, type) {
  if (type === 'other') return 'General Provision';
  const policy = CORPORATE_PLAYBOOK[type];
  return policy ? policy.name : 'Contract Clause';
}

function findMissingClauses(presentTypes) {
  const critical = ['liability', 'termination', 'confidentiality'];
  const recommended = ['payment', 'indemnification', 'intellectualProperty', 'dataProtection', 'governingLaw'];

  const missing = [];

  for (const type of critical) {
    if (!presentTypes.has(type)) {
      missing.push({
        clauseType: type,
        name: CORPORATE_PLAYBOOK[type]?.name || type,
        severity: 'Critical',
        note: 'This clause type is typically required and appears to be absent from the contract.',
      });
    }
  }

  for (const type of recommended) {
    if (!presentTypes.has(type)) {
      missing.push({
        clauseType: type,
        name: CORPORATE_PLAYBOOK[type]?.name || type,
        severity: 'Medium',
        note: 'This clause type is recommended and may need to be added.',
      });
    }
  }

  return missing;
}
