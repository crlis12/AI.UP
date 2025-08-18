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
};

// Children API
export const childrenAPI = {
  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/children/upload-profile`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '프로필 이미지 업로드에 실패했습니다.');
    }
    return data; // { success, url, path }
  },

  registerChild: async (payload) => {
    const response = await fetch(`${API_BASE}/children/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '아동 등록에 실패했습니다.');
    }
    return data; // { success, child: {...} }
  },

  updateChild: async (childId, payload) => {
    const response = await fetch(`${API_BASE}/children/${childId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '아동 정보 수정에 실패했습니다.');
    }
    return data;
  },

  deleteChild: async (childId) => {
    const response = await fetch(`${API_BASE}/children/${childId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '아동 삭제에 실패했습니다.');
    }
    return data;
  },
};

export default API_BASE;
