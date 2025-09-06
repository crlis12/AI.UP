import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Link 컴포넌트를 import 합니다.
import logo from '../assets/littletodack_logo.png';

import '../App.css';

// onSeenWelcome 함수를 props로 받도록 수정합니다.
function WelcomePage({ onSeenWelcome }) {
  const navigate = useNavigate(); // useNavigate 훅을 초기화합니다.

  // "로그인" 버튼 클릭 시 실행될 함수를 정의합니다.
  const handleLoginClick = () => {
    if (onSeenWelcome) {
      // onSeenWelcome 함수가 존재하면 호출합니다.
      onSeenWelcome(); // 웰컴 화면을 봤다고 App.js에 알립니다.
    }
    navigate('/signin'); // 로그인 페이지로 이동합니다.
  };

  return (
    <div className="welcome-container">
      <div className="welcome-top">
        <p className="welcome-title">AI.UP</p>
      </div>

      <div className="welcome-logo-section">
        <img src={logo} alt="Little Todak Logo" className="welcome-logo" />
        <p>리틀토닥</p>
      </div>

      <div className="welcome-actions">
        {/* "로그인" Link 대신 button을 사용하고 onClick 이벤트에 handleLoginClick을 연결합니다. */}
        <button onClick={handleLoginClick} className="welcome-login-button">
          로그인
        </button>
        <div className="welcome-links">
          {/* 다른 Link들은 그대로 유지합니다. */}
          <Link to="/find-id">아이디 찾기</Link> |<Link to="/find-password">비밀번호 찾기</Link> |
          <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;
