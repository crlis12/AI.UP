#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testKDSTAPI() {
  console.log('🧪 KDST API 테스트 시작');
  console.log('=' * 50);
  
  try {
    // 1. 기본 KDST 문제 목록 가져오기
    console.log('1️⃣ 기본 KDST 문제 목록 가져오기...');
    const defaultQuestionsResponse = await axios.get(`${BASE_URL}/kdst-report/default-questions`);
    console.log('✅ 기본 문제 목록:', defaultQuestionsResponse.data.questions);
    console.log();
    
    // 2. KDST RAG 검색 테스트
    console.log('2️⃣ KDST RAG 검색 테스트...');
    const testQuestions = [
      "엎드린 자세에서 뒤집는다.",
      "등을 대고 누운 자세에서 엎드린 자세로 뒤집는다(팔이 몸통에 깔려 있지 않아야 한다).",
      "누워 있을 때 자기 발을 잡고 논다"
    ];
    
    const ragSearchResponse = await axios.post(`${BASE_URL}/kdst-report/rag-search`, {
      questions: testQuestions
    });
    
    if (ragSearchResponse.data.success) {
      console.log('✅ RAG 검색 성공');
      console.log(`총 ${ragSearchResponse.data.data.results.length}개 문제 처리됨`);
      
      // 각 문제별 결과 출력
      ragSearchResponse.data.data.results.forEach((result, index) => {
        console.log(`\n문제 ${index + 1}: ${result.문제}`);
        if (result.일기 && result.일기.length > 0) {
          console.log(`  관련 일기 ${result.일기.length}개 발견`);
          result.일기.forEach((diary, diaryIndex) => {
            console.log(`    ${diaryIndex + 1}등: ${diary.date} (유사도: ${diary.similarity.toFixed(4)})`);
          });
        } else {
          console.log('  관련 일기 없음');
        }
      });
    } else {
      console.log('❌ RAG 검색 실패:', ragSearchResponse.data.message);
    }
    console.log();
    
    // 3. 보고서 컨텍스트 생성 테스트
    console.log('3️⃣ 보고서 컨텍스트 생성 테스트...');
    const contextResponse = await axios.post(`${BASE_URL}/kdst-report/report-context`, {
      questions: testQuestions
    });
    
    if (contextResponse.data.success) {
      console.log('✅ 컨텍스트 생성 성공');
      const context = contextResponse.data.context;
      console.log(`총 문제 수: ${context.analysis_summary.total_questions}`);
      console.log(`관련 일기가 있는 문제 수: ${context.analysis_summary.questions_with_related_content}`);
      console.log(`평균 최고 유사도: ${context.analysis_summary.average_top_similarity.toFixed(4)}`);
    } else {
      console.log('❌ 컨텍스트 생성 실패:', contextResponse.data.message);
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
testKDSTAPI();
