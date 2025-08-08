import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChildProfileCard from '../components/ChildProfileCard';
import '../App.css';

function ChildInfoPage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    birth_date: '',
    gender: '',
    nickname: '',
    height: '',
    weight: '',
    development_stage: '',
    special_needs: '',
    school_name: '',
    grade_level: '',
    interests: '',
    favorite_activities: ''
  });

  // 현재 로그인한 사용자 정보 가져오기
  const getCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  };

  // 아동 목록 조회
  const fetchChildren = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.error('로그인된 사용자가 없습니다.');
        return;
      }

      const response = await fetch(`http://localhost:3001/children/parent/${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setChildren(data.children);
      } else {
        console.error('아동 목록 조회 실패:', data.message);
      }
    } catch (error) {
      console.error('아동 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 아동 등록
  const handleAddChild = async (e) => {
    e.preventDefault();
    
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }

      const childData = {
        ...newChild,
        parent_id: currentUser.id
      };

      const response = await fetch('http://localhost:3001/children/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childData),
      });

      const data = await response.json();

      if (data.success) {
        alert('아동 등록이 완료되었습니다.');
        setShowAddForm(false);
        setNewChild({
          name: '',
          birth_date: '',
          gender: '',
          nickname: '',
          height: '',
          weight: '',
          development_stage: '',
          special_needs: '',
          school_name: '',
          grade_level: '',
          interests: '',
          favorite_activities: ''
        });
        fetchChildren(); // 목록 새로고침
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('아동 등록 오류:', error);
      alert('아동 등록 중 오류가 발생했습니다.');
    }
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewChild(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  if (loading) {
    return (
      <div className="child-info-page">
        <h1>내 아이 정보</h1>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="child-info-page">
      <div className="page-header">
        <h1>내 아이 정보</h1>
        <button 
          className="add-child-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '취소' : '아이 추가'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-child-form">
          <h3>새 아이 등록</h3>
          <form onSubmit={handleAddChild}>
            <div className="form-row">
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  name="name"
                  value={newChild.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>생년월일 *</label>
                <input
                  type="date"
                  name="birth_date"
                  value={newChild.birth_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>성별</label>
                <select
                  name="gender"
                  value={newChild.gender}
                  onChange={handleInputChange}
                >
                  <option value="">선택하세요</option>
                  <option value="M">남자</option>
                  <option value="F">여자</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div className="form-group">
                <label>별명</label>
                <input
                  type="text"
                  name="nickname"
                  value={newChild.nickname}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>키 (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={newChild.height}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>몸무게 (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={newChild.weight}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>발달단계</label>
              <select
                name="development_stage"
                value={newChild.development_stage}
                onChange={handleInputChange}
              >
                <option value="">선택하세요</option>
                <option value="영아기">영아기 (0-2세)</option>
                <option value="유아기">유아기 (3-5세)</option>
                <option value="학령전기">학령전기 (6-7세)</option>
                <option value="학령기">학령기 (8-12세)</option>
                <option value="청소년기">청소년기 (13-18세)</option>
              </select>
            </div>

            <div className="form-group">
              <label>학교/어린이집</label>
              <input
                type="text"
                name="school_name"
                value={newChild.school_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>학년/반</label>
              <input
                type="text"
                name="grade_level"
                value={newChild.grade_level}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>특별 요구사항/알레르기</label>
              <textarea
                name="special_needs"
                value={newChild.special_needs}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>관심사</label>
              <textarea
                name="interests"
                value={newChild.interests}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>좋아하는 활동</label>
              <textarea
                name="favorite_activities"
                value={newChild.favorite_activities}
                onChange={handleInputChange}
                rows="2"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">등록하기</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowAddForm(false)}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="children-list">
        {children.length === 0 ? (
          <div className="no-children">
            <p>등록된 아이가 없습니다.</p>
            <p>위의 "아이 추가" 버튼을 눌러 첫 번째 아이를 등록해보세요!</p>
          </div>
        ) : (
          <div className="children-grid">
            {children.map(child => (
              <ChildProfileCard 
                key={child.id} 
                child={child}
                onUpdate={fetchChildren}
              />
            ))}
          </div>
        )}
      </div>

      <div className="page-footer">
        <Link to="/main" className="back-link">메인으로 돌아가기</Link>
      </div>
    </div>
  );
}

export default ChildInfoPage;