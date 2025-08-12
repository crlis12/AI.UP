const express = require('express');
const router = express.Router();
const { runReportAgent } = require('../services/reportAgent');

// 독립 보고서 에이전트
// POST /report
// body: { input: string, history?: LangChainMessages[], context?: string, config?: {...}, spec?: {...} }
router.post('/', async (req, res) => {
  try {
    const { input, history, context } = req.body || {};

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

    const result = await runReportAgent({ input, history, context, config, spec });
    return res.json(result);
  } catch (error) {
    console.error('Report agent error:', error?.response?.data || error);
    const message = error?.response?.data?.error?.message || error.message || '보고서 에이전트 호출 중 오류가 발생했습니다.';
    return res.status(500).json({ success: false, message });
  }
});

module.exports = router;



