// src/components/BackButton.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi'; // 아이콘 import

function BackButton({ to, onBack }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (typeof onBack === 'function') return onBack();
    if (to) return navigate(to);
    return navigate(-1);
  };

  return (
    <button onClick={handleClick} className="back-button">
      <FiChevronLeft size={28} />
    </button>
  );
}

export default BackButton;
