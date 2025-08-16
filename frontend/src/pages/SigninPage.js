

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'; // Google 로그인 관련 임포트 제거
import BackButton from '../components/BackButton'; 
import '../App.css'; 

// 아이콘을 위한 임포트
import { FaCheck } from "react-icons/fa";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function SigninPage({ onLogin }) {
  const navigate = useNavigate();
  // 비밀번호 보이기/숨기기 상태 관리
  const [showPassword, setShowPassword] = useState(false);
  // 이메일과 비밀번호 입력 값 상태
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  // 로그인 오류 메시지 상태
  const [loginError, setLoginError] = useState(''); 

  // 로그인 버튼 클릭 시 실행될 함수
  const handleLogin = async () => {
    setLoginError(''); // 이전 오류 메시지 초기화

    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/login`, { // 백엔드 로그인 API 호출
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // 이메일과 비밀번호 전송
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user); // 부모 컴포넌트에 유저 정보 전달
        navigate('/'); // 메인 페이지로 이동
      } else {
        alert(data.message); // 에러 메시지 출력
      }
    } catch (error) { // 네트워크 오류 등 예외 발생 시
      setLoginError('네트워크 오류가 발생했습니다.');
      console.error('Network error during login:', error);
    }
  };

  // Google 로그인 관련 함수 제거 또는 주석 처리
  // const handleGoogleSuccess = (credentialResponse) => {
  //   console.log(credentialResponse);
  //   handleLogin(); 
  // };

  // const handleGoogleError = () => {
  //   console.log('Google Login Failed');
  //   setLoginError('Google 로그인에 실패했습니다.');
  // };

  return (
    // <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}> // GoogleOAuthProvider 제거
      <div className="email-login-container">
        <header className="page-header">
          <BackButton />
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

            {/* 로그인 오류 메시지 표시 */}
            {loginError && <p className="login-error-message">{loginError}</p>} 

            <Link to="/forgot-password" className="forgot-password-link">비밀번호 찾기</Link>

            {/* "로그인" 버튼 클릭 시 handleLogin 함수 호출 */}
            <button onClick={handleLogin} className="form-login-button">로그인</button>

            {/* 구글 로그인 버튼 영역 제거 */}
            {/* <div className="google-login-button-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                shape="pill" 
                logo_alignment="left"
                text="signin_with" 
                width="100%" 
              />
            </div> */}
          </div>

          {/* develop 브랜치에서 추가된 회원가입 링크 통합 */}
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
    // </GoogleOAuthProvider> // GoogleOAuthProvider 제거
  );
}

export default SigninPage;
