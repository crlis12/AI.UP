import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

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
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/auth/signup', {
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
          setErrors({ email: data.message });
        } else if (data.message.includes('비밀번호')) {
          setErrors({ password: data.message });
        } else if (data.message.includes('사용자명')) {
          setErrors({ username: data.message });
        } else if (data.message.includes('닉네임')) {
          setErrors({ nickname: data.message });
        } else {
          alert(data.message);
        }
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      alert('회원가입 요청 실패. 네트워크를 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>AI.UP</h1>
      <h2>회원가입</h2>
      
      <form onSubmit={handleSignup} className="login-form">
        <div className="input-group">
          <input
            type="email"
            name="email"
            placeholder="이메일"
            className={`login-input ${errors.email ? 'error' : ''}`}
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="username"
            placeholder="사용자명 (실명)"
            className={`login-input ${errors.username ? 'error' : ''}`}
            value={formData.username}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="input-group">
          <input
            type="text"
            name="nickname"
            placeholder="닉네임 (앱에서 사용할 이름)"
            className={`login-input ${errors.nickname ? 'error' : ''}`}
            value={formData.nickname}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          {errors.nickname && <span className="error-message">{errors.nickname}</span>}
        </div>

        <div className="input-group">
          <input
            type="password"
            name="password"
            placeholder="비밀번호 (최소 6자)"
            className={`login-input ${errors.password ? 'error' : ''}`}
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          {errors.password && <span className="error-message">{errors.password}</span>}
        </div>

        <div className="input-group">
          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            className={`login-input ${errors.confirmPassword ? 'error' : ''}`}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        <button 
          type="submit" 
          className="menu-button"
          disabled={isLoading}
        >
          {isLoading ? '처리중...' : '회원가입'}
        </button>
      </form>

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
  );
}

export default SignupPage;
