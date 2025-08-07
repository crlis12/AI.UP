import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import EmailLoginPage from './pages/EmailLoginPage';
import ChildInfoPage from './pages/ChildInfoPage';
import AIAnalysisPage from './pages/AIAnalysisPage';

// 1. 우리가 새로 만든 MainScreen 컴포넌트를 import 합니다.
// (경로는 실제 파일 위치에 맞게 조정하세요. 보통 src/components/MainScreen.js 입니다.)
import MainScreen from './components/MainScreen'; 
import './App.css';

// 2. 파일 내에 있던 기존 MainScreen 함수는 삭제합니다. (새로운 파일과 이름이 겹치므로)
/*
function MainScreen() {
  return (
    <div className="main-layout-chat">
      <ChatWindow />
    </div>
  );
}
*/

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className="App">
      <Routes>
        {/* 로그인 경로는 그대로 유지됩니다. */}
        <Route path="/login" element={<WelcomePage />} />
        <Route path="/login/email" element={<EmailLoginPage onLogin={handleLogin} />} />

        {/* 메인 페이지 경로의 element를 우리가 import한 MainScreen으로 교체합니다. */}
        <Route 
          path="/" 
          // 3. 이제 isLoggedIn이 true이면, 우리가 만든 새로운 MainScreen 컴포넌트가 보이게 됩니다.
          element={isLoggedIn ? <MainScreen /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/child-info" 
          element={isLoggedIn ? <ChildInfoPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/ai-analysis" 
          element={isLoggedIn ? <AIAnalysisPage /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

export default App;