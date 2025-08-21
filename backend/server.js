// backend/server.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const summarizeRoutes = require('./routes/summarize');
const diaryRoutes = require('./routes/diaries');
const reportRoutes = require('./routes/report');
const multimodalRoutes = require('./routes/multimodal');
const questionRoutes = require('./routes/question');
const questionsRoutes = require('./routes/questions');
const counselorsRoutes = require('./routes/counselors');


const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(express.json()); // JSON 요청 본문 파싱
// 업로드 파일 정적 제공
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS 설정 - 모든 origin 허용 (개발 환경용)
app.use(cors({
  origin: true, // 모든 origin 허용
  credentials: true
}));

// 라우터 등록 로그
console.log('=== 라우터 등록 시작 ===');
app.use('/auth', authRoutes);
console.log('✓ /auth 라우터 등록됨');
app.use('/children', childrenRoutes);
console.log('✓ /children 라우터 등록됨');
app.use('/summarize', summarizeRoutes);
console.log('✓ /summarize 라우터 등록됨');
app.use('/diaries', diaryRoutes);
app.use('/report', reportRoutes);
app.use('/multimodal', multimodalRoutes);
app.use('/question', questionRoutes);
app.use('/questions', questionsRoutes);
console.log('✓ /questions 라우터 등록됨');
app.use('/counselors', counselorsRoutes);
console.log('✓ /counselors 라우터 등록됨');

// 기본 라우트 (선택 사항)
app.get('/', (req, res) => {
  res.send('Backend server is running2!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
