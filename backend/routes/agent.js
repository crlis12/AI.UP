require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');

// 파일 업로드(multipart/form-data) 지원: 메모리 스토리지 사용
let multerInstance = null;
function getMulter() {
  if (!multerInstance) {
    // 사용자가 의존성을 설치해 두었다고 했으므로 require 사용
    // 미설치 시 런타임 에러가 발생할 수 있으나, 텍스트 전용 요청은 정상 동작하도록 분기 처리함
    // eslint-disable-next-line global-require
    const multer = require('multer');
    multerInstance = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
  }
  return multerInstance;
}

// LangChain은 ESM이므로 CommonJS 환경에서 동적 import 사용
async function loadLangChain() {
  const [googleGenAI, corePrompts, coreRunnables, coreMessages] = await Promise.all([
    import('@langchain/google-genai'),
    import('@langchain/core/prompts'),
    import('@langchain/core/runnables'),
    import('@langchain/core/messages'),
  ]);
  const { ChatGoogleGenerativeAI } = googleGenAI;
  const { ChatPromptTemplate, MessagesPlaceholder } = corePrompts;
  const { RunnableSequence } = coreRunnables;
  const { HumanMessage, AIMessage } = coreMessages;
  return { ChatGoogleGenerativeAI, ChatPromptTemplate, MessagesPlaceholder, RunnableSequence, HumanMessage, AIMessage };
}

// Gemini 엔드포인트 (멀티모달 직접 호출용)
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

function isHumanLangChainMessage(msg) {
  return msg?.id && Array.isArray(msg.id) && msg.id[msg.id.length - 1] === 'HumanMessage';
}

function reconstructLangChainHistory(history, HumanMessage, AIMessage) {
  return Array.isArray(history)
    ? history.map((msg) => {
        const content = msg?.kwargs?.content ?? msg?.content ?? '';
        return isHumanLangChainMessage(msg) ? new HumanMessage(content) : new AIMessage(content);
      })
    : [];
}

function toGeminiContents(history) {
  if (!Array.isArray(history)) return [];
  return history.map((msg) => {
    const role = isHumanLangChainMessage(msg) ? 'user' : 'model';
    const text = msg?.kwargs?.content ?? msg?.content ?? '';
    return { role, parts: [{ text }] };
  });
}

function parseDataUrl(dataUrl) {
  // data:[mimeType];base64,<data>
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

async function handleMultimodalWithGemini({ input, history, fileBuffer, fileMimeType, fileDataUrl, fileBase64 }) {
  const contents = toGeminiContents(history);

  const userParts = [];
  if (input && typeof input === 'string') userParts.push({ text: input });

  let inlineData = null;
  if (fileDataUrl) {
    const parsed = parseDataUrl(fileDataUrl);
    if (parsed) inlineData = { mimeType: parsed.mimeType, data: parsed.base64 };
  } else if (fileBase64 && fileMimeType) {
    const cleaned = String(fileBase64).replace(/^data:[^;]+;base64,/, '');
    inlineData = { mimeType: fileMimeType, data: cleaned };
  } else if (fileBuffer && fileMimeType) {
    inlineData = { mimeType: fileMimeType, data: fileBuffer.toString('base64') };
  }

  if (inlineData) userParts.push({ inlineData });

  if (userParts.length === 0) {
    // 파일이나 텍스트가 전혀 없는 경우 방어
    throw new Error('분석할 텍스트 또는 파일이 없습니다.');
  }

  contents.push({ role: 'user', parts: userParts });

  const response = await axios.post(GEMINI_API_ENDPOINT, { contents });
  const parts = response?.data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p?.text || '').filter(Boolean).join('\n');
  return text || '분석 결과가 비어 있습니다.';
}

router.post('/', async (req, res) => {
  try {
    // multipart/form-data 요청이면, 라우트 내부에서 동적으로 파싱
    let fileBuffer = null;
    let fileMimeType = null;
    if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
      const upload = getMulter().single('file');
      await new Promise((resolve, reject) => {
        upload(req, res, (err) => (err ? reject(err) : resolve()));
      });
      if (req.file) {
        fileBuffer = req.file.buffer;
        fileMimeType = req.file.mimetype;
      }
    }

    // 멀티파트 파싱 이후에 body 접근
    const { input, history, fileBase64, fileMimeType: bodyMimeType, fileDataUrl } = req.body || {};
    if (!fileMimeType && bodyMimeType) fileMimeType = bodyMimeType;

    const hasAnyFile = Boolean(fileBuffer || fileBase64 || fileDataUrl);

    if (hasAnyFile) {
      // 이미지/영상 포함 요청: Gemini 멀티모달 엔드포인트 직접 호출
      const content = await handleMultimodalWithGemini({ input, history, fileBuffer, fileMimeType, fileDataUrl, fileBase64 });
      return res.json({ success: true, content });
    }

    // 텍스트 전용 요청: 기존 LangChain 플로우 유지
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, message: 'input이 누락되었거나 형식이 올바르지 않습니다.' });
    }

    const { ChatGoogleGenerativeAI, ChatPromptTemplate, MessagesPlaceholder, RunnableSequence, HumanMessage, AIMessage } = await loadLangChain();

    const reconstructedHistory = reconstructLangChainHistory(history, HumanMessage, AIMessage);

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
    console.error('Agent route error:', error?.response?.data || error);
    const message = error?.response?.data?.error?.message || error.message || '에이전트 호출 중 오류가 발생했습니다.';
    return res.status(500).json({ success: false, message });
  }
});

module.exports = router;


