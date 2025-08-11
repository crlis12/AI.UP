// src/pages/ChildDetailPage.js (헤더 전송)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaUser, FaBirthdayCake, FaRuler, FaWeight, FaSchool, FaHeart, FaBrain } from 'react-icons/fa';
import '../App.css';

const BACKEND_API_URL = 'http://localhost:3001'; // 백엔드 API URL

function ChildDetailPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    gender: '',
    nickname: '',
    height: '',
    weight: '',
    development_stage: '',
    special_needs: '',
    medical_notes: '',
    school_name: '',
    grade_level: '',
    interests: '',
    favorite_activities: '',
    learning_style: '',
    communication_level: ''
  });

  // 현재 로그인한 사용자 정보 가져오기
  const getCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  };

  // 자녀 정보 조회
  const fetchChildDetail = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.id) {
        console.error('로그인된 사용자 ID가 없습니다.');
        alert('로그인이 필요합니다.');
        navigate('/login'); // 로그인 페이지로 리다이렉트
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_API_URL}/children/${childId}`, {
        headers: {
          'X-User-ID': currentUser.id // **수정된 부분: 사용자 ID를 헤더로 전송**
        }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setChild(data.child);
        setFormData({
          name: data.child.name || '',
          birth_date: data.child.birth_date ? data.child.birth_date.split('T')[0] : '',
          gender: data.child.gender || '',
          nickname: data.child.nickname || '',
          height: data.child.height || '',
          weight: data.child.weight || '',
          development_stage: data.child.development_stage || '',
          special_needs: data.child.special_needs || '',
          medical_notes: data.child.medical_notes || '',
          school_name: data.child.school_name || '',
          grade_level: data.child.grade_level || '',
          interests: data.child.interests || '',
          favorite_activities: data.child.favorite_activities || '',
          learning_style: data.child.learning_style || '',
          communication_level: data.child.communication_level || ''
        });
      } else {
        console.error('자녀 정보 조회 실패:', data.message);
        alert(`자녀 정보를 찾을 수 없거나 접근 권한이 없습니다: ${data.message || '알 수 없는 오류'}`);
        navigate('/child-info');
      }
    } catch (error) {
      console.error('자녀 정보 조회 오류:', error);
      alert('자녀 정보를 불러오는 중 네트워크 오류가 발생했습니다.');
      navigate('/child-info');
    } finally {
      setLoading(false);
    }
  };

  // 나이 계산 함수
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 자녀 정보 저장
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.id) {
        alert('로그인이 필요합니다.');
        setSaving(false);
        navigate('/login');
        return;
      }

      const response = await fetch(`${BACKEND_API_URL}/children/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': currentUser.id // **수정된 부분: 사용자 ID를 헤더로 전송**
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('자녀 정보가 성공적으로 수정되었습니다.');
        navigate('/child-info');
      } else {
        alert(data.message || '수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('자녀 정보 수정 오류:', error);
      alert('자녀 정보 수정 중 네트워크 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (childId) {
      fetchChildDetail();
    }
  }, [childId]); // childId가 변경될 때마다 다시 불러오도록 의존성 배열에 추가

  if (loading) {
    return (
      <div className="child-detail-page">
        <div className="loading-container">
          <p>자녀 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // child 객체가 null일 경우 (예: 404 에러 후) 추가 렌더링 방지
  if (!child) {
    return null; // 또는 에러 메시지 컴포넌트 렌더링
  }

  return (
    <div className="child-detail-page">
      {/* 헤더 */}
      <div className="detail-header">
        <Link to="/child-info" className="back-button">
          <FaArrowLeft />
          <span>돌아가기</span>
        </Link>
        <h1>자녀 상세 정보</h1>
        <div className="header-actions">
          <button 
            type="submit" 
            form="child-detail-form"
            className="save-button"
            disabled={saving}
          >
            <FaSave />
            <span>{saving ? '저장 중...' : '저장'}</span>
          </button>
        </div>
      </div>

      {/* 자녀 기본 정보 카드 */}
      <div className="child-summary-card">
        <div className="summary-info">
          <h2>{child?.name}</h2>
          {child?.nickname && <span className="summary-nickname">"{child.nickname}"</span>}
          <div className="summary-details">
            <span className="age-badge">{calculateAge(child?.birth_date)}세</span>
            {child?.development_stage && <span className="stage-badge">{child.development_stage}</span>}
          </div>
        </div>
      </div>

      {/* 상세 편집 폼 */}
      <form id="child-detail-form" onSubmit={handleSave} className="detail-form">
        {/* 기본 정보 섹션 */}
        <div className="form-section">
          <div className="section-header">
            <FaUser className="section-icon" />
            <h3>기본 정보</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>이름 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>별명</label>
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>생년월일 *</label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>성별</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">선택하세요</option>
                <option value="M">남자</option>
                <option value="F">여자</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
          </div>
        </div>

        {/* 신체 정보 섹션 */}
        <div className="form-section">
          <div className="section-header">
            <FaRuler className="section-icon" />
            <h3>신체 정보</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>키 (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>몸무게 (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>발달단계</label>
              <select
                name="development_stage"
                value={formData.development_stage}
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
          </div>
        </div>

        {/* 교육 정보 섹션 */}
        <div className="form-section">
          <div className="section-header">
            <FaSchool className="section-icon" />
            <h3>교육 정보</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>학교/어린이집</label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>학년/반</label>
              <input
                type="text"
                name="grade_level"
                value={formData.grade_level}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>학습 스타일</label>
              <select
                name="learning_style"
                value={formData.learning_style}
                onChange={handleInputChange}
              >
                <option value="">선택하세요</option>
                <option value="시각적">시각적 학습자</option>
                <option value="청각적">청각적 학습자</option>
                <option value="체감각적">체감각적 학습자</option>
                <option value="복합적">복합적 학습자</option>
              </select>
            </div>
            <div className="form-group">
              <label>의사소통 수준</label>
              <select
                name="communication_level"
                value={formData.communication_level}
                onChange={handleInputChange}
              >
                <option value="">선택하세요</option>
                <option value="기초">기초 수준</option>
                <option value="보통">보통 수준</option>
                <option value="우수">우수 수준</option>
                <option value="매우우수">매우 우수</option>
              </select>
            </div>
          </div>
        </div>

        {/* 관심사 및 활동 섹션 */}
        <div className="form-section">
          <div className="section-header">
            <FaHeart className="section-icon" />
            <h3>관심사 및 활동</h3>
          </div>
          <div className="form-group">
            <label>관심사</label>
            <textarea
              name="interests"
              value={formData.interests}
              onChange={handleInputChange}
              rows="3"
              placeholder="자녀가 좋아하는 것들을 적어주세요..."
            />
          </div>
          <div className="form-group">
            <label>좋아하는 활동</label>
            <textarea
              name="favorite_activities"
              value={formData.favorite_activities}
              onChange={handleInputChange}
              rows="3"
              placeholder="자녀가 즐겨하는 활동들을 적어주세요..."
            />
          </div>
        </div>

        {/* 건강 및 특별 요구사항 섹션 */}
        <div className="form-section">
          <div className="section-header">
            <FaBrain className="section-icon" />
            <h3>건강 및 특별 요구사항</h3>
          </div>
          <div className="form-group">
            <label>특별 요구사항/알레르기</label>
            <textarea
              name="special_needs"
              value={formData.special_needs}
              onChange={handleInputChange}
              rows="3"
              placeholder="알레르기, 특별한 요구사항 등을 적어주세요..."
            />
          </div>
          <div className="form-group">
            <label>의료 관련 메모</label>
            <textarea
              name="medical_notes"
              value={formData.medical_notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="건강 상태, 복용 약물, 병원 방문 기록 등을 적어주세요..."
            />
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChildDetailPage;
