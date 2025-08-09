// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const summarizeRoutes = require('./routes/summarize');
const diaryRoutes = require('./routes/diaries');

const app = express();
const PORT = 3001; // 포트 번호를 직접 명시

// 미들웨어 설정
app.use(express.json()); // JSON 요청 본문 파싱
app.use(cors()); // CORS 허용 (프론트엔드와 백엔드가 다른 포트에서 실행될 때 필요)


// auth 라우터 사용
// '/api/auth' 경로로 authRoutes를 마운트합니다.
// auth.js 내부의 '/login'은 '/api/auth/login'이 됩니다.

// 라우터
app.use('/auth', authRoutes); // '/api' 접두사 다시 제거
app.use('/children', childrenRoutes);
app.use('/summarize', summarizeRoutes);
app.use('/diaries', diaryRoutes);


// 기본 라우트 (선택 사항)
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
