// Centralized API base URL
function getDefaultApiBase() {
  // 개발 환경에서는 무조건 localhost 사용
  if (process.env.NODE_ENV === 'development') {
    console.log('개발 환경 감지 - localhost:3001 사용');
    return 'http://localhost:3001';
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('현재 hostname:', hostname);

    // Local development - 명시적으로 localhost 체크
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('로컬 개발 환경 감지 - localhost:3001 사용');
      return 'http://localhost:3001';
    }

    // If hosted on Azure Static Web Apps, point to the deployed backend
    if (hostname.includes('azurestaticapps.net')) {
      console.log('Azure 환경 감지 - 실서버 URL 사용');
      return 'https://ai-up-backend.azurewebsites.net';
    }
  }

  // Default fallback to local
  console.log('기본값으로 localhost:3001 사용');
  return 'http://localhost:3001';
}

// 로컬 개발 환경에서는 강제로 localhost 사용
const API_BASE =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : process.env.REACT_APP_API_BASE_URL || getDefaultApiBase();
console.log('최종 API_BASE:', API_BASE);

// Questions API 호출 함수들
export const questionsAPI = {
  // 자녀의 나이에 맞는 모든 질문 가져오기
  getQuestionsForChild: async (childId) => {
    try {
      const response = await fetch(`${API_BASE}/questions/child/${childId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '질문 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('질문 조회 오류:', error);
      throw error;
    }
  },

  // 특정 발달 영역의 질문만 가져오기
  getQuestionsByDomain: async (childId, domainId) => {
    try {
      const response = await fetch(`${API_BASE}/questions/child/${childId}/domain/${domainId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '발달 영역 질문 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('발달 영역 질문 조회 오류:', error);
      throw error;
    }
  },

  // 모든 발달 영역 목록 가져오기
  getDomains: async () => {
    try {
      const response = await fetch(`${API_BASE}/questions/domains`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || '발달 영역 조회에 실패했습니다.');
      }

      return data;
    } catch (error) {
      console.error('발달 영역 조회 오류:', error);
      throw error;
    }
  },

  // KDST 질문들에 대한 RAG 검색 (여러 질문)
  getKdstRagResults: async (childId, questions) => {
    try {
      console.log('🔍 KDST RAG 검색 API 호출');
      console.log('   - childId:', childId);
      console.log('   - questions 수:', questions?.length || 0);
      
      const response = await fetch(`${API_BASE}/questions/kdst-rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: childId,
          questions: questions
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'KDST RAG 검색에 실패했습니다.');
      }
      
      console.log('✅ KDST RAG 검색 완료');
      console.log('   - 성공:', data.success);
      console.log('   - RAG 결과:', data.ragResult);
      
      return data;
    } catch (error) {
      console.error('KDST RAG 검색 오류:', error);
      throw error;
    }
  },

  // 단일 KDST 질문에 대한 RAG 검색
  getSingleKdstRagResult: async (childId, question) => {
    try {
      console.log('🔍 단일 KDST RAG 검색 API 호출');
      console.log('   - childId:', childId);
      console.log('   - question:', question);
      
      const response = await fetch(`${API_BASE}/questions/kdst-rag/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: childId,
          question: question
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '단일 KDST RAG 검색에 실패했습니다.');
      }
      
      console.log('✅ 단일 KDST RAG 검색 완료');
      console.log('   - 결과:', data.result);
      
      return data;
    } catch (error) {
      console.error('단일 KDST RAG 검색 오류:', error);
      throw error;
    }
  },

  // KDST RAG 검색 결과를 JSON 파일로 저장
  saveKdstRagResultsToJson: async (childId, questions, outputFilename = null) => {
    try {
      console.log('💾 KDST RAG JSON 저장 API 호출');
      console.log('   - childId:', childId);
      console.log('   - questions 수:', questions?.length || 0);
      console.log('   - 출력 파일명:', outputFilename || 'auto-generated');
      
      const response = await fetch(`${API_BASE}/questions/kdst-rag/save-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: childId,
          questions: questions,
          outputFilename: outputFilename
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'KDST RAG JSON 저장에 실패했습니다.');
      }
      
      console.log('✅ KDST RAG JSON 저장 완료');
      console.log('   - 파일명:', data.saveResult?.output_filename);
      console.log('   - 저장 결과:', data.saveResult);
      
      return data;
    } catch (error) {
      console.error('KDST RAG JSON 저장 오류:', error);
      throw error;
    }
  }
};

// Children API 관련 함수들
export const childrenAPI = {
  // 모든 자녀 목록 조회
  getChildren: async (parentId) => {
    try {
      const response = await fetch(`${API_BASE}/children/parent/${parentId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '자녀 목록 조회에 실패했습니다.');
      }
      
      return data;
    } catch (error) {
      console.error('자녀 목록 조회 오류:', error);
      throw error;
    }
  },

  // 특정 자녀 정보 조회
  getChild: async (childId) => {
    try {
      const response = await fetch(`${API_BASE}/children/${childId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '자녀 정보 조회에 실패했습니다.');
      }
      
      return data;
    } catch (error) {
      console.error('자녀 정보 조회 오류:', error);
      throw error;
    }
  },

  // 자녀 정보 등록
  registerChild: async (childData) => {
    try {
      const response = await fetch(`${API_BASE}/children/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '자녀 등록에 실패했습니다.');
      }
      
      return data;
    } catch (error) {
      console.error('자녀 등록 오류:', error);
      throw error;
    }
  },

  // 자녀 정보 수정
  updateChild: async (childId, childData) => {
    try {
      const response = await fetch(`${API_BASE}/children/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '자녀 정보 수정에 실패했습니다.');
      }
      
      return data;
    } catch (error) {
      console.error('자녀 정보 수정 오류:', error);
      throw error;
    }
  },

  // 자녀 삭제
  deleteChild: async (childId) => {
    try {
      const response = await fetch(`${API_BASE}/children/${childId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '자녀 삭제에 실패했습니다.');
      }
      
      return data;
    } catch (error) {
      console.error('자녀 삭제 오류:', error);
      throw error;
    }
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (childId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('profile_image', imageFile);
      
      const response = await fetch(`${API_BASE}/children/${childId}/upload-profile`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '프로필 이미지 업로드에 실패했습니다.');
      }
      
      return data;
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error);
      throw error;
    }
  }
};

// Report Agent 관련 API
export const reportAPI = {
  // RAG + Report 통합 엔드포인트 호출
  ragReport: async ({ query, input, diaryString, useRagAsInput, config, spec, limit, score_threshold, history }) => {
    try {
      const response = await fetch(`${API_BASE}/report/rag-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          input,
          history: history || [],
          config,
          spec,
          limit,
          score_threshold,
          diaryString,
          useRagAsInput
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || '보고서 생성 요청에 실패했습니다.');
      }
      return data;
    } catch (error) {
      console.error('reportAPI.ragReport 오류:', error);
      throw error;
    }
  },

  // RAG 검색만 수행
  ragSearch: async ({ query, limit = 5, score_threshold = 0.5 }) => {
    try {
      const response = await fetch(`${API_BASE}/report/rag-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit, score_threshold })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'RAG 검색에 실패했습니다.');
      }
      return data;
    } catch (error) {
      console.error('reportAPI.ragSearch 오류:', error);
      throw error;
    }
  }
};

export default API_BASE;
