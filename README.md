```markdown
# Lexis-Core: Legal Contract Lifecycle & Precedent Memory Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Architecture: Antigravity](https://img.shields.io/badge/framework-Antigravity-purple.svg)]()

**Lexis-Core** (`lex-precedent`) is an autonomous, Human-in-the-Loop (HITL) agentic framework built for Enterprise Contract Lifecycle Management (CLM) and Institutional Precedent Memory Retrieval. 

The agent oversees contract operations across intake, risk analysis, negotiation, redlining, and post-execution obligation tracking. Every proposed redline and risk score is grounded in institutional precedent agreements, legal playbook baselines, and past negotiation win rates.

---

## Key Features

- **Document Ingestion & AST Parsing**: Parses `.docx` and `.pdf` files into hierarchical syntax trees, isolating standard boilerplate from bespoke, heavily negotiated provisions.
- **Precedent Memory Engine (RAG)**: Integrates vector embeddings to match incoming provisions against historical executed agreements, fallback positions (`Preferred`, `Fallback A/B`, `Walk-Away`), and empirical counterparty acceptance rates.
- **Automated OpenXML Redlining**: Generates native track-changes diffs with defensible rationale comments linked to prior executed agreements.
- **Multi-Factor Risk Telemetry**: Computes dynamic risk scores (0–100) across liability caps, indemnities, data privacy (DPA), and termination triggers.
- **Post-Execution Obligation Extraction**: Automatically parses renewal windows, cure periods, SLA thresholds, and audit milestones for downstream calendar and ERP integration.

---

## System Architecture


```

```
                   +-----------------------------+
                   |    Incoming Contract File   |
                   |        (.docx / .pdf)       |
                   +--------------+--------------+
                                  |
                                  v
                   +-----------------------------+
                   |   Parser & Structural AST   |
                   +--------------+--------------+
                                  |
   +------------------------------+------------------------------+
   |                                                             |
   v                                                             v

```

+---------------+                                             +--------------+
| Risk Scoring  |                                             | Precedent DB |
| & Escalation  |                                             | (Playbooks & |
| Matrix        |                                             | Past Deals)  |
+-------+-------+                                             +-------+------+
|                                                             |
+-----------------------------+-------------------------------+
|
v
+-----------------------------+
|   Comparative Clause Engine |
|    & Redline Generator      |
+--------------+--------------+
|
v
+-----------------------------+
| Track-Changes Export (.docx)|
| & Obligation Milestone Map  |
+-----------------------------+

```

---

## Repository Structure

```text
lex-precedent/
├── config/
│   ├── escalation_rules.yaml      # Department routing & risk thresholds
│   ├── playbook_baselines.json    # Standard fallback clause hierarchies
│   └── system_prompt.md           # Antigravity orchestration system prompt
├── data/
│   ├── sample_contracts/          # Raw test agreements (.pdf, .docx)
│   └── precedent_store/           # Sample metadata and historical deal vectors
├── src/
│   ├── ingestion/
│   │   ├── parser.py              # Structural AST and section extraction
│   │   └── chunker.py             # Semantic clause-level chunking
│   ├── memory/
│   │   ├── retriever.py           # Precedent memory retrieval logic
│   │   └── vector_store.py        # Vector database client interface
│   ├── analysis/
│   │   ├── redline_engine.py      # Automated diff generation and track changes
│   │   ├── risk_scorer.py         # Multi-factor exposure scoring
│   │   └── obligation_tracker.py  # Milestone & deadline extraction
│   └── main.py                    # Agent execution pipeline & Antigravity hooks
├── tests/
│   ├── test_ingestion.py
│   └── test_redline.py
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md

```

---

## Getting Started

### Prerequisites

* Python 3.10+
* Git
* Access to an Antigravity agent runtime or an LLM API key (OpenAI / Anthropic / Gemini)

### Quickstart

1. **Clone the repository**:
```bash
git clone [https://github.com/NandithaReddy-firestarter/lex-precedent.git](https://github.com/NandithaReddy-firestarter/lex-precedent.git)
cd lex-precedent

```


2. **Set up a virtual environment**:
```powershell
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

```


3. **Install dependencies**:
```bash
pip install -r requirements.txt

```


4. **Configure environment variables**:
```bash
cp .env.example .env

```


Add your API keys and vector database endpoints to `.env`:
```ini
LLM_API_KEY=your_llm_api_key
EMBEDDING_MODEL=text-embedding-3-large
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_API_KEY=your_vector_db_key
PLAYBOOK_PATH=config/playbook_baselines.json

```



---

## Usage

### Run Contract Review via CLI

Execute the pipeline on an incoming draft agreement:

```bash
python src/main.py \
  --input data/sample_contracts/Vendor_MSA_Draft.docx \
  --contract-type MSA \
  --leverage balanced \
  --output output/Redlined_Vendor_MSA.docx

```

### Run as an Antigravity Agent

1. Register the orchestration prompt in `config/system_prompt.md` inside your Antigravity agent profile.
2. Expose the modules in `src/analysis` and `src/memory` as Antigravity tool callbacks.
3. Pass incoming `.docx` and `.pdf` files through the pipeline triggers.

---

## Configuration

Customize risk scoring weights and clause hierarchies in `config/playbook_baselines.json`:

```json
{
  "limitation_of_liability": {
    "preferred": "Mutual aggregate cap equal to 1x annual contract value (fees paid in preceding 12 months).",
    "fallback_a": "Mutual aggregate cap equal to 2x annual contract value.",
    "fallback_b": "Unilateral cap equal to 2x contract value, with pre-approved exclusions for confidentiality only.",
    "walk_away": "Uncapped direct liability or unilateral uncapped exposure on indemnification."
  }
}

```

---

## Operational Guardrails

* **Human-in-the-Loop Requirement**: Lexis-Core provides redline recommendations and risk assessments. Final sign-off and document execution require authorized legal counsel.
* **Mandatory Sourcing**: Every proposed modification must trace back to an explicit enterprise playbook rule ID or an indexed historical precedent deal.
* **Strict Preservations**: Cross-references, internal section numbering, and defined terms are validated before exporting output files.

---

## License

Distributed under the [MIT License](https://www.google.com/search?q=LICENSE).

```
files for the lex-precedent repository."/>

```
