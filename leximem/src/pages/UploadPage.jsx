import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../App';
import { analyzeContract } from '../engine/workflowOrchestrator';
import { Upload, FileText, AlertCircle, X, ChevronRight } from 'lucide-react';

// ─── Synthetic Demo Contracts ─────────────────────────────────────────────

const DEMO_CONTRACT_1 = `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into as of March 15, 2025, between TechCorp Inc., a Delaware corporation ("Company"), and Acme Technologies, a California corporation ("Acme" or "Service Provider").

1. SERVICES
Acme Technologies shall provide software development and consulting services as described in applicable Statements of Work ("SOW").

2. FEES AND PAYMENT
All invoices are due and payable within seven (7) business days of receipt. Late payments shall incur a penalty of 3% per month, compounded monthly.

3. LIMITATION OF LIABILITY
NOTWITHSTANDING ANY OTHER PROVISION OF THIS AGREEMENT, ACME'S LIABILITY TO COMPANY SHALL BE UNLIMITED AND SHALL EXTEND TO ANY AND ALL DIRECT, INDIRECT, CONSEQUENTIAL, SPECIAL, EXEMPLARY, INCIDENTAL, AND PUNITIVE DAMAGES ARISING FROM ANY CAUSE WHATSOEVER, INCLUDING NEGLIGENCE, STRICT LIABILITY, OR BREACH OF THIS AGREEMENT, TO THE FULL EXTENT PERMITTED BY LAW.

4. TERMINATION
Acme Technologies may terminate this Agreement immediately without notice at its sole discretion if it determines that Company has violated any provision of this Agreement. Company may only terminate upon giving 90 days written notice.

5. CONFIDENTIALITY
Company shall maintain the confidentiality of all information provided by Acme Technologies during the term of this Agreement. These confidentiality obligations shall expire upon termination of this Agreement.

6. INTELLECTUAL PROPERTY
All work product, inventions, developments, and deliverables created by Acme Technologies in connection with this Agreement shall be work-for-hire and all rights, title and interest therein shall be assigned to and owned by Acme Technologies, including all intellectual property rights.

7. INDEMNIFICATION
Company shall fully indemnify, defend, and hold harmless Acme Technologies from and against any and all claims, damages, losses, costs, and expenses of any nature whatsoever (including attorneys' fees) arising from or relating to Company's use of the services provided under this Agreement, without limitation.

8. DATA PROCESSING
Acme Technologies may use, process, and share Company data with third parties for any purpose, including to train artificial intelligence models and create derivative works. Acme Technologies shall notify Company of any data breach within ninety (90) days of becoming aware of such breach.

9. GOVERNING LAW
This Agreement shall be governed by the laws of England and Wales. Any disputes shall be resolved exclusively in the courts of London, United Kingdom.

10. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

TECHCORP INC.                    ACME TECHNOLOGIES
By: ____________________         By: ____________________
Name: ___________________        Name: ___________________
Title: __________________        Title: __________________`;

const DEMO_CONTRACT_2 = `SOFTWARE LICENSE AGREEMENT

This Software License Agreement ("Agreement") is entered into as of September 10, 2025, between TechCorp Inc., a Delaware corporation ("Company" or "Licensee"), and Acme Technologies, a California corporation ("Acme" or "Licensor").

RECITALS
Company and Acme Technologies have previously engaged in negotiations regarding limitation of liability provisions, as reflected in the Master Services Agreement dated March 15, 2025.

1. LICENSE GRANT
Acme Technologies grants Company a non-exclusive, non-transferable license to use the licensed software product.

2. LICENSE FEES AND PAYMENT
License fees shall be invoiced quarterly. All invoices are due and payable within ten (10) business days of receipt. Failure to pay within the specified period shall result in a service interruption fee of 2% per month.

3. LIMITATION OF LIABILITY
THE TOTAL LIABILITY OF ACME TECHNOLOGIES TO LICENSEE UNDER THIS AGREEMENT SHALL NOT BE LIMITED AND ACME TECHNOLOGIES SHALL BE FULLY LIABLE FOR ANY AND ALL LOSSES, DAMAGES, CLAIMS, OR CAUSES OF ACTION ARISING DIRECTLY OR INDIRECTLY FROM THIS AGREEMENT OR THE USE OF THE LICENSED SOFTWARE, WITHOUT CAP OR RESTRICTION OF ANY KIND.

4. TERM AND TERMINATION
This Agreement shall commence on the effective date and continue for one (1) year. Either party may terminate upon 30 days' written notice. Acme Technologies may terminate for material breach upon 15 days' notice if the breach remains uncured.

5. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of each other's proprietary information. Confidentiality obligations shall survive termination for a period of two (2) years.

6. INTELLECTUAL PROPERTY
Acme Technologies retains all intellectual property rights in the licensed software. Company retains all rights to its pre-existing intellectual property.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California, USA, with disputes subject to arbitration under AAA rules in San Francisco, California.

IN WITNESS WHEREOF, the parties have executed this Agreement.

TECHCORP INC.                    ACME TECHNOLOGIES
By: ____________________         By: ____________________`;

export function UploadPage() {
  const { navigate, showToast, setAnalysisResult, refreshStats } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' | 'paste'
  const [analyzing, setAnalyzing] = useState(false);
  const [workflowState, setWorkflowState] = useState({ step: -1, message: '', detail: '' });
  const fileInputRef = useRef(null);

  const STEPS = [
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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, []);

  function handleFileSelect(f) {
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith('.txt') && !name.endsWith('.docx')) {
      showToast('Please upload a TXT or DOCX file. PDF requires conversion.', 'error');
      return;
    }
    setFile(f);
    showToast(`File selected: ${f.name}`, 'success');
  }

  async function runAnalysis(input) {
    setAnalyzing(true);
    setWorkflowState({ step: 0, message: STEPS[0], detail: '' });
    try {
      const result = await analyzeContract(input, (stepIdx, msg, detail) => {
        setWorkflowState({ step: stepIdx, message: msg, detail });
      });
      setAnalysisResult(result);
      refreshStats();
      showToast('Analysis complete! Reviewing results...', 'success');
      navigate('analysis');
    } catch (err) {
      showToast(`Analysis failed: ${err.message}`, 'error');
      setAnalyzing(false);
      setWorkflowState({ step: -1, message: '', detail: '' });
    }
  }

  function handleAnalyze() {
    if (mode === 'upload' && file) {
      runAnalysis(file);
    } else if (mode === 'paste' && pastedText.trim().length > 50) {
      runAnalysis(pastedText);
    } else {
      showToast('Please provide a contract file or paste contract text.', 'error');
    }
  }

  function loadDemo(which) {
    const text = which === 'demo1' ? DEMO_CONTRACT_1 : DEMO_CONTRACT_2;
    setMode('paste');
    setPastedText(text);
    setFile(null);
    showToast(`Demo Contract ${which === 'demo1' ? '1' : '2'} loaded — click Analyze to begin.`, 'info');
  }

  return (
    <div>
      <div className="page-header">
        <span className="page-header-title">📤 Analyze Contract</span>
        <span className="page-header-subtitle">Upload or paste a contract to begin autonomous analysis</span>
      </div>
      <div className="page-body">
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* AI Disclaimer */}
          <div className="ai-disclaimer" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>
              All analysis is <strong>AI-generated</strong> and must be reviewed by legal counsel before use. 
              Contracts are processed locally in your browser. Never upload confidential contracts to 
              external AI services without authorization.
            </span>
          </div>

          {/* Demo Buttons */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <span className="card-title">🧪 Demonstration Mode</span>
              <span className="synthetic-banner">Synthetic data only</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Run the required execution test with two synthetic Acme Technologies contracts to demonstrate 
              precedent memory persistence.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => loadDemo('demo1')}>
                📄 Load Demo Contract 1
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}> (Unlimited Liability)</span>
              </button>
              <button className="btn btn-secondary" onClick={() => loadDemo('demo2')}>
                🔄 Load Demo Contract 2
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}> (Memory Test)</span>
              </button>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="tabs" style={{ marginBottom: '1.25rem' }}>
            <button className={`tab-btn ${mode === 'upload' ? 'active' : ''}`} onClick={() => setMode('upload')}>
              <Upload size={14} /> Upload File
            </button>
            <button className={`tab-btn ${mode === 'paste' ? 'active' : ''}`} onClick={() => setMode('paste')}>
              <FileText size={14} /> Paste Text
            </button>
          </div>

          {/* Upload Zone */}
          {mode === 'upload' && (
            <div
              className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files[0])}
              />
              <div className="upload-icon">
                {file ? <FileText size={28} /> : <Upload size={28} />}
              </div>
              {file ? (
                <>
                  <div className="upload-title" style={{ color: 'var(--low)' }}>✅ {file.name}</div>
                  <div className="upload-subtitle">{(file.size / 1024).toFixed(1)} KB — Ready to analyze</div>
                  <button className="btn btn-secondary btn-sm" style={{ margin: '0 auto' }}
                    onClick={e => { e.stopPropagation(); setFile(null); }}>
                    <X size={12} /> Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="upload-title">Drop your contract here</div>
                  <div className="upload-subtitle">or click to browse files</div>
                  <div className="upload-formats">
                    <span className="format-pill supported">TXT ✓</span>
                    <span className="format-pill supported">DOCX ✓</span>
                    <span className="format-pill limited">PDF (convert first)</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Paste Zone */}
          {mode === 'paste' && (
            <div>
              <textarea
                rows={18}
                placeholder="Paste your contract text here (minimum 50 characters)..."
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                style={{ borderRadius: 'var(--radius-lg)' }}
              />
              {pastedText && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
                  {pastedText.split(/\s+/).filter(Boolean).length.toLocaleString()} words · {pastedText.length.toLocaleString()} characters
                </div>
              )}
            </div>
          )}

          {/* Analyze Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={analyzing || (mode === 'upload' && !file) || (mode === 'paste' && pastedText.trim().length < 50)}
              style={{ minWidth: 180 }}
            >
              {analyzing ? (
                <>
                  <div className="workflow-spinner" style={{ width: 14, height: 14 }} />
                  Analyzing...
                </>
              ) : (
                <>🔍 Run Analysis <ChevronRight size={16} /></>
              )}
            </button>
          </div>

          {/* Workflow Progress */}
          {analyzing && (
            <div className="workflow-container" style={{ marginTop: '1.5rem' }}>
              <div className="workflow-header">
                <div className="workflow-spinner" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>LexiMem Autonomous Analysis</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{workflowState.message}</div>
                </div>
              </div>
              <div className="workflow-steps">
                {STEPS.map((step, idx) => {
                  const status = idx < workflowState.step ? 'done'
                    : idx === workflowState.step ? 'active'
                    : 'waiting';
                  return (
                    <div key={idx} className={`workflow-step ${status}`}>
                      <div className={`step-icon ${status}`}>
                        {status === 'done' ? '✓' : idx + 1}
                      </div>
                      <span>Step {idx + 1}: {step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
