// questionAgent 전용 기본 설정과 시스템 프롬프트를 정의합니다.

const QUESTION_AGENT_DEFAULT_CONFIG = {
  vendor: 'gemini',
  model: 'gemini-2.5-flash',
  temperature: 0.3,
};

// 별도의 스키마 적용 없이, 백틱으로 감싼 긴 시스템 프롬프트 문자열을 사용합니다.
const QUESTION_AGENT_PROMPT = `당신은 육아상담 에이전트입니다.
사용자의 입력과 사용자가 작성한 육아일기가 입력됩니다.
사용자가 작성한 육아일기 내용을 바탕으로 사용자의 질문에 대한 대답을 해주세요
만약 육아일기 들어온게 없다면 육아일기가 없다는걸 알려주세요.`;

module.exports = {
  QUESTION_AGENT_DEFAULT_CONFIG,
  QUESTION_AGENT_PROMPT,
};
