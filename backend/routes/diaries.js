require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');
const { normalizeGeminiModel, getGeminiRestEndpoint } = require('../services/modelFactory');
const { MULTIMODAL_AGENT_DEFAULT_CONFIG, MULTIMODAL_AGENT_PROMPT } = require('../services/multimodalAgent');

// multer 설정: uploads/diaries 폴더에 저장
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'diaries');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (_) {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });

// 보조 테이블: 일지 첨부 파일 저장용 (없으면 생성)
const ensureDiaryFilesTableSql = `
  CREATE TABLE IF NOT EXISTS diary_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diary_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(diary_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
try {
  db.query(ensureDiaryFilesTableSql, () => {});
} catch (_) {}


// 벡터 임베딩 생성 함수
async function generateVectorEmbedding(diaryData) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '..', 'search-engine-py', 'upsert_diary.py');
    
    // Azure 환경에서 확실하게 python3 사용
    let pythonPath;
    if (process.env.WEBSITE_SITE_NAME) {
      // Azure App Service 환경 - 무조건 python3 사용
      pythonPath = 'python3';
    } else {
      // 로컬 환경
      pythonPath = process.env.PYTHON_PATH || 'python';
    }
    
    // 디버깅 로그 추가
    console.log('🐍 Python 벡터 임베딩 생성 시작');
    console.log('   - Python 경로:', pythonPath);
    console.log('   - 스크립트 경로:', pythonScriptPath);
    console.log('   - 작업 디렉토리:', path.join(__dirname, '..', 'search-engine-py'));
    console.log('   - Azure 환경:', !!process.env.WEBSITE_SITE_NAME);
    console.log('   - 일기 ID:', diaryData.id);
    
    const pythonProcess = spawn(pythonPath, [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..', 'search-engine-py'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log('🐍 Python 프로세스 종료 코드:', code);
      if (code !== 0) {
        console.error('❌ Python 스크립트 오류:', errorString);
        console.error('   - 환경 변수 WEBSITE_SITE_NAME:', process.env.WEBSITE_SITE_NAME);
        console.error('   - 환경 변수 PYTHON_PATH:', process.env.PYTHON_PATH);
        return reject(new Error(`Python 스크립트 실행 실패 (code: ${code}): ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString.trim());
        console.log('✅ 벡터 임베딩 생성 성공:', result.success ? '성공' : '실패');
        if (!result.success) {
          console.warn('⚠️ 벡터 임베딩 생성 실패 메시지:', result.message);
        }
        resolve(result);
      } catch (parseError) {
        console.error('❌ JSON 파싱 오류:', parseError, 'Raw output:', dataString);
        reject(new Error(`결과 파싱 실패: ${parseError.message}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('❌ Python 프로세스 실행 오류:', error);
      console.error('   - 사용된 Python 경로:', pythonPath);
      console.error('   - 스크립트 경로:', pythonScriptPath);
      

      
      reject(error);
    });

    // 일기 데이터를 JSON으로 전송 (UTF-8 인코딩)
    const inputData = JSON.stringify(diaryData);
    pythonProcess.stdin.write(inputData, 'utf8');
    pythonProcess.stdin.end();
  });
}

async function loadLangChain() {
  const [googleGenAI] = await Promise.all([import('@langchain/google-genai')]);
  const { ChatGoogleGenerativeAI } = googleGenAI;
  return { ChatGoogleGenerativeAI };
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
    } catch (e) {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('파일이 ACTIVE 상태가 되기 전에 시간 초과되었습니다.');
}

function inferMimeTypeFromExt(filename, fallbackType) {
  const ext = String(path.extname(filename) || '').toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  return fallbackType || 'application/octet-stream';
}

async function generateMediaCaptions({ baseDir, entries }) {
  const captions = [];
  const instructionText = '아래 콘텐츠를 육아일기 RAG 검색용으로, 사실 기반의 한두 문장 핵심 캡션만 생성하세요. 추측 금지, 마크다운 금지.';
  const { ChatGoogleGenerativeAI } = await loadLangChain();
  const modelName = normalizeGeminiModel(
    (MULTIMODAL_AGENT_DEFAULT_CONFIG && MULTIMODAL_AGENT_DEFAULT_CONFIG.model) || 'gemini-2.5-flash'
  );
  const chat = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: modelName,
    temperature: (MULTIMODAL_AGENT_DEFAULT_CONFIG && MULTIMODAL_AGENT_DEFAULT_CONFIG.temperature) || 0,
  });

  for (const entry of entries) {
    try {
      const filename = path.basename(entry.url || '');
      if (!filename) continue;
      const localPath = path.join(baseDir, filename);
      const mimeType = inferMimeTypeFromExt(filename, entry.type === 'video' ? 'video/mp4' : 'image/png');
      if (entry.type === 'image') {
        const fileBuffer = fs.readFileSync(localPath);
        const base64 = fileBuffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        const sys = MULTIMODAL_AGENT_PROMPT;
        const response = await chat.invoke([
          { role: 'system', content: sys },
          { role: 'user', content: [ { type: 'text', text: instructionText }, { type: 'image_url', image_url: dataUrl } ] }
        ]);
        const content = Array.isArray(response?.content)
          ? response.content.map((p) => p?.text || '').join('\n')
          : (typeof response?.content === 'string' ? response.content : String(response?.content ?? ''));
        const cap = String(content || '').trim();
        if (cap) captions.push(cap);
      } else if (entry.type === 'video') {
        const fileBuffer = fs.readFileSync(localPath);
        const fileUri = await uploadToGeminiFiles({ fileBuffer, mimeType, displayName: filename });
        await waitForGeminiFileActive(fileUri);
        const sys = MULTIMODAL_AGENT_PROMPT;
        const contents = [
          { role: 'user', parts: [ { text: instructionText }, { fileData: { fileUri, mimeType } } ] }
        ];
        const endpoint = getGeminiRestEndpoint(modelName, process.env.GEMINI_API_KEY);
        const resp = await axios.post(endpoint, {
          contents,
          systemInstruction: { role: 'system', parts: [{ text: sys }] },
        });
        const candidateParts = resp?.data?.candidates?.[0]?.content?.parts || [];
        const cap = candidateParts.map((p) => p?.text || '').filter(Boolean).join('\n').trim();
        if (cap) captions.push(cap);
      }
    } catch (_) {}
  }
  return captions;
}

// 특정 아동의 모든 일지 조회 (새 스키마: date, content)
router.get('/child/:childId', (req, res) => {
  const { childId } = req.params;
  const { date } = req.query;

  let query = 'SELECT * FROM diaries WHERE child_id = ?';
  const params = [childId];
  if (date) {
    // Normalize incoming date to YYYY-MM-DD
    const dateOnly = normalizeToDateOnly(date) || null;
    query += ' AND date = ? ORDER BY created_at DESC LIMIT 1';
    params.push(dateOnly);
  } else {
    query += ' ORDER BY date DESC, created_at DESC';
  }

  db.query(query, params, async (err, results) => {
    if (err) {
      console.error('일기 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }

    // 각 일기에 대해 첨부파일 정보도 함께 조회
    try {
      const diariesWithFiles = await Promise.all(
        results.map(async (diary) => {
          return new Promise((resolve, reject) => {
            const filesQuery = 'SELECT id, file_path, file_type FROM diary_files WHERE diary_id = ? ORDER BY created_at ASC';
            db.query(filesQuery, [diary.id], (fileErr, files) => {
              if (fileErr) {
                console.error('파일 조회 오류:', fileErr);
                resolve({ ...diary, files: [] });
              } else {
                resolve({ ...diary, files: files || [] });
              }
            });
          });
        })
      );

      res.json({ success: true, diaries: diariesWithFiles });
    } catch (fileError) {
      console.error('파일 정보 조회 중 오류:', fileError);
      res.json({ success: true, diaries: results.map(diary => ({ ...diary, files: [] })) });
    }
  });
});

// 특정 일지 상세 조회 (새 스키마)
router.get('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const query = 'SELECT * FROM diaries WHERE id = ?';

  db.query(query, [diaryId], (err, results) => {
    if (err) {
      console.error('일기 상세 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    const diary = results[0];
    db.query(
      'SELECT id, file_path, file_type FROM diary_files WHERE diary_id = ? ORDER BY id ASC',
      [diaryId],
      (fErr, files) => {
        if (fErr) {
          console.error('일지 파일 조회 DB 오류:', fErr);
          return res.json({ success: true, diary });
        }
        diary.files = files || [];
        res.json({ success: true, diary });
      }
    );
  });
});

// 기존 첨부(이미지/영상) 삭제: children_img를 NULL로 설정하고 파일이 있다면 디스크에서도 제거
router.delete('/:diaryId/image', (req, res) => {
  const { diaryId } = req.params;
  db.query('SELECT children_img FROM diaries WHERE id = ? LIMIT 1', [diaryId], (selErr, rows) => {
    if (selErr) {
      console.error('기존 첨부 조회 오류:', selErr);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    const filename = rows[0].children_img;
    db.query(
      'UPDATE diaries SET children_img = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [diaryId],
      (updErr) => {
        if (updErr) {
          console.error('첨부 제거 DB 오류:', updErr);
          return res.status(500).json({ success: false, message: '첨부 제거 중 오류가 발생했습니다.' });
        }
        // 파일이 존재하면 디스크에서도 best-effort로 삭제
        if (filename) {
          try {
            const filePath = path.join(__dirname, '..', 'uploads', 'diaries', filename);
            fs.unlink(filePath, () => {});
          } catch (_) {}
        }
        return res.json({ success: true, message: '기존 첨부가 삭제되었습니다.' });
      }
    );
  });
});

// 개별 파일 삭제
router.delete('/:diaryId/files/:fileId', (req, res) => {
  const { diaryId, fileId } = req.params;
  
  // 먼저 파일 정보를 조회
  db.query('SELECT file_path FROM diary_files WHERE id = ? AND diary_id = ?', [fileId, diaryId], (selErr, rows) => {
    if (selErr) {
      console.error('파일 조회 오류:', selErr);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
    }
    
    const filePath = rows[0].file_path;
    
    // DB에서 파일 정보 삭제
    db.query('DELETE FROM diary_files WHERE id = ? AND diary_id = ?', [fileId, diaryId], (delErr, result) => {
      if (delErr) {
        console.error('파일 삭제 DB 오류:', delErr);
        return res.status(500).json({ success: false, message: '파일 삭제 중 오류가 발생했습니다.' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '파일을 찾을 수 없습니다.' });
      }
      
      // 실제 파일도 디스크에서 삭제 (best-effort)
      if (filePath) {
        try {
          // filePath가 완전한 URL인 경우 파일명만 추출
          let fileName = filePath;
          if (filePath.includes('/uploads/')) {
            fileName = filePath.split('/uploads/')[1];
          }
          
          const fullPath = path.join(__dirname, '..', 'uploads', fileName);
          fs.unlink(fullPath, (unlinkErr) => {
            if (unlinkErr) {
              console.warn('디스크 파일 삭제 실패:', unlinkErr.message);
            }
          });
        } catch (fsErr) {
          console.warn('파일 삭제 시도 중 오류:', fsErr.message);
        }
      }
      
      res.json({ success: true, message: '파일이 성공적으로 삭제되었습니다.' });
    });
  });
});

// 일지 삭제
router.delete('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const query = 'DELETE FROM diaries WHERE id = ?';

  db.query(query, [diaryId], (err, result) => {
    if (err) {
      console.error('일지 삭제 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '삭제할 일지를 찾을 수 없습니다.' });
    }
    res.json({ success: true, message: '일지가 삭제되었습니다.' });
  });
});

// helper: format JS Date to YYYY-MM-DD
function formatDateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeToDateOnly(input) {
  if (!input) return null;
  const d = new Date(input);
  if (!isNaN(d)) {
    return formatDateOnly(d);
  }
  const s = String(input);
  if (s.length >= 10 && /\d{4}-\d{2}-\d{2}/.test(s.slice(0, 10))) return s.slice(0, 10);
  return null;
}

// 새로운 일지 생성 또는 같은 날짜의 기존 일지 업데이트(업서트)
router.post('/', upload.array('files', 10), (req, res) => {
  const { child_id, content, date } = req.body || {};

  if (!child_id || !content) {
    return res
      .status(400)
      .json({ success: false, message: '필수 정보(child_id, content)가 누락되었습니다.' });
  }

  const dateOnly = normalizeToDateOnly(date) || formatDateOnly(new Date());

  const upsert = `
    INSERT INTO diaries (child_id, date, content)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = CURRENT_TIMESTAMP
  `;

  db.query(upsert, [child_id, dateOnly, content], async (err, result) => {
    if (err) {
      console.error('일지 생성/업데이트 DB 오류:', err);
      return res
        .status(500)
        .json({ success: false, message: '일지 저장 중 서버 오류가 발생했습니다.' });
    }
    
    // 업서트 후 diary id 확보
    const maybeId = result.insertId;
    const fetchIdAndHandleFiles = async (diaryId) => {
      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) {
        const parentId = 'unknown';
        // 파일이 없으면 캡션 없이 임베딩만
        try {
          const embeddingData = { id: diaryId, content, date: dateOnly, child_id, captions: [], parent_id: parentId };
          console.log('벡터 임베딩 생성 시작(파일 없음):', { id: diaryId, date: dateOnly });
          const embeddingResult = await generateVectorEmbedding(embeddingData);
          console.log('벡터 임베딩 생성 결과:', embeddingResult);
          if (embeddingResult.success) console.log('✅ 벡터 임베딩 생성 성공:', diaryId);
          else console.warn('⚠️ 벡터 임베딩 생성 실패:', embeddingResult.message);
        } catch (embeddingError) {
          console.error('❌ 벡터 임베딩 생성 중 오류:', embeddingError.message);
        }
        return res.status(201).json({ success: true, message: '일지가 저장되었습니다.', diary: { id: diaryId || null, child_id, date: dateOnly, content } });
      }

      // child_id로 부모 사용자 ID 조회 후 사용자/아동별 폴더로 이동, 저장 후 캡션 생성 → 임베딩
      db.query('SELECT parent_id FROM children WHERE id = ? LIMIT 1', [child_id], (pErr, rows) => {
        const parentId = !pErr && rows && rows[0] ? rows[0].parent_id : 'unknown';
        const baseDir = path.join(__dirname, '..', 'uploads', 'diaries', 'users', String(parentId), 'children', String(child_id));
        try { fs.mkdirSync(baseDir, { recursive: true }); } catch (_) {}

        const uploadsBase = (process.env.FILE_BASE_URL && process.env.FILE_BASE_URL.replace(/\/$/, '')) || `${req.protocol}://${req.get('host')}/uploads`;
        const values = files.map((f) => {
          let finalBasename = path.basename(f.path);
          try {
            const newPath = path.join(baseDir, finalBasename);
            if (fs.existsSync(newPath)) {
              const ext = path.extname(finalBasename);
              const name = path.basename(finalBasename, ext);
              finalBasename = `${name}_${Date.now()}${ext}`;
            }
            fs.renameSync(f.path, path.join(baseDir, finalBasename));
          } catch (moveErr) {
            console.error('파일 이동 오류:', moveErr);
          }
          const url = `${uploadsBase}/diaries/users/${parentId}/children/${child_id}/${finalBasename}`;
          const type = f.mimetype && f.mimetype.startsWith('video/') ? 'video' : 'image';
          return [diaryId, url, type];
        });

        const insertFilesSql = 'INSERT INTO diary_files (diary_id, file_path, file_type) VALUES ?';
        db.query(insertFilesSql, [values], async (fErr) => {
          if (fErr) console.error('첨부 저장 DB 오류:', fErr);
          // 캡션 생성 시도
          let captions = [];
          try {
            const entries = values.map(([, url, type]) => ({ url, type }));
            captions = await generateMediaCaptions({ baseDir, entries });
          } catch (capErr) {
            console.warn('멀티모달 캡션 생성 실패:', capErr?.message || capErr);
            captions = [];
          }

          // 임베딩 생성 (캡션 포함하되 UI에는 노출하지 않음)
          try {
            const embeddingData = { id: diaryId, content, date: dateOnly, child_id, captions, parent_id: parentId };
            console.log('벡터 임베딩 생성 시작:', { id: diaryId, date: dateOnly, captions_len: captions.length });
            const embeddingResult = await generateVectorEmbedding(embeddingData);
            console.log('벡터 임베딩 생성 결과:', embeddingResult);
          } catch (embeddingError) {
            console.error('❌ 벡터 임베딩 생성 중 오류:', embeddingError.message);
          }

          return res.status(201).json({ success: true, message: '일지가 저장되었습니다.', diary: { id: diaryId || null, child_id, date: dateOnly, content } });
        });
      });
    };

    if (maybeId && maybeId > 0) {
      await fetchIdAndHandleFiles(maybeId);
    } else {
      db.query('SELECT id FROM diaries WHERE child_id = ? AND date = ? LIMIT 1', [child_id, dateOnly], async (qErr, rows) => {
        if (qErr || rows.length === 0) {
          return res.status(201).json({ success: true, message: '일지가 저장되었습니다.' });
        }
        await fetchIdAndHandleFiles(rows[0].id);
      });
    }
  });
});

// 일기 수정
router.put('/:diaryId', async (req, res) => {
  const { diaryId } = req.params;
  const { date, content, child_id } = req.body || {};

  if (!date || !content) {
    return res.status(400).json({ success: false, message: '날짜와 내용은 필수입니다.' });
  }

  const query = 'UPDATE diaries SET date = ?, content = ?, updated_at = NOW() WHERE id = ?';
  
  db.query(query, [date, content, diaryId], async (err, result) => {
    if (err) {
      console.error('일기 수정 DB 오류:', err);
      return res
        .status(500)
        .json({ success: false, message: '일기 수정 중 서버 오류가 발생했습니다.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    // 벡터 임베딩 업데이트 (비동기)
    try {
      const idNum = parseInt(diaryId);
      // 현재 일기의 첨부 목록 조회
      db.query('SELECT file_path, file_type FROM diary_files WHERE diary_id = ? ORDER BY id ASC', [idNum], (fErr, rows) => {
        if (fErr) {
          console.warn('일기 파일 조회 실패(캡션 생략):', fErr?.message || fErr);
          (async () => {
            const embeddingData = { id: idNum, content, date, child_id, captions: [], parent_id: parentId };
            const embeddingResult = await generateVectorEmbedding(embeddingData);
            console.log('벡터 임베딩 업데이트 결과(텍스트만):', embeddingResult);
          })();
          return;
        }

        if (!rows || rows.length === 0) {
          (async () => {
            const embeddingData = { id: idNum, content, date, child_id, captions: [], parent_id: parentId };
            const embeddingResult = await generateVectorEmbedding(embeddingData);
            console.log('벡터 임베딩 업데이트 결과(파일 없음):', embeddingResult);
          })();
          return;
        }

        // parent_id 조회 후 baseDir 계산 → 캡션 생성 → 임베딩 업데이트
        db.query('SELECT parent_id FROM children WHERE id = ? LIMIT 1', [child_id], async (pErr, cRows) => {
          const parentId = !pErr && cRows && cRows[0] ? cRows[0].parent_id : 'unknown';
          const baseDir = path.join(
            __dirname,
            '..',
            'uploads',
            'diaries',
            'users',
            String(parentId),
            'children',
            String(child_id)
          );
          const entries = rows.map((r) => ({ url: r.file_path, type: r.file_type }));
          let captions = [];
          try {
            captions = await generateMediaCaptions({ baseDir, entries });
          } catch (capErr) {
            console.warn('멀티모달 캡션 생성 실패(업데이트):', capErr?.message || capErr);
            captions = [];
          }
          const embeddingData = { id: idNum, content, date, child_id, captions, parent_id: parentId };
          const embeddingResult = await generateVectorEmbedding(embeddingData);
          console.log('벡터 임베딩 업데이트 결과(캡션 포함):', embeddingResult);
        });
      });
    } catch (embeddingError) {
      console.error('❌ 벡터 임베딩 업데이트 중 오류:', embeddingError.message);
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 수정되었습니다.'
    });
  });
});

// 벡터 임베딩 삭제 함수
async function deleteVectorEmbedding(diaryId) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '..', 'search-engine-py', 'delete_diary.py');
    
    // Azure 환경에서 확실하게 python3 사용
    let pythonPath;
    if (process.env.WEBSITE_SITE_NAME) {
      // Azure App Service 환경 - 무조건 python3 사용
      pythonPath = 'python3';
    } else {
      // 로컬 환경
      pythonPath = process.env.PYTHON_PATH || 'python';
    }
    
    const pythonProcess = spawn(pythonPath, [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..', 'search-engine-py'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python 삭제 스크립트 오류:', errorString);
        return reject(new Error(`Python 삭제 스크립트 실행 실패 (code: ${code}): ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString.trim());
        resolve(result);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError, 'Raw output:', dataString);
        reject(new Error(`결과 파싱 실패: ${parseError.message}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python 삭제 프로세스 실행 오류:', error);
      reject(error);
    });

    // 일기 ID를 JSON으로 전송 (UTF-8 인코딩)
    const inputData = JSON.stringify({ diary_id: parseInt(diaryId) });
    pythonProcess.stdin.write(inputData, 'utf8');
    pythonProcess.stdin.end();
  });
}

// 일기 삭제
router.delete('/:diaryId', async (req, res) => {
  const { diaryId } = req.params;

  const query = 'DELETE FROM diaries WHERE id = ?';
  
  db.query(query, [diaryId], async (err, result) => {
    if (err) {
      console.error('일기 삭제 DB 오류:', err);
      return res
        .status(500)
        .json({ success: false, message: '일기 삭제 중 서버 오류가 발생했습니다.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    // 벡터 임베딩 삭제 (비동기, 실패해도 일기 삭제는 성공으로 처리)
    try {
      console.log('벡터 임베딩 삭제 시작:', diaryId);
      const embeddingResult = await deleteVectorEmbedding(diaryId);
      console.log('벡터 임베딩 삭제 결과:', embeddingResult);
      
      if (embeddingResult.success) {
        console.log('✅ 벡터 임베딩 삭제 성공:', diaryId);
      } else {
        console.warn('⚠️ 벡터 임베딩 삭제 실패:', embeddingResult.message);
      }
    } catch (embeddingError) {
      console.error('❌ 벡터 임베딩 삭제 중 오류:', embeddingError.message);
      // 벡터 임베딩 실패는 로그만 남기고 계속 진행
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 삭제되었습니다.'
    });
  });
});

module.exports = router;