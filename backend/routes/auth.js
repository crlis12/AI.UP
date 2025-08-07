const express = require('express');
const db = require('../db');
const router = express.Router();

// 회원가입
router.post('/signup', (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB 오류' });

    if (rows.length > 0) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    db.query(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, password, username],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'DB 저장 오류' });
        return res.status(201).json({ message: '회원가입 성공' });
      }
    );
  });
});

// 로그인
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB 오류' });

    if (rows.length === 0) {
      return res.status(401).json({ message: '등록되지 않은 이메일입니다.' });
    }

    const user = rows[0];

    if (user.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    res.status(200).json({ message: '로그인 성공', username: user.username });
  });
});

module.exports = router;
