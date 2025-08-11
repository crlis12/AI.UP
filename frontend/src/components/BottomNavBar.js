// src/components/BottomNavBar.js

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiBookOpen, FiMessageSquare, FiSettings } from 'react-icons/fi';
import '../App.css'; // 공통 스타일 사용

function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentChildId, setCurrentChildId] = useState(null);

  useEffect(() => {
    const childId = localStorage.getItem('currentChildId');
    if (childId) {
      setCurrentChildId(childId);
    }
  }, [location]); // 경로가 변경될 때마다 childId를 다시 가져올 수 있습니다.


  // 현재 경로를 기반으로 활성화된 탭을 결정
  const getActiveClass = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  const handleNavigate = (path) => {
    const childId = localStorage.getItem('currentChildId');
    if (childId) {
      navigate(`/${path}/${childId}`);
    } else {
      // 자녀가 없을 경우 기본 페이지로 이동하거나 알림을 표시합니다.
      alert("먼저 자녀를 선택해주세요.");
      navigate('/main');
    }
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
      <button className={`nav-item ${getActiveClass('/diary')}`} onClick={() => handleNavigate('diary')}>
        <FiBookOpen className="nav-icon" />
        <span className="nav-text">일지</span>
      </button>
      <button className={`nav-item ${getActiveClass('/chat')}`} onClick={() => handleNavigate('chat')}>
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

