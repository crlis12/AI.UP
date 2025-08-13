/**
 * 모델 및 관련 헬퍼 생성기
 */

function normalizeGeminiModel(model) {
  const m = String(model || '').trim().toLowerCase();
  if (!m) return 'gemini-2.5-flash';
  if (m.includes('flash')) return 'gemini-2.5-flash';
  if (m.includes('pro')) return 'gemini-2.5-pro';
  return model; // 사용자가 직접 모델명을 넣은 경우 그대로 사용
}

function getGeminiRestEndpoint(model, apiKey) {
  const modelId = normalizeGeminiModel(model);
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
}

async function createGeminiChat({ apiKey, model, temperature }) {
  const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
  const normalized = normalizeGeminiModel(model);
  return new ChatGoogleGenerativeAI({
    apiKey,
    model: normalized,
    ...(typeof temperature === 'number' ? { temperature } : {}),
  });
}

module.exports = {
  normalizeGeminiModel,
  getGeminiRestEndpoint,
  createGeminiChat,
};


