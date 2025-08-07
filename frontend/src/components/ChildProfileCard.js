// src/components/ChildProfileCard.js

import React from 'react';
import { FaChevronLeft, FaChevronRight, FaCheckSquare } from 'react-icons/fa';
import babyImage from '../assets/baby_image.png';

const ChildProfileCard = () => {
  return (
    <div className="child-profile-container">
      <div className="profile-carousel">
        <button className="carousel-arrow left"><FaChevronLeft /></button>
        <img src={babyImage} alt="아이 프로필" className="profile-image" />
        <button className="carousel-arrow right"><FaChevronRight /></button>
      </div>

      <div className="info-card">
        <div className="info-header">
          <span className="info-tag">영아기</span>
          <h2 className="info-name">창돌이</h2>
        </div>
        <div className="info-details">
          <div className="checklist">
            <h3>체크리스트</h3>
            <ul>
              <li><FaCheckSquare className="check-icon" /> 결핵 주사 맞기</li>
              <li><FaCheckSquare className="check-icon" /> 결핵 주사 맞기</li>
              <li><FaCheckSquare className="check-icon" /> List item</li>
            </ul>
          </div>
          <div className="milestones">
            <ul>
              <li>08.13 창돌이 첫 걸음마</li>
              <li>08.15 집안일을 해요</li>
              <li>08.19 유치원 놀이를 해요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildProfileCard;