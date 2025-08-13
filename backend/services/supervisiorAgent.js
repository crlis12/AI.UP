/**
 * SupervisiorAgent (슈퍼바이저 에이전트)
 */

const { createGeminiChat, normalizeGeminiModel } = require('./modelFactory');
const { getAgent } = require('./childAgents');

async function selectModel({ vendor, model }) {
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

async function runSupervisiorAgent({
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

  const parts = null; // 확장 포인트

  const role = agentRole || 'defaultResponder';
  const agentFactory = getAgent(role);
  if (!agentFactory) throw new Error(`등록되지 않은 에이전트 역할: ${role}`);

  const agent = agentFactory({ model: modelInstance, systemPrompt });
  const content = await agent({ input, history, parts, file });
  return { content, provider, model: finalModel, temperature, role };
}

module.exports = { runSupervisiorAgent };


