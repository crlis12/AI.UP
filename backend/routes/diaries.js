const express = require('express');
const router = express.Router();
const db = require('../db');

// 루트 경로 - 모든 일기 조회
router.get('/', async (req, res) => {
  try {
    db.query(
      'SELECT * FROM parent_diaries ORDER BY created_at DESC',
      (error, rows) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          res.json({ success: true, diaries: rows });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 생성
router.post('/', async (req, res) => {
  try {
    const { user_id, title, content, mood } = req.body;
    db.query(
      'INSERT INTO parent_diaries (user_id, title, content, mood) VALUES (?, ?, ?, ?)',
      [user_id, title, content, mood],
      (error, result) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          res.json({ success: true, id: result.insertId });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 조회 (사용자별)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    db.query(
      'SELECT * FROM parent_diaries WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (error, rows) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          res.json({ success: true, diaries: rows });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood } = req.body;
    db.query(
      'UPDATE parent_diaries SET title = ?, content = ?, mood = ? WHERE id = ?',
      [title, content, mood, id],
      (error) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          res.json({ success: true });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    db.query(
      'DELETE FROM parent_diaries WHERE id = ?',
      [id],
      (error) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          res.json({ success: true });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
