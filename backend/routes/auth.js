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


// 회원가입
router.post('/signup', (req, res) => {
    const { email, password, username, nickname } = req.body;

    if (!email || !password || !username || !nickname) {
        return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
        if (err) {
            console.error('DB 오류:', err);
            return res.status(500).json({ success: false, message: '데이터베이스 오류가 발생했습니다.' });
        }
        if (rows.length > 0) {
            return res.status(409).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        bcrypt.hash(password, saltRounds, (hashErr, hashedPassword) => {
            if (hashErr) {
                console.error('Bcrypt 해싱 오류:', hashErr);
                return res.status(500).json({ success: false, message: '비밀번호 처리 중 오류가 발생했습니다.' });
            }
            
            db.query(
                'INSERT INTO users (email, password, username, nickname) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, username, nickname],
                (insertErr) => {
                    if (insertErr) {
                        console.error('DB 삽입 오류:', insertErr);
                        return res.status(500).json({ success: false, message: '회원가입 중 오류가 발생했습니다.' });
                    }
                    return res.status(201).json({ success: true, message: '회원가입 성공' });
                }
            );
        });
    });
});

// 로그인
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: '이메일과 비밀번호는 필수입니다.' });
    }
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, rows) => {
        if (err) {
            console.error('DB 오류:', err);
            return res.status(500).json({ success: false, message: '데이터베이스 오류가 발생했습니다.' });
        }
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: '등록되지 않은 이메일입니다.' });
        }
        const user = rows[0];
        bcrypt.compare(password, user.password, (compareErr, isMatch) => {
            if (compareErr) {
                console.error('Bcrypt 비교 오류:', compareErr);
                return res.status(500).json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' });
            }
            if (!isMatch) {
                return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
            }
            // 로그인 성공 시 사용자 정보 반환
            const { id, username, nickname, email } = user;
            res.status(200).json({ 
                success: true, 
                message: '로그인 성공', 
                user: { id, username, nickname, email } 
            });
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

module.exports = router;
