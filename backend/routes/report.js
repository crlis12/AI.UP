const express = require('express');
const router = express.Router();
const { runReportAgent } = require('../services/reportAgent');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');

// 파일 업로드(multipart/form-data) 지원: 메모리 스토리지 사용
let multerInstance = null;
function getMulter() {
  if (!multerInstance) {
    const multer = require('multer');
    multerInstance = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
  }
  return multerInstance;
}

// Python 검색 스크립트 실행 함수
async function runPythonSearchScript(queryData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'search-engine-py', 'search_diaries.py');
    
    console.log(`[${new Date().toISOString()}] Python 검색 스크립트 실행 시작:`, scriptPath);
    
    const pythonProcess = spawn(config.python.path, [scriptPath]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[${new Date().toISOString()}] Python stdout:`, data.toString());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`[${new Date().toISOString()}] Python stderr:`, data.toString());
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`[${new Date().toISOString()}] Python 검색 스크립트 종료, exit code:`, code);
      
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          console.log(`[${new Date().toISOString()}] 검색 결과 파싱 성공:`, result);
          resolve(result);
        } catch (parseError) {
          console.error(`[${new Date().toISOString()}] JSON 파싱 오류:`, parseError);
          reject(new Error(`JSON 파싱 오류: ${parseError.message}`));
        }
      } else {
        console.error(`[${new Date().toISOString()}] Python 스크립트 실행 실패, exit code: ${code}`);
        reject(new Error(`Python 스크립트 실행 실패, exit code: ${code}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Python 프로세스 오류:`, error);
      reject(error);
    });
    
    // 쿼리 데이터를 Python 스크립트에 전달
    const inputData = JSON.stringify(queryData);
    console.log(`[${new Date().toISOString()}] Python 스크립트에 전달할 데이터:`, inputData);
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();
  });
}

// RAG 검색 엔드포인트
// POST /report/rag-search
// body: { query: string, limit?: number, score_threshold?: number }
router.post('/rag-search', async (req, res) => {
  try {
    const { query, limit = 5, score_threshold = 0.5 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'query가 누락되었거나 형식이 올바르지 않습니다.' 
      });
    }
    
    console.log(`[${new Date().toISOString()}] RAG 검색 요청:`, { query, limit, score_threshold });
    
    // Python 검색 스크립트 실행
    const searchResult = await runPythonSearchScript({
      query: query,
      limit: limit,
      score_threshold: score_threshold
    });
    
    if (searchResult.success) {
      console.log(`[${new Date().toISOString()}] RAG 검색 성공:`, searchResult.total_found, '개 결과');
      return res.json({
        success: true,
        query: query,
        results: searchResult.results,
        total_found: searchResult.total_found,
        message: `VectorDB에서 ${searchResult.total_found}개의 유사한 일기를 찾았습니다.`
      });
    } else {
      console.error(`[${new Date().toISOString()}] RAG 검색 실패:`, searchResult.error);
      return res.status(500).json({
        success: false,
        message: `VectorDB 검색 실패: ${searchResult.error || '알 수 없는 오류'}`
      });
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] RAG 검색 오류:`, error);
    return res.status(500).json({
      success: false,
      message: `RAG 검색 중 오류가 발생했습니다: ${error.message}`
    });
  }
});

// 테스트용 모의 RAG 검색 + Report 에이전트 통합 엔드포인트
// POST /report/rag-report-test
// body: { query: string, input: string, history?: LangChainMessages[], config?: {...}, spec?: {...} }
router.post('/rag-report-test', async (req, res) => {
  try {
    const { 
      query,           // RAG 검색용 쿼리
      input,           // Report 에이전트용 입력
      history,         // 대화 히스토리
      config,          // Report 에이전트 설정
      spec             // Report 스펙
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

    console.log(`[${new Date().toISOString()}] RAG + Report 테스트 요청:`, { 
      query, input 
    });

    // 1단계: 모의 RAG 검색 결과 생성
    console.log(`[${new Date().toISOString()}] 1단계: 모의 RAG 검색 결과 생성`);
    const mockSearchResult = {
      success: true,
      total_found: 3,
      results: [
        {
          payload: {
            date: '2024-08-14',
            combined_text: '아이가 밤에 자주 깨어나서 부모님이 걱정하고 있습니다. 수면 패턴이 불규칙하고, 밤중에 울거나 깨어나는 일이 잦습니다.'
          },
          score: 0.95
        },
        {
          payload: {
            date: '2024-08-13',
            combined_text: '아이의 수면 문제가 지속되고 있습니다. 밤에 2-3번씩 깨어나고, 다시 잠들기까지 시간이 오래 걸립니다.'
          },
          score: 0.87
        },
        {
          payload: {
            date: '2024-08-12',
            combined_text: '아이가 밤에 자주 깨어나는 문제로 인해 부모님의 수면도 부족해지고 있습니다. 수면 환경 개선이 필요해 보입니다.'
          },
          score: 0.82
        }
      ]
    };

    console.log(`[${new Date().toISOString()}] 모의 RAG 검색 성공:`, mockSearchResult.total_found, '개 결과');

    // 2단계: 검색 결과를 컨텍스트로 변환
    console.log(`[${new Date().toISOString()}] 2단계: 검색 결과를 컨텍스트로 변환`);
    let ragContext = `[RAG 검색 결과 - "${query}"에 대한 유사한 일기들]\n`;
    ragContext += `총 ${mockSearchResult.total_found}개의 유사한 일기를 찾았습니다.\n\n`;

    mockSearchResult.results.forEach((result, index) => {
      ragContext += `--- 일기 ${index + 1} ---\n`;
      ragContext += `날짜: ${result.payload.date}\n`;
      ragContext += `내용: ${result.payload.combined_text}\n`;
      if (result.score !== undefined) {
        ragContext += `유사도 점수: ${result.score.toFixed(3)}\n`;
      }
      ragContext += '\n';
    });

    // 3단계: Report 에이전트 실행 (RAG 컨텍스트 포함)
    console.log(`[${new Date().toISOString()}] 3단계: Report 에이전트 실행`);
    const reportResult = await runReportAgent({ 
      input, 
      history, 
      context: ragContext,  // RAG 검색 결과를 컨텍스트로 전달
      config, 
      spec 
    });

    if (!reportResult.success) {
      console.error(`[${new Date().toISOString()}] Report 에이전트 실행 실패:`, reportResult.message);
      return res.status(500).json({
        success: false,
        message: `Report 에이전트 실행 실패: ${reportResult.message}`
      });
    }

    console.log(`[${new Date().toISOString()}] Report 에이전트 실행 성공`);

    // 4단계: 통합 결과 반환
    return res.json({
      success: true,
      query: query,
      input: input,
      rag_search: {
        total_found: mockSearchResult.total_found,
        results_count: mockSearchResult.results.length,
        score_threshold: 0.5,
        note: "모의 데이터 사용 (Python 스크립트 오류로 인해)"
      },
      report: {
        content: reportResult.content,
        meta: reportResult.meta
      },
      message: `RAG 검색과 Report 생성을 성공적으로 완료했습니다. ${mockSearchResult.total_found}개의 유사한 일기를 기반으로 보고서를 생성했습니다. (모의 데이터 사용)`
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] RAG + Report 테스트 오류:`, error);
    return res.status(500).json({
      success: false,
      message: `RAG + Report 테스트 처리 중 오류가 발생했습니다: ${error.message}`
    });
  }
});

// RAG 검색 + Report 에이전트 통합 엔드포인트
// POST /report/rag-report
// body: { query: string, input: string, history?: LangChainMessages[], config?: {...}, spec?: {...}, limit?: number, score_threshold?: number }
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

    console.log(`[${new Date().toISOString()}] RAG + Report 통합 요청:`, { 
      query, input, limit, score_threshold 
    });

    // 1단계: RAG 검색 실행
    console.log(`[${new Date().toISOString()}] 1단계: RAG 검색 시작`);
    const searchResult = await runPythonSearchScript({
      query: query,
      limit: limit,
      score_threshold: score_threshold
    });

    if (!searchResult.success) {
      console.error(`[${new Date().toISOString()}] RAG 검색 실패:`, searchResult.error);
      return res.status(500).json({
        success: false,
        message: `VectorDB 검색 실패: ${searchResult.error || '알 수 없는 오류'}`
      });
    }

    console.log(`[${new Date().toISOString()}] RAG 검색 성공:`, searchResult.total_found, '개 결과');

    // 2단계: 검색 결과를 컨텍스트로 변환
    console.log(`[${new Date().toISOString()}] 2단계: 검색 결과를 컨텍스트로 변환`);
    let ragContext = `[RAG 검색 결과 - "${query}"에 대한 유사한 일기들]\n`;
    ragContext += `총 ${searchResult.total_found}개의 유사한 일기를 찾았습니다.\n\n`;

    if (searchResult.results && Array.isArray(searchResult.results)) {
      searchResult.results.forEach((result, index) => {
        ragContext += `--- 일기 ${index + 1} ---\n`;
        ragContext += `날짜: ${result.payload.get('date', 'N/A')}\n`;
        ragContext += `내용: ${result.payload.get('combined_text', 'N/A')}\n`;
        if (result.score !== undefined) {
          ragContext += `유사도 점수: ${result.score.toFixed(3)}\n`;
        }
        ragContext += '\n';
      });
    }

    // 3단계: Report 에이전트 실행 (RAG 컨텍스트 포함)
    console.log(`[${new Date().toISOString()}] 3단계: Report 에이전트 실행`);
    const reportResult = await runReportAgent({ 
      input, 
      history, 
      context: ragContext,  // RAG 검색 결과를 컨텍스트로 전달
      config, 
      spec 
    });

    if (!reportResult.success) {
      console.error(`[${new Date().toISOString()}] Report 에이전트 실행 실패:`, reportResult.message);
      return res.status(500).json({
        success: false,
        message: `Report 에이전트 실행 실패: ${reportResult.message}`
      });
    }

    console.log(`[${new Date().toISOString()}] Report 에이전트 실행 성공`);

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
    console.error(`[${new Date().toISOString()}] RAG + Report 통합 오류:`, error);
    return res.status(500).json({
      success: false,
      message: `RAG + Report 통합 처리 중 오류가 발생했습니다: ${error.message}`
    });
  }
});

// 독립 보고서 에이전트
// POST /report
// body: { input: string, history?: LangChainMessages[], context?: string, config?: {...}, spec?: {...} }
router.post('/', async (req, res) => {
  try {
    // multipart/form-data 지원
    let fileBuffer = null;
    let fileMimeType = null;
    let fileSize = null;
    if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
      const upload = getMulter().single('file');
      await new Promise((resolve, reject) => {
        upload(req, res, (err) => (err ? reject(err) : resolve()));
      });
      if (req.file) {
        fileBuffer = req.file.buffer;
        fileMimeType = req.file.mimetype;
        fileSize = req.file.size;
      }
    }

    let { input, history, context, childrenContext, k_dst } = req.body || {};

    let config = req.body?.config || {};
    if (typeof config === 'string') {
      try { config = JSON.parse(config); } catch (_) { config = {}; }
    }

    let spec = req.body?.spec || {};
    if (typeof spec === 'string') {
      try { spec = JSON.parse(spec); } catch (_) { spec = {}; }
    }

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, message: 'input이 누락되었거나 형식이 올바르지 않습니다.' });
    }

    // 파일이 있으면 컨텍스트에 메타만 주입 (본문 분석은 현재 미지원)
    if (fileBuffer && fileMimeType) {
      const note = `\n[첨부파일 정보] type=${fileMimeType}, size=${fileSize} bytes`;
      context = (context || '') + note;
    }

    // childrenContext, k_dst 문자열 케이스 처리
    if (typeof childrenContext === 'string') {
      try { childrenContext = JSON.parse(childrenContext); } catch (_) {}
    }
    if (typeof k_dst === 'string') {
      try { k_dst = JSON.parse(k_dst); } catch (_) {}
    }

    const result = await runReportAgent({ input, history, context, config, spec, childrenContext, k_dst });
    return res.json(result);
  } catch (error) {
    console.error('Report agent error:', error?.response?.data || error);
    const message = error?.response?.data?.error?.message || error.message || '보고서 에이전트 호출 중 오류가 발생했습니다.';
    return res.status(500).json({ success: false, message });
  }
});

module.exports = router;
