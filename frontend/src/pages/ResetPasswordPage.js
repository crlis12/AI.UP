// src/pages/ResetPasswordPage.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // axios import
import PageLayout from '../components/PageLayout';
import API_BASE from '../utils/api';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    // email 정보 없이 이 페이지에 직접 접근하는 것을 방지
    if (!email) {
      alert('잘못된 접근입니다. 비밀번호 찾기를 처음부터 다시 시도해주세요.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/reset-password`, { email, password });
      alert('비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.');
      navigate('/login'); // 로그인 선택 페이지로 이동
    } catch (error) {
      const message = error.response?.data?.message || '비밀번호 변경에 실패했습니다.';
      alert(message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <PageLayout title="비밀번호 재설정">
      <div className="login-content-wrapper" style={{gap: '30px', alignItems: 'flex-start', textAlign: 'left'}}>
        <form onSubmit={handleSubmit} className="login-form-container" style={{width: '100%', maxWidth: '350px'}}>
          <label htmlFor="password">새 비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호를 입력하세요"
            className="login-input"
            required
          />

          <label htmlFor="confirmPassword" style={{marginTop: '10px'}}>비밀번호 확인</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="비밀번호를 다시 입력하세요"
            className="login-input"
            required
          />
          <button type="submit" className="form-login-button" disabled={isLoading} style={{backgroundColor: '#056125', borderRadius: '12px', marginTop: '20px'}}>
            {isLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </PageLayout>
  );
}

export default ResetPasswordPage;
