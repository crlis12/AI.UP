import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import '../App.css';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onLogin();
    navigate('/');
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log(credentialResponse);
    handleLogin();
  };

  const handleGoogleError = () => {
    console.log('Login Failed');
  };

  return (
    <GoogleOAuthProvider clientId="1046505600549-1a6gjndch3spkvactcmc1rqjl62ja4uo.apps.googleusercontent.com">
      <div className="login-container">
        <h1>마인드 아너스</h1>
        <div className="login-form">
          <input type="email" placeholder="이메일" className="login-input" />
          <input type="password" placeholder="비밀번호" className="login-input" />
          <button onClick={handleLogin} className="menu-button">로그인</button>
        </div>

        <div className="social-login">
          {/* 구글 로그인 버튼만 남깁니다. */}
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default LoginPage;

