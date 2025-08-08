// src/pages/SigninPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import BackButton from '../components/BackButton';
import '../App.css';

import { FaCheck } from "react-icons/fa";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

function SigninPage({ onLogin }) {
  const navigate = useNavigate();

  // 입력값 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 로그인 처리 함수 (서버와 통신)
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/login/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user); // 부모 컴포넌트에 유저 정보 전달
        navigate('/'); // 메인 페이지로 이동
      } else {
        alert(data.message); // 에러 메시지 출력
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('서버에 로그인 요청 실패');
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    console.log(credentialResponse);
    handleLogin(); // 구글 로그인 성공 시에도 동일하게 처리
  };

  const handleGoogleError = () => {
    console.log('Login Failed');
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <div className="email-login-container">
        <header className="page-header">
          <button onClick={() => navigate(-1)} className="design-back-button">
            &lt; 뒤로가기
          </button>
        </header>

        <div className="login-content-wrapper">
          <h1 className="login-title">로그인</h1>

          <div className="login-form-container">
            {/* 이메일 입력 */}
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
              />
              {email && <FaCheck className="input-icon check-icon" />}
            </div>

            {/* 비밀번호 입력 */}
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
              />
              <button
                type="button"
                className="input-icon eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </div>

            <a href="/forgot-password" className="forgot-password-link">비밀번호 찾기</a>

            {/* 로그인 버튼 */}
            <button onClick={handleLogin} className="form-login-button">로그인</button>

            {/* 구글 로그인 */}
            <div className="google-login-button-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                shape="pill"
                logo_alignment="left"
                text="signin_with"
                width="100%"
              />
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="signup-link">
            <p>
              계정이 없으신가요?{' '}
              <button 
                type="button"
                className="link-button"
                onClick={() => navigate('/signup')}
              >
                회원가입하기
              </button>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default SigninPage;
