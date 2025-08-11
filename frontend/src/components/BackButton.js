// src/components/BackButton.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi'; // 아이콘 import

function BackButton() {
  const navigate = useNavigate();

  return (
    // 클래스 이름을 더 명확하게 변경하고, 아이콘과 텍스트를 함께 사용합니다.
    <button className="global-back-button" onClick={() => navigate(-1)}>
      <FiChevronLeft size={22} />
      <span>뒤로가기</span>
    </button>
  );
}

export default BackButton;
