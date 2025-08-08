const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');

const app = express();
const PORT = 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우터
app.use('/auth', authRoutes);
app.use('/children', childrenRoutes);

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});
