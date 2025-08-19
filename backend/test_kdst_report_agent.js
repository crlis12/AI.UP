#!/usr/bin/env node

const axios = require('axios');
const { runReportAgent } = require('./services/reportAgent');

const BASE_URL = 'http://localhost:3001';

async function testKDSTReportGeneration() {
  console.log('🧪 KDST RAG + ReportAgent 테스트 시작');
  console.log('=' * 60);
  
  try {
    // 1. KDST RAG 검색 수행
    console.log('1️⃣ KDST RAG 검색 수행...');
    const testQuestions = [
      "엎드린 자세에서 뒤집는다.",
      "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
      "누워 있을 때 자기 발을 잡고 논다"
    ];
    
    const ragResponse = await axios.post(`${BASE_URL}/kdst-report/report-context`, {
      questions: testQuestions
    });
    
    if (!ragResponse.data.success) {
      throw new Error('RAG 검색 실패: ' + ragResponse.data.message);
    }
    
    const kdstRagContext = ragResponse.data.context;
    console.log('✅ RAG 검색 완료');
    console.log(`총 문제 수: ${kdstRagContext.analysis_summary.total_questions}`);
    console.log(`관련 일기가 있는 문제 수: ${kdstRagContext.analysis_summary.questions_with_related_content}`);
    console.log(`평균 최고 유사도: ${kdstRagContext.analysis_summary.average_top_similarity.toFixed(4)}`);
    console.log();
    
    // 2. ReportAgent로 보고서 생성
    console.log('2️⃣ ReportAgent로 KDST 보고서 생성...');
    
    const reportConfig = {
      vendor: 'gemini',
      model: 'gemini-2.5-flash',
      temperature: 0.7
    };
    
    const reportSpec = {
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
      ]
    };
    
    const reportInput = `
KDST 문제들에 대한 RAG 검색 결과를 바탕으로 전문적인 아기 발달 평가 보고서를 작성해주세요.

각 KDST 문제별로:
1. 문제의 의미와 발달적 중요성
2. 관련 일기 내용을 바탕으로 한 행동 관찰 분석
3. 현재 발달 단계 평가
4. 향후 발달 방향 제안

RAG 검색 결과의 일기 내용을 구체적으로 인용하여 근거를 제시해주세요.
`;
    
    const reportResult = await runReportAgent({
      input: reportInput,
      history: [],
      context: {},
      config: reportConfig,
      spec: reportSpec,
      kdstRagContext: kdstRagContext
    });
    
    console.log('✅ 보고서 생성 완료');
    console.log();
    
    // 3. 생성된 보고서 출력
    console.log('3️⃣ 생성된 KDST 보고서:');
    console.log('=' * 60);
    console.log(reportResult.content);
    console.log('=' * 60);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 테스트 실행
testKDSTReportGeneration();
