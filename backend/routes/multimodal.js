const express = require('express');
const router = express.Router();
const axios = require('axios');

let multerInstance = null;
function getMulter() {
  if (!multerInstance) {
    const multer = require('multer');
    multerInstance = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
  }
  return multerInstance;
}

async function loadLangChain() {
  const [googleGenAI] = await Promise.all([
    import('@langchain/google-genai'),
  ]);
  const { ChatGoogleGenerativeAI } = googleGenAI;
  return { ChatGoogleGenerativeAI };
}

const { normalizeGeminiModel, getGeminiRestEndpoint } = require('../services/modelFactory');

function buildSystemPromptFromSpec({ systemPrompt, spec }) {
  const base = systemPrompt || (spec && typeof spec === 'object' && spec.default) || 'You are a helpful multimodal captioning assistant.';
  const lines = [base];
  if (!spec || typeof spec !== 'object') return lines.join('\n');

  for (const [key, value] of Object.entries(spec)) {
    if (key === 'default') continue;
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

  const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?upload_type=multipart&key=${process.env.GEMINI_API_KEY}`;
  const response = await axios.post(url, multipartBody, {
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    maxBodyLength: Infinity,
  });

  const fileUri = response?.data?.file?.uri;
  if (!fileUri) throw new Error('파일 업로드 실패: file.uri 응답 누락');
  return fileUri;
}

// 업로드 후 파일 상태가 ACTIVE가 될 때까지 폴링
async function waitForGeminiFileActive(fileUri, options = {}) {
  const { timeoutMs = 120000, intervalMs = 2000 } = options;
  const deadline = Date.now() + timeoutMs;
  const url = `${fileUri}?key=${process.env.GEMINI_API_KEY}`;
  while (Date.now() < deadline) {
    try {
      const resp = await axios.get(url);
      const data = resp?.data || {};
      const state = data?.state || data?.file?.state;
      if (state === 'ACTIVE') return;
      if (state === 'FAILED') throw new Error('파일 처리 실패(FAILED)');
    } catch (e) {
      // 일시적 오류는 무시하고 폴링 지속
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('파일이 ACTIVE 상태가 되기 전에 시간 초과되었습니다.');
}

router.post('/', async (req, res) => {
  try {
    let fileBuffer = null;
    let mimeType = null;
    let input = '';
    let mode = 'auto';
    let model = 'gemini-2.5-flash';
    let temperature = 0.2;
    let spec = {};

    if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
      const upload = getMulter().single('file');
      await new Promise((resolve, reject) => {
        upload(req, res, (err) => (err ? reject(err) : resolve()));
      });
      if (req.file) {
        fileBuffer = req.file.buffer;
        mimeType = req.file.mimetype;
      }
      input = req.body?.input || '';
      mode = req.body?.mode || 'auto';
      if (req.body?.config) {
        let cfg = req.body.config;
        if (typeof cfg === 'string') { try { cfg = JSON.parse(cfg); } catch (_) { cfg = {}; } }
        if (cfg.model) model = cfg.model;
        if (typeof cfg.temperature === 'number') temperature = cfg.temperature;
      }
      if (req.body?.spec) {
        let sp = req.body.spec;
        if (typeof sp === 'string') { try { sp = JSON.parse(sp); } catch (_) { sp = {}; } }
        spec = sp || {};
      }
    } else if (req.is('application/json')) {
      const body = req.body || {};
      input = body.input || '';
      mode = body.mode || 'auto';
      if (body?.config) {
        if (body.config.model) model = body.config.model;
        if (typeof body.config.temperature === 'number') temperature = body.config.temperature;
      }
      if (body?.spec) {
        spec = body.spec || {};
      }
    }

    const isImage = mimeType?.startsWith('image/');
    const isVideo = mimeType?.startsWith('video/');

    // 텍스트 전용 입력 지원 (system 메시지 사용)
    if (!fileBuffer) {
      const { ChatGoogleGenerativeAI } = await loadLangChain();
      const chat = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: normalizeGeminiModel(model),
        temperature,
      });
      const sys = buildSystemPromptFromSpec({ systemPrompt: undefined, spec });
      const response = await chat.invoke([
        { role: 'system', content: sys },
        { role: 'user', content: (input || '간결한 설명을 작성해 주세요.') },
      ]);
      const content = typeof response?.content === 'string'
        ? response.content
        : Array.isArray(response?.content)
          ? response.content.map((p) => p?.text || '').join('\n')
          : String(response?.content ?? '');
      return res.json({ success: true, content });
    }

    if (mode === 'image' && !isImage) return res.status(400).json({ success: false, message: '이미지 모드에서 이미지 파일이 필요합니다.' });
    if (mode === 'video' && !isVideo) return res.status(400).json({ success: false, message: '비디오 모드에서 비디오 파일이 필요합니다.' });

    if (isImage || mode === 'image') {
      const { ChatGoogleGenerativeAI } = await loadLangChain();
      const chat = new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: normalizeGeminiModel(model),
        temperature,
      });
      const base64 = fileBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;
      const sys = buildSystemPromptFromSpec({ systemPrompt: undefined, spec });
      const response = await chat.invoke([
        { role: 'system', content: sys },
        { role: 'user', content: [
          { type: 'text', text: (input || '이미지에 대한 간결한 캡션을 작성해 주세요.') },
          { type: 'image_url', image_url: dataUrl },
        ]},
      ]);
      const content = typeof response?.content === 'string'
        ? response.content
        : Array.isArray(response?.content)
          ? response.content.map((p) => p?.text || '').join('\n')
          : String(response?.content ?? '');
      return res.json({ success: true, content });
    }

    if (isVideo || mode === 'video') {
      const fileUri = await uploadToGeminiFiles({ fileBuffer, mimeType, displayName: 'uploaded-video' });
      await waitForGeminiFileActive(fileUri);
      const sys = buildSystemPromptFromSpec({ systemPrompt: undefined, spec });
      const contents = [
        { role: 'user', parts: [
          { text: (input ? `요청:${input}` : '영상에 대한 간결한 캡션/요약을 작성해 주세요.') },
          { fileData: { fileUri, mimeType } },
        ]},
      ];
      const endpoint = getGeminiRestEndpoint(normalizeGeminiModel(model), process.env.GEMINI_API_KEY);
      const resp = await axios.post(endpoint, {
        contents,
        systemInstruction: { role: 'system', parts: [{ text: sys }] },
      });
      const candidateParts = resp?.data?.candidates?.[0]?.content?.parts || [];
      const analysis = candidateParts.map((p) => p?.text || '').filter(Boolean).join('\n');
      const content = analysis || '분석 결과가 비어 있습니다.';
      return res.json({ success: true, content });
    }

    return res.status(400).json({ success: false, message: '지원하지 않는 파일 형식입니다.' });
  } catch (error) {
    console.error('Multimodal route error:', error?.response?.data || error);
    const message = error?.response?.data?.error?.message || error.message || '멀티모달 처리 중 오류가 발생했습니다.';
    return res.status(500).json({ success: false, message });
  }
});

module.exports = router;


