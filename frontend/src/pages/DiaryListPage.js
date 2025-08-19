import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiCalendar, FiEdit3 } from 'react-icons/fi';
import PageLayout from '../components/PageLayout';
import API_BASE from '../utils/api';
import './DiaryListPage.css';

const DiaryListPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [diaries, setDiaries] = useState([]);
  const [child, setChild] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 아이 정보와 일기 목록 불러오기
  useEffect(() => {
    console.log('=== DiaryListPage useEffect 실행 ===');
    console.log('childId:', childId);
    console.log('API_BASE:', API_BASE);

    const fetchData = async () => {
      try {
        setIsLoading(true);

        if (!childId) {
          console.error('childId가 없습니다!');
          setIsLoading(false);
          return;
        }

        // 아이 정보 불러오기
        console.log('아이 정보 요청 URL:', `${API_BASE}/children/${childId}`);
        const childResponse = await fetch(`${API_BASE}/children/${childId}`);
        const childData = await childResponse.json();
        if (childData.success) {
          setChild(childData.child);
        }

        // 일기 목록 불러오기
        console.log('일기 목록 요청 URL:', `${API_BASE}/diaries/child/${childId}`);
        const diariesResponse = await fetch(`${API_BASE}/diaries/child/${childId}`);
        const diariesData = await diariesResponse.json();
        console.log('일기 목록 응답:', diariesData);
        if (diariesData.success) {
          setDiaries(diariesData.diaries);
        }
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (childId) {
      fetchData();
    }
  }, [childId]);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // 일기 내용 미리보기 (첫 100자)
  const getPreview = (content) => {
    if (content.length <= 100) return content;
    return content.substring(0, 100) + '...';
  };

  // 일기 작성 페이지로 이동
  const handleWriteDiary = () => {
    navigate(`/diary/write/${childId}`);
  };

  // 일기 상세보기/수정
  const handleEditDiary = (diaryId) => {
    navigate(`/diary/edit/${diaryId}`);
  };

  if (isLoading) {
    return (
      <PageLayout title="일기">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>일기를 불러오는 중...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`${child?.name || '아이'}의 일기`}>
      <div className="diary-list-page">
        <div className="diary-list-container">
          {/* 헤더 */}
          <div className="diary-list-header">
            <h2>{child?.name || '아이'}의 일기</h2>
            <p className="diary-count">총 {diaries.length}개의 일기</p>
          </div>

          {/* 일기 작성 버튼 */}
          <button className="write-diary-btn" onClick={handleWriteDiary}>
            <FiPlus className="btn-icon" />새 일기 작성
          </button>

          {/* 일기 목록 */}
          <div className="diary-list">
            {diaries.length === 0 ? (
              <div className="empty-state">
                <FiEdit3 className="empty-icon" />
                <h3>아직 작성된 일기가 없어요</h3>
                <p>첫 번째 일기를 작성해보세요!</p>
                <button className="empty-write-btn" onClick={handleWriteDiary}>
                  일기 작성하기
                </button>
              </div>
            ) : (
              diaries.map((diary) => (
                <div
                  key={diary.id}
                  className="diary-item"
                  onClick={() => handleEditDiary(diary.id)}
                >
                  <div className="diary-item-header">
                    <div className="diary-date">
                      <FiCalendar className="date-icon" />
                      {formatDate(diary.date)}
                    </div>
                  </div>
                  <div className="diary-preview">{getPreview(diary.content)}</div>
                  <div className="diary-item-footer">
                    <span className="diary-length">{diary.content.length}자</span>
                    <FiEdit3 className="edit-icon" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DiaryListPage;
