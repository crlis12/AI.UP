// reports 테이블 컬럼 추가 스크립트
require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

// SQL 파일 읽기
const sqlFilePath = path.join(__dirname, 'add_report_columns.sql');
const alterTableSQL = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Reports 테이블에 새 컬럼을 추가하는 중...');

// SQL 문을 세미콜론으로 분리하여 각각 실행
const sqlStatements = alterTableSQL
  .split(';')
  .map(sql => sql.trim())
  .filter(sql => sql.length > 0 && !sql.startsWith('--'));

async function executeStatements() {
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`\n실행 중 (${i + 1}/${sqlStatements.length}): ${sql.substring(0, 50)}...`);
    
    try {
      await new Promise((resolve, reject) => {
        db.query(sql, (err, result) => {
          if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
              console.log('✓ 컬럼이 이미 존재합니다.');
              resolve();
            } else if (err.code === 'ER_DUP_KEYNAME') {
              console.log('✓ 인덱스가 이미 존재합니다.');
              resolve();
            } else {
              reject(err);
            }
          } else {
            console.log('✅ 성공적으로 실행되었습니다.');
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`❌ 실행 실패: ${error.message}`);
      process.exit(1);
    }
  }
  
  // 테이블 구조 확인
  console.log('\n📋 업데이트된 Reports 테이블 구조:');
  db.query('DESCRIBE reports', (descErr, columns) => {
    if (descErr) {
      console.error('테이블 구조 확인 실패:', descErr.message);
    } else {
      console.table(columns);
    }
    
    console.log('\n🎉 Reports 테이블 업데이트가 완료되었습니다!');
    console.log('\n새로 추가된 컬럼:');
    console.log('- alert_message: TEXT (체크리스트 알림 메시지)');
    console.log('- week_number: INT (주차 번호, 기본값 1)');
    console.log('\n새로 추가된 인덱스:');
    console.log('- idx_child_week: (child_id, week_number)');
    console.log('- idx_parent_child_week: (parent_id, child_id, week_number)');
    
    process.exit(0);
  });
}

executeStatements();
