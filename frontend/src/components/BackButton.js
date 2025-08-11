// src/components/BackButton.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi'; // 아이콘 import

function BackButton() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate(-1)} className="back-button">
      <FiChevronLeft size={28} />
    </button>
  );
}

export default BackButton;
