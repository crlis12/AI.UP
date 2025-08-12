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
  const { RunnableSequence, RunnableLambda } = coreRunnables;
  const { HumanMessage, AIMessage } = coreMessages;
  return { ChatGoogleGenerativeAI, ChatPromptTemplate, MessagesPlaceholder, RunnableSequence, RunnableLambda, HumanMessage, AIMessage };
}

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

function parseDataUrl(dataUrl) {
  // data:[mimeType];base64,<data>
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

// Gemini REST 엔드포인트 (비디오 분석용)
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

function historyToGeminiContents(history) {
  if (!Array.isArray(history)) return [];
  return history.map((msg) => {
    const role = isHumanLangChainMessage(msg) ? 'user' : 'model';
    const text = msg?.kwargs?.content ?? msg?.content ?? '';
    return { role, parts: [{ text }] };
  });
}

async function uploadToGeminiFiles({ fileBuffer, mimeType, displayName }) {
  const boundary = '----LangChainGeminiUpload' + Math.random().toString(16).slice(2);
  const delimiter = `--${boundary}`;
  const closeDelimiter = `--${boundary}--`;

  const meta = Buffer.from(
    `${delimiter}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify({ file: { displayName: displayName || 'uploaded-file' } }) +
      '\r\n'
  );

  const mediaHeader = Buffer.from(
    `${delimiter}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
  );

  const closing = Buffer.from(`\r\n${closeDelimiter}\r\n`);

  const multipartBody = Buffer.concat([meta, mediaHeader, fileBuffer, closing]);

  // Google 표준 업로드 경로 사용 (multipart 업로드)
  const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?upload_type=multipart&key=${process.env.GEMINI_API_KEY}`;
  const response = await axios.post(url, multipartBody, {
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    maxBodyLength: Infinity,
  });

  const fileUri = response?.data?.file?.uri;
  if (!fileUri) {
    throw new Error('파일 업로드 실패: file.uri 응답 누락');
  }
  return fileUri;
}

async function waitForGeminiFileActive(fileUri, options = {}) {
  const { timeoutMs = 120000, intervalMs = 2000 } = options;
  const deadline = Date.now() + timeoutMs;
  const url = `${fileUri}?key=${process.env.GEMINI_API_KEY}`;
  /* Poll file state until ACTIVE */
  // Some responses nest under "file", others are flat. Handle both.
  // States: PROCESSING, ACTIVE, FAILED
  while (Date.now() < deadline) {
    try {
      const resp = await axios.get(url);
      const data = resp?.data || {};
      const state = data?.state || data?.file?.state;
      if (state === 'ACTIVE') return;
      if (state === 'FAILED') throw new Error('파일 처리 실패(FAILED)');
    } catch (e) {
      // transient errors: continue polling until timeout
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('파일이 ACTIVE 상태가 되기 전에 시간 초과되었습니다.');
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

    const { ChatGoogleGenerativeAI, ChatPromptTemplate, MessagesPlaceholder, RunnableSequence, RunnableLambda, HumanMessage, AIMessage } = await loadLangChain();

    const reconstructedHistory = reconstructLangChainHistory(history, HumanMessage, AIMessage);

    if (hasAnyFile) {
      // 이미지/영상 포함 요청: LangChain 모델로 멀티모달 메시지 구성
      let base64 = null;
      let mimeType = fileMimeType || null;
      if (fileDataUrl) {
        const parsed = parseDataUrl(fileDataUrl);
        if (parsed) {
          base64 = parsed.base64;
          mimeType = parsed.mimeType;
        }
      } else if (fileBase64) {
        base64 = String(fileBase64).replace(/^data:[^;]+;base64,/, '');
      } else if (fileBuffer) {
        base64 = fileBuffer.toString('base64');
      }

      const parts = [];
      if (input && typeof input === 'string') {
        parts.push({ type: 'text', text: input });
      }

      if (base64 && mimeType && String(mimeType).startsWith('image/')) {
        // 이미지: data URL로 전달 (image_url)
        const dataUrl = `data:${mimeType};base64,${base64}`;
        parts.push({ type: 'image_url', image_url: dataUrl });
      }

      // 비디오: Files API 업로드 후, REST로 분석하여 텍스트로 요약 → LangChain 프롬프트에 주입
      if (mimeType && String(mimeType).startsWith('video/')) {
        const uploadBuffer = fileBuffer || (base64 ? Buffer.from(base64, 'base64') : null);
        if (!uploadBuffer) {
          return res.status(400).json({ success: false, message: '영상 업로드 데이터가 없습니다.' });
        }

        const fileUri = await uploadToGeminiFiles({ fileBuffer: uploadBuffer, mimeType, displayName: 'uploaded-video' });
        await waitForGeminiFileActive(fileUri);

        const analyzeVideo = async ({ input: inText, history: inHistory }) => {
          const contents = historyToGeminiContents(inHistory);
          const userParts = [];
          if (inText && typeof inText === 'string') userParts.push({ text: inText });
          userParts.push({ fileData: { fileUri, mimeType } });
          contents.push({ role: 'user', parts: userParts });
          const response = await axios.post(GEMINI_API_ENDPOINT, { contents });
          const candidateParts = response?.data?.candidates?.[0]?.content?.parts || [];
          const analysis = candidateParts.map((p) => p?.text || '').filter(Boolean).join('\n');
          return analysis || '분석 결과가 비어 있습니다.';
        };

        const video_analysis = await analyzeVideo({ input, history: reconstructedHistory });

        const model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GEMINI_API_KEY,
          model: 'gemini-2.5-flash',
        });

        const prompt = ChatPromptTemplate.fromMessages([
          ['system', "You are a helpful assistant. Please answer the user's questions using the provided video analysis if relevant."],
          new MessagesPlaceholder('history'),
          ['human', '사용자 질문: {input}\n\n영상 분석 참고:\n{video_analysis}'],
        ]);

        const chain = RunnableSequence.from([prompt, model]);
        const response = await chain.invoke({ input, history: reconstructedHistory, video_analysis });
        const content = typeof response?.content === 'string'
          ? response.content
          : Array.isArray(response?.content)
            ? response.content.map((p) => p?.text || '').join('\n')
            : String(response?.content ?? '');

        return res.json({ success: true, content });
      }

      if (parts.length === 0) {
        return res.status(400).json({ success: false, message: '지원하지 않는 파일 형식입니다.' });
      }

      const lastHuman = new HumanMessage({ content: parts });

      const model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-flash',
      });

      const response = await model.invoke([...reconstructedHistory, lastHuman]);
      const content = typeof response?.content === 'string'
        ? response.content
        : Array.isArray(response?.content)
          ? response.content.map((p) => p?.text || '').join('\n')
          : String(response?.content ?? '');

      return res.json({ success: true, content });
    }

    // 텍스트 전용 요청: 기존 LangChain 플로우 유지
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, message: 'input이 누락되었거나 형식이 올바르지 않습니다.' });
    }

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