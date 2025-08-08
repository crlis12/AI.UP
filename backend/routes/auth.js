const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// 이메일 유효성 검사 함수
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 유효성 검사 함수
const validatePassword = (password) => {
  return password && password.length >= 6;
};

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { email, password, username, nickname } = req.body;

    // 입력 데이터 검증
    if (!email || !password || !username || !nickname) {
      return res.status(400).json({ 
        success: false,
        message: '이메일, 비밀번호, 사용자명, 닉네임은 필수입니다.' 
      });
    }

    // 이메일 형식 검증
    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: '올바른 이메일 형식을 입력해주세요.' 
      });
    }

    // 비밀번호 길이 검증
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.' 
      });
    }

    // 사용자명 길이 검증
    if (username.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: '사용자명은 최소 2자 이상이어야 합니다.' 
      });
    }

    // 닉네임 길이 검증
    if (nickname.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: '닉네임은 최소 2자 이상이어야 합니다.' 
      });
    }

    // 이메일 중복 확인
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, rows) => {
      if (err) {
        console.error('DB 조회 오류:', err);
        return res.status(500).json({ 
          success: false,
          message: '서버 오류가 발생했습니다.' 
        });
      }

      if (rows.length > 0) {
        return res.status(409).json({ 
          success: false,
          message: '이미 가입된 이메일입니다.' 
        });
      }

      try {
        // 비밀번호 암호화
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 사용자 정보 DB에 저장
        db.query(
          'INSERT INTO users (email, password, username, nickname) VALUES (?, ?, ?, ?)',
          [email, hashedPassword, username.trim(), nickname.trim()],
          (err, result) => {
            if (err) {
              console.error('DB 저장 오류:', err);
              return res.status(500).json({ 
                success: false,
                message: '회원가입 처리 중 오류가 발생했습니다.' 
              });
            }
            
            return res.status(201).json({ 
              success: true,
              message: '회원가입이 완료되었습니다.',
              user: {
                id: result.insertId,
                email: email,
                username: username.trim(),
                nickname: nickname.trim()
              }
            });
          }
        );
      } catch (hashError) {
        console.error('비밀번호 암호화 오류:', hashError);
        return res.status(500).json({ 
          success: false,
          message: '회원가입 처리 중 오류가 발생했습니다.' 
        });
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    return res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

// 로그인
router.post('/login/email', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력 데이터 검증
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.' 
      });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, rows) => {
      if (err) {
        console.error('DB 조회 오류:', err);
        return res.status(500).json({ 
          success: false,
          message: '서버 오류가 발생했습니다.' 
        });
      }

      if (rows.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: '등록되지 않은 이메일입니다.' 
        });
      }

      const user = rows[0];

      try {
        // 비밀번호 확인
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
          return res.status(401).json({ 
            success: false,
            message: '비밀번호가 일치하지 않습니다.' 
          });
        }

        res.status(200).json({ 
          success: true,
          message: '로그인 성공',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            nickname: user.nickname
          }
        });
      } catch (compareError) {
        console.error('비밀번호 비교 오류:', compareError);
        return res.status(500).json({ 
          success: false,
          message: '로그인 처리 중 오류가 발생했습니다.' 
        });
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    return res.status(500).json({ 
      success: false,
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

module.exports = router;
