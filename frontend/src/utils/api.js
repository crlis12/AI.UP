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
const API_BASE = (process.env.NODE_ENV === 'development') 
  ? 'http://localhost:3001' 
  : (process.env.REACT_APP_API_BASE_URL || getDefaultApiBase());
console.log('최종 API_BASE:', API_BASE);

export default API_BASE;


