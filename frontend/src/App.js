// src/App.js (충돌 해결 및 통합본)

import React, { useState, useEffect } from 'react'; // useEffect 추가
import { Routes, Route, Navigate } from 'react-router-dom'; // Link 제거
import './App.css';

// 페이지 컴포넌트 임포트 (src/pages 폴더에 있다고 가정)
import WelcomePage from './pages/WelcomePage';
import EmailLoginPage from './pages/EmailLoginPage';
import ChildInfoPage from './pages/ChildInfoPage';
import AIAnalysisPage from './pages/AIAnalysisPage';

// 컴포넌트 임포트 (src/components 폴더에 있다고 가정)
import MainScreen from './components/MainScreen';
import ChatWindow from './components/ChatWindow';

// LangChain 관련 모듈 임포트
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, AIMessage } from "@langchain/core/messages"; // LangChain 메시지 형식 임포트
import { MessagesPlaceholder } from "@langchain/core/prompts";


// 환경 변수에서 API 키를 가져옵니다.
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY; 

// LangChain 모델을 초기화합니다.
const model = new ChatGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  model: "gemini-2.5-flash", // gemini-pro에서 gemini-2.5-flash로 변경
});

// 대화 히스토리를 위한 프롬프트 템플릿을 정의합니다.
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant. Please answer the user's questions."],
  new MessagesPlaceholder("history"), // 대화 히스토리 플레이스홀더
  ["human", "{input}"], // 현재 사용자 입력
]);

// 모델과 프롬프트를 연결하는 체인(Chain)을 구성합니다.
const chain = RunnableSequence.from([prompt, model]);


function App() {
  // 로그인 상태 관리 (localStorage에서 초기값 가져오기)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 모든 대화 내용을 저장할 'messages' 상태를 만듭니다.
  const [messages, setMessages] = useState([]);
  // 로딩 상태를 관리합니다.
  const [isLoading, setIsLoading] = useState(false);



  // 로그인 처리 함수
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // 새로운 메시지를 받아 대화 목록에 추가하고 LLM 응답을 받는 함수
  const handleSendMessage = async (messageText) => {
    // 사용자가 보낸 메시지를 대화 목록에 추가
    const userMessage = { text: messageText, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    setIsLoading(true); // 로딩 시작

    try {
      // LangChain이 이해할 수 있는 형식으로 대화 히스토리를 변환합니다.
      // messages 상태의 메시지를 LangChain의 HumanMessage/AIMessage 객체로 변환
      const history = messages.map(msg => 
        msg.sender === 'user' ? new HumanMessage(msg.text) : new AIMessage(msg.text)
      );

      // LangChain 체인을 호출하여 Gemini API와 대화합니다.
      const response = await chain.invoke({
        input: messageText,
        history: history, // 이전 대화 기록 전달
      });
      
      // Gemini의 응답 메시지를 messages 상태에 추가합니다.
      const geminiMessage = { text: response.content, sender: 'gemini' };
      setMessages(prevMessages => [...prevMessages, geminiMessage]);

    } catch (error) {
      console.error("Gemini API 호출 중 오류 발생:", error);
      // 오류 발생 시 오류 메시지를 추가합니다.
      const errorMessage = { text: "죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다.", sender: 'gemini' };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  return (
    <div className="App">
      <Routes>
        {/* 앱의 초기 진입점: 로그인 상태에 따라 리다이렉트 */}
        <Route 
          path="/" 
          element={isLoggedIn ? <Navigate to="/main" /> : <Navigate to="/login" />} 
        />

        {/* 로그인 관련 라우트 */}
        <Route path="/login" element={<WelcomePage />} />
        <Route path="/login/email" element={<EmailLoginPage onLogin={handleLogin} />} />

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
