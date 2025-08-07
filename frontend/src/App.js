// App.js (최종 수정본)

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import EmailLoginPage from './pages/EmailLoginPage';
import ChildInfoPage from './pages/ChildInfoPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import MainScreen from './components/MainScreen';
import ChatWindow from './components/ChatWindow';
import './App.css';
// 1. 대화 메시지 형식을 import 합니다. (없다면 새로 만들어야 할 수 있습니다)
import { HumanMessage, AIMessage } from "@langchain/core/messages";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 2. 모든 대화 내용을 저장할 'messages' 상태를 만듭니다.
  const [messages, setMessages] = useState([]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // 3. 새로운 메시지를 받아 대화 목록에 추가하는 함수를 만듭니다.
  const handleSendMessage = (messageText) => {
    // 사용자가 보낸 메시지를 대화 목록에 추가
    setMessages(prevMessages => [
      ...prevMessages, 
      new HumanMessage(messageText)
    ]);

    // (임시) 1초 후에 AI가 답변하는 것처럼 시뮬레이션
    setTimeout(() => {
      setMessages(prevMessages => [
        ...prevMessages,
        new AIMessage("네, 질문을 받았습니다! 무엇이 궁금하신가요?")
      ]);
    }, 1000);
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<WelcomePage />} />
        <Route path="/login/email" element={<EmailLoginPage onLogin={handleLogin} />} />

        <Route 
          path="/" 
          // 4. MainScreen에 handleSendMessage 함수를 props로 전달합니다.
          element={isLoggedIn ? <MainScreen onSendMessage={handleSendMessage} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/chat" 
          // 5. ChatWindow에 messages 목록과 handleSendMessage 함수를 모두 전달합니다.
          element={isLoggedIn ? <ChatWindow messages={messages} onSendMessage={handleSendMessage} /> : <Navigate to="/login" />} 
        />

        <Route path="/child-info" element={isLoggedIn ? <ChildInfoPage /> : <Navigate to="/login" />} />
        <Route path="/ai-analysis" element={isLoggedIn ? <AIAnalysisPage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;