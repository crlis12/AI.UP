// questionAgent 전용 기본 설정과 시스템 프롬프트를 정의합니다.

const QUESTION_AGENT_DEFAULT_CONFIG = {
  vendor: 'gemini',
  model: 'gemini-2.5-flash',
  temperature: 0.3,
};

// 별도의 스키마 적용 없이, 백틱으로 감싼 긴 시스템 프롬프트 문자열을 사용합니다.
const QUESTION_AGENT_PROMPT = `당신은 육아상담 에이전트입니다`;

module.exports = {
  QUESTION_AGENT_DEFAULT_CONFIG,
  QUESTION_AGENT_PROMPT,
};


