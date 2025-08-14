export const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

//기본 에이전트 설정 (Specific한 설정이 없으면 이 설정을 사용)
export const DEFAULT_AGENT_CONFIG = {
  vendor: 'gemini',
  model: 'gemini-2.5-flash',
  temperature: 0.6,
  systemPrompt: undefined,
  agentRole: 'defaultResponder',
};

// 에이전트 레지스트리: endpoint와 개별 설정(override)만 기록
export const AGENTS = {
  reportAgent: {
    label: '보고서 에이전트',
    description: '요약/보고서 생성 특화 에이전트',
    endpoint: '/report',
    config: { model: 'gemini-2.5-flash', temperature: 0.0 },
  },
};

// 에이전트 이름으로 최종 LLM 설정을 가져옵니다. (DEFAULT 병합 + override만 적용)
export function getAgentConfig(agentName) {
  const override = (agentName && AGENTS?.[agentName]?.config) || {};
  return { ...DEFAULT_AGENT_CONFIG, ...override };
}

export const DEFAULT_REPORT_SPEC = {
  default: '당신은 에이전트입니다',
};

// 에이전트별 SPEC(역할/형식 등) 오버라이드 (선택)
// 필요 시 개별 에이전트 스펙만 여기에 정의 (없으면 기본 스펙 사용)
export const AGENT_SPECS = {
  // reportAgent 전용 스펙
  reportAgent: {
    default: '당신은 에이전트입니다',
    reportType: '일반 보고서',
    audience: '부모',
    tone: '전문적이고 차분한',
    length: 'A4 1-2쪽',
    language: 'ko',
    format: 'markdown',
    sections: ['요약', '핵심 내용', '권고사항'],
    includeSummary: true,
    citations: false,
  },
};

// 에이전트 이름으로 SPEC을 가져옵니다. 없으면 기본값 반환
export function getAgentSpec(agentName) {
  return (agentName && AGENT_SPECS?.[agentName]) || DEFAULT_REPORT_SPEC;
}

// 에이전트 이름으로 전체 엔드포인트(URL)를 반환
export function getAgentEndpoint(agentName) {
  const path = (agentName && AGENTS?.[agentName]?.endpoint) || '/report';
  return `${BACKEND_BASE_URL}${path}`;
}

// 현재 사용 가능한 에이전트 목록(이름 배열)
export function listAgentNames() {
  return Object.keys(AGENTS);
}

// 현재 사용 가능한 에이전트 메타 목록(이름/라벨/설명/엔드포인트/최종 설정/스펙)
export function listAgents() {
  return Object.keys(AGENTS).map((name) => ({
    name,
    label: AGENTS[name]?.label || name,
    description: AGENTS[name]?.description || '',
    endpoint: getAgentEndpoint(name),
    config: getAgentConfig(name),
    spec: getAgentSpec(name),
  }));
}