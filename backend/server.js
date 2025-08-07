// backend/server.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // auth.js에서 정의한 라우터 임포트

const app = express();
const PORT = 3001; // 포트 번호를 직접 명시

// 미들웨어 설정
app.use(express.json()); // JSON 요청 본문 파싱
app.use(cors()); // CORS 허용 (프론트엔드와 백엔드가 다른 포트에서 실행될 때 필요)

// auth 라우터 사용
app.use('/api/auth', authRoutes); // /api/auth 경로로 authRoutes를 마운트

// 기본 라우트 (선택 사항)
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
