import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/background1.png'; // 로고 이미지 경로를 확인해주세요.
import '../App.css';

function WelcomePage() {
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
        <Link to="/login/email" className="welcome-login-button">로그인</Link>
        <div className="welcome-links">
          <Link to="/find-id">아이디 찾기</Link> | 
          <Link to="/find-password">비밀번호 찾기</Link> | 
          <Link to="/signup">회원가입</Link>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;
