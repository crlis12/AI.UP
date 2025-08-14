import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';

function DiaryDetailPage() {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const childIdFromState = location.state?.childId;

  useEffect(() => {
    const fetchDiaryDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/diaries/${diaryId}`);
        const data = await response.json();

        if (data.success) {
          setDiary(data.diary);
        } else {
          console.error("일지 상세 정보 조회 실패:", data.message);
          alert(data.message);
        }
      } catch (error) {
        console.error("일지 상세 정보 조회 중 오류 발생:", error);
        alert("일지 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDiaryDetail();
  }, [diaryId]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!diary) {
    return <div>일지 정보를 찾을 수 없습니다.</div>;
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  return (
    <div className="main-screen">
      <div className="main-screen__scroll-view">
        <div className="chat-window-header">
          <button
            onClick={() => {
              if (childIdFromState) {
                navigate(`/diary/list/${childIdFromState}`, { replace: true });
              } else {
                navigate(-1);
              }
            }}
            className="chat-window-back-button"
          >
            <FiChevronLeft size={25} />
            <span>목록으로</span>
          </button>
        </div>

        <div className="diary-detail__content">
          <div className="diary-detail__header">
            <span className="diary-detail__date">{formatDate(diary.diary_date)}</span>
            <h1 className="diary-detail__title">대화 일지</h1>
          </div>
          <div className="diary-detail__body">
            <p>{diary.full_text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiaryDetailPage;
