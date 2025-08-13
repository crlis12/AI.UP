export const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const DEFAULT_AGENT_CONFIG = {
  vendor: 'gemini',
  model: 'gemini-2.5-flash',
  temperature: 0.6,
  systemPrompt: undefined,
  agentRole: 'defaultResponder',
};

export const DEFAULT_REPORT_SPEC = {
  reportType: '일반 보고서',
  audience: '부모',
  tone: '전문적이고 차분한',
  length: 'A4 1-2쪽',
  language: 'ko',
  format: 'markdown',
  sections: ['요약', '핵심 내용', '권고사항'],
  includeSummary: true,
  citations: false,
};

