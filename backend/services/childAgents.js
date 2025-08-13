/**
 * 서브 에이전트 레지스트리/팩토리
 * - 확장 가능: 새로운 역할을 가진 에이전트를 이곳에 등록
 */

const registry = {};

function registerAgent(role, factory) {
  registry[role] = factory;
}

function getAgent(role) {
  return registry[role];
}

// 예시 에이전트 팩토리 (필요 시 확장)
registerAgent('defaultResponder', ({ model, systemPrompt }) => {
  return async function run({ input, history, parts }) {
    const { ChatPromptTemplate, MessagesPlaceholder } = await import('@langchain/core/prompts');
    const { RunnableSequence } = await import('@langchain/core/runnables');

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt || "You are a helpful assistant."],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    const chain = RunnableSequence.from([prompt, model]);
    const response = await chain.invoke({ input, history });
    const content = typeof response?.content === 'string'
      ? response.content
      : Array.isArray(response?.content)
        ? response.content.map((p) => p?.text || '').join('\n')
        : String(response?.content ?? '');
    return content;
  };
});

module.exports = {
  registerAgent,
  getAgent,
};


