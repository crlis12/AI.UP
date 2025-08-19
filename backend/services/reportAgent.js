const { createGeminiChat, normalizeGeminiModel } = require('./modelFactory');

function formatObjectAsBullets(obj, indent = 0) {
  if (!obj || typeof obj !== 'object') return '';
  const pad = '  '.repeat(indent);
  const lines = [];
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${pad}- ${key}:`);
      const nested = formatObjectAsBullets(value, indent + 1);
      if (nested) lines.push(nested);
    } else if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${pad}- ${key}:`);
      for (const item of value) {
        if (typeof item === 'object') {
          lines.push(formatObjectAsBullets(item, indent + 1));
        } else {
          lines.push(`${pad}  - ${String(item)}`);
        }
      }
    } else {
      lines.push(`${pad}- ${key}: ${String(value)}`);
    }
  }
  return lines.join('\n');
}

function buildSystemPrompt({ systemPrompt, spec, k_dst, kdstRagContext }) {
  const base = systemPrompt || 'You are a professional report writing assistant. Produce accurate, well-structured, and concise reports.';
  const lines = [base];

  // 사용자가 제공하는 systemPrompt를 중심으로, 필요한 경우 spec 기반의 메타 지시만 추가
  if (spec?.reportType) lines.push(`Report type: ${spec.reportType}`);
  if (spec?.audience) lines.push(`Target audience: ${spec.audience}`);
  if (spec?.tone) lines.push(`Tone: ${spec.tone}`);
  if (spec?.length) lines.push(`Target length: ${spec.length}`);
  if (spec?.language) lines.push(`Language: ${spec.language}`);
  if (spec?.format) lines.push(`Output format: ${spec.format}`);
  if (spec?.includeSummary) lines.push('Include an executive summary at the beginning.');
  if (spec?.citations) lines.push('Add citations or references when applicable.');

  if (spec?.sections && Array.isArray(spec.sections) && spec.sections.length > 0) {
    lines.push('Required sections:');
    for (const s of spec.sections) {
      lines.push(`- ${s}`);
    }
  }

  // 판단 기준(K-DST) 섹션 주입 (정적 가이드라인만 유지)
  if (k_dst && typeof k_dst === 'object') {
    lines.push('Decision criteria (K-DST):');
    const kd = formatObjectAsBullets(k_dst, 1);
    if (kd) lines.push(kd);
  }

  // 주의: RAG로 수집된 컨텍스트(kdstRagContext 포함)는 시스템 프롬프트에 주입하지 않습니다.
  // 해당 내용은 사용자 입력 컨텍스트(assistant 입력)로만 전달되어야 합니다.

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

async function runReportAgent({ input, history, context, config, spec, childrenContext, k_dst, kdstRagContext }) {
  const { vendor = 'gemini', model = 'gemini-2.5-pro', temperature, systemPrompt } = config || {};
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

  const sys = buildSystemPrompt({ systemPrompt, spec, k_dst, kdstRagContext });
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', sys],
    new MessagesPlaceholder('history'),
    ['human', 'User request:\n{input}\n\nContext (optional):\n{context}'],
  ]);

  // childrenContext를 컨텍스트에 구조화하여 병합
  let mergedContext = context || '';
  if (childrenContext && typeof childrenContext === 'object') {
    const block = formatObjectAsBullets(childrenContext, 0);
    if (block) {
      mergedContext = `${mergedContext}\n\n[Children Context]\n${block}`.trim();
    }
  }

  const chain = RunnableSequence.from([prompt, chat]);
  const response = await chain.invoke({ input, history: lcHistory, context: mergedContext });
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



