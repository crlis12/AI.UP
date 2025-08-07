import { Routes, Route, Link, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChildInfoPage from './pages/ChildInfoPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import SideMenu from './components/SideMenu'; // 새로 추가
import ChatWindow from './components/ChatWindow'; // 새로 추가
import './App.css';
import React, { useState, useEffect } from 'react';

// MainScreen은 이제 레이아웃만 담당합니다.
function MainScreen() {
  return (
    <div className="main-layout">
      <SideMenu />
      <ChatWindow />
    </div>
  );
}

// App 컴포넌트 (라우터 및 로그인 관리)
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('isLoggedIn') === 'true'
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/" element={isLoggedIn ? <MainScreen /> : <Navigate to="/login" />} />
        <Route path="/child-info" element={isLoggedIn ? <ChildInfoPage /> : <Navigate to="/login" />} />
        <Route path="/ai-analysis" element={isLoggedIn ? <AIAnalysisPage /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
