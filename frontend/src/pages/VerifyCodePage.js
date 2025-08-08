// src/pages/VerifyCodePage.js

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // axios import

const BACKEND_API_URL = 'http://localhost:3001';

function VerifyCodePage() {
  const [code, setCode] = useState(['', '', '', '']);
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
    if (/^[0-9]$/.test(value) || value === '') {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 3) {
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
    if (verificationCode.length !== 4) {
      alert('인증번호 4자리를 모두 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(`${BACKEND_API_URL}/api/auth/verify-code`, { email, code: verificationCode });
      navigate('/reset-password', { state: { email, code: verificationCode } }); // 보안을 위해 code도 함께 전달
    } catch (error) {
      const message = error.response?.data?.message || '인증번호가 올바르지 않습니다.';
      alert(message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/login/email');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', textAlign: 'center', maxWidth: '400px', width: '90%' }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', fontWeight: '600' }}>인증번호 4자리</h2>
        <p style={{ margin: '0 0 30px 0', color: '#555', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {email} 주소로 전송된 인증번호를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '35px' }}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputsRef.current[index] = el}
                type="tel"
                maxLength="1"
                value={digit}
                onChange={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{ width: '60px', height: '70px', textAlign: 'center', fontSize: '2rem', borderRadius: '12px', border: '1px solid #ddd', backgroundColor: '#f7f8fa' }}
              />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <button type="submit" className="form-login-button" disabled={isLoading} style={{ backgroundColor: '#005248', borderRadius: '12px' }}>
              {isLoading ? '확인 중...' : 'Confirm'}
            </button>
            <button type="button" onClick={handleCancel} className="form-login-button" style={{ backgroundColor: 'white', color: '#337ab7', border: '1px solid #ccc', borderRadius: '12px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerifyCodePage;
