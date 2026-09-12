import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import API_BASE from '../utils/api';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data && data.success) {
        onLogin(data.user);
        navigate('/');
      } else {
        alert(data?.message || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      alert('로그인 요청 실패');
    }
  };

  return (
    <div className="login-container">
      <h1>마인드 아너스</h1>
      <div className="login-form">
        <input
          type="email"
          placeholder="이메일"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="login-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} className="menu-button">
          로그인
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
