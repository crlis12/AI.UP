#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testKDSTIntegratedReport() {
  console.log('🧪 통합 KDST 보고서 생성 API 테스트');
  console.log('=' * 60);
  
  try {
    // 1. 기본 KDST 문제 목록 가져오기
    console.log('1️⃣ 기본 KDST 문제 목록 가져오기...');
    const defaultQuestionsResponse = await axios.get(`${BASE_URL}/report/kdst-default-questions`);
    console.log('✅ 기본 문제 목록:', defaultQuestionsResponse.data.questions);
    console.log();
    
    // 2. 통합 KDST 보고서 생성 API 테스트
    console.log('2️⃣ 통합 KDST 보고서 생성 API 테스트...');
    const testQuestions = [
      "엎드린 자세에서 뒤집는다.",
      "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
      "누워 있을 때 자기 발을 잡고 논다"
    ];
    
    const reportInput = `
KDST 문제들에 대한 RAG 검색 결과를 바탕으로 전문적인 아기 발달 평가 보고서를 작성해주세요.

각 KDST 문제별로:
1. 문제의 의미와 발달적 중요성
2. 관련 일기 내용을 바탕으로 한 행동 관찰 분석
3. 현재 발달 단계 평가
4. 향후 발달 방향 제안

RAG 검색 결과의 일기 내용을 구체적으로 인용하여 근거를 제시해주세요.
`;
    
    const generateReportResponse = await axios.post(`${BASE_URL}/report/kdst-generate-report`, {
      questions: testQuestions,
      reportInput: reportInput,
      reportConfig: {
        temperature: 0.7,
        model: 'gemini-2.5-flash'
      },
      reportSpec: {
        reportType: 'KDST Development Assessment Report',
        audience: 'Child Development Professionals and Parents',
        tone: 'Professional and Informative',
        language: 'Korean'
      }
    });
    
    if (generateReportResponse.data.success) {
      console.log('✅ 통합 보고서 생성 성공!');
      console.log();
      
      // 3. 생성된 보고서 출력
      console.log('3️⃣ 생성된 KDST 보고서:');
      console.log('=' * 60);
      console.log(generateReportResponse.data.report.content);
      console.log('=' * 60);
      
      // 4. 컨텍스트 정보 출력
      console.log('\n4️⃣ 사용된 컨텍스트 정보:');
      const context = generateReportResponse.data.context;
      console.log(`총 문제 수: ${context.analysis_summary.total_questions}`);
      console.log(`관련 일기가 있는 문제 수: ${context.analysis_summary.questions_with_related_content}`);
      console.log(`평균 최고 유사도: ${context.analysis_summary.average_top_similarity.toFixed(4)}`);
      
    } else {
      console.log('❌ 보고서 생성 실패:', generateReportResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
}

// 테스트 실행
testKDSTIntegratedReport();
