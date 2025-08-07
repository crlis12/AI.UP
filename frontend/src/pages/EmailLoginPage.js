import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import BackButton from '../components/BackButton';
import '../App.css';

// 아이콘을 위한 임포트 (react-icons 라이브러리 사용 예시)
// 터미널에서 npm install react-icons 를 먼저 실행해주세요.
import { FaCheck } from "react-icons/fa";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";


function EmailLoginPage({ onLogin }) {
  const navigate = useNavigate();
  // 비밀번호 보이기/숨기기 상태 관리
  const [showPassword, setShowPassword] = useState(false);

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
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      {/* 전체 페이지를 감싸는 컨테이너의 클래스 이름을 명확하게 변경합니다. */}
      <div className="email-login-container">
        <header className="page-header">
          {/* 디자인 시안과 같이 'Back' 텍스트를 추가합니다. BackButton 컴포넌트를 수정하거나 아래와 같이 직접 구현할 수 있습니다. */}
          <button onClick={() => navigate(-1)} className="design-back-button">
            &lt; Back
          </button>
        </header>

        {/* 메인 컨텐츠 영역 */}
        <div className="login-content-wrapper">
          <h1 className="login-title">로그인</h1>

          <div className="login-form-container">
            {/* --- 이메일 입력 필드 --- */}
            <label htmlFor="email">Email</label>
            {/* 아이콘을 넣기 위해 div로 감싸줍니다. */}
            <div className="input-wrapper">
              <input type="email" id="email" defaultValue="myemail@gmail.com" />
              {/* 유효성 검사 아이콘 */}
              <FaCheck className="input-icon check-icon" />
            </div>

            {/* --- 비밀번호 입력 필드 --- */}
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input type={showPassword ? "text" : "password"} id="password" defaultValue="••••••••••" />
              {/* 비밀번호 보이기/숨기기 아이콘 */}
              <button
                type="button"
                className="input-icon eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </div>

            <a href="/forgot-password" className="forgot-password-link">Forgot password?</a>

            <button onClick={handleLogin} className="form-login-button">로그인</button>

            <div className="google-login-button-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                shape="pill" // 버튼 모양을 둥글게
                logo_alignment="left"
                text="signin_with" // 'Sign in with Google' 텍스트
                width="100%" // 부모 요소의 너비에 맞춤
              />
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default EmailLoginPage;