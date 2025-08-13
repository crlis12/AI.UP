export const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

export const DEFAULT_AGENT_CONFIG = {
  vendor: 'gemini',
  model: 'gemini-2.5-flash',
  temperature: 0.0,
  systemPrompt: undefined,
  agentRole: 'defaultResponder',
};

export const DEFAULT_REPORT_SPEC = {
  reportType: '육아일지 기반 아동발달 상황 브리핑 보고서',
  audience: '부모',
  tone: '전문적이고 차분한',
  length: '간결하게',
  language: '한국어',
  format: 'markdown',
  sections: ['요약', '핵심 내용', '권고사항', 'K-DST 문항별 점수 채점 및 또래 아동과 비교'],
  includeSummary: true,
  citations: false,
};

