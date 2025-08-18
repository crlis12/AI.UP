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
  multimodalAgent: {
    label: '멀티모달 캡셔너',
    description: '텍스트/이미지/비디오 입력 모두 지원, 간결한 캡션/응답 생성',
    endpoint: '/multimodal',
    config: { model: 'gemini-2.5-flash', temperature: 0.2 },
  },
  questionAgent: {
    label: '질문 응답 에이전트',
    description: '육아일기를 바탕으로 부모의 질문에 답변',
    endpoint: '/question',
    config: { model: 'gemini-2.5-flash', temperature: 0.3 },
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
// 여기 있는 스펙들이 각 에이전트의 시스템 프롬프트로 작용해서 들어감.
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
  // multimodalAgent 전용 스펙
  multimodalAgent: {
    default: '당신은 멀티모달 캡셔닝 에이전트입니다',
    audience: '일반 사용자',
    tone: '간결하고 친절한',
    length: '한두 문장',
    language: 'ko',
    format: 'plain',
    captionFocus: ['주요 대상', '핵심 동작', '배경 맥락'],
    avoid: ['추측 단정', '불필요한 감탄사'],
    includeSafety: false,
  },
  // questionAgent 전용 스펙
  questionAgent: {
    default:
      '당신은 아이의 육아일기를 참고하여 아이의 상태를 고려해 부모의 질문에 공감과 근거를 갖춘 답변을 제공하는 상담 에이전트입니다.',
    audience: '부모',
    tone: '공감적이고 실용적',
    length: '한두 문장 또는 필요한 경우 간략한 항목 나열',
    language: 'ko',
    format: 'plain',
    consider: [
      '아이의 연령 및 발달 단계',
      '최근 정서/행동 변화',
      '수면/식습관/활동량',
      '안전 이슈',
    ],
    avoid: ['의학적 진단 단정', '불필요한 불안 유발'],
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
