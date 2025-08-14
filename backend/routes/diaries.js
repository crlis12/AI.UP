const express = require('express');
const router = express.Router();
const db = require('../db');

// 특정 아동의 모든 일기 조회
router.get('/child/:childId', (req, res) => {
  const { childId } = req.params;

  const query = 'SELECT * FROM diaries WHERE child_id = ? ORDER BY date DESC';

  db.query(query, [childId], (err, results) => {
    if (err) {
      console.error('일기 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    res.json({ success: true, diaries: results });
  });
});

// 특정 일기 상세 조회
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
    res.json({ success: true, diary: results[0] });
  });
});

// 새로운 일기 생성
router.post('/', (req, res) => {
  console.log('=== 일기 생성 요청 받음 ===');
  console.log('요청 body:', req.body);
  
  const { child_id, date, content } = req.body;
  
  console.log('추출된 값들:', { child_id, date, content });

  if (!child_id || !date || !content) {
    console.log('필수 정보 누락 - child_id:', !!child_id, 'date:', !!date, 'content:', !!content);
    return res.status(400).json({ success: false, message: '필수 정보(child_id, date, content)가 누락되었습니다.' });
  }

  const query = 'INSERT INTO diaries (child_id, date, content, created_at) VALUES (?, ?, ?, NOW())';
  
  db.query(query, [child_id, date, content], (err, result) => {
    if (err) {
      console.error('일기 생성 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일기 저장 중 서버 오류가 발생했습니다.' });
    }
    res.status(201).json({ 
      success: true, 
      message: '일기가 성공적으로 저장되었습니다.',
      diary: {
        id: result.insertId,
        child_id,
        date,
        content
      } 
    });
  });
});

// 일기 수정
router.put('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const { date, content } = req.body;

  if (!date || !content) {
    return res.status(400).json({ success: false, message: '날짜와 내용은 필수입니다.' });
  }

  const query = 'UPDATE diaries SET date = ?, content = ?, updated_at = NOW() WHERE id = ?';
  
  db.query(query, [date, content, diaryId], (err, result) => {
    if (err) {
      console.error('일기 수정 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일기 수정 중 서버 오류가 발생했습니다.' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 수정되었습니다.'
    });
  });
});

// 일기 삭제
router.delete('/:diaryId', (req, res) => {
  const { diaryId } = req.params;

  const query = 'DELETE FROM diaries WHERE id = ?';
  
  db.query(query, [diaryId], (err, result) => {
    if (err) {
      console.error('일기 삭제 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일기 삭제 중 서버 오류가 발생했습니다.' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 삭제되었습니다.'
    });
  });
});

module.exports = router;
