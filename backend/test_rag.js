#!/usr/bin/env node

/**
 * RAG 기능 테스트 스크립트
 * "아이가 걸을 수 있나요?" 질문으로 VectorDB 검색 테스트
 */

const axios = require('axios');

// 테스트 설정
const API_BASE_URL = 'http://localhost:3001';
const TEST_QUERY = "아이가 걸을 수 있나요?";

async function testRAGSearch() {
  try {
    console.log('🚀 RAG 검색 테스트 시작...');
    console.log(`📍 API 엔드포인트: ${API_BASE_URL}/report/rag-search`);
    console.log(`🔍 테스트 질문: "${TEST_QUERY}"`);
    console.log('─'.repeat(50));
    
    // RAG 검색 요청
    const response = await axios.post(`${API_BASE_URL}/report/rag-search`, {
      query: TEST_QUERY,
      limit: 5,
      score_threshold: 0.1
    });
    
    if (response.data.success) {
      console.log('✅ RAG 검색 성공!');
      console.log(`📊 총 ${response.data.total_found}개의 유사한 일기를 찾았습니다.`);
      console.log('─'.repeat(50));
      
      // 검색 결과 상세 출력
      response.data.results.forEach((result, index) => {
        console.log(`\n📝 결과 ${index + 1}:`);
        console.log(`   ID: ${result.id}`);
        console.log(`   날짜: ${result.date}`);
        console.log(`   유사도: ${result.similarity_percentage}%`);
        console.log(`   점수: ${result.score}`);
        console.log(`   텍스트: ${result.text}`);
        if (result.combined_text) {
          console.log(`   결합 텍스트: ${result.combined_text}`);
        }
      });
      
      console.log('\n🎯 RAG 검색 결과 분석:');
      console.log(`- 질문: "${response.data.query}"`);
      console.log(`- 검색된 일기 수: ${response.data.total_found}`);
      console.log(`- 가장 유사한 일기: ID ${response.data.results[0]?.id} (${response.data.results[0]?.similarity_percentage}%)`);
      
    } else {
      console.error('❌ RAG 검색 실패:', response.data.message);
    }
    
  } catch (error) {
    console.error('💥 RAG 검색 테스트 중 오류 발생:');
    if (error.response) {
      console.error(`   HTTP 상태: ${error.response.status}`);
      console.error(`   오류 메시지: ${error.response.data?.message || '알 수 없는 오류'}`);
    } else if (error.request) {
      console.error('   서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    } else {
      console.error(`   오류: ${error.message}`);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  testRAGSearch()
    .then(() => {
      console.log('\n✨ RAG 테스트 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 RAG 테스트 실패:', error.message);
      process.exit(1);
    });
}

module.exports = { testRAGSearch };
