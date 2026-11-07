// ============================================================
// LexiMem Document Parser
// Handles TXT, DOCX (via mammoth), and plain text contracts
// PDF support noted as limitation (requires server-side processing)
// ============================================================

/**
 * Parse an uploaded file and extract its text content.
 * Returns: { text, metadata, fileName, fileType, fileSize }
 */
export async function parseDocument(file) {
  const fileName = file.name;
  const fileType = getFileType(file);
  const fileSize = formatFileSize(file.size);

  if (!validateFile(file)) {
    throw new Error('Unsupported file type. Please upload a TXT or DOCX file.');
  }

  let text = '';

  if (fileType === 'txt') {
    text = await readAsText(file);
  } else if (fileType === 'docx') {
    text = await readDocx(file);
  } else if (fileType === 'pdf') {
    throw new Error(
      'PDF parsing requires server-side processing (pdf.js worker). ' +
      'Please convert your PDF to TXT or DOCX for analysis, or paste the contract text directly.'
    );
  }

  // Extract basic metadata from text
  const metadata = extractMetadata(text, fileName);

  return {
    text: text.trim(),
    metadata,
    fileName,
    fileType,
    fileSize,
    uploadedAt: new Date().toISOString(),
    characterCount: text.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

/**
 * Parse raw text directly (for paste input)
 */
export function parseRawText(text, fileName = 'Pasted Contract') {
  const metadata = extractMetadata(text, fileName);
  return {
    text: text.trim(),
    metadata,
    fileName,
    fileType: 'txt',
    fileSize: formatFileSize(text.length),
    uploadedAt: new Date().toISOString(),
    characterCount: text.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file, 'UTF-8');
  });
}

async function readDocx(file) {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (err) {
    throw new Error('Failed to parse DOCX file: ' + err.message);
  }
}

function getFileType(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) return 'txt';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'text/plain') return 'txt';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (file.type === 'application/pdf') return 'pdf';
  return 'unknown';
}

function validateFile(file) {
  const type = getFileType(file);
  return ['txt', 'docx', 'pdf'].includes(type);
}

function extractMetadata(text, fileName) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to extract contract title (first meaningful line)
  const title = extractTitle(lines, fileName);

  // Try to extract parties
  const parties = extractParties(text);

  // Try to extract dates
  const dates = extractDates(text);

  // Try to identify contract type
  const contractType = identifyContractType(text);

  return {
    title,
    parties,
    dates,
    contractType,
    effectiveDate: dates.effectiveDate || null,
    expirationDate: dates.expirationDate || null,
  };
}

function extractTitle(lines, fileName) {
  // Look for common title patterns
  for (const line of lines.slice(0, 10)) {
    if (line.match(/AGREEMENT|CONTRACT|SERVICES|LICENSE|MASTER|PROFESSIONAL/i) && line.length < 120) {
      return line.replace(/^[^a-zA-Z]*/, '').trim();
    }
  }
  // Fallback to filename
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
}

function extractParties(text) {
  const parties = [];

  // Pattern: "between [Company A] and [Company B]"
  const betweenMatch = text.match(/between\s+([\w\s,\.]+?)\s+(?:and|&)\s+([\w\s,\.]+?)(?:\s*[\(\n,])/i);
  if (betweenMatch) {
    parties.push(betweenMatch[1].trim(), betweenMatch[2].trim());
    return parties;
  }

  // Pattern: "Party A: ...\nParty B: ..."
  const partyMatch = text.match(/(?:company|client|customer|vendor|provider|licensor|licensee|supplier)[:\s]+([^\n,]{3,60})/gi);
  if (partyMatch) {
    partyMatch.slice(0, 2).forEach(m => {
      const name = m.replace(/^(company|client|customer|vendor|provider|licensor|licensee|supplier)[:\s]+/i, '').trim();
      if (name && !parties.includes(name)) parties.push(name);
    });
  }

  return parties.length > 0 ? parties : ['[Party not identified]', '[Counterparty not identified]'];
}

function extractDates(text) {
  const datePatterns = [
    /effective\s+(?:date|as of|from)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /dated?\s+(?:as of\s+)?([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/,
  ];

  const dates = {};

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      dates.effectiveDate = match[1] || match[0];
      break;
    }
  }

  // Look for expiration
  const expMatch = text.match(/(?:expir(?:es?|ation)|terminat(?:es?|ion)\s+date|end\s+date)[:\s]+([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
  if (expMatch) {
    dates.expirationDate = expMatch[1];
  }

  return dates;
}

function identifyContractType(text) {
  const upper = text.toUpperCase();
  if (upper.includes('MASTER SERVICES') || upper.includes('MSA')) return 'Master Services Agreement';
  if (upper.includes('SOFTWARE LICENSE')) return 'Software License Agreement';
  if (upper.includes('SAAS') || upper.includes('SUBSCRIPTION')) return 'SaaS Subscription Agreement';
  if (upper.includes('DATA PROCESSING') || upper.includes('DPA')) return 'Data Processing Agreement';
  if (upper.includes('NON-DISCLOSURE') || upper.includes('NDA')) return 'Non-Disclosure Agreement';
  if (upper.includes('PROFESSIONAL SERVICES')) return 'Professional Services Agreement';
  if (upper.includes('PARTNERSHIP')) return 'Partnership Agreement';
  if (upper.includes('EMPLOYMENT')) return 'Employment Agreement';
  if (upper.includes('VENDOR')) return 'Vendor Agreement';
  return 'Commercial Agreement';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
