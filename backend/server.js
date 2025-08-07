// backend/server.js
const express = require('express');
const cors = require('cors');
// **수정된 부분: auth.js 파일의 실제 경로에 맞게 수정**
// auth.js가 backend/routes 폴더 안에 있다면 './routes/auth'로 변경합니다.
const authRoutes = require('./routes/auth'); // auth.js 파일이 'routes' 폴더 안에 있다고 가정

const app = express();
const PORT = 3001; // 포트 번호를 직접 명시

// 미들웨어 설정
app.use(express.json()); // JSON 요청 본문 파싱
app.use(cors()); // CORS 허용 (프론트엔드와 백엔드가 다른 포트에서 실행될 때 필요)

// auth 라우터 사용
// '/api/auth' 경로로 authRoutes를 마운트합니다.
// auth.js 내부의 '/login'은 '/api/auth/login'이 됩니다.
app.use('/api/auth', authRoutes); 

// 기본 라우트 (선택 사항)
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
