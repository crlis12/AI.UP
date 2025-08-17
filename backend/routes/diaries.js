const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// multer 설정: uploads/diaries 폴더에 저장
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'diaries');
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

// 메인 테이블: 일기 저장용 (없으면 생성)
const ensureParentDiariesTableSql = `
  CREATE TABLE IF NOT EXISTS parent_diaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    mood VARCHAR(50) DEFAULT 'happy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX(user_id),
    INDEX(created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// 보조 테이블: 일지 첨부 파일 저장용 (없으면 생성)
const ensureDiaryFilesTableSql = `
  CREATE TABLE IF NOT EXISTS diary_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diary_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(diary_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

try {
  db.query(ensureParentDiariesTableSql, () => {});
  db.query(ensureDiaryFilesTableSql, () => {});
} catch (_) {}

// 특정 아동의 모든 일지 조회 (새 스키마: date, content)
router.get('/child/:userId', (req, res) => {
  const { userId } = req.params;
  const { date } = req.query;

  let query = 'SELECT * FROM parent_diaries WHERE user_id = ?';
  const params = [userId];
  if (date) {
    // Normalize incoming date to YYYY-MM-DD
    const dateOnly = normalizeToDateOnly(date) || null;
    query += ' AND date = ? ORDER BY created_at DESC LIMIT 1';
    params.push(dateOnly);
  } else {
    // parent_diaries 테이블에는 date 컬럼이 없으므로 created_at만 사용
    query += ' ORDER BY created_at DESC';
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('일기 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    res.json({ success: true, diaries: results });
  });
});

// 특정 일지 상세 조회 (새 스키마)
router.get('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const query = 'SELECT * FROM parent_diaries WHERE id = ?';

  db.query(query, [diaryId], (err, results) => {
    if (err) {
      console.error('일기 상세 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    const diary = results[0];
    db.query('SELECT id, file_path, file_type FROM diary_files WHERE diary_id = ? ORDER BY id ASC', [diaryId], (fErr, files) => {
      if (fErr) {
        console.error('일지 파일 조회 DB 오류:', fErr);
        return res.json({ success: true, diary });
      }
      diary.files = files || [];
      res.json({ success: true, diary });
    });
  });
});

// 일지 삭제
router.delete('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const query = 'DELETE FROM parent_diaries WHERE id = ?';

  db.query(query, [diaryId], (err, result) => {
    if (err) {
      console.error('일지 삭제 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '삭제할 일지를 찾을 수 없습니다.' });
    }
    res.json({ success: true, message: '일지가 삭제되었습니다.' });
  });
});

// helper: format JS Date to YYYY-MM-DD
function formatDateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeToDateOnly(input) {
  if (!input) return null;
  const d = new Date(input);
  if (!isNaN(d)) {
    return formatDateOnly(d);
  }
  const s = String(input);
  if (s.length >= 10 && /\d{4}-\d{2}-\d{2}/.test(s.slice(0, 10))) return s.slice(0, 10);
  return null;
}

// 새로운 일지 생성 또는 같은 날짜의 기존 일지 업데이트(업서트)
router.post('/', upload.array('files', 10), (req, res) => {
  const { user_id, title, content, mood } = req.body;

  if (!user_id || !content) {
    return res.status(400).json({ success: false, message: '필수 정보(user_id, content)가 누락되었습니다.' });
  }

  const dateOnly = formatDateOnly(new Date());

  const upsert = `
    INSERT INTO parent_diaries (user_id, title, content, mood, created_at)
    VALUES (?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = CURRENT_TIMESTAMP
  `;

      db.query(upsert, [user_id, title || dateOnly, content, mood || 'happy'], (err, result) => {
    if (err) {
      console.error('일지 생성/업데이트 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일지 저장 중 서버 오류가 발생했습니다.' });
    }
    // 업서트 후 diary id 확보
    const maybeId = result.insertId;
    const fetchIdAndHandleFiles = (diaryId) => {
      const files = Array.isArray(req.files) ? req.files : [];
      if (files.length === 0) {
        return res.status(201).json({
          success: true,
          message: '일지가 저장되었습니다.',
          diary: { id: diaryId || null, child_id, date: dateOnly, content },
        });
      }
      const values = files.map((f) => [
        diaryId,
        `/uploads/diaries/${path.basename(f.path)}`,
        f.mimetype && f.mimetype.startsWith('video/') ? 'video' : 'image',
      ]);
      const insertFilesSql = 'INSERT INTO diary_files (diary_id, file_path, file_type) VALUES ?';
      db.query(insertFilesSql, [values], (fErr) => {
        if (fErr) {
          console.error('첨부 저장 DB 오류:', fErr);
          // 파일 저장 오류가 있어도 일지 저장 자체는 성공으로 처리
        }
        return res.status(201).json({
          success: true,
          message: '일지가 저장되었습니다.',
          diary: { id: diaryId || null, child_id, date: dateOnly, content },
        });
      });
    };

    if (maybeId && maybeId > 0) {
      fetchIdAndHandleFiles(maybeId);
    } else {
      db.query('SELECT id FROM parent_diaries WHERE user_id = ? AND date = ? LIMIT 1', [user_id, dateOnly], (qErr, rows) => {
        if (qErr || rows.length === 0) {
          return res.status(201).json({ success: true, message: '일지가 저장되었습니다.' });
        }
        fetchIdAndHandleFiles(rows[0].id);
      });
    }
  });
});

// 일기 수정
router.put('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const { date, content } = req.body;

  if (!date || !content) {
    return res.status(400).json({ success: false, message: '날짜와 내용은 필수입니다.' });
  }

  const query = 'UPDATE diaries SET date = ?, content = ?, updated_at = NOW() WHERE id = ?';
  
  db.query(query, [date, content, diaryId], (err, result) => {
    if (err) {
      console.error('일기 수정 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일기 수정 중 서버 오류가 발생했습니다.' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 수정되었습니다.'
    });
  });
});

// 일기 삭제
router.delete('/:diaryId', (req, res) => {
  const { diaryId } = req.params;

  const query = 'DELETE FROM diaries WHERE id = ?';
  
  db.query(query, [diaryId], (err, result) => {
    if (err) {
      console.error('일기 삭제 DB 오류:', err);
      return res.status(500).json({ success: false, message: '일기 삭제 중 서버 오류가 발생했습니다.' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 삭제되었습니다.'
    });
  });
});

const config = require('../config');
const { spawn } = require('child_process');

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
              title: title,
              content: content,
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
            // TODO: 나중에 벡터 DB 문제 해결 후 활성화
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
    console.log(`[${new Date().toISOString()}] 일기 조회 요청: user_id=${userId}`);
    
    db.query(
      'SELECT * FROM parent_diaries WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (error, rows) => {
        if (error) {
          console.error(`[${new Date().toISOString()}] 일기 조회 DB 오류:`, error.message);
          res.status(500).json({ success: false, error: error.message });
        } else {
          console.log(`[${new Date().toISOString()}] 일기 조회 성공: ${rows.length}개`);
          res.json({ success: true, diaries: rows || [] });
        }
      }
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 일기 조회 중 오류:`, error.message);
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