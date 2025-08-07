<<<<<<< HEAD
// src/pages/EmailLoginPage.js (백엔드 연동)
=======
// src/pages/EmailLoginPage.js
>>>>>>> origin/develop

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import BackButton from '../components/BackButton';
import '../App.css';

<<<<<<< HEAD
// 아이콘을 위한 임포트 (react-icons 라이브러리 사용 예시)
import { FaCheck } from "react-icons/fa";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

// 백엔드 API 기본 URL (직접 명시)
const BACKEND_API_URL = 'http://localhost:3001'; 

=======
import { FaCheck } from "react-icons/fa";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

>>>>>>> origin/develop
function EmailLoginPage({ onLogin }) {
  const navigate = useNavigate();

  // 입력값 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // 이메일과 비밀번호 입력 값 상태
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  // 로그인 오류 메시지 상태
  const [loginError, setLoginError] = useState(''); 

<<<<<<< HEAD
  // 로그인 버튼 클릭 시 실행될 함수
  const handleLogin = async () => {
    setLoginError(''); // 이전 오류 메시지 초기화

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/login`, { // 백엔드 로그인 API 호출
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }), // 이메일과 비밀번호 전송
=======
  // 로그인 처리 함수 (서버와 통신)
  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/login/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
>>>>>>> origin/develop
      });

      const data = await response.json();

<<<<<<< HEAD
      if (response.ok) { // 응답이 성공적일 경우 (HTTP 상태 코드 2xx)
        console.log('Login successful:', data);
        onLogin(); // App.js의 로그인 상태 업데이트
        navigate('/'); // 메인 화면으로 이동 (App.js에서 /main으로 리다이렉트)
      } else { // 응답이 실패일 경우 (HTTP 상태 코드 4xx, 5xx)
        setLoginError(data.message || '로그인에 실패했습니다.'); // 백엔드에서 보낸 메시지 또는 기본 메시지
        console.error('Login failed:', data.message);
      }
    } catch (error) { // 네트워크 오류 등 예외 발생 시
      setLoginError('네트워크 오류가 발생했습니다.');
      console.error('Network error during login:', error);
=======
      if (data.success) {
        onLogin(); // 부모 컴포넌트 로그인 상태 설정
        navigate('/'); // 메인 페이지로 이동
      } else {
        alert(data.message); // 에러 메시지 출력
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('서버에 로그인 요청 실패');
>>>>>>> origin/develop
    }
  };

  // Google 로그인 성공 시 처리 함수
  const handleGoogleSuccess = (credentialResponse) => {
    console.log(credentialResponse);
<<<<<<< HEAD
    // Google 로그인 후 백엔드에 사용자 정보 전송 및 로그인 처리 로직 추가 필요
    // 현재는 바로 프론트엔드 로그인 상태만 변경
    handleLogin(); // onLogin()과 navigate('/')를 포함하는 handleLogin 함수 호출
=======
    handleLogin(); // 구글 로그인 성공 시에도 동일하게 처리
>>>>>>> origin/develop
  };

  // Google 로그인 실패 시 처리 함수
  const handleGoogleError = () => {
    console.log('Google Login Failed');
    setLoginError('Google 로그인에 실패했습니다.');
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
<<<<<<< HEAD
              <input 
                type="email" 
                id="email" 
                value={email} // email 상태와 연결
                onChange={(e) => setEmail(e.target.value)} // 입력 값 변경 시 email 상태 업데이트
                placeholder="이메일을 입력하세요" // 기본값 대신 placeholder 사용
              />
              <FaCheck className="input-icon check-icon" />
=======
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
              />
              {email && <FaCheck className="input-icon check-icon" />}
>>>>>>> origin/develop
            </div>

            {/* 비밀번호 입력 */}
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
<<<<<<< HEAD
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={password} // password 상태와 연결
                onChange={(e) => setPassword(e.target.value)} // 입력 값 변경 시 password 상태 업데이트
                placeholder="비밀번호를 입력하세요" // 기본값 대신 placeholder 사용
=======
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
>>>>>>> origin/develop
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

            <a href="/forgot-password" className="forgot-password-link">비밀번호 찾기</a>

<<<<<<< HEAD
            {/* "로그인" 버튼 클릭 시 handleLogin 함수 호출 */}
=======
            {/* 로그인 버튼 */}
>>>>>>> origin/develop
            <button onClick={handleLogin} className="form-login-button">로그인</button>

            {/* 구글 로그인 */}
            <div className="google-login-button-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
<<<<<<< HEAD
                shape="pill" 
                logo_alignment="left"
                text="signin_with" 
                width="100%" 
=======
                shape="pill"
                logo_alignment="left"
                text="signin_with"
                width="100%"
>>>>>>> origin/develop
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

export default EmailLoginPage;
