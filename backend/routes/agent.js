require('dotenv').config();
const express = require('express');
const router = express.Router();

// LangChain은 ESM이므로 CommonJS 환경에서 동적 import 사용
async function loadLangChain() {
  const [{ ChatGoogleGenerativeAI }, { ChatPromptTemplate, MessagesPlaceholder }, { RunnableSequence }, { HumanMessage, AIMessage }] = await Promise.all([
    import('@langchain/google-genai'),
    import('@langchain/core/prompts'),
    import('@langchain/core/runnables'),
    import('@langchain/core/messages'),
  ]);
  return { ChatGoogleGenerativeAI, ChatPromptTemplate, MessagesPlaceholder, RunnableSequence, HumanMessage, AIMessage };
}

router.post('/', async (req, res) => {
  try {
    const { input, history } = req.body || {};

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, message: 'input이 누락되었거나 형식이 올바르지 않습니다.' });
    }

    const { ChatGoogleGenerativeAI, ChatPromptTemplate, MessagesPlaceholder, RunnableSequence, HumanMessage, AIMessage } = await loadLangChain();

    // 프론트에서 전달된 LangChain 메시지 객체를 재구성
    const reconstructedHistory = Array.isArray(history)
      ? history.map((msg) => {
          const isHuman = msg?.id && Array.isArray(msg.id) && msg.id[msg.id.length - 1] === 'HumanMessage';
          const content = msg?.kwargs?.content ?? msg?.content ?? '';
          return isHuman ? new HumanMessage(content) : new AIMessage(content);
        })
      : [];

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', "You are a helpful assistant. Please answer the user's questions."],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    const chain = RunnableSequence.from([prompt, model]);

    const response = await chain.invoke({ input, history: reconstructedHistory });
    const content = typeof response?.content === 'string'
      ? response.content
      : Array.isArray(response?.content)
        ? response.content.map((p) => p?.text || '').join('\n')
        : String(response?.content ?? '');

    return res.json({ success: true, content });
  } catch (error) {
    console.error('Agent route error:', error);
    return res.status(500).json({ success: false, message: '에이전트 호출 중 오류가 발생했습니다.' });
  }
});

module.exports = router;


