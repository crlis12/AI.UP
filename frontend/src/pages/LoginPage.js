import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import '../App.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/auth/login/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.username); // 로그인 성공 시 부모 컴포넌트에 유저 정보 전달
        navigate('/');          // 홈 페이지로 이동
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      alert('로그인 요청 실패');
    }
  };

  return (
    <GoogleOAuthProvider clientId="1046505600549-1a6gjndch3spkvactcmc1rqjl62ja4uo.apps.googleusercontent.com">
      <div className="login-container">
        <h1>마인드 아너스</h1>
        <div className="login-form">
          <input
            type="email"
            placeholder="이메일"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} className="menu-button">로그인</button>
        </div>

        {/* <div className="social-login">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div> */}
      </div>
    </GoogleOAuthProvider>
  );
}


export default LoginPage;
