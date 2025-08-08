// src/components/ChildProfileCard.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaBirthdayCake, FaRuler, FaWeight, FaSchool } from 'react-icons/fa';
import babyImage from '../assets/baby_image.png';

const ChildProfileCard = ({ child, onUpdate }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  // 나이 계산 함수
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // 성별 표시 함수
  const getGenderText = (gender) => {
    switch(gender) {
      case 'M': return '남자';
      case 'F': return '여자';
      case 'OTHER': return '기타';
      default: return '미설정';
    }
  };



  // 아동 정보 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 아동 정보를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/children/${child.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('아동 정보가 삭제되었습니다.');
        onUpdate(); // 부모 컴포넌트의 목록 새로고침
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('아동 정보 삭제 오류:', error);
      alert('아동 정보 삭제 중 오류가 발생했습니다.');
    }
  };



  return (
    <div className="child-profile-card">
      <div className="profile-header">
        <div className="profile-image-container">
          <img 
            src={child.profile_image || babyImage} 
            alt={`${child.name} 프로필`} 
            className="profile-image" 
          />
        </div>
        <div className="profile-basic-info">
          <h3 className="child-name">{child.name}</h3>
          <span className="child-nickname">
            {child.nickname && `"${child.nickname}"`}
          </span>
          <div className="child-age">
            <FaBirthdayCake className="icon" />
            {calculateAge(child.birth_date)}세 ({getGenderText(child.gender)})
          </div>
          {child.development_stage && (
            <span className="development-stage">{child.development_stage}</span>
          )}
        </div>
        <div className="profile-actions">
          <button 
            className="edit-btn"
            onClick={() => navigate(`/child-detail/${child.id}`)}
            title="상세 수정"
          >
            <FaEdit />
          </button>
          <button 
            className="delete-btn"
            onClick={handleDelete}
            title="삭제"
          >
            <FaTrash />
          </button>
        </div>
      </div>



      <div className="profile-details">
        <div className="detail-row">
          {child.height && (
            <div className="detail-item">
              <FaRuler className="icon" />
              <span>{child.height}cm</span>
            </div>
          )}
          {child.weight && (
            <div className="detail-item">
              <FaWeight className="icon" />
              <span>{child.weight}kg</span>
            </div>
          )}
          {child.school_name && (
            <div className="detail-item">
              <FaSchool className="icon" />
              <span>{child.school_name}</span>
            </div>
          )}
        </div>

        <button 
          className="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '간단히 보기' : '자세히 보기'}
        </button>

        {showDetails && (
          <div className="detailed-info">
            {child.special_needs && (
              <div className="info-section">
                <h4>특별 요구사항</h4>
                <p>{child.special_needs}</p>
              </div>
            )}
            {child.interests && (
              <div className="info-section">
                <h4>관심사</h4>
                <p>{child.interests}</p>
              </div>
            )}
            {child.favorite_activities && (
              <div className="info-section">
                <h4>좋아하는 활동</h4>
                <p>{child.favorite_activities}</p>
              </div>
            )}
            {child.grade_level && (
              <div className="info-section">
                <h4>학년/반</h4>
                <p>{child.grade_level}</p>
              </div>
            )}
            {child.learning_style && (
              <div className="info-section">
                <h4>학습 스타일</h4>
                <p>{child.learning_style}</p>
              </div>
            )}
            {child.communication_level && (
              <div className="info-section">
                <h4>의사소통 수준</h4>
                <p>{child.communication_level}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildProfileCard;