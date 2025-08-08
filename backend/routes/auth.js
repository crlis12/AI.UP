// backend/routes/auth.js
const express = require('express');
const db = require('../db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const router = express.Router();

const saltRounds = 10;

// --- Nodemailer 설정 ---
// .env 파일 변수 확인
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("오류: .env 파일에 EMAIL_USER 또는 EMAIL_PASS가 설정되지 않았습니다.");
    // 실제 운영 환경에서는 서버를 시작하지 않도록 처리하는 것이 좋습니다.
    // process.exit(1); 
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// --- 설정 끝 ---


// (기존 회원가입 및 로그인 라우트 코드는 동일하므로 생략)
// ...

// 1. 비밀번호 찾기 요청 (이메일 발송)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, users) => {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ message: '데이터베이스 오류' });
    }
    if (users.length === 0) {
      return res.status(200).json({ message: '요청이 접수되었습니다.' });
    }

    const verificationCode = crypto.randomInt(1000, 9999).toString();
    const expiration = new Date(Date.now() + 10 * 60 * 1000);

    db.query(
      'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE email = ?',
      [verificationCode, expiration, email],
      (updateErr) => {
        if (updateErr) {
          console.error('DB 업데이트 오류:', updateErr);
          return res.status(500).json({ message: 'DB 업데이트 오류' });
        }

        const mailOptions = {
          from: `"AI.UP" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: '[AI.UP] 비밀번호 찾기 인증번호 안내',
          html: `<p>안녕하세요. AI.UP 비밀번호 찾기 인증번호는 다음과 같습니다.</p>
                 <h2>${verificationCode}</h2>
                 <p>이 인증번호는 10분 후에 만료됩니다.</p>`,
        };

        transporter.sendMail(mailOptions, (mailErr, info) => {
          if (mailErr) {
            // 터미널에 상세 오류를 출력하는 코드 추가
            console.error('이메일 발송 오류:', mailErr);
            return res.status(500).json({ message: '이메일 발송에 실패했습니다.' });
          }
          res.status(200).json({ message: '인증 이메일이 발송되었습니다.' });
        });
      }
    );
  });
});

// (기존 verify-code 및 reset-password 라우트 코드는 동일하므로 생략)
// ...

module.exports = router;

// --- 기존 코드 부분 (수정 없이 유지) ---
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
        bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
            if (hashErr) return res.status(500).json({ message: '비밀번호 해싱 오류' });
            db.query(
                'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
                [email, hashedPassword, username],
                (insertErr) => {
                    if (insertErr) return res.status(500).json({ message: 'DB 저장 오류' });
                    return res.status(201).json({ message: '회원가입 성공' });
                }
            );
        });
    });
});
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
    }
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
        if (err) return res.status(500).json({ message: 'DB 오류' });
        if (rows.length === 0) {
            return res.status(401).json({ message: '등록되지 않은 이메일입니다.' });
        }
        const user = rows[0];
        bcrypt.compare(password, user.password, (compareErr, isMatch) => {
            if (compareErr) return res.status(500).json({ message: '비밀번호 비교 오류' });
            if (!isMatch) {
                return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
            }
            res.status(200).json({ message: '로그인 성공', username: user.username });
        });
    });
});
router.post('/verify-code', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ message: '이메일과 인증코드는 필수입니다.' });
    }
    db.query(
        'SELECT * FROM users WHERE email = ? AND verification_code = ? AND verification_code_expires > NOW()',
        [email, code],
        (err, users) => {
            if (err) return res.status(500).json({ message: 'DB 오류' });
            if (users.length === 0) {
                return res.status(400).json({ message: '인증번호가 유효하지 않거나 만료되었습니다.' });
            }
            res.status(200).json({ message: '인증 성공' });
        }
    );
});
router.post('/reset-password', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호는 필수입니다.' });
    }
    bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
        if (hashErr) return res.status(500).json({ message: '비밀번호 해싱 오류' });
        db.query(
            'UPDATE users SET password = ?, verification_code = NULL, verification_code_expires = NULL WHERE email = ?',
            [hashedPassword, email],
            (updateErr) => {
                if (updateErr) return res.status(500).json({ message: 'DB 업데이트 오류' });
                res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
            }
        );
    });
});
