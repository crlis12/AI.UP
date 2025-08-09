// src/pages/SignupPage.js (디자인 복구)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
// 아이콘 임포트
import { FaCheck, FaRegEye, FaRegEyeSlash } from "react-icons/fa";

// 백엔드 API 기본 URL (EmailLoginPage.js와 동일하게 설정)
const BACKEND_API_URL = 'http://localhost:3001'; 

function SignupPage() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    nickname: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 비밀번호 보이기/숨기기 상태
  const [signupError, setSignupError] = useState(''); // 회원가입 오류 메시지 상태

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 해당 필드의 에러 메시지 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 클라이언트 사이드 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    // 이메일 검증
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    
    // 사용자명 검증
    if (!formData.username) {
      newErrors.username = '사용자명을 입력해주세요.';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = '사용자명은 최소 2자 이상이어야 합니다.';
    }
    
    // 닉네임 검증
    if (!formData.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (formData.nickname.trim().length < 2) {
      newErrors.nickname = '닉네임은 최소 2자 이상이어야 합니다.';
    }
    
    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }
    
    // 비밀번호 확인 검증
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 회원가입 처리
  const handleSignup = async (e) => {
    e.preventDefault(); // 폼 기본 제출 동작 방지
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 백엔드 API 호출 경로에서 /api 제거
      const response = await fetch(`${BACKEND_API_URL}/auth/signup`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username.trim(),
          nickname: formData.nickname.trim()
        }),
      });

      const data = await response.json();


      if (data.success) {
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        navigate('/signin');
      } else {
        // 서버에서 온 에러 메시지 표시
        if (data.message.includes('이메일')) {
          setErrors(prev => ({ ...prev, email: data.message }));
        } else if (data.message.includes('비밀번호')) {
          setErrors(prev => ({ ...prev, password: data.message }));
        } else if (data.message.includes('사용자명')) {

          setErrors({ username: data.message });
        } else if (data.message.includes('닉네임')) {
          setErrors({ nickname: data.message });
        } else {
          setSignupError(data.message); // 기타 서버 에러 메시지는 signupError 상태에 저장
        }
        console.error('Signup failed:', data.message);
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      setSignupError('회원가입 요청 실패. 네트워크를 확인해주세요.'); // 네트워크 오류 메시지
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-login-container">
      <header className="page-header">
        <button onClick={() => navigate(-1)} className="design-back-button">
          &lt; 뒤로가기
        </button>
      </header>

      {/* **디자인 복구: 메인 컨텐츠 영역 클래스 사용** */}
      <div className="login-content-wrapper"> 
        <h1 className="login-title">회원가입</h1> {/* h1 태그에 login-title 클래스 사용 */}

        {/* **디자인 복구: 폼 컨테이너 클래스 사용** */}
        <form onSubmit={handleSignup} className="login-form-container"> 
          {/* 이메일 입력 */}
          <div className="input-group">
            <label htmlFor="signup-email">이메일</label> 
            <div className="input-wrapper"> 
              <input
                type="email"
                id="signup-email"
                name="email" 
                placeholder="이메일을 입력하세요"
                className={`login-input ${errors.email ? 'error' : ''}`}
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {formData.email && !errors.email && <FaCheck className="input-icon check-icon" />} 
            </div>
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* 사용자명 입력 */}
          <div className="input-group">
            <label htmlFor="signup-username">사용자명</label> 
            <div className="input-wrapper"> 
              <input
                type="text"
                id="signup-username"
                name="username" 
                placeholder="사용자명을 입력하세요"
                className={`login-input ${errors.username ? 'error' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {formData.username && !errors.username && <FaCheck className="input-icon check-icon" />} 
            </div>
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          {/* 닉네임 입력 */}
          <div className="input-group">
            <label htmlFor="signup-nickname">닉네임</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="signup-nickname"
                name="nickname"
                placeholder="닉네임을 입력하세요"
                className={`login-input ${errors.nickname ? 'error' : ''}`}
                value={formData.nickname}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {formData.nickname && !errors.nickname && <FaCheck className="input-icon check-icon" />}
            </div>
            {errors.nickname && <span className="error-message">{errors.nickname}</span>}
          </div>

          {/* 비밀번호 입력 */}
          <div className="input-group">
            <label htmlFor="signup-password">비밀번호</label> 
            <div className="input-wrapper"> 
              <input
                type={showPassword ? "text" : "password"}
                id="signup-password"
                name="password" 
                placeholder="비밀번호 (최소 6자)"
                className={`login-input ${errors.password ? 'error' : ''}`}
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-icon eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* 비밀번호 확인 입력 */}
          <div className="input-group">
            <label htmlFor="signup-confirm-password">비밀번호 확인</label> 
            <div className="input-wrapper"> 
              <input
                type={showPassword ? "text" : "password"}
                id="signup-confirm-password"
                name="confirmPassword" 
                placeholder="비밀번호를 다시 입력하세요"
                className={`login-input ${errors.confirmPassword ? 'error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="input-icon eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* 회원가입 오류 메시지 표시 */}
          {isLoading && <p className="loading-message">처리중...</p>}
          {signupError && <p className="error-message">{signupError}</p>} 

          {/* 회원가입 버튼 */}
          <button 
            type="submit" 
            className="form-login-button" // **디자인 복구: form-login-button 클래스 사용**
            disabled={isLoading}
          >
            회원가입
          </button>
        </form>

        {/* 이미 계정이 있다면 로그인 링크 */}
        <div className="signup-link">
          <p>
            이미 계정이 있으신가요?{' '}
            <button 
              type="button"
              className="link-button"
              onClick={() => navigate('/signin')}
              disabled={isLoading}
            >
              로그인하기
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}

export default SignupPage;
