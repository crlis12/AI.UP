export const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// 기본 에이전트 설정(프론트에서 전달 가능). 필요 시 화면에서 바꿔주면 됨
export const DEFAULT_AGENT_CONFIG = {
  vendor: 'gemini',
  model: 'gemini-2.5-flash', // 'gemini-2.5-pro' 등으로 교체 가능
  temperature: 0.6,
  systemPrompt: undefined,
  agentRole: 'defaultResponder',
};

