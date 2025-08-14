const express = require('express');
const router = express.Router();
const db = require('../db');
const config = require('../config');
const { spawn } = require('child_process');
const path = require('path');

// Python 스크립트 호출 함수
function runPythonScript(diaryData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'search-engine-py', 'upsert_diary.py');
    const pythonPath = config.python.path;
    
    console.log(`[${new Date().toISOString()}] Python 스크립트 실행 시작:`);
    console.log(`  - 스크립트 경로: ${scriptPath}`);
    console.log(`  - Python 경로: ${pythonPath}`);
    console.log(`  - 입력 데이터:`, diaryData);
    
    const pythonProcess = spawn(pythonPath, [scriptPath]);
    
    let result = '';
    let error = '';
    
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
      console.log(`[${new Date().toISOString()}] Python stdout:`, data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
      console.log(`[${new Date().toISOString()}] Python stderr:`, data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`[${new Date().toISOString()}] Python 프로세스 종료: 코드 ${code}`);
      console.log(`  - stdout 결과: ${result}`);
      console.log(`  - stderr 에러: ${error}`);
      
      if (code === 0) {
        try {
          const jsonResult = JSON.parse(result);
          console.log(`[${new Date().toISOString()}] Python 결과 파싱 성공:`, jsonResult);
          resolve(jsonResult);
        } catch (e) {
          console.error(`[${new Date().toISOString()}] Python 결과 파싱 실패:`, e);
          reject(new Error('Python 스크립트 결과 파싱 실패'));
        }
      } else {
        console.error(`[${new Date().toISOString()}] Python 스크립트 실행 실패: 코드 ${code}`);
        reject(new Error(`Python 스크립트 실행 실패 (코드: ${code}): ${error}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      console.error(`[${new Date().toISOString()}] Python 프로세스 에러:`, err);
      reject(new Error(`Python 프로세스 에러: ${err.message}`));
    });
    
    // JSON 데이터 전송
    const inputData = JSON.stringify(diaryData);
    console.log(`[${new Date().toISOString()}] Python에 전송할 데이터:`, inputData);
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
  });
}

// 루트 경로 - 모든 일기 조회
router.get('/', async (req, res) => {
  try {
    db.query(
      'SELECT * FROM parent_diaries ORDER BY created_at DESC',
      (error, rows) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          res.json({ success: true, diaries: rows });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 생성
router.post('/', async (req, res) => {
  try {
    const { user_id, title, content, mood } = req.body;
    
    console.log(`[${new Date().toISOString()}] 일기 생성 요청: user_id=${user_id}, title="${title}"`);
    
    // MySQL에 일기 저장
    db.query(
      'INSERT INTO parent_diaries (user_id, title, content, mood) VALUES (?, ?, ?, ?)',
      [user_id, title, content, mood],
      async (error, result) => {
        if (error) {
          console.error(`[${new Date().toISOString()}] MySQL 저장 실패:`, error.message);
          res.status(500).json({ success: false, error: error.message });
        } else {
          const diaryId = result.insertId;
          console.log(`[${new Date().toISOString()}] MySQL 저장 성공: diary_id=${diaryId}`);
          
          try {
            // 벡터 DB에도 저장
            const diaryData = {
              id: diaryId,
              text: `${title} ${content}`, // 제목과 내용을 합쳐서 텍스트로
              date: new Date().toISOString().split('T')[0] // 오늘 날짜
            };
            
            console.log(`[${new Date().toISOString()}] VectorDB 저장 시작: diary_id=${diaryId}`);
            const vectorResult = await runPythonScript(diaryData);
            console.log(`[${new Date().toISOString()}] VectorDB 저장 완료:`, vectorResult);
            
            res.json({ 
              success: true, 
              id: diaryId,
              vectorDB: vectorResult 
            });
          } catch (vectorError) {
            console.error(`[${new Date().toISOString()}] VectorDB 저장 실패:`, vectorError.message);
            // 벡터 DB 저장 실패해도 MySQL 저장은 성공했으므로 성공 응답
            res.json({ 
              success: true, 
              id: diaryId,
              vectorDB: { success: false, message: vectorError.message }
            });
          }
        }
      }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 일기 생성 중 오류:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 조회 (사용자별)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    db.query(
      'SELECT * FROM parent_diaries WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (error, rows) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          res.json({ success: true, diaries: rows });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood } = req.body;
    
    // MySQL에서 일기 수정
    db.query(
      'UPDATE parent_diaries SET title = ?, content = ?, mood = ? WHERE id = ?',
      [title, content, mood, id],
      async (error) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else {
          try {
            // 벡터 DB도 업데이트
            const diaryData = {
              id: parseInt(id),
              text: `${title} ${content}`,
              date: new Date().toISOString().split('T')[0]
            };
            
            const vectorResult = await runPythonScript(diaryData);
            console.log('벡터 DB 업데이트 결과:', vectorResult);
            
            res.json({ 
              success: true,
              vectorDB: vectorResult 
            });
          } catch (vectorError) {
            console.error('벡터 DB 업데이트 실패:', vectorError);
            res.json({ 
              success: true,
              vectorDB: { success: false, message: vectorError.message }
            });
          }
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 일기 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 먼저 삭제할 일기 정보를 가져옴
    db.query(
      'SELECT * FROM parent_diaries WHERE id = ?',
      [id],
      async (error, rows) => {
        if (error) {
          res.status(500).json({ success: false, error: error.message });
        } else if (rows.length === 0) {
          res.status(404).json({ success: false, error: '일기를 찾을 수 없습니다.' });
        } else {
          try {
            // VectorDB에서 해당 벡터 삭제
            const deleteData = {
              action: 'delete',
              id: parseInt(id)
            };
            
            const vectorResult = await runPythonScript(deleteData);
            console.log('VectorDB 삭제 결과:', vectorResult);
            
            // MySQL에서 일기 삭제
            db.query(
              'DELETE FROM parent_diaries WHERE id = ?',
              [id],
              (deleteError) => {
                if (deleteError) {
                  res.status(500).json({ success: false, error: deleteError.message });
                } else {
                  res.json({ 
                    success: true, 
                    message: '일기가 성공적으로 삭제되었습니다.',
                    vectorDB: vectorResult 
                  });
                }
              }
            );
          } catch (vectorError) {
            console.error('VectorDB 삭제 실패:', vectorError);
            // VectorDB 삭제 실패해도 MySQL 삭제는 진행
            db.query(
              'DELETE FROM parent_diaries WHERE id = ?',
              [id],
              (deleteError) => {
                if (deleteError) {
                  res.status(500).json({ success: false, error: deleteError.message });
                } else {
                  res.json({ 
                    success: true, 
                    message: '일기가 삭제되었지만 VectorDB 동기화에 실패했습니다.',
                    vectorDB: { success: false, message: vectorError.message }
                  });
                }
              }
            );
          }
        }
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;