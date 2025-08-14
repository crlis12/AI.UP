// src/components/BottomNavBar.js

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiBarChart2, FiBookOpen, FiMessageSquare, FiSettings, FiX } from 'react-icons/fi';
import API_BASE from '../utils/api';
import '../App.css'; // 공통 스타일 사용

function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentChildId, setCurrentChildId] = useState(null);
  const [showChildSelection, setShowChildSelection] = useState(false);
  const [children, setChildren] = useState([]);
  const [targetPath, setTargetPath] = useState('');

  useEffect(() => {
    const childId = localStorage.getItem('currentChildId');
    if (childId) {
      setCurrentChildId(childId);
    }
  }, [location]); // 경로가 변경될 때마다 childId를 다시 가져올 수 있습니다.

  // 현재 로그인한 사용자 정보 가져오기
  const getCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  };

  // 자녀 목록 조회
  const fetchChildren = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.error('로그인된 사용자가 없습니다.');
        return;
      }

      const response = await fetch(`${API_BASE}/children/parent/${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setChildren(data.children);
      } else {
        console.error('자녀 목록 조회 실패:', data.message);
      }
    } catch (error) {
      console.error('자녀 목록 조회 오류:', error);
    }
  };


  // 현재 경로를 기반으로 활성화된 탭을 결정
  const getActiveClass = (path) => {
    return location.pathname.startsWith(path) ? 'active' : '';
  };

  const handleNavigate = (path) => {
    const childId = localStorage.getItem('currentChildId');
    if (childId) {
      navigate(`/${path}/${childId}`);
    } else {
      // 자녀가 없을 경우 자녀 선택 모달을 표시합니다.
      setTargetPath(path);
      fetchChildren();
      setShowChildSelection(true);
    }
  };

  // 자녀 선택 핸들러
  const handleChildSelect = (child) => {
    localStorage.setItem('currentChildId', child.id);
    setCurrentChildId(child.id);
    setShowChildSelection(false);
    navigate(`/${targetPath}/${child.id}`);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowChildSelection(false);
    setTargetPath('');
  };

  return (
    <>
      <div className="bottom-nav-bar">
        <button className={`nav-item ${getActiveClass('/main')}`} onClick={() => navigate('/main')}>
          <FiHome className="nav-icon" />
          <span className="nav-text">홈</span>
        </button>
        <button className={`nav-item ${getActiveClass('/report')}`} onClick={() => handleNavigate('report')}>
          <FiBarChart2 className="nav-icon" />
          <span className="nav-text">리포트</span>
        </button>
        <button className={`nav-item ${getActiveClass('/diary')}`} onClick={() => handleNavigate('diary')}>
          <FiBookOpen className="nav-icon" />
          <span className="nav-text">일기</span>
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

      {/* 자녀 선택 모달 */}
      {showChildSelection && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="child-selection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>자녀를 선택해주세요</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                <FiX />
              </button>
            </div>
            <div className="modal-content">
              {children.length === 0 ? (
                <div className="no-children">
                  <p>등록된 자녀가 없습니다.</p>
                  <button 
                    className="add-child-btn"
                    onClick={() => {
                      handleCloseModal();
                      navigate('/child-info');
                    }}
                  >
                    자녀 등록하기
                  </button>
                </div>
              ) : (
                <div className="children-list">
                  {children.map((child) => (
                    <div 
                      key={child.id} 
                      className="child-item"
                      onClick={() => handleChildSelect(child)}
                    >
                      <div className="child-info">
                        <h4>{child.name}</h4>
                        {child.nickname && <span className="nickname">"{child.nickname}"</span>}
                        <span className="age">
                          {new Date().getFullYear() - new Date(child.birth_date).getFullYear()}세
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BottomNavBar;

