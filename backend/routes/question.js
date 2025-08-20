const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');

let multerInstance = null;
function getMulter() {
  if (!multerInstance) {
    const multer = require('multer');
    multerInstance = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    });
  }
  return multerInstance;
}

// history 배열(JSON/string)을 받아 role/content 쌍의 텍스트 메시지 리스트로 변환
function extractHistoryMessages(historyRaw) {
  try {
    const historyArr = Array.isArray(historyRaw) ? historyRaw : [];
    const messages = [];
    for (const msg of historyArr) {
      try {
        // LangChain 직렬화 형태 대비: msg.kwargs.content 또는 msg.content 사용
        const rawContent = msg?.kwargs?.content ?? msg?.content ?? '';
        let text = '';
        if (Array.isArray(rawContent)) {
          // 멀티모달 형태일 수 있음 → text 파트만 추출 및 합침
          const parts = [];
          for (const p of rawContent) {
            if (p && typeof p === 'object') {
              if (typeof p.text === 'string' && p.text.trim() !== '') parts.push(p.text.trim());
              if (typeof p.image_url === 'string') parts.push('[이미지]');
              if (typeof p.video_url === 'string') parts.push('[비디오]');
            }
          }
          text = parts.join('\n');
        } else if (typeof rawContent === 'string') {
          text = rawContent;
        } else {
          text = String(rawContent ?? '');
        }

        text = String(text || '').trim();
        if (!text) continue;

        // 역할 추정: LangChain id 마지막이 HumanMessage인지 검사, 아니면 type/role 힌트 사용
        let role = 'assistant';
        try {
          const idArr = Array.isArray(msg?.id) ? msg.id : [];
          if (idArr.length > 0 && idArr[idArr.length - 1] === 'HumanMessage') role = 'user';
        } catch (_) {
          // ignore
        }
        if (typeof msg?._getType === 'function') {
          const t = msg._getType();
          if (t === 'human') role = 'user';
          else if (t === 'ai') role = 'assistant';
        } else if (typeof msg?.type === 'string') {
          if (msg.type === 'human') role = 'user';
          else if (msg.type === 'ai') role = 'assistant';
        }

        messages.push({ role, content: text });
      } catch (_) {
        // 개별 메시지 파싱 오류 무시
      }
    }
    return messages;
  } catch (_) {
    return [];
  }
}

async function loadLangChain() {
  const [googleGenAI] = await Promise.all([import('@langchain/google-genai')]);
  const { ChatGoogleGenerativeAI } = googleGenAI;
  return { ChatGoogleGenerativeAI };
}

const { normalizeGeminiModel, getGeminiRestEndpoint } = require('../services/modelFactory');

const { QUESTION_AGENT_DEFAULT_CONFIG, QUESTION_AGENT_PROMPT } = require('../services/questionAgent');

function buildSystemPromptFromSpec({ systemPrompt, spec }) {
  // 스펙을 더 이상 누적 병합하지 않고, 명시된 systemPrompt가 있으면 그것을,
  // 없으면 백엔드 기본 questionAgent 프롬프트를 그대로 사용합니다.
  if (systemPrompt && String(systemPrompt).trim() !== '') return String(systemPrompt);
  return QUESTION_AGENT_PROMPT;
}

// 일반 RAG 검색을 위한 Python 스크립트 실행 함수 (search_diaries.py 재사용)
async function runPythonSearchScript(queryData) {
  return new Promise((resolve, reject) => {
    try {
      const scriptPath = path.join(__dirname, '..', 'search-engine-py', 'search_diaries.py');
      const pythonProcess = spawn(config.python.path, [scriptPath], {
        cwd: path.dirname(scriptPath),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`JSON 파싱 오류: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Python 스크립트 실행 실패, exit code: ${code}. ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(error);
      });

      const inputData = JSON.stringify(queryData);
      pythonProcess.stdin.write(inputData);
      pythonProcess.stdin.end();
    } catch (err) {
      reject(err);
    }
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

  const mediaHeader = Buffer.from(`${delimiter}\r\n` + `Content-Type: ${mimeType}\r\n\r\n`);

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
    let model = QUESTION_AGENT_DEFAULT_CONFIG.model;
    let temperature = QUESTION_AGENT_DEFAULT_CONFIG.temperature;
    let spec = undefined; // 별도 스키마/스펙 비사용
    let combinedInput = '';

    let history = [];

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
      // history: 문자열이면 JSON 파싱 시도
      if (req.body?.history) {
        try {
          const h = typeof req.body.history === 'string' ? JSON.parse(req.body.history) : req.body.history;
          history = Array.isArray(h) ? h : [];
        } catch (_) {
          history = [];
        }
      }
      if (req.body?.config) {
        let cfg = req.body.config;
        if (typeof cfg === 'string') {
          try {
            cfg = JSON.parse(cfg);
          } catch (_) {
            cfg = {};
          }
        }
        if (cfg.model) model = cfg.model;
        if (typeof cfg.temperature === 'number') temperature = cfg.temperature;
      }
      // spec은 더 이상 사용하지 않습니다 (무시)
    } else if (req.is('application/json')) {
      const body = req.body || {};
      input = body.input || '';
      mode = body.mode || 'auto';
      if (body?.history && Array.isArray(body.history)) {
        history = body.history;
      }
      if (body?.config) {
        if (body.config.model) model = body.config.model;
        if (typeof body.config.temperature === 'number') temperature = body.config.temperature;
      }
      // spec은 더 이상 사용하지 않습니다 (무시)
    }

    // 0단계: 입력 텍스트를 키워드로 RAG 검색을 수행하고, 결과를 입력 하단에 문자열로 붙입니다.
    try {
      combinedInput = String(input || '').trim();
      // 0-1) 과거 대화 히스토리를 간략 텍스트로 압축하여 상단에 첨부
      const historyMsgs = extractHistoryMessages(history);
      if (historyMsgs.length > 0) {
        const lastFew = historyMsgs.slice(-6); // 최근 6개만 사용
        const historyLines = lastFew.map((m) => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`);
        const historyBlock = `[대화 요약]\n${historyLines.join('\n')}`;
        combinedInput = historyBlock + (combinedInput ? `\n\n${combinedInput}` : '');
      }
      const queryForRag = combinedInput;
      if (queryForRag) {
        const limit = (req.body && typeof req.body.limit !== 'undefined') ? Number(req.body.limit) : 3;
        const score_threshold = (req.body && typeof req.body.score_threshold !== 'undefined') ? Number(req.body.score_threshold) : 0.0;
        const searchResult = await runPythonSearchScript({ query: queryForRag, limit, score_threshold });
        console.log('[RAG][question] query:', queryForRag, 'limit:', limit, 'threshold:', score_threshold);
        console.log('[RAG][question] raw result:', JSON.stringify(searchResult)?.slice(0, 500) + '...');
        if (searchResult?.success && Array.isArray(searchResult.results)) {
          const lines = [];
          for (const item of searchResult.results) {
            try {
              const content =
                item?.content ||
                item?.combined_text ||
                item?.payload?.combined_text ||
                item?.text ||
                item?.payload?.text ||
                item?.content_preview || '';
              const normalized = String(content || '').trim();
              if (!normalized) continue;
              lines.push(normalized);
            } catch (_) {
              // 개별 항목 오류는 무시
            }
          }
          if (lines.length > 0) {
            const ragBlock = `[관련 일기]\n${lines.join('\n')}`;
            combinedInput = combinedInput ? `${combinedInput}\n\n${ragBlock}` : ragBlock;
            console.log('[RAG][question] appended lines:', lines.length);
          }
        }
      }
    } catch (e) {
      console.warn('RAG 검색 실패, 원문 입력만 사용합니다.', e?.message || e);
      combinedInput = input || '';
    }

    const isImage = mimeType?.startsWith('image/');
    const isVideo = mimeType?.startsWith('video/');

    // 텍스트 전용 입력 (시스템 프롬프트는 백엔드 상수 사용)
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
        { role: 'user', content: combinedInput || '부모의 질문에 간결하고 실용적으로 답변해 주세요.' },
      ]);
      const content =
        typeof response?.content === 'string'
          ? response.content
          : Array.isArray(response?.content)
            ? response.content.map((p) => p?.text || '').join('\n')
            : String(response?.content ?? '');
      return res.json({ success: true, content });
    }

    if (mode === 'image' && !isImage)
      return res
        .status(400)
        .json({ success: false, message: '이미지 모드에서 이미지 파일이 필요합니다.' });
    if (mode === 'video' && !isVideo)
      return res
        .status(400)
        .json({ success: false, message: '비디오 모드에서 비디오 파일이 필요합니다.' });

    // 이미지 + 텍스트/이미지 단독
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
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: combinedInput || '부모의 질문에 답변하기 위한 필요한 정보를 추출해 답변해 주세요.',
            },
            { type: 'image_url', image_url: dataUrl },
          ],
        },
      ]);
      const content =
        typeof response?.content === 'string'
          ? response.content
          : Array.isArray(response?.content)
            ? response.content.map((p) => p?.text || '').join('\n')
            : String(response?.content ?? '');
      return res.json({ success: true, content });
    }

    // 비디오 + 텍스트/비디오 단독
    if (isVideo || mode === 'video') {
      const fileUri = await uploadToGeminiFiles({
        fileBuffer,
        mimeType,
        displayName: 'uploaded-video',
      });
      await waitForGeminiFileActive(fileUri);
      const sys = buildSystemPromptFromSpec({ systemPrompt: undefined, spec });
      const contents = [
        {
          role: 'user',
          parts: [
            { text: combinedInput ? `요청:${combinedInput}` : '영상 기반으로 부모의 질문에 답변해 주세요.' },
            { fileData: { fileUri, mimeType } },
          ],
        },
      ];
      const endpoint = getGeminiRestEndpoint(
        normalizeGeminiModel(model),
        process.env.GEMINI_API_KEY
      );
      const resp = await axios.post(endpoint, {
        contents,
        systemInstruction: { role: 'system', parts: [{ text: sys }] },
      });
      const candidateParts = resp?.data?.candidates?.[0]?.content?.parts || [];
      const analysis = candidateParts
        .map((p) => p?.text || '')
        .filter(Boolean)
        .join('\n');
      const content = analysis || '분석 결과가 비어 있습니다.';
      return res.json({ success: true, content });
    }

    return res.status(400).json({ success: false, message: '지원하지 않는 파일 형식입니다.' });
  } catch (error) {
    console.error('Question agent route error:', error?.response?.data || error);
    const message =
      error?.response?.data?.error?.message ||
      error.message ||
      '질문 에이전트 처리 중 오류가 발생했습니다.';
    return res.status(500).json({ success: false, message });
  }
});

module.exports = router;
