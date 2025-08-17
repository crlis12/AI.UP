const express = require('express');
const router = express.Router();
const { runReportAgent } = require('../services/reportAgent');
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');

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

module.exports = router;
