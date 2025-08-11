// src/components/BottomNavBar.js

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiBookOpen, FiMessageSquare, FiSettings } from 'react-icons/fi';
import '../App.css'; // 공통 스타일 사용

function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로를 기반으로 활성화된 탭을 결정
  const getActiveClass = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  return (
    <div className="bottom-nav-bar">
      <button className={`nav-item ${getActiveClass('/main')}`} onClick={() => navigate('/main')}>
        <FiHome className="nav-icon" />
        <span className="nav-text">홈</span>
      </button>
      <button className={`nav-item ${getActiveClass('/growth')}`} onClick={() => navigate('/growth')}>
        <FiTrendingUp className="nav-icon" />
        <span className="nav-text">성장</span>
      </button>
      <button className={`nav-item ${getActiveClass('/diary')}`} onClick={() => navigate('/diary/1')}>
        <FiBookOpen className="nav-icon" />
        <span className="nav-text">일지</span>
      </button>
      <button className={`nav-item ${getActiveClass('/chat')}`} onClick={() => navigate('/chat/1')}>
        <FiMessageSquare className="nav-icon" />
        <span className="nav-text">AI챗</span>
      </button>
      <button className={`nav-item ${getActiveClass('/settings')}`} onClick={() => navigate('/settings')}>
        <FiSettings className="nav-icon" />
        <span className="nav-text">설정</span>
      </button>
    </div>
  );
}

export default BottomNavBar;

