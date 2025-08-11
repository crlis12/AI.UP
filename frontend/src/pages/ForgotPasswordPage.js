// src/pages/FindPasswordPage.js (복구)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageLayout from '../components/PageLayout';

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

function FindPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 백엔드 API 호출 (최종 결정: /api 접두사 없음)
      await axios.post(`${BACKEND_API_URL}/auth/forgot-password`, { email });
      alert('입력하신 이메일로 인증번호가 발송되었습니다. 메일함을 확인해주세요.');
      // 이메일과 함께 다음 페이지로 이동
      navigate('/verify-code', { state: { email } });
    } catch (error) {
      console.error('Error sending verification email', error);
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
            가입 시 사용한 이메일을 입력하시면,
            비밀번호 재설정을 위한 인증번호를 보내드립니다.
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
            {isLoading ? '전송 중...' : '인증번호 받기'}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

export default FindPasswordPage;
