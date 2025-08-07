// backend/routes/auth.js
const express = require('express');
const db = require('../db'); // db.js는 backend 폴더에, auth.js는 routes 폴더에 있으므로 '../db'가 올바른 경로입니다.
const router = express.Router(); // 이 줄이 6번째 줄일 것입니다.

// 회원가입 라우트
router.post('/signup', (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) {
      console.error('회원가입 DB 조회 오류:', err);
      return res.status(500).json({ message: 'DB 오류' });
    }

    if (rows.length > 0) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    // 경고: 비밀번호가 평문으로 저장됩니다. 보안에 매우 취약합니다.
    db.query(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, password, username],
      (err, result) => {
        if (err) {
          console.error('회원가입 DB 저장 오류:', err);
          return res.status(500).json({ message: 'DB 저장 오류' });
        }
        return res.status(201).json({ message: '회원가입 성공' });
      }
    );
  });
});

// 로그인 라우트
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
    if (err) {
      console.error('로그인 DB 조회 오류:', err);
      return res.status(500).json({ message: 'DB 오류' });
    }

    if (rows.length === 0) {
      return res.status(401).json({ message: '등록되지 않은 이메일입니다.' });
    }

    const user = rows[0];

    // 경고: 비밀번호가 평문으로 비교됩니다. 보안에 매우 취약합니다.
    if (user.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    res.status(200).json({ message: '로그인 성공', username: user.username });
  });
});

module.exports = router;
