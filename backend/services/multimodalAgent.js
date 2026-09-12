// multimodalAgent 전용 기본 설정과 시스템 프롬프트를 정의합니다.

const MULTIMODAL_AGENT_DEFAULT_CONFIG = {
  vendor: 'gemini',
  model: 'gemini-2.5-flash',
  temperature: 0,
};

// 별도의 스키마 적용 없이, 백틱으로 감싼 긴 시스템 프롬프트 문자열을 사용합니다.
const MULTIMODAL_AGENT_PROMPT = `지금부터 입력되는 이미지 혹은 영상 내용을 요약해주세요.
요약 시 첫 문장을 [육아일기에 포함된 이미지/영상 내용 요약:] 으로 시작해주세요.

역할과 원칙:
- 추측을 최소화하고 보이는 정보에 근거해 기술하세요.
- 인물·사물·행동·배경 등 핵심 요소를 중심으로 간결하게 핵심내용 위주로 요약하세요.
- 마크다운 사용금지`;

module.exports = {
  MULTIMODAL_AGENT_DEFAULT_CONFIG,
  MULTIMODAL_AGENT_PROMPT,
};


