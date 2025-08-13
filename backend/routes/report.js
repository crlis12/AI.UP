const express = require('express');
const router = express.Router();
const { runReportAgent } = require('../services/reportAgent');

// 파일 업로드(multipart/form-data) 지원: 메모리 스토리지 사용
let multerInstance = null;
function getMulter() {
  if (!multerInstance) {
    const multer = require('multer');
    multerInstance = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
  }
  return multerInstance;
}

// 독립 보고서 에이전트
// POST /report
// body: { input: string, history?: LangChainMessages[], context?: string, config?: {...}, spec?: {...} }
router.post('/', async (req, res) => {
  try {
    // multipart/form-data 지원
    let fileBuffer = null;
    let fileMimeType = null;
    let fileSize = null;
    if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
      const upload = getMulter().single('file');
      await new Promise((resolve, reject) => {
        upload(req, res, (err) => (err ? reject(err) : resolve()));
      });
      if (req.file) {
        fileBuffer = req.file.buffer;
        fileMimeType = req.file.mimetype;
        fileSize = req.file.size;
      }
    }

    let { input, history, context, childrenContext, k_dst } = req.body || {};

    let config = req.body?.config || {};
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch (_) { config = {}; }
    }

    let spec = req.body?.spec || {};
    if (typeof spec === 'string') {
      try { spec = JSON.parse(spec); } catch (_) { spec = {}; }
    }

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, message: 'input이 누락되었거나 형식이 올바르지 않습니다.' });
    }

    // 파일이 있으면 컨텍스트에 메타만 주입 (본문 분석은 현재 미지원)
    if (fileBuffer && fileMimeType) {
      const note = `\n[첨부파일 정보] type=${fileMimeType}, size=${fileSize} bytes`;
      context = (context || '') + note;
    }

    // childrenContext, k_dst 문자열 케이스 처리
    if (typeof childrenContext === 'string') {
      try { childrenContext = JSON.parse(childrenContext); } catch (_) {}
    }
    if (typeof k_dst === 'string') {
      try { k_dst = JSON.parse(k_dst); } catch (_) {}
    }

    const result = await runReportAgent({ input, history, context, config, spec, childrenContext, k_dst });
    return res.json(result);
  } catch (error) {
    console.error('Report agent error:', error?.response?.data || error);
    const message = error?.response?.data?.error?.message || error.message || '보고서 에이전트 호출 중 오류가 발생했습니다.';
    return res.status(500).json({ success: false, message });
  }
});

module.exports = router;



