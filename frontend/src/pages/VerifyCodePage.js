// src/pages/VerifyCodePage.js

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';

function VerifyCodePage() {
  const [code, setCode] = useState(['', '', '', '', '', '']); // 6자리로 변경
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      alert('잘못된 접근입니다. 이메일 입력부터 다시 시작해주세요.');
      navigate('/forgot-password');
    }
    inputsRef.current[0]?.focus();
  }, [email, navigate]);

  const handleInputChange = (e, index) => {
    const { value } = e.target;
    // 영문, 숫자를 모두 허용하도록 정규식 변경
    if (/^[a-zA-Z0-9]?$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value.toUpperCase(); // 대문자로 통일하여 저장
      setCode(newCode);
      if (value && index < 5) {
        // 5로 변경
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      // 6으로 변경
      alert('인증번호 6자리를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // API 경로에서 /api 제거
      await axios.post(`${API_BASE}/auth/verify-code`, { email, code: verificationCode });
      navigate('/reset-password', { state: { email } }); // code는 전달할 필요 없음
    } catch (error) {
      const message = error.response?.data?.message || '인증번호가 올바르지 않습니다.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login'); // 이메일 로그인 페이지가 아닌, 로그인 선택 페이지로 이동 (경로 수정)
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      <div
        style={{
          padding: '40px',
          backgroundColor: '#FBFDF7',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          textAlign: 'center',
          maxWidth: '480px',
          width: '90%',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: '600' }}>
          인증번호 6자리
        </h2>
        <p style={{ margin: '0 0 30px 0', color: '#555', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {email} 주소로 전송된 인증번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <div
            style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '35px' }}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text" // text로 변경하여 영문 입력 가능하게
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  width: '50px',
                  height: '60px',
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  borderRadius: '12px',
                  border: '1px solid #ddd',
                  backgroundColor: '#FBFDF7',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <button
              type="submit"
              className="form-login-button"
              disabled={isLoading}
              style={{ backgroundColor: '#005248', borderRadius: '12px' }}
            >
              {isLoading ? '확인 중...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="form-login-button"
              style={{
                backgroundColor: '#FBFDF7',
                color: '#337ab7',
                border: '1px solid #ccc',
                borderRadius: '12px',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerifyCodePage;
