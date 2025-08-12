require('dotenv').config();
const express = require('express');
const router = express.Router();
const multer = require('multer');

// 파일을 메모리에 저장하도록 multer 설정
const upload = multer({ storage: multer.memoryStorage() });

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

router.post('/', upload.single('file'), async (req, res) => {
  try {
    // FormData에서 텍스트 필드와 파일 가져오기
    const { input } = req.body;
    const history = req.body.history ? JSON.parse(req.body.history) : [];
    const file = req.file;

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
    
    // 최종적으로 모델에 전달될 인간 메시지
    let finalInput;

    if (file) {
      // 파일이 있으면, 텍스트와 이미지를 함께 포함하는 객체로 구성
      finalInput = new HumanMessage({
        content: [
          { type: 'text', text: input },
          {
            type: 'image_url',
            image_url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          },
        ],
      });
    } else {
      // 파일이 없으면 텍스트만 사용
      finalInput = new HumanMessage(input);
    }
    
    // 재구성된 기록에 최종 입력을 추가
    const fullHistory = [...reconstructedHistory, finalInput];


    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-1.5-flash', // 멀티모달 지원 모델로 변경
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', "You are a helpful assistant. Please answer the user's questions."],
      new MessagesPlaceholder('history'),
      // 최종 메시지가 이미 history에 포함되어 있으므로, 별도의 human 메시지는 제거
    ]);
    
    const chain = RunnableSequence.from([
        prompt,
        model
    ]);

    const response = await chain.invoke({ history: fullHistory });
    
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


