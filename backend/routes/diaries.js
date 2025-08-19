require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// multer 설정: uploads/diaries 폴더에 저장
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'diaries');
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (_) {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });

// 기존 diary_files 테이블은 더 이상 사용하지 않으므로 삭제 시도 (없으면 무시)
try {
  db.query('DROP TABLE IF EXISTS diary_files', () => {});
} catch (_) {}


// 벡터 임베딩 생성 함수
async function generateVectorEmbedding(diaryData) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '..', 'search-engine-py', 'upsert_diary.py');
    
    const pythonProcess = spawn('python', [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..', 'search-engine-py'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python 스크립트 오류:', errorString);
        return reject(new Error(`Python 스크립트 실행 실패 (code: ${code}): ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString.trim());
        resolve(result);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError, 'Raw output:', dataString);
        reject(new Error(`결과 파싱 실패: ${parseError.message}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python 프로세스 실행 오류:', error);
      reject(error);
    });

    // 일기 데이터를 JSON으로 전송 (UTF-8 인코딩)
    const inputData = JSON.stringify(diaryData);
    pythonProcess.stdin.write(inputData, 'utf8');
    pythonProcess.stdin.end();
  });
}

// 특정 아동의 모든 일지 조회 (새 스키마: date, content)
router.get('/child/:childId', (req, res) => {
  const { childId } = req.params;
  const { date } = req.query;

  let query = 'SELECT * FROM diaries WHERE child_id = ?';
  const params = [childId];
  if (date) {
    // Normalize incoming date to YYYY-MM-DD
    const dateOnly = normalizeToDateOnly(date) || null;
    query += ' AND date = ? ORDER BY created_at DESC LIMIT 1';
    params.push(dateOnly);
  } else {
    query += ' ORDER BY date DESC, created_at DESC';
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
  const query = 'SELECT * FROM diaries WHERE id = ?';

  db.query(query, [diaryId], (err, results) => {
    if (err) {
      console.error('일기 상세 조회 DB 오류:', err);
      return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    const diary = results[0];
    return res.json({ success: true, diary });
  });
});

// 일지 삭제
router.delete('/:diaryId', (req, res) => {
  const { diaryId } = req.params;
  const query = 'DELETE FROM diaries WHERE id = ?';

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
router.post('/', upload.any(), (req, res) => {
  const { child_id, content, date } = req.body;

  if (!child_id || !content) {
    return res
      .status(400)
      .json({ success: false, message: '필수 정보(child_id, content)가 누락되었습니다.' });
  }

  const dateOnly = normalizeToDateOnly(date) || formatDateOnly(new Date());

  const upsert = `
    INSERT INTO diaries (child_id, date, content)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE content = VALUES(content), updated_at = CURRENT_TIMESTAMP
  `;

  db.query(upsert, [child_id, dateOnly, content], async (err, result) => {
    if (err) {
      console.error('일지 생성/업데이트 DB 오류:', err);
      return res
        .status(500)
        .json({ success: false, message: '일지 저장 중 서버 오류가 발생했습니다.' });
    }
    
    // 업서트 후 diary id 확보
    const maybeId = result.insertId;
    const fetchIdAndHandleFiles = async (diaryId) => {
      // 벡터 임베딩 생성 (비동기, 실패해도 일기 저장은 성공으로 처리)
      try {
        const embeddingData = {
          id: diaryId,
          content: content,
          date: dateOnly,
          child_id: child_id
        };
        
        console.log('벡터 임베딩 생성 시작:', embeddingData);
        const embeddingResult = await generateVectorEmbedding(embeddingData);
        console.log('벡터 임베딩 생성 결과:', embeddingResult);
        
        if (embeddingResult.success) {
          console.log('✅ 벡터 임베딩 생성 성공:', diaryId);
        } else {
          console.warn('⚠️ 벡터 임베딩 생성 실패:', embeddingResult.message);
        }
      } catch (embeddingError) {
        console.error('❌ 벡터 임베딩 생성 중 오류:', embeddingError.message);
        // 벡터 임베딩 실패는 로그만 남기고 계속 진행
      }
      
      const files = Array.isArray(req.files) ? req.files : [];
      // 첫 번째 파일만 사용하여 파일명만 저장 (없으면 null)
      let filenameOnly = null;
      if (files.length > 0) {
        try {
          // multer가 이미 uploads/diaries 에 안전한 파일명으로 저장함
          const first = files[0];
          filenameOnly = path.basename(first.path);
        } catch (e) {
          filenameOnly = null;
        }
      }

      if (filenameOnly) {
        db.query(
          'UPDATE diaries SET children_img = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [filenameOnly, diaryId],
          () => {}
        );
      }

      return res.status(201).json({
        success: true,
        message: '일지가 저장되었습니다.',
        diary: { id: diaryId || null, child_id, date: dateOnly, content, children_img: filenameOnly || null },
      });
    };

    if (maybeId && maybeId > 0) {
      await fetchIdAndHandleFiles(maybeId);
    } else {
      db.query('SELECT id FROM diaries WHERE child_id = ? AND date = ? LIMIT 1', [child_id, dateOnly], async (qErr, rows) => {
        if (qErr || rows.length === 0) {
          return res.status(201).json({ success: true, message: '일지가 저장되었습니다.' });
        }
        await fetchIdAndHandleFiles(rows[0].id);
      });
    }
  });
});

// 일기 수정
router.put('/:diaryId', async (req, res) => {
  const { diaryId } = req.params;
  const { date, content, child_id } = req.body;

  if (!date || !content) {
    return res.status(400).json({ success: false, message: '날짜와 내용은 필수입니다.' });
  }

  const query = 'UPDATE diaries SET date = ?, content = ?, updated_at = NOW() WHERE id = ?';
  
  db.query(query, [date, content, diaryId], async (err, result) => {
    if (err) {
      console.error('일기 수정 DB 오류:', err);
      return res
        .status(500)
        .json({ success: false, message: '일기 수정 중 서버 오류가 발생했습니다.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    // 벡터 임베딩 업데이트 (비동기, 실패해도 일기 수정은 성공으로 처리)
    try {
      const embeddingData = {
        id: parseInt(diaryId),
        content: content,
        date: date,
        child_id: child_id
      };
      
      console.log('벡터 임베딩 업데이트 시작:', embeddingData);
      const embeddingResult = await generateVectorEmbedding(embeddingData);
      console.log('벡터 임베딩 업데이트 결과:', embeddingResult);
      
      if (embeddingResult.success) {
        console.log('✅ 벡터 임베딩 업데이트 성공:', diaryId);
      } else {
        console.warn('⚠️ 벡터 임베딩 업데이트 실패:', embeddingResult.message);
      }
    } catch (embeddingError) {
      console.error('❌ 벡터 임베딩 업데이트 중 오류:', embeddingError.message);
      // 벡터 임베딩 실패는 로그만 남기고 계속 진행
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 수정되었습니다.'
    });
  });
});

// 벡터 임베딩 삭제 함수
async function deleteVectorEmbedding(diaryId) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '..', 'search-engine-py', 'delete_diary.py');
    
    const pythonProcess = spawn('python', [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..', 'search-engine-py'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python 삭제 스크립트 오류:', errorString);
        return reject(new Error(`Python 삭제 스크립트 실행 실패 (code: ${code}): ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString.trim());
        resolve(result);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError, 'Raw output:', dataString);
        reject(new Error(`결과 파싱 실패: ${parseError.message}`));
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('Python 삭제 프로세스 실행 오류:', error);
      reject(error);
    });

    // 일기 ID를 JSON으로 전송 (UTF-8 인코딩)
    const inputData = JSON.stringify({ diary_id: parseInt(diaryId) });
    pythonProcess.stdin.write(inputData, 'utf8');
    pythonProcess.stdin.end();
  });
}

// 일기 삭제
router.delete('/:diaryId', async (req, res) => {
  const { diaryId } = req.params;

  const query = 'DELETE FROM diaries WHERE id = ?';
  
  db.query(query, [diaryId], async (err, result) => {
    if (err) {
      console.error('일기 삭제 DB 오류:', err);
      return res
        .status(500)
        .json({ success: false, message: '일기 삭제 중 서버 오류가 발생했습니다.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: '일기를 찾을 수 없습니다.' });
    }
    
    // 벡터 임베딩 삭제 (비동기, 실패해도 일기 삭제는 성공으로 처리)
    try {
      console.log('벡터 임베딩 삭제 시작:', diaryId);
      const embeddingResult = await deleteVectorEmbedding(diaryId);
      console.log('벡터 임베딩 삭제 결과:', embeddingResult);
      
      if (embeddingResult.success) {
        console.log('✅ 벡터 임베딩 삭제 성공:', diaryId);
      } else {
        console.warn('⚠️ 벡터 임베딩 삭제 실패:', embeddingResult.message);
      }
    } catch (embeddingError) {
      console.error('❌ 벡터 임베딩 삭제 중 오류:', embeddingError.message);
      // 벡터 임베딩 실패는 로그만 남기고 계속 진행
    }
    
    res.json({ 
      success: true, 
      message: '일기가 성공적으로 삭제되었습니다.'
    });
  });
});

module.exports = router;