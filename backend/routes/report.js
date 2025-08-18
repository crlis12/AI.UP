const express = require('express');
const router = express.Router();
const { runReportAgent } = require('../services/reportAgent');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');

// KDST RAG 검색을 위한 Python 스크립트 실행 함수
async function runKDSTRAGScript(questions) {
  return new Promise((resolve, reject) => {
    try {
      const scriptPath = path.join(__dirname, '..', 'search-engine-py', 'kdst_rag_module.py');

      const pythonProcess = spawn(config.python.path, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '..', 'search-engine-py'),
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONPATH: path.join(__dirname, '..', 'search-engine-py'),
        },
      });

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString('utf8');
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python 스크립트 실행 실패 (코드: ${code}): ${errorData}`));
          return;
        }
        try {
          const result = JSON.parse(outputData);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`KDST 결과 파싱 실패: ${parseError.message}. Raw: ${outputData}`));
        }
      });

      // stdin으로 질문 전달
      const inputData = JSON.stringify({ questions });
      pythonProcess.stdin.write(inputData, 'utf8');
      pythonProcess.stdin.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Python 검색 스크립트 실행 함수
async function runPythonSearchScript(queryData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'search-engine-py', 'search_diaries.py');
    
    const pythonProcess = spawn(config.python.path, [scriptPath], {
      cwd: path.dirname(scriptPath)
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`JSON 파싱 오류: ${parseError.message}`));
        }
      } else {
        reject(new Error(`Python 스크립트 실행 실패, exit code: ${code}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(error);
    });
    
    const inputData = JSON.stringify(queryData);
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
  });
}

// RAG 검색 엔드포인트
// POST /report/rag-search
router.post('/rag-search', async (req, res) => {
  try {
    const { query, limit = 5, score_threshold = 0.5 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'query가 누락되었거나 형식이 올바르지 않습니다.' 
      });
    }
    
    const searchResult = await runPythonSearchScript({
      query: query,
      limit: limit,
      score_threshold: score_threshold
    });
    
    if (searchResult.success) {
      return res.json({
        success: true,
        query: query,
        results: searchResult.results,
        total_found: searchResult.total_found,
        message: `VectorDB에서 ${searchResult.total_found}개의 유사한 일기를 찾았습니다.`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: `VectorDB 검색 실패: ${searchResult.error || '알 수 없는 오류'}`
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `RAG 검색 중 오류가 발생했습니다: ${error.message}`
    });
  }
});

// RAG 검색 + Report 에이전트 통합 엔드포인트
// POST /report/rag-report
router.post('/rag-report', async (req, res) => {
  try {
    const { 
      query,           // RAG 검색용 쿼리
      input,           // Report 에이전트용 입력
      history,         // 대화 히스토리
      config,          // Report 에이전트 설정
      spec,            // Report 스펙
      limit = 5,       // 검색 결과 개수
      score_threshold = 0.5  // 검색 점수 임계값
    } = req.body;

    // 필수 파라미터 검증
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'query가 누락되었거나 형식이 올바르지 않습니다.' 
      });
    }

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'input이 누락되었거나 형식이 올바르지 않습니다.' 
      });
    }

    // 1단계: RAG 검색 실행
    const searchResult = await runPythonSearchScript({
      query: query,
      limit: limit,
      score_threshold: score_threshold
    });

    if (!searchResult.success) {
      return res.status(500).json({
        success: false,
        message: `VectorDB 검색 실패: ${searchResult.error || '알 수 없는 오류'}`
      });
    }

    // 2단계: 검색 결과를 컨텍스트로 변환
    let ragContext = `[RAG 검색 결과 - "${query}"에 대한 유사한 일기들]\n`;
    ragContext += `총 ${searchResult.total_found}개의 유사한 일기를 찾았습니다.\n\n`;

    if (searchResult.results && Array.isArray(searchResult.results)) {
      searchResult.results.forEach((result, index) => {
        ragContext += `--- 일기 ${index + 1} ---\n`;
        ragContext += `날짜: ${result.date || result.payload?.date || 'N/A'}\n`;
        ragContext += `내용: ${result.combined_text || result.payload?.combined_text || result.text || 'N/A'}\n`;
        if (result.score !== undefined) {
          ragContext += `유사도 점수: ${result.score.toFixed(3)}\n`;
        }
        ragContext += '\n';
      });
    }

    // 3단계: Report 에이전트 실행 (RAG 컨텍스트 포함)
    const reportResult = await runReportAgent({ 
      input, 
      history, 
      context: ragContext,
      config, 
      spec 
    });

    if (!reportResult.success) {
      return res.status(500).json({
        success: false,
        message: `Report 에이전트 실행 실패: ${reportResult.message}`
      });
    }

    // 4단계: 통합 결과 반환
    return res.json({
      success: true,
      query: query,
      input: input,
      rag_search: {
        total_found: searchResult.total_found,
        results_count: searchResult.results ? searchResult.results.length : 0,
        score_threshold: score_threshold
      },
      report: {
        content: reportResult.content,
        meta: reportResult.meta
      },
      message: `RAG 검색과 Report 생성을 성공적으로 완료했습니다. ${searchResult.total_found}개의 유사한 일기를 기반으로 보고서를 생성했습니다.`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `RAG + Report 통합 처리 중 오류가 발생했습니다: ${error.message}`
    });
  }
});

// KDST 문제에 대한 RAG 검색 API
router.post('/kdst-rag-search', async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'KDST 문제 목록이 필요합니다.'
      });
    }
    
    console.log(`[${new Date().toISOString()}] KDST RAG 검색 요청: ${questions.length}개 문제`);
    
    // Python 스크립트 실행
    const result = await runKDSTRAGScript(questions);
    
    console.log(`[${new Date().toISOString()}] KDST RAG 검색 완료`);
    
    res.json({
      success: true,
      message: 'KDST RAG 검색 완료',
      data: result
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] KDST RAG 검색 오류:`, error.message);
    res.status(500).json({
      success: false,
      message: 'KDST RAG 검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// KDST 보고서 컨텍스트 생성 API
router.post('/kdst-report-context', async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'KDST 문제 목록이 필요합니다.'
      });
    }
    
    console.log(`[${new Date().toISOString()}] KDST 보고서 컨텍스트 생성 요청: ${questions.length}개 문제`);
    
    // Python 스크립트 실행
    const result = await runKDSTRAGScript(questions);
    
    if (result.success) {
      // 보고서 작성용 컨텍스트 생성
      const context = {
        kdst_questions: questions,
        rag_results: result.results || [],
        analysis_summary: {
          total_questions: questions.length,
          questions_with_related_content: 0,
          average_top_similarity: 0
        }
      };
      
      // 분석 요약 계산
      if (result.results) {
        const questionsWithContent = result.results.filter(item => item.일기 && item.일기.length > 0);
        context.analysis_summary.questions_with_related_content = questionsWithContent.length;
        
        if (questionsWithContent.length > 0) {
          const topSimilarities = questionsWithContent.map(item => item.일기[0].similarity);
          context.analysis_summary.average_top_similarity = 
            topSimilarities.reduce((sum, sim) => sum + sim, 0) / topSimilarities.length;
        }
      }
      
      console.log(`[${new Date().toISOString()}] KDST 보고서 컨텍스트 생성 완료`);
      
      res.json({
        success: true,
        message: 'KDST 보고서 컨텍스트 생성 완료',
        context: context
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'KDST RAG 검색 실패',
        error: result.message
      });
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] KDST 보고서 컨텍스트 생성 오류:`, error.message);
    res.status(500).json({
      success: false,
      message: 'KDST 보고서 컨텍스트 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 기본 KDST 문제 목록 제공 API
router.get('/kdst-default-questions', (req, res) => {
  const defaultQuestions = [
    "엎드린 자세에서 뒤집는다.",
    "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
    "누워 있을 때 자기 발을 잡고 논다"
  ];
  
  res.json({
    success: true,
    message: '기본 KDST 문제 목록',
    questions: defaultQuestions
  });
});

// KDST 컨텍스트 생성 + ReportAgent로 보고서 생성 통합 API
router.post('/kdst-generate-report', async (req, res) => {
  try {
    const { 
      questions, 
      reportConfig = {}, 
      reportSpec = {},
      reportInput = "KDST 문제들로 아기 발달 보고서 작성"
    } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'KDST 문제 목록이 필요합니다.'
      });
    }
    
    console.log(`[${new Date().toISOString()}] KDST 보고서 생성 요청: ${questions.length}개 문제`);
    
    // 1단계: KDST RAG 검색으로 컨텍스트 생성
    const ragResult = await runKDSTRAGScript(questions);
    
    if (!ragResult.success) {
      return res.status(500).json({
        success: false,
        message: 'KDST RAG 검색 실패',
        error: ragResult.message
      });
    }
    
    // 2단계: 보고서 컨텍스트 구성
    const kdstRagContext = {
      kdst_questions: questions,
      rag_results: ragResult.results || [],
      analysis_summary: {
        total_questions: questions.length,
        questions_with_related_content: 0,
        average_top_similarity: 0
      }
    };
    
    // 분석 요약 계산
    if (ragResult.results) {
      const questionsWithContent = ragResult.results.filter(item => item.일기 && item.일기.length > 0);
      kdstRagContext.analysis_summary.questions_with_related_content = questionsWithContent.length;
      
      if (questionsWithContent.length > 0) {
        const topSimilarities = questionsWithContent.map(item => item.일기[0].similarity);
        kdstRagContext.analysis_summary.average_top_similarity = 
          topSimilarities.reduce((sum, sim) => sum + sim, 0) / topSimilarities.length;
      }
    }
    
    console.log(`[${new Date().toISOString()}] KDST RAG 컨텍스트 생성 완료`);
    
    // 3단계: ReportAgent로 보고서 생성
    const defaultReportConfig = {
      vendor: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      ...reportConfig
    };
    
    const defaultReportSpec = {
      reportType: 'KDST Development Assessment Report',
      audience: 'Child Development Professionals and Parents',
      tone: 'Professional and Informative',
      length: 'Comprehensive',
      language: 'Korean',
      format: 'Markdown',
      includeSummary: true,
      sections: [
        'Executive Summary',
        'KDST Question Analysis',
        'Behavioral Observations',
        'Development Assessment',
        'Recommendations'
      ],
      ...reportSpec
    };
    
    console.log(`[${new Date().toISOString()}] ReportAgent로 보고서 생성 시작...`);
    
    const reportResult = await runReportAgent({
      input: reportInput,
      history: [],
      context: {},
      config: defaultReportConfig,
      spec: defaultReportSpec,
      kdstRagContext: kdstRagContext
    });
    
    console.log(`[${new Date().toISOString()}] KDST 보고서 생성 완료`);
    
    res.json({
      success: true,
      message: 'KDST 보고서 생성 완료',
      report: reportResult,
      context: kdstRagContext
    });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] KDST 보고서 생성 오류:`, error.message);
    res.status(500).json({
      success: false,
      message: 'KDST 보고서 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
