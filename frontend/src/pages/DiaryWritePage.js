import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import API_BASE from '../utils/api';
import './DiaryWritePage.css';

const DiaryWritePage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  // 일기 상태 관리
  const [diary, setDiary] = useState({
    date: new Date().toISOString().split('T')[0], // 오늘 날짜로 초기화
    content: ''
  });
  
  const [isLoading, setSaving] = useState(false);
  const [child, setChild] = useState(null);

  // 아이 정보 불러오기
  useEffect(() => {
    const fetchChild = async () => {
      try {
        const response = await fetch(`${API_BASE}/children/${childId}`);
        const data = await response.json();
        if (data.success) {
          setChild(data.child);
        }
      } catch (error) {
        console.error('아이 정보 불러오기 실패:', error);
      }
    };

    if (childId) {
      fetchChild();
    }
  }, [childId]);

  // 입력 값 변경 처리
  const handleInputChange = (field, value) => {
    setDiary(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 일기 저장
  const handleSave = async () => {
    if (!diary.content.trim()) {
      alert('일기 내용을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/diaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          child_id: childId,
          date: diary.date,
          content: diary.content
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('일기가 저장되었습니다!');
        navigate(`/diary/${childId}`); // 일기 목록으로 이동
      } else {
        alert('일기 저장에 실패했습니다: ' + data.message);
      }
    } catch (error) {
      console.error('일기 저장 오류:', error);
      alert('일기 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout title={`${child?.name || '아이'}의 일기 작성`}>
      <div className="diary-write-page">
        <div className="diary-write-container">
          {/* 헤더 */}
          <div className="diary-write-header">
            <h2>새 일기 작성</h2>
            <p className="diary-subtitle">오늘 하루는 어떠셨나요?</p>
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
                onClick={() => navigate(`/diary/${childId}`)}
                className="cancel-button"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="save-button"
                disabled={isLoading || !diary.content.trim()}
              >
                {isLoading ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DiaryWritePage;