// backend/server.js
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const summarizeRoutes = require('./routes/summarize');
const agentRoutes = require('./routes/agent');
const diaryRoutes = require('./routes/diaries');
const reportsRoutes = require('./routes/reports');


const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어 설정
app.use(express.json());

// CORS 설정
const allowedOrigins = [
  'http://localhost:3000', // 로컬 개발 환경
  'https://salmon-field-0d3db0a00.1.azurestaticapps.net', // 메인 URL
  'https://salmon-field-0d3db0a00-preview.eastasia.1.azurestaticapps.net' // 프리뷰 URL
];

app.use(cors({
  origin: function (origin, callback) {
    // 허용된 origin이거나 origin이 없는 경우 (예: Postman, 같은 출처 요청) 허용
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
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
console.log('✓ /diaries 라우터 등록됨');
app.use('/reports', reportsRoutes);
console.log('✓ /reports 라우터 등록됨');
app.use('/agent', agentRoutes);
console.log('✓ /agent 라우터 등록됨');
console.log('=== 라우터 등록 완료 ===');

// 기본 라우트 (선택 사항)
app.get('/', (req, res) => {
  res.send('Backend server is running2!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
