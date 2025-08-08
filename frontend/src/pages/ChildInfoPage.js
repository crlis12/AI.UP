// src/pages/ChildInfoPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout'; // 페이지 레이아웃 컴포넌트 추가

// App.js로부터 onSave와 currentInfo를 props로 받습니다.
export default function ChildInfoPage({ onSave, currentInfo }) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const navigate = useNavigate();

  // 컴포넌트가 로드될 때, App.js에 저장된 현재 아이 정보를 폼에 채워줍니다.
  useEffect(() => {
    if (currentInfo) {
      setName(currentInfo.name || '');
      setBirthDate(currentInfo.birthDate || '');
    }
  }, [currentInfo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && birthDate) {
      // onSave 함수를 호출하여 App.js의 상태를 업데이트합니다.
      onSave({ name, birthDate });
      // 저장이 완료되면 메인 화면으로 돌아갑니다.
      navigate('/main');
    } else {
      alert('아이 이름과 생년월일을 모두 입력해주세요.');
    }
  };

  return (
    <PageLayout title="아이 정보">
      <form onSubmit={handleSubmit} className="login-form-container" style={{gap: '20px'}}>
        <div className="input-group">
          <label htmlFor="childName">아이 이름</label>
          <input
            id="childName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="아이의 이름을 입력하세요"
            className="login-input"
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="birthDate">생년월일</label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="login-input"
            required
          />
        </div>
        <button type="submit" className="form-login-button">
          저장하기
        </button>
      </form>
    </PageLayout>
  );
}
