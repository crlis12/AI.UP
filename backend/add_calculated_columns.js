// reports 테이블에 계산된 컬럼 추가 스크립트
require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

// SQL 파일 읽기
const sqlFilePath = path.join(__dirname, 'add_calculated_columns.sql');
const alterTableSQL = fs.readFileSync(sqlFilePath, 'utf8');

console.log('Reports 테이블에 계산된 컬럼들을 추가하는 중...');

// SQL 문을 세미콜론으로 분리하여 각각 실행
const sqlStatements = alterTableSQL
  .split(';')
  .map(sql => sql.trim())
  .filter(sql => sql.length > 0 && !sql.startsWith('--'));

async function executeStatements() {
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`\n실행 중 (${i + 1}/${sqlStatements.length}): ${sql.substring(0, 80)}...`);
    
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
    
    console.log('\n🎉 계산된 컬럼 추가가 완료되었습니다!');
    console.log('\n새로 추가된 컬럼:');
    console.log('- total_score: DECIMAL(5,2) (6개 영역 점수의 합계, 자동 계산)');
    console.log('- average_score: DECIMAL(5,2) (6개 영역 점수의 평균, 자동 계산)');
    console.log('\n새로 추가된 인덱스:');
    console.log('- idx_total_score: (total_score)');
    console.log('- idx_average_score: (average_score)');
    console.log('- idx_child_total_score: (child_id, total_score)');
    console.log('- idx_child_average_score: (child_id, average_score)');
    
    // 기존 데이터 확인
    console.log('\n📊 기존 리포트 데이터 확인 중...');
    db.query('SELECT id, child_id, total_score, average_score, week_number FROM reports ORDER BY id DESC LIMIT 5', (dataErr, reports) => {
      if (dataErr) {
        console.error('데이터 확인 실패:', dataErr.message);
      } else if (reports.length > 0) {
        console.log('\n최근 리포트 데이터 (계산된 점수 포함):');
        console.table(reports);
      } else {
        console.log('\n아직 저장된 리포트 데이터가 없습니다.');
      }
      
      process.exit(0);
    });
  });
}

executeStatements();
