// src/App.js (로그인 상태 비유지)

import React, { useState, useEffect, useCallback } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom'; 
import './App.css';

// 페이지 컴포넌트 임포트 (src/pages 폴더에 있다고 가정)
import WelcomePage from './pages/WelcomePage';

import SigninPage from './pages/SigninPage';
import SignupPage from './pages/SignupPage';
import ChildInfoPage from './pages/ChildInfoPage';
import ChildDetailPage from './pages/ChildDetailPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; // 이름 복구
import VerifyCodePage from './pages/VerifyCodePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DiaryPage from './pages/DiaryPage'; // DiaryPage 임포트 추가
import DiaryWritePage from './pages/DiaryWritePage';
import DiaryDetailPage from './pages/DiaryDetailPage'; // DiaryDetailPage 임포트 추가
import ReportAgentTestPage from './pages/ReportAgentTestPage';
import ReportDetailPage from './pages/ReportDetailPage';

// 컴포넌트 임포트 (src/components 폴더에 있다고 가정)
import MainScreen from './components/MainScreen';
import ChatWindow from './components/ChatWindow';

// LLM 호출을 백엔드 API로 위임합니다.
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import API_BASE, { questionsAPI } from './utils/api';


// BASE URL은 공통 config 사용


function App() {

  // 로그인 상태 관리 (localStorage에서 초기값 가져오기)
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 초기값 false로 유지
  // 사용자 정보 상태 관리
  const [currentUser, setCurrentUser] = useState(null);
  // **새로운 상태: 웰컴 화면을 이미 봤는지 여부**
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. 아이 정보를 위한 상태 추가
  const [childInfo, setChildInfo] = useState({ name: '아이', birthDate: '' });

  // 2. localStorage와 연동하는 useEffect 추가
  useEffect(() => {
    console.log('=== App.js 초기화 시작 ===');

    // 로그인 상태 확인 (기존 로직 유지)
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('localStorage isLoggedIn:', localStorage.getItem('isLoggedIn'));
    console.log('loggedIn 상태:', loggedIn);
    setIsLoggedIn(loggedIn);
    
    // 사용자 정보 확인
    const savedUser = localStorage.getItem('currentUser');
    console.log('localStorage currentUser:', savedUser);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('파싱된 사용자 정보:', parsedUser);
      setCurrentUser(parsedUser);
    } else {
      console.log('저장된 사용자 정보가 없습니다');
    }
    
    // **새로운 로직: 웰컴 화면을 봤는지 확인**
    const seenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    setHasSeenWelcome(seenWelcome);

    // localStorage에서 아이 정보 불러오기
    const savedChildInfo = localStorage.getItem('childInfo');
    if (savedChildInfo) {
      setChildInfo(JSON.parse(savedChildInfo));
    }
    
    console.log('=== App.js 초기화 완료 ===');
  }, []);

  // 로그인 처리 함수
  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('isLoggedIn', 'true'); // 로그인 상태 유지 로직 유지
    localStorage.setItem('currentUser', JSON.stringify(user)); // 사용자 정보 저장
  };

  const handleSeenWelcome = () => {
    setHasSeenWelcome(true);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    // 메시지도 초기화
    setMessages([]);
  };

  // 새로운 메시지를 받아 대화 목록에 추가하고 LLM 응답을 받는 함수
  const handleSendMessage = async (messageText, file) => {
    if (isLoading) return;

    // 화면 표시: "영상/이미지 버블"과 "텍스트 버블"을 분리해서 추가
    // 렌더 순서: 위(먼저 추가한 것) → 아래(나중 추가한 것)
    const history = [...messages];

    if (file) {
      const pendingMessages = [];
      if (messageText && messageText.trim()) {
        pendingMessages.push(new HumanMessage(messageText));
      }
      try {
        const localUrl = URL.createObjectURL(file);
        const mediaPart = file.type?.startsWith('image/')
          ? { type: 'image_url', image_url: localUrl }
          : file.type?.startsWith('video/')
            ? { type: 'video_url', video_url: localUrl }
            : { type: 'text', text: `첨부: ${file.name}` };
        const mediaMessage = new HumanMessage({ content: [mediaPart] });
        // 위에 영상, 아래에 텍스트가 보이도록: 먼저 미디어를 push, 그다음 텍스트를 push
        setMessages((prev) => [...prev, mediaMessage, ...pendingMessages]);
      } catch (_) {
        // 실패 시 텍스트만 표시
        if (pendingMessages.length > 0) {
          setMessages((prev) => [...prev, ...pendingMessages]);
        }
      }
    } else {
      // 파일이 없는 경우 기존과 동일하게 텍스트 메시지만 추가
      const newUserTextMessage = new HumanMessage(messageText || '');
      setMessages((prev) => [...prev, newUserTextMessage]);
    }
    setIsLoading(true);
    try {
      const endpoint = `${API_BASE}/question`;
      let resp;
      if (file) {
        const formData = new FormData();
        formData.append('input', messageText);
        formData.append('history', JSON.stringify(history));
        formData.append('file', file); // 중요: 파일 필드명 'file'
        resp = await fetch(endpoint, {
          method: 'POST',
          body: formData, // Content-Type 헤더 지정 금지 (브라우저가 자동 설정)
        });
      } else {
        resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: messageText, history }),
        });
      }
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || '에이전트 호출 실패');
      const aiMessage = new AIMessage(data.content);
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Agent API 호출 오류:', error);
      const errorMessage = new AIMessage('죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.');
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Report 에이전트로 메시지를 보내는 함수 (RAG + Report)
  const handleSendReportMessage = async (messageText, file) => {
    if (isLoading) return;

    const history = [...messages];

    // 파일이 있어도 우선 텍스트 중심으로 처리 (리포트 에이전트는 파일 업로드 미사용)
    if (file) {
      const pendingMessages = [];
      if (messageText && messageText.trim()) {
        pendingMessages.push(new HumanMessage(messageText));
      }
      try {
        const localUrl = URL.createObjectURL(file);
        const mediaPart = file.type?.startsWith('image/')
          ? { type: 'image_url', image_url: localUrl }
          : file.type?.startsWith('video/')
            ? { type: 'video_url', video_url: localUrl }
            : { type: 'text', text: `첨부: ${file.name}` };
        const mediaMessage = new HumanMessage({ content: [mediaPart] });
        setMessages((prev) => [...prev, mediaMessage, ...pendingMessages]);
      } catch (_) {
        if (pendingMessages.length > 0) {
          setMessages((prev) => [...prev, ...pendingMessages]);
        }
      }
    } else {
      const newUserTextMessage = new HumanMessage(messageText || '');
      setMessages((prev) => [...prev, newUserTextMessage]);
    }

    setIsLoading(true);
    try {
      const endpoint = `${API_BASE}/report/rag-report`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText || '',
          input: messageText || '',
          history,
          config: { vendor: 'gemini', model: 'gemini-2.5-flash' },
          spec: { language: 'Korean', reportType: '대화 보고서' },
          limit: 5,
          score_threshold: 0.5
        })
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || '리포트 에이전트 호출 실패');
      const aiMessage = new AIMessage(data.report?.content || '보고서 응답 본문이 없습니다.');
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Report Agent API 호출 오류:', error);
      const errorMessage = new AIMessage('죄송합니다. 리포트 에이전트 처리 중 오류가 발생했습니다.');
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="App">
      <Routes>
        {/* 앱의 초기 진입점: 웰컴 화면을 봤는지 여부에 따라 리다이렉트 */}
        <Route 
          path="/" 
          element={hasSeenWelcome ? <Navigate to="/main" /> : <Navigate to="/login" />} 
        />

        {/* 로그인 관련 라우트 */}
        <Route path="/login" element={<WelcomePage onSeenWelcome={handleSeenWelcome} />} />

        <Route path="/signin" element={<SigninPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* 경로 복구 */}
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* 메인 화면 라우트 (이제 '/main' 경로로 접근) */}
        <Route
          path="/main"
          element={isLoggedIn ? <MainScreen onSendMessage={handleSendReportMessage} currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        
        {/* 기본 채팅을 리포트 에이전트로 연결 */}
        <Route 
          path="/chat/:childId" 
          element={isLoggedIn ? <ChatWindow messages={messages} onSendMessage={handleSendReportMessage} isLoading={isLoading} /> : <Navigate to="/login" />} 
        />

        {/* 기타 보호된 라우트 */}

        <Route path="/child-info" element={isLoggedIn ? <ChildInfoPage /> : <Navigate to="/login" />} />
        <Route path="/child-detail/:childId" element={isLoggedIn ? <ChildDetailPage /> : <Navigate to="/login" />} />
        {/* 일지 작성 기본 경로 */}
        <Route path="/diary/:childId" element={isLoggedIn ? <DiaryWritePage /> : <Navigate to="/login" />} />
        {/* 일지 목록 경로 */}
        <Route path="/diary/list/:childId" element={isLoggedIn ? <DiaryPage /> : <Navigate to="/login" />} />
        <Route path="/diary/detail/:diaryId" element={isLoggedIn ? <DiaryDetailPage /> : <Navigate to="/login" />} /> {/* DiaryDetailPage 라우트 추가 */}

        <Route path="/ai-analysis" element={isLoggedIn ? <AIAnalysisPage /> : <Navigate to="/login" />} />

        {/* 리포트 에이전트 테스트 라우트 */}
        <Route path="/report/test" element={isLoggedIn ? <ReportAgentTestPage /> : <Navigate to="/login" />} />

        {/* 리포트 상세 보기 라우트 */}
        <Route path="/report/:childId" element={isLoggedIn ? <ReportDetailPage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
