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

function buildSystemPrompt({ systemPrompt }) {
  // config에서 systemPrompt가 있으면 그대로 사용, 없으면 기본값
  return systemPrompt || '시스템 프롬프트 오류가 났다는 것을 알려주세요';
}

// KDST 보고서 전용 JSON 스키마 (필요 시 명시적으로 전달하여 사용)
const REPORT_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    child_name: { type: 'string' },
    child_age_month: { type: 'string' },
    domains: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          domain_id: { type: 'integer' },
          domain_name: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                question_number: { type: 'integer', minimum: 1 },
                score: {
                  oneOf: [
                    { type: 'integer', minimum: 0, maximum: 3 },
                    { type: 'null' }
                  ]
                },
                question: { type: 'string' },
                reason: { type: 'string' }
              },
              required: ['question_number', 'score','question', 'reason']
            }
          }
        },
        required: ['domain_id', 'domain_name', 'questions']
      }
    },
    final_opinion: {
      type: 'object',
      additionalProperties: false,
      properties: {
        isWarning: {
          oneOf: [
            { type: 'boolean' },
            { type: 'null' }
          ]
        },
        opinion_text: { type: 'string' },
        requirements: { type: 'array', items: { type: 'string' } }
      },
      required: ['isWarning', 'opinion_text','requirements']
    }
  },
  required: ['child_name', 'child_age_month', 'domains', 'final_opinion']
};

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

  const sys = buildSystemPrompt({ systemPrompt });
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

  // 출력 스키마 적용: 우선순위 spec.outputSchema > config.outputSchema (기본 스키마 자동 적용 없음)
  const outputSchema = (spec && spec.outputSchema) || (config && config.outputSchema) || null;

  // 스키마가 있으면 구조화 출력 모드로 전환
  const llm = outputSchema && typeof chat.withStructuredOutput === 'function'
    ? chat.withStructuredOutput(outputSchema)
    : chat;

  const chain = RunnableSequence.from([prompt, llm]);
  const response = await chain.invoke({ input, history: lcHistory, context: mergedContext });

  // 구조화 모드에서는 객체가 반환될 수 있음 → JSON 문자열로 직렬화
  let content;
  if (outputSchema && response && typeof response === 'object' && !('content' in response)) {
    try {
      content = JSON.stringify(response);
    } catch (_) {
      content = String(response);
    }
  } else {
    content = typeof response?.content === 'string'
      ? response.content
      : Array.isArray(response?.content)
        ? response.content.map((p) => p?.text || '').join('\n')
        : String(response?.content ?? '');
  }
  return {
    success: true,
    content,
    meta: {
      vendor: 'gemini',
      model: normalizedModel,
      temperature: typeof temperature === 'number' ? temperature : undefined,
    },
  };
}


module.exports = { runReportAgent, REPORT_OUTPUT_SCHEMA };