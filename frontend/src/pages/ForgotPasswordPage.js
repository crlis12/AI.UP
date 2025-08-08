// src/pages/ForgotPasswordPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // axios import
import PageLayout from '../components/PageLayout';

const BACKEND_API_URL = 'http://localhost:3001';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 백엔드 API 호출
      await axios.post(`${BACKEND_API_URL}/api/auth/forgot-password`, { email });
      alert('입력하신 이메일로 인증번호가 발송되었습니다. 메일함을 확인해주세요.');
      // 이메일과 함께 다음 페이지로 이동
      navigate('/verify-code', { state: { email } });
    } catch (error) {
      console.error('Error sending verification email', error);
      // 백엔드에서 오는 오류 메시지를 사용하거나 기본 메시지 표시
      const message = error.response?.data?.message || '인증 이메일 전송에 실패했습니다.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout title="비밀번호 찾기">
      <div className="login-content-wrapper" style={{gap: '30px', alignItems: 'flex-start', textAlign: 'left'}}>
        <p style={{margin: 0, color: '#666', width: '100%', maxWidth: '350px'}}>
            Enter your email for the verification process, 
            we will send code to your email
        </p>

        <form onSubmit={handleSubmit} className="login-form-container" style={{width: '100%', maxWidth: '350px'}}>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 적어주세요"
            className="login-input"
            required
          />
          <button type="submit" className="form-login-button" disabled={isLoading} style={{backgroundColor: '#005248', borderRadius: '12px', marginTop: '20px'}}>
            {isLoading ? '전송 중...' : 'Continue'}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

export default ForgotPasswordPage;
