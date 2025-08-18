import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import API_BASE from '../utils/api';
import './DiaryWritePage.css'; // 같은 스타일 사용

const DiaryEditPage = () => {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  
  // 일기 상태 관리
  const [diary, setDiary] = useState({
    date: '',
    content: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [child, setChild] = useState(null);

  // 일기 정보 불러오기
  useEffect(() => {
    const fetchDiary = async () => {
      try {
        setIsLoading(true);
        
        // 일기 정보 불러오기
        const response = await fetch(`${API_BASE}/diaries/${diaryId}`);
        const data = await response.json();
        
        if (data.success) {
          const diaryData = data.diary;
          setDiary({
            date: diaryData.date.split('T')[0], // ISO 날짜를 YYYY-MM-DD 형식으로 변환
            content: diaryData.content
          });

          // 아이 정보도 불러오기
          const childResponse = await fetch(`${API_BASE}/children/${diaryData.child_id}`);
          const childData = await childResponse.json();
          if (childData.success) {
            setChild(childData.child);
          }
        } else {
          alert('일기를 불러올 수 없습니다.');
          navigate(-1);
        }
      } catch (error) {
        console.error('일기 불러오기 실패:', error);
        alert('일기를 불러오는 중 오류가 발생했습니다.');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    if (diaryId) {
      fetchDiary();
    }
  }, [diaryId, navigate]);

  // 입력 값 변경 처리
  const handleInputChange = (field, value) => {
    setDiary(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 일기 수정 저장
  const handleSave = async () => {
    if (!diary.content.trim()) {
      alert('일기 내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/diaries/${diaryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: diary.date,
          content: diary.content,
          child_id: child?.id
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('일기가 수정되었습니다!');
        navigate(`/diary/${child.id}`); // 일기 목록으로 이동
      } else {
        alert('일기 수정에 실패했습니다: ' + data.message);
      }
    } catch (error) {
      console.error('일기 수정 오류:', error);
      alert('일기 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 일기 삭제
  const handleDelete = async () => {
    if (!window.confirm('정말로 이 일기를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/diaries/${diaryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('일기가 삭제되었습니다.');
        navigate(`/diary/${child.id}`);
      } else {
        alert('일기 삭제에 실패했습니다: ' + data.message);
      }
    } catch (error) {
      console.error('일기 삭제 오류:', error);
      alert('일기 삭제 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="일기 수정">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>일기를 불러오는 중...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`${child?.name || '아이'}의 일기 수정`}>
      <div className="diary-write-page">
        <div className="diary-write-container">
          {/* 헤더 */}
          <div className="diary-write-header">
            <h2>일기 수정</h2>
            <p className="diary-subtitle">일기 내용을 수정해보세요</p>
          </div>

          {/* 일기 작성 폼 */}
          <div className="diary-form">
            {/* 날짜 입력 */}
            <div className="form-group">
              <label htmlFor="diary-date">날짜</label>
              <input
                id="diary-date"
                type="date"
                value={diary.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="date-input"
              />
            </div>

            {/* 일기 내용 입력 */}
            <div className="form-group">
              <label htmlFor="diary-content">일기 내용</label>
              <textarea
                id="diary-content"
                value={diary.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="오늘 있었던 일들을 자유롭게 적어보세요..."
                className="content-textarea"
                rows={15}
              />
              <div className="character-count">
                {diary.content.length} / 2000자
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="button-group">
              <button
                type="button"
                onClick={() => navigate(`/diary/${child?.id}`)}
                className="cancel-button"
                disabled={isSaving}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="delete-button"
                disabled={isSaving}
              >
                삭제
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="save-button"
                disabled={isSaving || !diary.content.trim()}
              >
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DiaryEditPage;
