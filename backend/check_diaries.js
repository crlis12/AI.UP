const mysql = require('mysql');
require('dotenv').config({ path: '.env.local' });

// MySQL 연결
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 저장된 일기들 확인
connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  
  console.log('MySQL 연결 성공');
  
  // parent_diaries 테이블의 모든 일기 조회
  connection.query('SELECT id, title, created_at FROM parent_diaries ORDER BY id', (error, results) => {
    if (error) {
      console.error('일기 조회 실패:', error);
    } else {
      console.log(`\n총 ${results.length}개의 일기가 저장되어 있습니다:`);
      results.forEach(diary => {
        console.log(`- ID ${diary.id}: ${diary.title} (${diary.created_at})`);
      });
    }
    
    // 연결 종료
    connection.end();
  });
});
