import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi'; // 아이콘 임포트

function DiaryPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // location 훅 사용
  const [diaries, setDiaries] = useState([]); // 일지 목록 상태
  const [childName, setChildName] = useState(''); // 아이 이름 상태
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
    // MainScreen에서 넘겨준 이름 정보가 있으면 사용, 없으면 빈 문자열
    const nameFromState = location.state?.childName || '';
    setChildName(nameFromState);

    const fetchDiaries = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/diaries/child/${childId}`);
        const data = await response.json();

        if (data.success) {
          setDiaries(data.diaries);
          // 아이 이름을 API 응답에서 가져오는 로직이 아직 없으므로,
          // location state에서 가져온 이름을 유지합니다.
        } else {
          console.error("일지 목록 조회 실패:", data.message);
          alert(data.message);
        }
      } catch (error) {
        console.error("일지 목록 조회 중 오류 발생:", error);
        alert("일지 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchDiaries();
  }, [childId, location.state]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="main-screen">
      <div className="main-screen__scroll-view">
        <div className="chat-window-header">
          <button onClick={() => navigate(-1)} className="chat-window-back-button">
            <FiChevronLeft size={25} /> 
            <span>뒤로가기</span>
          </button>
        </div>

        <div className="diary-page__content">
          <div className="diary-page__header">
            <h1 className="diary-page__title">{childName}의 대화 일지</h1>
            <p className="diary-page__subtitle">하루 동안 나눈 대화의 핵심 요약입니다.</p>
          </div>

          <div className="diary-list">
            {diaries.map(diary => (
              <div 
                key={diary.id} 
                className="diary-list__item" 
                onClick={() => navigate(`/diary/detail/${diary.id}`)}
              >
                <div className="diary-list__date-container">
                  <span className="diary-list__day">{new Date(diary.diary_date).getDate()}</span>
                  <span className="diary-list__month">{new Date(diary.diary_date).toLocaleString('ko-KR', { month: 'short' })}</span>
                </div>
                <div className="diary-list__content">
                  <p className="diary-list__summary">{diary.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiaryPage;
