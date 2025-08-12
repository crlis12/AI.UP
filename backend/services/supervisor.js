/**
 * 슈퍼바이저 에이전트
 * - 요청 컨텍스트와 설정(모델/temperature/system prompt)을 받아
 *   어떤 하위 에이전트를 호출할지 결정하고 실행
 * - 우선 단일 에이전트(delegate 1개) 형태로 동작, 추후 멀티-스텝 오케스트레이션 확장 가능
 */

const { createGeminiChat, normalizeGeminiModel, getGeminiRestEndpoint } = require('./modelFactory');
const { getAgent } = require('./childAgents');

async function selectModel({ vendor, model }) {
  // 현재는 Gemini만, 필요 시 OpenAI 등 추가 확장
  const provider = (vendor || 'gemini').toLowerCase();
  if (provider !== 'gemini') {
    throw new Error('현재는 Gemini 공급자만 지원합니다. vendor=gemini');
  }
  return { provider, model: normalizeGeminiModel(model) };
}

async function createModelInstance({ provider, model, temperature, apiKey }) {
  if (provider === 'gemini') {
    return createGeminiChat({ apiKey, model, temperature });
  }
  throw new Error('지원하지 않는 provider 입니다.');
}

async function runSupervisor({
  input,
  history,
  file,
  config, // { vendor, model, temperature, systemPrompt, agentRole }
}) {
  const { vendor, model, temperature, systemPrompt, agentRole } = config || {};
  const { provider, model: finalModel } = await selectModel({ vendor, model });
  const modelInstance = await createModelInstance({
    provider,
    model: finalModel,
    temperature,
    apiKey: process.env.GEMINI_API_KEY,
  });

  // 파일/멀티모달 처리 확장 포인트: 필요 시 여기서 parts 생성
  const parts = null;

  // 하위 에이전트 선택 (기본값: defaultResponder)
  const role = agentRole || 'defaultResponder';
  const agentFactory = getAgent(role);
  if (!agentFactory) throw new Error(`등록되지 않은 에이전트 역할: ${role}`);

  const agent = agentFactory({ model: modelInstance, systemPrompt });
  const content = await agent({ input, history, parts, file });
  return { content, provider, model: finalModel, temperature, role };
}

module.exports = { runSupervisor };


