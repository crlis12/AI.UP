const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// multer 설정: uploads/diaries 폴더에 저장
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'diaries');
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

// 특정 아동의 모든 일지 조회 (새 스키마: date, content)
router.get('/child/:childId', (req, res) => {
  const { childId } = req.params;

  const query = 'SELECT * FROM diaries WHERE child_id = ? ORDER BY date DESC, created_at DESC';

  db.query(query, [childId], (err, results) => {
    if (err) {
      console.error('일기 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    res.json({ success: true, diaries: results });
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
    res.json({ success: true, diary: results[0] });
  });
});

// helper: format JS Date to YYYY-MM-DD
function formatDateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 새로운 일지 생성 (summary 컬럼이 없을 수도 있어 안전 처리)
// 새 스키마에 맞춘 생성/업서트 (child_id+date 유니크)
router.post('/', upload.none(), (req, res) => {
  const { child_id, content, date } = req.body;

  if (!child_id || !content) {
    return res.status(400).json({ success: false, message: '필수 정보(child_id, content)가 누락되었습니다.' });
  }

  const dateOnly = date ? date : formatDateOnly(new Date());

  const upsert = `
    INSERT INTO diaries (child_id, date, content)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = CURRENT_TIMESTAMP
  `;

  db.query(upsert, [child_id, dateOnly, content], (err, result) => {
    if (err) {
      console.error('일지 생성/업데이트 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일지 저장 중 서버 오류가 발생했습니다.' });
    }
    const id = result.insertId || null;
    return res.status(201).json({
      success: true,
      message: '일지가 저장되었습니다.',
      diary: { id, child_id, date: dateOnly, content },
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
