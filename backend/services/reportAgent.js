const { createGeminiChat, normalizeGeminiModel } = require('./modelFactory');

function buildSystemPrompt({ systemPrompt, spec }) {
  const base = systemPrompt || (spec && typeof spec === 'object' && spec.default) || 'You are a professional report writing assistant. Produce accurate, well-structured, and concise reports.';
  const lines = [base];
  if (!spec || typeof spec !== 'object') return lines.join('\n');

  for (const [key, value] of Object.entries(spec)) {
    if (key === 'default') continue; // default는 시스템 프롬프트로만 사용하고 본문에 출력하지 않음
    if (value === undefined || value === null) continue;
    const keyLabel = String(key).trim();
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${keyLabel}:`);
      for (const item of value) {
        if (item === undefined || item === null || String(item).trim() === '') continue;
        lines.push(`- ${typeof item === 'string' ? item : JSON.stringify(item)}`);
      }
      continue;
    }
    if (typeof value === 'object') {
      lines.push(`${keyLabel}: ${JSON.stringify(value)}`);
      continue;
    }
    const primitive = String(value).trim();
    if (primitive !== '') lines.push(`${keyLabel}: ${primitive}`);
  }

  return lines.join('\n');
}

async function reconstructLangChainHistory(history) {
  const { HumanMessage, AIMessage } = await import('@langchain/core/messages');
  function isHumanLangChainMessage(msg) {
    return msg?.id && Array.isArray(msg.id) && msg.id[msg.id.length - 1] === 'HumanMessage';
  }
  return Array.isArray(history)
    ? history.map((msg) => {
        const content = msg?.kwargs?.content ?? msg?.content ?? '';
        return isHumanLangChainMessage(msg) ? new HumanMessage(content) : new AIMessage(content);
      })
    : [];
}

async function runReportAgent({ input, history, context, config, spec }) {
  const { vendor = 'gemini', model = 'gemini-2.5-flash', temperature, systemPrompt } = config || {};
  if (String(vendor).toLowerCase() !== 'gemini') {
    throw new Error('현재 보고서 에이전트는 vendor=gemini만 지원합니다.');
  }

  const normalizedModel = normalizeGeminiModel(model);
  const chat = await createGeminiChat({
    apiKey: process.env.GEMINI_API_KEY,
    model: normalizedModel,
    temperature,
  });

  const { ChatPromptTemplate, MessagesPlaceholder } = await import('@langchain/core/prompts');
  const { RunnableSequence } = await import('@langchain/core/runnables');
  const { HumanMessage } = await import('@langchain/core/messages');

  const lcHistory = await reconstructLangChainHistory(history);

  const sys = buildSystemPrompt({ systemPrompt, spec });
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', sys],
    new MessagesPlaceholder('history'),
    ['human', 'User request:\n{input}\n\nContext (optional):\n{context}'],
  ]);

  const chain = RunnableSequence.from([prompt, chat]);
  const response = await chain.invoke({ input, history: lcHistory, context: context || '' });
  const content = typeof response?.content === 'string'
    ? response.content
    : Array.isArray(response?.content)
      ? response.content.map((p) => p?.text || '').join('\n')
      : String(response?.content ?? '');

  return {
    success: true,
    content,
    meta: { vendor: 'gemini', model: normalizedModel, temperature: typeof temperature === 'number' ? temperature : undefined },
  };
}

module.exports = { runReportAgent };



