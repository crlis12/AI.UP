// src/App.js (로그인 상태 비유지)

import React, { useState, useEffect } from 'react'; 
import { Routes, Route, Navigate } from 'react-router-dom'; 
import './App.css';

// 페이지 컴포넌트 임포트 (src/pages 폴더에 있다고 가정)
import WelcomePage from './pages/WelcomePage';

import SigninPage from './pages/SigninPage';
import SignupPage from './pages/SignupPage';
import ChildInfoPage from './pages/ChildInfoPage';
import ChildDetailPage from './pages/ChildDetailPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyCodePage from './pages/VerifyCodePage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// 컴포넌트 임포트 (src/components 폴더에 있다고 가정)
import MainScreen from './components/MainScreen';
import ChatWindow from './components/ChatWindow';

// LangChain 관련 모듈 임포트
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, AIMessage } from "@langchain/core/messages"; 
import { MessagesPlaceholder } from "@langchain/core/prompts";


// 환경 변수에서 API 키를 가져옵니다.
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY; 

// LangChain 모델을 초기화합니다.
const model = new ChatGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  model: "gemini-2.5-flash", 
});

// 대화 히스토리를 위한 프롬프트 템플릿을 정의합니다.
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Please answer the user's questions."],
  new MessagesPlaceholder("history"), 
  ["human", "{input}"], 
]);

// 모델과 프롬프트를 연결하는 체인(Chain)을 구성합니다.
const chain = RunnableSequence.from([prompt, model]);


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

    // 로그인 상태 확인 (기존 로직 유지)
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    // 사용자 정보 확인
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    // **새로운 로직: 웰컴 화면을 봤는지 확인**
    const seenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    setHasSeenWelcome(seenWelcome);

    // localStorage에서 아이 정보 불러오기
    const savedChildInfo = localStorage.getItem('childInfo');
    if (savedChildInfo) {
      setChildInfo(JSON.parse(savedChildInfo));
    }
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
  const handleSendMessage = async (messageText) => {
    // 이전에 요청을 처리 중이라면 중복 실행을 방지합니다.
    if (isLoading) {
      return;
    }

    const newUserMessage = new HumanMessage(messageText);
    
    // API에 보낼 history는 현재 사용자 메시지가 추가되기 전의 내용입니다.
    const history = [...messages];

    // 사용자 메시지를 화면에 먼저 표시하고 로딩 상태로 변경합니다.
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      // API를 호출할 때는 캡처해둔 history를 사용합니다.
      const response = await chain.invoke({
        input: messageText,
        history: history, 
      });

      const geminiMessage = new AIMessage(response.content);

      // AI 응답을 메시지 목록에 추가합니다.
      // 이 시점의 prevMessages에는 위에서 추가한 newUserMessage가 포함되어 있습니다.
      setMessages(prevMessages => [...prevMessages, geminiMessage]);

    } catch (error) {
      // 개발자 콘솔에서 실제 오류를 확인하는 것이 중요합니다.
      console.error("Gemini API 호출 중 오류 발생:", error);
      const errorMessage = new AIMessage("죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.");
      setMessages(prevMessages => [...prevMessages, errorMessage]);
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
        {/* 메인 화면 라우트 (이제 '/main' 경로로 접근) */}
        <Route
          path="/main"
          element={isLoggedIn ? <MainScreen onSendMessage={handleSendMessage} currentUser={currentUser} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        
        <Route 
          path="/chat" 
          element={isLoggedIn ? <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} /> : <Navigate to="/login" />} 
        />

        {/* 기타 보호된 라우트 */}

        <Route path="/child-info" element={isLoggedIn ? <ChildInfoPage /> : <Navigate to="/login" />} />
        <Route path="/child-detail/:childId" element={isLoggedIn ? <ChildDetailPage /> : <Navigate to="/login" />} />

        <Route path="/ai-analysis" element={isLoggedIn ? <AIAnalysisPage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
