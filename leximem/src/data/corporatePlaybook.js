// Corporate Legal Playbook — Preferred Positions & Risk Thresholds
// This represents the company's standard legal policy positions.

export const CORPORATE_PLAYBOOK = {
  liability: {
    id: 'liability',
    name: 'Liability Cap',
    preferredPosition: 'Cap liability at 12 months of fees paid in the preceding 12 months',
    redFlag: 'unlimited liability or liability cap exceeding 36 months of fees',
    keywords: ['liability', 'liable', 'damages', 'loss', 'harm', 'indemnify', 'unlimited'],
    riskKeywords: ['unlimited', 'uncapped', 'without limit', 'full extent', 'any and all damages', 'consequential'],
    thresholds: {
      acceptable: '12 months of fees',
      negotiable: '24 months of fees',
      unacceptable: 'unlimited or no cap',
    },
    policyText: 'Liability shall be capped at the total fees paid by the Company in the twelve (12) months immediately preceding the event giving rise to the claim.',
    defaultRiskWeight: 30,
  },
  payment: {
    id: 'payment',
    name: 'Payment Terms',
    preferredPosition: 'Net 30 days from invoice date',
    redFlag: 'payment terms shorter than 30 days or penalties exceeding 1.5% per month',
    keywords: ['payment', 'invoice', 'fee', 'fees', 'due', 'net', 'days', 'billing', 'payable'],
    riskKeywords: ['net 7', 'net 10', 'net 15', 'immediate payment', 'upon receipt', 'penalty', 'interest on late'],
    thresholds: {
      acceptable: 'Net 30 days',
      negotiable: 'Net 15 days',
      unacceptable: 'Net 7 days or less',
    },
    policyText: 'Payment shall be due within thirty (30) days of receipt of a valid invoice. Late payment interest shall not exceed 1.5% per month.',
    defaultRiskWeight: 15,
  },
  termination: {
    id: 'termination',
    name: 'Termination Notice',
    preferredPosition: '30-day written notice for convenience termination',
    redFlag: 'immediate termination rights without notice or cause',
    keywords: ['termination', 'terminate', 'terminating', 'notice', 'cancel', 'cancellation', 'end', 'exit'],
    riskKeywords: ['immediate', 'immediately', 'without notice', 'at will', 'without cause', 'sole discretion'],
    thresholds: {
      acceptable: '30 days notice',
      negotiable: '14 days notice',
      unacceptable: 'immediate or no notice',
    },
    policyText: 'Either party may terminate this Agreement for convenience upon thirty (30) days prior written notice to the other party.',
    defaultRiskWeight: 15,
  },
  confidentiality: {
    id: 'confidentiality',
    name: 'Confidentiality',
    preferredPosition: 'Mutual obligations with 3-year post-term survival',
    redFlag: 'one-sided confidentiality obligations or no post-term survival',
    keywords: ['confidential', 'confidentiality', 'proprietary', 'secret', 'nda', 'non-disclosure', 'disclose'],
    riskKeywords: ['one-way', 'unilateral', 'disclosing party only', 'no survival', 'expires', 'perpetual'],
    thresholds: {
      acceptable: 'Mutual, 3-year survival',
      negotiable: 'Mutual, 2-year survival',
      unacceptable: 'One-sided or no survival clause',
    },
    policyText: 'Each party shall maintain the confidentiality of the other party\'s Confidential Information. These obligations shall survive termination of this Agreement for a period of three (3) years.',
    defaultRiskWeight: 20,
  },
  indemnification: {
    id: 'indemnification',
    name: 'Indemnification',
    preferredPosition: 'Mutual, limited to third-party IP and gross negligence claims',
    redFlag: 'broad unilateral indemnification or uncapped indemnity obligations',
    keywords: ['indemnif', 'hold harmless', 'defend', 'indemnification', 'third party claim'],
    riskKeywords: ['fully indemnify', 'all claims', 'any claim', 'unlimited', 'broad indemnification', 'one-sided'],
    thresholds: {
      acceptable: 'Mutual, limited scope',
      negotiable: 'Mutual with carve-outs',
      unacceptable: 'Unilateral or uncapped',
    },
    policyText: 'Each party shall indemnify, defend, and hold harmless the other from third-party claims arising from: (a) infringement of third-party intellectual property rights; (b) gross negligence or willful misconduct.',
    defaultRiskWeight: 20,
  },
  intellectualProperty: {
    id: 'intellectualProperty',
    name: 'Intellectual Property',
    preferredPosition: 'Company retains IP; licenses granted for specific use only',
    redFlag: 'broad IP assignments or work-for-hire provisions claiming company IP',
    keywords: ['intellectual property', 'ip', 'copyright', 'patent', 'trademark', 'ownership', 'work for hire', 'invention'],
    riskKeywords: ['assigns', 'transfer', 'work for hire', 'all rights', 'ownership transfers', 'irrevocable license'],
    thresholds: {
      acceptable: 'Each party retains own IP',
      negotiable: 'Limited joint ownership of jointly developed IP',
      unacceptable: 'Assignment of company pre-existing IP',
    },
    policyText: 'Each party shall retain ownership of its pre-existing intellectual property. Jointly developed intellectual property shall be governed by a separate written agreement.',
    defaultRiskWeight: 25,
  },
  dataProtection: {
    id: 'dataProtection',
    name: 'Data Protection',
    preferredPosition: 'GDPR/CCPA compliant data processing with breach notification within 72 hours',
    redFlag: 'no data protection obligations or breach notification exceeding 30 days',
    keywords: ['data', 'privacy', 'personal data', 'gdpr', 'ccpa', 'data protection', 'processing', 'breach'],
    riskKeywords: ['no data obligations', 'unrestricted data use', 'third party sharing', 'no breach notice', 'unlimited retention'],
    thresholds: {
      acceptable: 'GDPR/CCPA compliant, 72-hour breach notice',
      negotiable: '30-day breach notification',
      unacceptable: 'No data protection provisions',
    },
    policyText: 'Each party shall comply with applicable data protection laws including GDPR and CCPA. Data breaches shall be notified within seventy-two (72) hours of discovery.',
    defaultRiskWeight: 20,
  },
  governingLaw: {
    id: 'governingLaw',
    name: 'Governing Law',
    preferredPosition: 'State of Delaware, USA, with arbitration for disputes',
    redFlag: 'foreign jurisdiction without arbitration or litigation in inconvenient forums',
    keywords: ['governing law', 'jurisdiction', 'arbitration', 'dispute', 'venue', 'forum', 'applicable law'],
    riskKeywords: ['foreign court', 'international arbitration', 'exclusive jurisdiction', 'courts of', 'foreign law'],
    thresholds: {
      acceptable: 'Delaware or agreed US state with arbitration',
      negotiable: 'Mutual agreed US federal court',
      unacceptable: 'Foreign jurisdiction without arbitration',
    },
    policyText: 'This Agreement shall be governed by the laws of the State of Delaware. All disputes shall be resolved through binding arbitration under AAA Commercial Rules.',
    defaultRiskWeight: 10,
  },
};

export const RISK_LEVELS = {
  CRITICAL: { label: 'Critical', min: 80, color: '#ff4757', bg: 'rgba(255, 71, 87, 0.15)' },
  HIGH: { label: 'High', min: 60, color: '#ff6b35', bg: 'rgba(255, 107, 53, 0.15)' },
  MEDIUM: { label: 'Medium', min: 35, color: '#ffa502', bg: 'rgba(255, 165, 2, 0.15)' },
  LOW: { label: 'Low', min: 0, color: '#2ed573', bg: 'rgba(46, 213, 115, 0.15)' },
};

export function getRiskLevel(score) {
  if (score >= 80) return RISK_LEVELS.CRITICAL;
  if (score >= 60) return RISK_LEVELS.HIGH;
  if (score >= 35) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}
