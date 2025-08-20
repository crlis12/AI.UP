const express = require('express');
const router = express.Router();
const db = require('../db'); // DB 연결 가져오기
const { spawn } = require('child_process');
const path = require('path');

// 테스트 라우트
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Questions 라우트가 정상적으로 작동합니다!',
  });
});

// 자녀의 나이에 맞는 질문들을 가져오는 API
router.get('/child/:childId', async (req, res) => {
  try {
    const childId = req.params.childId;

    // 임시 테스트용 더미 데이터
    console.log('Questions API 호출됨 - childId:', childId);

    // 데이터베이스 연결 테스트
    if (!db) {
      console.error('데이터베이스 연결이 없습니다');
      return res.status(500).json({
        success: false,
        message: '데이터베이스 연결 오류',
      });
    }

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: '자녀 ID가 필요합니다.',
      });
    }

    // 먼저 자녀 정보 가져오기 (나이 계산을 위해)
    const childQuery = `
      SELECT id, name, birth_date 
      FROM children 
      WHERE id = ? AND is_active = TRUE
    `;

    db.query(childQuery, [childId], (err, childRows) => {
      if (err) {
        console.error('자녀 정보 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      if (childRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '자녀 정보를 찾을 수 없습니다.',
        });
      }

      const child = childRows[0];

      // 자녀의 현재 나이(개월 수) 계산
      const today = new Date();
      const birthDate = new Date(child.birth_date);
      let ageInMonths =
        (today.getFullYear() - birthDate.getFullYear()) * 12 +
        (today.getMonth() - birthDate.getMonth());
      if (today.getDate() < birthDate.getDate()) {
        ageInMonths -= 1;
      }
      ageInMonths = Math.max(0, ageInMonths);

      // 4개월 미만인 경우 KDST 체크리스트 없음 알림
      if (ageInMonths < 4) {
        console.log('4개월 미만 아기 - KDST 체크리스트 없음');
        console.log('  - 자녀 나이:', ageInMonths, '개월');
        console.log('  - KDST는 4개월부터 시작됩니다.');
        
        return res.status(200).json({
          success: false,
          message: 'KDST 체크리스트는 4개월부터 시작됩니다.',
          child: {
            id: child.id,
            name: child.name,
            ageInMonths: ageInMonths,
          },
          questions: [],
          noKDST: true,
          reason: `현재 ${ageInMonths}개월로, KDST 체크리스트 대상이 아닙니다. (4개월부터 시작)`
        });
      }

      // 정확한 개월 수에 해당하는 age_group만 조회
      console.log('자녀 나이 정보:');
      console.log('  - 실제 나이:', ageInMonths, '개월');
      console.log('  - 조회할 질문: 정확히', ageInMonths, '개월에 해당하는 age_group의 질문만');

      // 하드코딩으로 age_group_id 결정
      let ageGroupId;
      let ageRangeText;

      if (4 <= ageInMonths && ageInMonths <= 5) {
        ageGroupId = 1;
        ageRangeText = "4~5개월용";
      } else if (6 <= ageInMonths && ageInMonths <= 7) {
        ageGroupId = 2;
        ageRangeText = "6~7개월용";
      } else if (8 <= ageInMonths && ageInMonths <= 9) {
        ageGroupId = 3;
        ageRangeText = "8~9개월용";
      } else if (10 <= ageInMonths && ageInMonths <= 11) {
        ageGroupId = 4;
        ageRangeText = "10~11개월용";
      } else if (12 <= ageInMonths && ageInMonths <= 13) {
        ageGroupId = 5;
        ageRangeText = "12~13개월용";
      } else if (14 <= ageInMonths && ageInMonths <= 15) {
        ageGroupId = 6;
        ageRangeText = "14~15개월용";
      } else if (16 <= ageInMonths && ageInMonths <= 17) {
        ageGroupId = 7;
        ageRangeText = "16~17개월용";
      } else if (18 <= ageInMonths && ageInMonths <= 19) {
        ageGroupId = 8;
        ageRangeText = "18~19개월용";
      } else if (20 <= ageInMonths && ageInMonths <= 21) {
        ageGroupId = 9;
        ageRangeText = "20~21개월용";
      } else if (22 <= ageInMonths && ageInMonths <= 23) {
        ageGroupId = 10;
        ageRangeText = "22~23개월용";
      } else if (24 <= ageInMonths && ageInMonths <= 26) {
        ageGroupId = 11;
        ageRangeText = "24~26개월용";
      } else if (27 <= ageInMonths && ageInMonths <= 29) {
        ageGroupId = 12;
        ageRangeText = "27~29개월용";
      } else if (30 <= ageInMonths && ageInMonths <= 32) {
        ageGroupId = 13;
        ageRangeText = "30~32개월용";
      } else if (33 <= ageInMonths && ageInMonths <= 35) {
        ageGroupId = 14;
        ageRangeText = "33~35개월용";
      } else if (36 <= ageInMonths && ageInMonths <= 41) {
        ageGroupId = 15;
        ageRangeText = "36~41개월용";
      } else if (42 <= ageInMonths && ageInMonths <= 47) {
        ageGroupId = 16;
        ageRangeText = "42~47개월용";
      } else if (48 <= ageInMonths && ageInMonths <= 53) {
        ageGroupId = 17;
        ageRangeText = "48~53개월용";
      } else if (54 <= ageInMonths && ageInMonths <= 59) {
        ageGroupId = 18;
        ageRangeText = "54~59개월용";
      } else if (60 <= ageInMonths && ageInMonths <= 65) {
        ageGroupId = 19;
        ageRangeText = "60~65개월용";
      } else if (66 <= ageInMonths && ageInMonths <= 71) {
        ageGroupId = 20;
        ageRangeText = "66~71개월용";
      } else {
        // 지원하지 않는 연령대
        console.log('지원하지 않는 연령대:', ageInMonths, '개월');
        return res.status(200).json({
          success: false,
          message: '지원하지 않는 연령대입니다.',
          child: {
            id: child.id,
            name: child.name,
            ageInMonths: ageInMonths,
          },
          questions: [],
          noKDST: true,
          reason: `${ageInMonths}개월은 KDST 체크리스트 지원 범위를 벗어났습니다.`
        });
      }

      console.log('결정된 age_group 정보:');
      console.log('  - age_group_id:', ageGroupId);
      console.log('  - age_range_text:', ageRangeText);

      // 먼저 테이블 존재 여부 확인
      console.log('데이터베이스 테이블 확인 중...');

      // Questions 테이블 데이터 개수 확인
      db.query('SELECT COUNT(*) as count FROM Questions', (countErr, countResult) => {
        if (countErr) {
          console.error('Questions 테이블 조회 오류:', countErr);
        } else {
          console.log('Questions 테이블 총 데이터 수:', countResult[0]?.count || 0);
        }
      });

      // AgeGroups 테이블 확인
      db.query('SELECT * FROM AgeGroups', (ageErr, ageResult) => {
        if (ageErr) {
          console.error('AgeGroups 테이블 조회 오류:', ageErr);
        } else {
          console.log('AgeGroups 테이블 데이터:', ageResult);
        }
      });

      // 정확한 age_group_id로 질문들만 조회
      const questionsQuery = `
        SELECT 
          q.question_id,
          q.question_text,
          q.question_note,
          q.question_number,
          q.is_additional,
          q.additional_category,
          d.domain_name,
          ag.age_range_text,
          ag.min_months,
          ag.max_months
        FROM Questions q
        JOIN AgeGroups ag ON q.age_group_id = ag.age_group_id
        JOIN Domains d ON q.domain_id = d.domain_id
        WHERE q.age_group_id = ?
        ORDER BY d.domain_id, q.question_number
      `;

      console.log('질문 조회 쿼리 실행 (정확한 age_group_id로 조회)');
      console.log('검색 조건:');
      console.log('  - 자녀 나이:', ageInMonths, '개월');
      console.log('  - age_group_id:', ageGroupId);
      console.log('  - age_range_text:', ageRangeText);
      console.log('  - 실제 쿼리: WHERE q.age_group_id =', ageGroupId);

      // 정확한 age_group_id로 질문만 조회
      db.query(questionsQuery, [ageGroupId], (questionsErr, questionRows) => {
        if (questionsErr) {
          console.error('질문 조회 오류:', questionsErr);
          return res.status(500).json({
            success: false,
            message: '질문 조회 중 오류가 발생했습니다.',
          });
        }

        console.log('조회 결과:');
        console.log('  - 자녀 나이:', ageInMonths, '개월');
        console.log('  - age_group_id:', ageGroupId);
        console.log('  - age_range_text:', ageRangeText);
        console.log('  - 조회된 질문 수:', questionRows.length);

        return res.status(200).json({
          success: true,
          child: {
            id: child.id,
            name: child.name,
            ageInMonths: ageInMonths,
          },
          questions: questionRows,
        });
      });
    });
  } catch (error) {
    console.error('질문 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 특정 발달 영역의 질문들만 가져오는 API
router.get('/child/:childId/domain/:domainId', async (req, res) => {
  try {
    const { childId, domainId } = req.params;

    if (!childId || !domainId) {
      return res.status(400).json({
        success: false,
        message: '자녀 ID와 발달 영역 ID가 필요합니다.',
      });
    }

    // 자녀 정보 가져오기
    const childQuery = `
      SELECT id, name, birth_date 
      FROM children 
      WHERE id = ? AND is_active = TRUE
    `;

    db.query(childQuery, [childId], (err, childRows) => {
      if (err) {
        console.error('자녀 정보 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      if (childRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '자녀 정보를 찾을 수 없습니다.',
        });
      }

      const child = childRows[0];

      // 나이 계산
      const today = new Date();
      const birthDate = new Date(child.birth_date);
      let ageInMonths =
        (today.getFullYear() - birthDate.getFullYear()) * 12 +
        (today.getMonth() - birthDate.getMonth());
      if (today.getDate() < birthDate.getDate()) {
        ageInMonths -= 1;
      }
      ageInMonths = Math.max(0, ageInMonths);

      // 특정 발달 영역의 질문들 조회
      const questionsQuery = `
        SELECT 
          q.question_id,
          q.question_text,
          q.question_note,
          q.question_number,
          q.is_additional,
          q.additional_category,
          d.domain_name,
          ag.age_range_text
        FROM Questions q
        JOIN AgeGroups ag ON q.age_group_id = ag.age_group_id
        JOIN Domains d ON q.domain_id = d.domain_index
        WHERE ag.min_months <= ? AND ag.max_months >= ? AND d.domain_id = ?
        ORDER BY q.question_number
      `;

      db.query(
        questionsQuery,
        [ageInMonths, ageInMonths, domainId],
        (questionsErr, questionRows) => {
          if (questionsErr) {
            console.error('질문 조회 오류:', questionsErr);
            return res.status(500).json({
              success: false,
              message: '질문 조회 중 오류가 발생했습니다.',
            });
          }

          return res.status(200).json({
            success: true,
            child: {
              id: child.id,
              name: child.name,
              ageInMonths: ageInMonths,
            },
            domain: questionRows.length > 0 ? questionRows[0].domain_name : '',
            questions: questionRows,
          });
        }
      );
    });
  } catch (error) {
    console.error('질문 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// 모든 발달 영역 목록 가져오기
router.get('/domains', (req, res) => {
  try {
    const query = `
      SELECT domain_id, domain_name 
      FROM Domains 
      ORDER BY domain_id
    `;

    db.query(query, (err, rows) => {
      if (err) {
        console.error('발달 영역 조회 오류:', err);
        return res.status(500).json({
          success: false,
          message: '서버 오류가 발생했습니다.',
        });
      }

      return res.status(200).json({
        success: true,
        domains: rows,
      });
    });
  } catch (error) {
    console.error('발달 영역 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
    });
  }
});

// KDST 질문에 대한 RAG 검색 API
router.post('/kdst-rag', async (req, res) => {
  try {
    const { childId, questions } = req.body;
    
    console.log('🔍 KDST RAG 검색 API 호출됨');
    console.log('   - childId:', childId);
    console.log('   - questions 수:', questions?.length || 0);
    
    if (!childId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'childId와 questions 배열이 필요합니다.'
      });
    }
    
    // Python RAG 모듈 실행
    const pythonScriptPath = path.join(__dirname, '..', 'search-engine-py', 'kdst_rag_module.py');
    console.log('   - Python 스크립트 경로:', pythonScriptPath);
    
    // Python 프로세스 실행 (UTF-8 인코딩 설정)
    const pythonProcess = spawn('python', [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..', 'search-engine-py'),
      env: {
        ...process.env,
        'PYTHONIOENCODING': 'utf-8',
        'PYTHONPATH': path.join(__dirname, '..', 'search-engine-py')
      }
    });
    
    let outputData = '';
    let errorData = '';
    
    // 표준 출력 데이터 수집 (UTF-8 인코딩)
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString('utf8');
    });
    
    // 표준 에러 데이터 수집 (UTF-8 인코딩)
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString('utf8');
      console.error('Python stderr:', data.toString('utf8'));
    });
    
    let isResponseSent = false;
    
    // 프로세스 종료 처리
    pythonProcess.on('close', (code) => {
      console.log('   - Python 프로세스 종료 코드:', code);
      
      if (isResponseSent) return;
      
      if (code !== 0) {
        console.error('Python 프로세스 실행 실패:', errorData);
        isResponseSent = true;
        return res.status(500).json({
          success: false,
          message: `Python RAG 모듈 실행 실패 (코드: ${code})`,
          error: errorData
        });
      }
      
      try {
        // Python 출력 결과 파싱
        const ragResult = JSON.parse(outputData);
        console.log('✅ KDST RAG 검색 완료');
        console.log('   - 성공:', ragResult.success);
        console.log('   - 결과 수:', ragResult.results?.length || 0);
        
        isResponseSent = true;
        return res.status(200).json({
          success: true,
          childId: childId,
          message: 'KDST RAG 검색 완료',
          ragResult: ragResult
        });
        
      } catch (parseError) {
        console.error('Python 출력 파싱 실패:', parseError);
        console.error('Raw output:', outputData);
        isResponseSent = true;
        return res.status(500).json({
          success: false,
          message: 'RAG 결과 파싱 실패',
          error: parseError.message,
          rawOutput: outputData
        });
      }
    });
    
    // Python 프로세스에 질문 데이터 전송 (UTF-8 인코딩)
    const inputData = JSON.stringify({ questions: questions });
    pythonProcess.stdin.write(inputData, 'utf8');
    pythonProcess.stdin.end();
    
    // 타임아웃 설정 (30초)
    const timeoutId = setTimeout(() => {
      if (!pythonProcess.killed && !isResponseSent) {
        pythonProcess.kill();
        isResponseSent = true;
        return res.status(408).json({
          success: false,
          message: 'RAG 검색 시간 초과'
        });
      }
    }, 30000);
    
  } catch (error) {
    console.error('KDST RAG API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 단일 KDST 질문에 대한 RAG 검색 API
router.post('/kdst-rag/single', async (req, res) => {
  try {
    const { childId, question } = req.body;
    
    console.log('🔍 단일 KDST RAG 검색 API 호출됨');
    console.log('   - childId:', childId);
    console.log('   - question:', question);
    
    if (!childId || !question) {
      return res.status(400).json({
        success: false,
        message: 'childId와 question이 필요합니다.'
      });
    }
    
    // 단일 질문을 배열로 변환하여 기존 API 재사용
    req.body.questions = [question];
    
    // 기존 RAG API 로직 재사용 (위의 코드와 동일)
    const pythonScriptPath = path.join(__dirname, '..', 'search-engine-py', 'kdst_rag_module.py');
    
    const pythonProcess = spawn('python', [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..', 'search-engine-py'),
      env: {
        ...process.env,
        'PYTHONIOENCODING': 'utf-8',
        'PYTHONPATH': path.join(__dirname, '..', 'search-engine-py')
      }
    });
    
    let outputData = '';
    let errorData = '';
    
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString('utf8');
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString('utf8');
    });
    
    let isSingleResponseSent = false;
    
    pythonProcess.on('close', (code) => {
      if (isSingleResponseSent) return;
      
      if (code !== 0) {
        isSingleResponseSent = true;
        return res.status(500).json({
          success: false,
          message: `Python RAG 모듈 실행 실패 (코드: ${code})`,
          error: errorData
        });
      }
      
      try {
        const ragResult = JSON.parse(outputData);
        console.log('✅ 단일 KDST RAG 검색 완료');
        
        // 첫 번째 결과만 반환 (단일 질문이므로)
        const singleResult = ragResult.results?.[0] || null;
        
        isSingleResponseSent = true;
        return res.status(200).json({
          success: true,
          childId: childId,
          question: question,
          message: '단일 KDST RAG 검색 완료',
          result: singleResult
        });
        
      } catch (parseError) {
        isSingleResponseSent = true;
        return res.status(500).json({
          success: false,
          message: 'RAG 결과 파싱 실패',
          error: parseError.message
        });
      }
    });
    
    const inputData = JSON.stringify({ questions: [question] });
    pythonProcess.stdin.write(inputData, 'utf8');
    pythonProcess.stdin.end();
    
    const singleTimeoutId = setTimeout(() => {
      if (!pythonProcess.killed && !isSingleResponseSent) {
        pythonProcess.kill();
        isSingleResponseSent = true;
        return res.status(408).json({
          success: false,
          message: 'RAG 검색 시간 초과'
        });
      }
    }, 30000);
    
  } catch (error) {
    console.error('단일 KDST RAG API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// KDST RAG 검색 결과를 JSON 파일로 저장하는 API
router.post('/kdst-rag/save-json', async (req, res) => {
  try {
    const { childId, questions, outputFilename } = req.body;
    
    console.log('💾 KDST RAG JSON 저장 API 호출됨');
    console.log('   - childId:', childId);
    console.log('   - questions 수:', questions?.length || 0);
    console.log('   - 출력 파일명:', outputFilename || 'auto-generated');
    
    if (!childId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'childId와 questions 배열이 필요합니다.'
      });
    }
    
    // Python JSON 저장 스크립트 실행
    const pythonScriptPath = path.join(__dirname, '..', 'search-engine-py', 'save_kdst_rag_results.py');
    console.log('   - Python 스크립트 경로:', pythonScriptPath);
    
    // Python 프로세스 실행 (UTF-8 인코딩 설정)
    const pythonProcess = spawn('python', [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..', 'search-engine-py'),
      env: {
        ...process.env,
        'PYTHONIOENCODING': 'utf-8',
        'PYTHONPATH': path.join(__dirname, '..', 'search-engine-py')
      }
    });
    
    let outputData = '';
    let errorData = '';
    let isJsonResponseSent = false;
    
    // 표준 출력 데이터 수집 (UTF-8 인코딩)
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString('utf8');
    });
    
    // 표준 에러 데이터 수집 (UTF-8 인코딩)
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString('utf8');
      console.error('Python stderr:', data.toString('utf8'));
    });
    
    // 프로세스 종료 처리
    pythonProcess.on('close', (code) => {
      console.log('   - Python 프로세스 종료 코드:', code);
      
      if (isJsonResponseSent) return;
      
      if (code !== 0) {
        console.error('Python 프로세스 실행 실패:', errorData);
        isJsonResponseSent = true;
        return res.status(500).json({
          success: false,
          message: `Python JSON 저장 스크립트 실행 실패 (코드: ${code})`,
          error: errorData
        });
      }
      
      try {
        // Python 출력 결과 파싱
        const saveResult = JSON.parse(outputData);
        console.log('✅ KDST RAG JSON 저장 완료');
        console.log('   - 성공:', saveResult.success);
        console.log('   - 파일명:', saveResult.output_filename);
        
        isJsonResponseSent = true;
        return res.status(200).json({
          success: true,
          childId: childId,
          message: 'KDST RAG 결과 JSON 파일 저장 완료',
          saveResult: saveResult
        });
        
      } catch (parseError) {
        console.error('Python 출력 파싱 실패:', parseError);
        console.error('Raw output:', outputData);
        isJsonResponseSent = true;
        return res.status(500).json({
          success: false,
          message: 'JSON 저장 결과 파싱 실패',
          error: parseError.message,
          rawOutput: outputData
        });
      }
    });
    
    // Python 프로세스에 데이터 전송 (UTF-8 인코딩)
    const inputData = JSON.stringify({ 
      questions: questions,
      output_filename: outputFilename 
    });
    pythonProcess.stdin.write(inputData, 'utf8');
    pythonProcess.stdin.end();
    
    // 타임아웃 설정 (60초 - JSON 저장은 시간이 더 걸릴 수 있음)
    const jsonTimeoutId = setTimeout(() => {
      if (!pythonProcess.killed && !isJsonResponseSent) {
        pythonProcess.kill();
        isJsonResponseSent = true;
        return res.status(408).json({
          success: false,
          message: 'JSON 저장 시간 초과'
        });
      }
    }, 60000);
    
  } catch (error) {
    console.error('KDST RAG JSON 저장 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
