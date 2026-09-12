const mysql = require('mysql');
require('dotenv').config({ path: '.env.local' });

// MySQL 연결
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 기존 일기들 삭제
connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패:', err);
    return;
  }
  
  console.log('MySQL 연결 성공');
  
  // parent_diaries 테이블의 모든 데이터 삭제
  connection.query('DELETE FROM parent_diaries', (error, results) => {
    if (error) {
      console.error('일기 삭제 실패:', error);
    } else {
      console.log(`총 ${results.affectedRows}개의 일기가 삭제되었습니다.`);
    }
    
    // 연결 종료
    connection.end();
  });
});
