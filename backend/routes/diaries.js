const express = require('express');
const router = express.Router();
const db = require('../db');

// 특정 아동의 모든 일지 조회
router.get('/child/:childId', (req, res) => {
  const { childId } = req.params;

  const query = 'SELECT * FROM diaries WHERE child_id = ? ORDER BY diary_date DESC';

  db.query(query, [childId], (err, results) => {
    if (err) {
      console.error('일지 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    res.json({ success: true, diaries: results });
  });
});

// 특정 일지 상세 조회
router.get('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const query = 'SELECT * FROM diaries WHERE id = ?';

  db.query(query, [diaryId], (err, results) => {
    if (err) {
      console.error('일지 상세 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: '일지를 찾을 수 없습니다.' });
    }
    res.json({ success: true, diary: results[0] });
  });
});

// 새로운 일지 생성
router.post('/', (req, res) => {
  const { child_id, summary, full_text } = req.body;

  if (!child_id || !summary || !full_text) {
    return res.status(400).json({ success: false, message: '필수 정보(child_id, summary, full_text)가 누락되었습니다.' });
  }

  const query = 'INSERT INTO diaries (child_id, summary, full_text, diary_date) VALUES (?, ?, ?, NOW())';
  
  db.query(query, [child_id, summary, full_text], (err, result) => {
    if (err) {
      console.error('일지 생성 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일지 저장 중 서버 오류가 발생했습니다.' });
    }
    res.status(201).json({ 
      success: true, 
      message: '일지가 성공적으로 생성되었습니다.',
      diary: {
        id: result.insertId,
        child_id,
        summary,
        full_text
      } 
    });
  });
});

module.exports = router;
