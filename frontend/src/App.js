// src/App.js (웰컴 화면 강제 표시 기능 추가)
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
// 페이지 컴포넌트 임포트 (src/pages 폴더에 있다고 가정)
import WelcomePage from './pages/WelcomePage';
import EmailLoginPage from './pages/EmailLoginPage';
import SignupPage from './pages/SignupPage';
import ChildInfoPage from './pages/ChildInfoPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
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
  // **새로운 상태: 웰컴 화면을 이미 봤는지 여부**
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  // 모든 대화 내용을 저장할 'messages' 상태를 만듭니다.
  const [messages, setMessages] = useState([]);
  // 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);
  // 컴포넌트 마운트 시 localStorage에서 로그인 및 웰컴 화면 확인 상태를 확인
  useEffect(() => {
    // 로그인 상태 확인 (기존 로직 유지)
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    // **새로운 로직: 웰컴 화면을 봤는지 확인**
    const seenWelcome = localStorage.getItem('hasSeenWelcome') === 'true';
    setHasSeenWelcome(seenWelcome);
  }, []);
  // 로그인 처리 함수
  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true'); // 로그인 상태 유지 로직 유지
  };
  // **새로운 함수: 웰컴 화면을 봤다고 표시하는 함수**
  const handleSeenWelcome = () => {
    setHasSeenWelcome(true);
    localStorage.setItem('hasSeenWelcome', 'true');
  };
  // 새로운 메시지를 받아 대화 목록에 추가하고 LLM 응답을 받는 함수
  const handleSendMessage = async (messageText) => {
    const userMessage = { text: messageText, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    try {
      const history = messages.map(msg =>
        msg.sender === 'user' ? new HumanMessage(msg.text) : new AIMessage(msg.text)
      );
      const response = await chain.invoke({
        input: messageText,
        history: history,
      });

      console.log("Gemini API 응답:", response); // 응답 로깅

      // 응답 내용이 있는지 확인
      if (response && response.content) {
        const geminiMessage = { text: response.content, sender: 'gemini' };
        setMessages(prevMessages => [...prevMessages, geminiMessage]);
      } else {
        // 응답 내용이 비어있는 경우
        console.error("Gemini API 응답이 비어있습니다.");
        const errorMessage = { text: "죄송합니다. 응답을 생성하지 못했습니다.", sender: 'gemini' };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error("Gemini API 호출 중 오류 발생:", error);
      const errorMessage = { text: "죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.", sender: 'gemini' };
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
        {/* WelcomePage에 handleSeenWelcome 함수를 전달하여, 웰컴 화면을 본 후 호출하도록 합니다. */}
        <Route path="/login" element={<WelcomePage onSeenWelcome={handleSeenWelcome} />} />
        <Route path="/login/email" element={<EmailLoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* 메인 화면 라우트 (이제 '/main' 경로로 접근) */}
        <Route
          path="/main"
          element={isLoggedIn ? <MainScreen onSendMessage={handleSendMessage} /> : <Navigate to="/login" />}
        />
        {/* 채팅 화면 라우트 */}
        <Route
          path="/chat"
          element={isLoggedIn ? <ChatWindow messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} /> : <Navigate to="/login" />}
        />
        {/* 기타 보호된 라우트 */}
        <Route path="/child-info" element={isLoggedIn ? <ChildInfoPage /> : <Navigate to="/login" />} />
        <Route path="/ai-analysis" element={isLoggedIn ? <AIAnalysisPage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}
export default App;