import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';

function DiaryDetailPage() {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const [diary, setDiary] = useState(null);

  useEffect(() => {
    // TODO: 백엔드에서 실제 데이터 가져오는 로직 구현 예정
    // --- 임시 목업 데이터 ---
    const mockDiary = {
      id: diaryId,
      diary_date: '2024-05-21',
      summary: '오늘은 아이와 함께 공룡에 대한 대화를 많이 나누었습니다. 아이는 특히 티라노사우루스에 큰 흥미를 보이며, "티라노사우루스가 제일 세?"라고 반복해서 질문했습니다. 공룡의 왕이라는 점을 설명해주자 매우 기뻐하며 공룡 장난감을 가지고 한참을 놀았습니다.\n\n오후에는 어린이집에서 있었던 일에 대해서도 이야기했습니다. 친구와 블록 쌓기 놀이를 하다가 다툼이 있었지만, 선생님의 도움으로 화해하고 다시 사이좋게 놀았다고 합니다. 아이가 갈등을 해결하는 방법을 배워나가는 과정이 기특하게 느껴졌습니다.\n\n잠들기 전에는 별과 달에 대한 동화책을 읽어주었습니다. 아이는 "왜 달은 모양이 맨날 바뀌어?"라고 물었고, 지구의 그림자에 대해 눈높이에 맞춰 설명해주려 노력했습니다. 아이의 순수한 호기심 덕분에 저 또한 즐거운 하루를 보낼 수 있었습니다.'
    };
    setDiary(mockDiary);
    // --- 임시 목업 데이터 끝 ---
  }, [diaryId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  if (!diary) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="main-screen">
      <div className="main-screen__scroll-view">
        <div className="chat-window-header">
          <button onClick={() => navigate(-1)} className="chat-window-back-button">
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
            <p>{diary.summary.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiaryDetailPage;
