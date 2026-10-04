/**
 * Portfolio content — the only file you need to edit to change what the site says.
 * Artwork, layout and motion live in separate files and never read text from anywhere but here.
 */

export type ProjectImage = {
  /** Path under /public (e.g. '/work/propnet-01.jpg'). Leave out to show placeholder art. */
  src?: string;
  alt: string;
  caption: string;
};

export type ZoneId = 'aisec' | 'ml' | 'cyber';

export type Project = {
  id: string;
  zone: ZoneId;
  title: string;
  year: string;
  kind: string;
  /** Short stack line shown under the title. */
  stack: string;
  summary: string;
  role: string;
  problem: string;
  process: string[];
  images: ProjectImage[];
  outcome: string;
  link?: { label: string; href: string };
};

/** Smaller pieces of work: one line each, listed under a zone's featured projects. */
export type ShelfItem = { title: string; line: string; href: string };

const GH = 'https://github.com/f20230198-art';

export const profile = {
  name: 'Srivathsa Honyal',
  discipline: 'AI Security · Machine Learning · Offensive Security',
  intro: 'I break machine learning defenses to find out what they really guarantee, and I build ML systems that hold up when someone tries the same on them.',
  email: 'shhonyal@gmail.com',
  links: [
    { label: 'GitHub', href: GH },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/srivathsa-honyal' },
  ],
};

export const scenes = {
  opening: {
    eyebrow: profile.discipline,
    title: profile.name,
    body: profile.intro,
    primary: { label: 'Explore my work', href: '#aisec' },
    secondary: { label: 'About me', href: '#about' },
    hint: 'Psst — the slime likes to be poked.',
  },
  destination: {
    eyebrow: 'The greenhouse',
    title: 'About me',
    body: 'Computer Science at BITS Pilani, Dubai (CGPA 8.96, class of 2027). I care about evaluation that survives an adversary: honest baselines, ablations, and attacking my own work before anyone else does.',
    contactLead: 'Working on ML security, or need something broken carefully? Say hello.',
  },
};

export const zones: { id: ZoneId; eyebrow: string; title: string; body: string; shelf: ShelfItem[] }[] = [
  {
    id: 'aisec',
    eyebrow: 'I · The moonlit pool',
    title: 'AI Security',
    body: 'Auditing the defenses that are supposed to keep ML models honest, and showing where their guarantees break.',
    shelf: [],
  },
  {
    id: 'ml',
    eyebrow: 'II · The shaded grove',
    title: 'Machine Learning',
    body: 'End-to-end ML systems: sequence models, graph neural networks and LLM agents, measured against real baselines.',
    shelf: [
      { title: 'EdgeFusion', line: 'Federated multi-modal anomaly detection for smart cities · ResearchX 2026', href: `${GH}/EdgeFusion` },
      { title: 'SmartProcure', line: 'Four AI agents that debate procurement decisions inside Odoo 19', href: `${GH}/SmarpProcure` },
      { title: 'TrustPulse', line: 'Real-time social-media crisis intelligence for banking', href: `${GH}/TrustPulse` },
      { title: 'Replayable mini-RAG', line: 'Local, citation-strict retrieval pipeline with built-in evaluation', href: `${GH}/online-assessment-deriv` },
    ],
  },
  {
    id: 'cyber',
    eyebrow: 'III · The old roots',
    title: 'Cybersecurity',
    body: 'Offensive tooling and threat intelligence, from scanners that crawl and fuzz to a dark-web intel pipeline.',
    shelf: [
      { title: 'SQLi Scanner', line: 'Crawls web forms and fuzzes inputs for SQL injection', href: `${GH}/SQLi-Scanner` },
      { title: 'Phishing URL Detector', line: 'Feature-based phishing detection on the VirusTotal API', href: `${GH}/phishing-url-detector` },
      { title: 'TECHCORP // BREACH', line: 'A cinematic, mobile-first CTF I built for live workshops', href: `${GH}/Cyber_Game` },
      { title: 'Bug Bounty Workshop', line: 'Three days from zero to a first bug report', href: `${GH}/Bug-Bounty-Hunting` },
    ],
  },
];

export const projects: Project[] = [
  // ── AI Security ──
  {
    id: 'lora-backdoor',
    zone: 'aisec',
    title: 'Weights Aren’t Enough',
    year: '2026',
    kind: 'Research · first-author paper, in revision',
    stack: 'LoRA / PEFT · PyTorch · adversarial ML',
    summary: 'An audit of the leading weight-space defense for detecting backdoors in LoRA-adapted language models.',
    role: 'First author',
    problem: 'A published detector claimed it could spot backdoored LoRA adapters from their weights alone. If that held, it would make adapter marketplaces much safer, so it was worth checking whether the signal it learned was really about backdoors.',
    process: [
      'Reproduced the detector at the code level, not just from the paper',
      'Traced its reported performance to dataset asymmetry, a hardcoded single-layer probe and evaluation-set-tuned hyperparameters',
      'Designed adaptive attacks that keep the backdoor fully functional while collapsing the detector’s separation margin',
    ],
    images: [{ alt: 'Detector separation margin before and after adaptive attack', caption: 'Separation margin collapses under adaptive attack' }],
    outcome: 'Weight-space signals alone are not enough for trustworthy adapter auditing. First-author paper, now being revised for resubmission.',
    link: { label: 'View on GitHub', href: `${GH}/LoraBackdoorDetection` },
  },
  {
    id: 'ownership-spoof',
    zone: 'aisec',
    title: 'Spoofing Dataset Ownership',
    year: '2027',
    kind: 'Research · in preparation',
    stack: 'Data Taggants · CertDW · certified watermarking',
    summary: 'Attacking the false-positive guarantee of dataset ownership verification.',
    role: 'First author',
    problem: 'Data Taggants (ICLR 2025) promises that an innocent model can never be falsely accused of training on a protected dataset. Ownership schemes are usually tested against evasion, rarely against false accusation.',
    process: [
      'Modelled an adversary who wants to frame a model, not hide one',
      'Induced the verification signal in models that never saw the data',
      'Extending the audit to CertDW and related certified watermarking schemes',
    ],
    images: [{ alt: 'Verification signal in a model that never trained on the data', caption: 'A verification signal, without the data' }],
    outcome: 'In preparation as a first-author paper.',
  },
  {
    id: 'ml-dsa',
    zone: 'aisec',
    title: 'Threshold ML-DSA Cryptanalysis',
    year: '2026',
    kind: 'Research · in progress',
    stack: 'Post-quantum signatures · NIST MPTC',
    summary: 'Assessing the threshold ML-DSA proposals in the NIST Multi-Party Threshold Cryptography first call.',
    role: 'Researcher',
    problem: 'Threshold versions of ML-DSA (Mithril, Quorus, SplitForge/Trilithium, TALUS) split a post-quantum signing key across parties. Each brings new ways to leak information about it.',
    process: [
      'Literature and specification review of all four proposals',
      'Building a reusable leakage-analysis framework across them',
    ],
    images: [{ alt: 'Threshold signing protocol overview', caption: 'Four proposals, one leakage lens' }],
    outcome: 'Specification assessment complete; experiments in progress.',
    link: { label: 'View on GitHub', href: `${GH}/ML-DSA` },
  },

  // ── Machine Learning ──
  {
    id: 'exam-drift',
    zone: 'ml',
    title: 'Behavioral Drift Detection',
    year: '2026',
    kind: 'ML system',
    stack: 'PyTorch · scikit-learn · Streamlit',
    summary: 'Scoring how far an online exam session drifts from that student’s own normal behaviour.',
    role: 'Sole developer',
    problem: 'Proctoring tools flag students against a population average, which punishes anyone who simply works differently. Integrity checks should compare a student to themselves, and be auditable for bias.',
    process: [
      'Built per-student behavioural baselines from EdNet-KT2 and OULAD',
      'Trained a Transformer drift classifier against LSTM, One-Class SVM, Isolation Forest, autoencoder and rule-based baselines',
      'Audited fairness across gender, age and disability, with gradient attribution for every flag',
      'Shipped a live Streamlit dashboard and a pytest suite on GitHub Actions CI',
    ],
    images: [{ alt: 'Drift dashboard', caption: 'Live dashboard running real inference' }],
    outcome: 'F1 0.774 and ROC-AUC 0.959, ahead of every baseline, with per-flag explanations.',
    link: { label: 'View on GitHub', href: `${GH}/exam-integrity-detection` },
  },
  {
    id: 'propnet',
    zone: 'ml',
    title: 'PropNet',
    year: '2026',
    kind: 'Graph ML',
    stack: 'PyTorch Geometric · DistilBERT · Flask · D3',
    summary: 'Detecting misinformation from how it spreads, not only from what it says.',
    role: 'Sole developer',
    problem: 'Text-only fake-news classifiers miss the shape of a story’s spread, which is often the clearest signal.',
    process: [
      'Embedded each post in a UPFD propagation tree with DistilBERT',
      'Ran a Graph Attention Network over the tree, fused with 7 structural motif features through a learned attention gate',
      'Evaluated on a 5-seed pooled test against text-only and motif-only baselines',
      'Shipped a Flask + D3.js demo at about 30 ms per graph',
    ],
    images: [{ alt: 'Propagation tree visualization', caption: 'A propagation tree in the D3 demo' }],
    outcome: 'ROC-AUC 0.989 ± 0.004, beating text-only BERT (0.973) and motif-only Random Forest (0.795).',
  },
  {
    id: 'doom-engine',
    zone: 'ml',
    title: 'DOOM Engine',
    year: '2026',
    kind: 'Multi-agent LLM system',
    stack: 'Python · FastAPI · Alpaca · ChromaDB',
    summary: 'Nine LLM agents that trade together on a 60-second cycle.',
    role: 'Sole developer',
    problem: 'A single model asked to trade mixes up research, risk and execution. Splitting them into agents only helps if something resolves their disagreements.',
    process: [
      'Nine agents: market intel, sector specialists, sentiment, strategy, risk and execution',
      'An orchestrator that resolves conflicts and makes the final go/no-go call',
      'HMM market-regime detection that changes how agents behave',
      'ChromaDB memory to recall similar past decisions, and per-agent P&L attribution',
    ],
    images: [{ alt: 'Agent orchestration diagram', caption: 'Agents, orchestrator and memory' }],
    outcome: 'Runs autonomously on live Alpaca paper trading, with every decision attributable to an agent.',
    link: { label: 'View on GitHub', href: `${GH}/AI_Trading_engine` },
  },

  // ── Cybersecurity ──
  {
    id: 'sentinelx',
    zone: 'cyber',
    title: 'SentinelX',
    year: '2026',
    kind: 'Threat intelligence platform',
    stack: 'Python · FastAPI · React · Tor · Mistral 7B',
    summary: 'Scraping, enriching and mapping dark-web chatter to MITRE ATT&CK.',
    role: 'Sole developer',
    problem: 'Analysts read forum posts by hand to pull out indicators and map them to techniques. Most of that can be automated.',
    process: [
      'Scraped a synthetic .onion forum over Tor SOCKS5',
      'Extracted IOCs with spaCy and regex, then enriched each post with a 4-step Mistral 7B prompt chain',
      'Mapped posts across 697 MITRE ATT&CK techniques',
      'Built a React dashboard with a live SSE timeline, a 14-tactic heatmap, IOC pivot graphs and PDF export',
    ],
    images: [{ alt: 'ATT&CK heatmap', caption: '14-tactic ATT&CK heatmap' }],
    outcome: '236+ enriched posts searchable and pivotable in one dashboard.',
    link: { label: 'View on GitHub', href: `${GH}/SentinalX` },
  },
  {
    id: 'cyberscan',
    zone: 'cyber',
    title: 'CyberScan',
    year: '2025',
    kind: 'Web security scanner',
    stack: 'Node.js · Express · Cheerio',
    summary: 'A modular scanner that scores a website’s security from 0 to 100.',
    role: 'Sole developer',
    problem: 'Small sites rarely get a pentest. A fast, honest first pass should say what is wrong and how bad it is.',
    process: [
      'Automated form crawling with SQL injection (20+ payloads) and XSS (15+ payloads) tests',
      'Checks for SSL/TLS misconfiguration, 7 security headers, and DNS / typosquatting signals',
      'A weighted 0–100 scoring engine modelled on real pentest reporting',
    ],
    images: [{ alt: 'Scan report', caption: 'A scored scan report' }],
    outcome: 'One command gives a scored, explained report over REST endpoints.',
    link: { label: 'View on GitHub', href: `${GH}/CyberScan` },
  },
];

export const experience = {
  title: 'Along the way',
  items: [
    { when: '2025', what: 'Cybersecurity Intern · Everest DG', line: 'Phishing URL detection on VirusTotal and an SQL injection scanner with reproducible PoCs.' },
    { when: '2025 –', what: 'Tech Lead · GDG on Campus, BITS Pilani Dubai', line: 'Hosting hackathons and CTFs, from inter-university to national level, including BitNBuild ’26.' },
    { when: '2025', what: '1st place · ACM BPDC CTF', line: '48 hours, 30+ teams, 19 of 20 challenges solved.' },
  ],
};

export const projectsIn = (zone: ZoneId) => projects.filter((p) => p.zone === zone);
