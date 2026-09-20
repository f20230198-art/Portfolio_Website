export type View = 'work' | 'research' | 'systems' | 'fieldwork';

export type Investigation = {
  id: string;
  name: string;
  shortName: string;
  number: string;
  category: 'RESEARCH' | 'SYSTEM' | 'FIELDWORK';
  year: string;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor?: 'start' | 'end';
  system: string;
  question: string;
  method: string;
  finding: string;
  evidence: string;
  evidenceUrl?: string;
  evidenceLinkLabel?: string;
  marker?: string;
};

export const investigations: Investigation[] = [
  {
    id: 'ai-security-research', name: 'AI security research', shortName: 'AI security', number: '01', category: 'RESEARCH', year: '2026—27',
    x: 281, y: 254, labelX: 297, labelY: 243,
    system: 'Adversarial ML investigations',
    question: 'Which security guarantees survive an adaptive attacker?',
    method: 'Reproduction · threat-model review · adaptive evaluation',
    finding: 'Current work probes assumptions behind machine-learning defenses.',
    evidence: 'First-author AAAI 2027 submission · under review',
    marker: 'Research programme',
  },
  {
    id: 'weights-arent-enough', name: 'Weights Aren’t Enough', shortName: 'Weights Aren’t Enough', number: '02', category: 'RESEARCH', year: '2027',
    x: 550, y: 190, labelX: 566, labelY: 178,
    system: 'LoRA backdoor detector audit',
    question: 'Can weight-space signals reliably expose a backdoor?',
    method: 'Detector reproduction · dataset asymmetry and probe audit · adaptive attacks',
    finding: 'Adaptive attacks defeat detection while keeping the backdoor functional.',
    evidence: 'First-author AAAI 2027 submission · under review',
    marker: 'Assumption under test',
  },
  {
    id: 'sentinelx', name: 'SentinelX', shortName: 'SentinelX', number: '03', category: 'SYSTEM', year: '2026',
    x: 221, y: 470, labelX: 236, labelY: 458,
    system: 'Threat-intelligence platform',
    question: 'How can fragmented threat signals become inspectable?',
    method: 'Tor collection from a synthetic .onion forum · IOC extraction · Mistral pipeline · ATT&CK mapping',
    finding: 'Live investigation across an SSE timeline, ATT&CK heatmap, and IOC pivot graphs.',
    evidence: '236+ enriched posts · 14-tactic heatmap · live SSE timeline',
    evidenceUrl: 'https://github.com/f20230198-art/SentinalX',
    evidenceLinkLabel: 'Inspect source repository',
    marker: 'Threat analysis',
  },
  {
    id: 'propnet', name: 'PropNet', shortName: 'PropNet', number: '04', category: 'SYSTEM', year: '2026',
    x: 367, y: 83, labelX: 381, labelY: 70,
    system: 'Graph-based misinformation detector',
    question: 'Does propagation structure improve classification?',
    method: 'DistilBERT embeddings · graph attention · seven structural motifs',
    finding: 'ROC-AUC 0.989 ± 0.004 across five pooled-test seeds.',
    evidence: 'Text-only BERT 0.973 · motif-only random forest 0.795',
    marker: 'Measured performance',
  },
  {
    id: 'doom-engine', name: 'DOOM Engine', shortName: 'DOOM Engine', number: '05', category: 'SYSTEM', year: '2026',
    x: 703, y: 87, labelX: 718, labelY: 74,
    system: 'Multi-agent LLM trading system',
    question: 'Can specialized agents make accountable decisions?',
    method: 'Nine-agent orchestration · regime detection · vector memory · risk gate',
    finding: 'Decisions and agent-level P&L are traceable through paper trades.',
    evidence: '60-second async cycle · live Alpaca paper-trade pipeline',
    evidenceUrl: 'https://github.com/f20230198-art/AI_Trading_engine',
    evidenceLinkLabel: 'Inspect source repository',
    marker: 'Decision pipeline',
  },
  {
    id: 'cyberscan', name: 'CyberScan', shortName: 'CyberScan', number: '06', category: 'SYSTEM', year: '2025',
    x: 507, y: 510, labelX: 522, labelY: 498,
    system: 'Web vulnerability scanner',
    question: 'Which site weaknesses can be surfaced systematically?',
    method: 'Form crawling · SQLi and XSS payloads · TLS and header checks',
    finding: 'Weighted issue scoring with reproducible findings.',
    evidence: '20+ SQLi payloads · 15+ XSS payloads · 0–100 score',
    evidenceUrl: 'https://github.com/f20230198-art/CyberScan',
    evidenceLinkLabel: 'Inspect source repository',
    marker: 'Application testing',
  },
  {
    id: 'offensive-security', name: 'Offensive security', shortName: 'Offensive security', number: '07', category: 'FIELDWORK', year: '2025—26',
    x: 688, y: 359, labelX: 704, labelY: 347,
    system: 'Security testing and CTF work',
    question: 'Where do application trust boundaries fail?',
    method: 'Web testing · exploitation · challenge solving',
    finding: 'First place in a 48-hour CTF among 30+ teams.',
    evidence: '19 of 20 challenges solved · ACM BPDC CTF 2025',
    marker: 'Field result',
  },
  {
    id: 'gdg-leadership', name: 'GDG leadership', shortName: 'GDG leadership', number: '08', category: 'FIELDWORK', year: '2025—',
    x: 743, y: 571, labelX: 728, labelY: 558, anchor: 'end',
    system: 'Campus technical leadership',
    question: 'How can security practice be taught and applied?',
    method: 'Hackathons · CTFs · workshops · leaderboard audit and server-side fix',
    finding: 'Found and fixed an unguarded score-submission path.',
    evidence: 'GDG on Campus Tech Lead · hackathons, CTFs and workshops',
    marker: 'Community practice',
  },
];

export type Connection = {
  id: string;
  from: string;
  to: string;
  label: string;
  bend: number;
};

export const connections: Connection[] = [
  { id: 'research-output', from: 'ai-security-research', to: 'weights-arent-enough', label: 'research output', bend: -23 },
  { id: 'adaptive-attack', from: 'weights-arent-enough', to: 'offensive-security', label: 'adaptive attack method', bend: 31 },
  { id: 'model-evaluation', from: 'ai-security-research', to: 'propnet', label: 'model evaluation', bend: -25 },
  { id: 'decision-systems', from: 'propnet', to: 'doom-engine', label: 'decision systems', bend: 13 },
  { id: 'testing', from: 'offensive-security', to: 'cyberscan', label: 'security analysis', bend: -23 },
  { id: 'triage', from: 'cyberscan', to: 'sentinelx', label: 'security analysis', bend: 29 },
  { id: 'teaching', from: 'offensive-security', to: 'gdg-leadership', label: 'practice and teaching', bend: -17 },
];

export const viewMembers: Record<View, string[]> = {
  work: investigations.map((item) => item.id),
  research: ['ai-security-research', 'weights-arent-enough', 'propnet'],
  systems: ['sentinelx', 'propnet', 'doom-engine', 'cyberscan'],
  fieldwork: ['offensive-security', 'gdg-leadership'],
};

export const itemById = Object.fromEntries(investigations.map((item) => [item.id, item])) as Record<string, Investigation>;

export type Chapter = 'identity' | 'research' | 'systems' | 'fieldwork';
export type PearlId = 'identity' | string;
export type PearlPresentation = {
  position: [number, number, number];
  radius: number;
  proof: string;
  proofLabel: string;
  summary: string;
  chapter: Chapter;
};

export const pearlPresentation: Record<string, PearlPresentation> = {
  identity: { position: [0, 0, 0], radius: 1.05, proof: '8.96 / 10.0', proofLabel: 'CGPA · BITS PILANI, DUBAI', summary: 'Computer Science student investigating security assumptions in machine-learning systems.', chapter: 'identity' },
  'ai-security-research': { position: [-3.2, 1.25, -.5], radius: .49, proof: 'Adaptive', proofLabel: 'ADVERSARIAL ML RESEARCH', summary: 'Which security guarantees survive an attacker who knows the defense?', chapter: 'research' },
  'weights-arent-enough': { position: [-1.35, 2.0, .35], radius: .7, proof: 'AAAI 2027', proofLabel: 'FIRST-AUTHOR SUBMISSION · UNDER REVIEW', summary: 'Adaptive attacks defeat a LoRA backdoor detector while keeping the backdoor functional.', chapter: 'research' },
  propnet: { position: [1.15, 2.15, -.6], radius: .55, proof: '0.989', proofLabel: '± 0.004 ROC-AUC · FIVE SEEDS', summary: 'Graph-based misinformation detection using language and propagation structure.', chapter: 'research' },
  sentinelx: { position: [3.05, .55, .05], radius: .7, proof: '236+', proofLabel: 'ENRICHED THREAT POSTS', summary: 'From fragmented threat signals to an inspectable, live investigation.', chapter: 'systems' },
  'doom-engine': { position: [2.7, -1.6, -.75], radius: .52, proof: '9 agents', proofLabel: 'ONE ACCOUNTABLE DECISION PIPELINE', summary: 'An LLM trading system with traceable decisions, risk gates, and paper trades.', chapter: 'systems' },
  cyberscan: { position: [.65, -2.2, .3], radius: .47, proof: '0–100', proofLabel: 'WEIGHTED ISSUE SCORE', summary: 'Systematic web testing, from forms and payloads to TLS and security headers.', chapter: 'systems' },
  'offensive-security': { position: [-1.75, -1.55, .4], radius: .62, proof: '1st', proofLabel: '48-HOUR CTF · 30+ TEAMS', summary: '19 of 20 challenges solved. Application trust boundaries tested in practice.', chapter: 'fieldwork' },
  'gdg-leadership': { position: [-3.55, -1.0, -.7], radius: .47, proof: 'Tech Lead', proofLabel: 'GDG ON CAMPUS · HACKATHONS, CTFS & WORKSHOPS', summary: 'GDG on Campus Tech Lead. Running hackathons, CTFs and workshops — teaching security, building challenges, and fixing real flaws.', chapter: 'fieldwork' },
};

export const chapters: { id: Chapter; number: string; title: string; subtitle: string; members: string[] }[] = [
  { id: 'identity', number: '01', title: 'A connected body\nof work.', subtitle: 'Research, systems, and the questions between them.', members: Object.keys(pearlPresentation) },
  { id: 'research', number: '02', title: 'Question the\nguarantee.', subtitle: 'Security assumptions, under examination.', members: ['ai-security-research', 'weights-arent-enough', 'propnet'] },
  { id: 'systems', number: '03', title: 'Make intelligence\ninspectable.', subtitle: 'Working systems. Traceable decisions.', members: ['sentinelx', 'doom-engine', 'cyberscan', 'propnet'] },
  { id: 'fieldwork', number: '04', title: 'Put it\nto the test.', subtitle: 'Security in practice. Knowledge shared.', members: ['offensive-security', 'gdg-leadership'] },
];

export const links = {
  email: 'mailto:shhonyal@gmail.com',
  github: 'https://github.com/f20230198-art',
  linkedin: 'https://linkedin.com/in/srivathsa-honyal-8352a828b',
};
