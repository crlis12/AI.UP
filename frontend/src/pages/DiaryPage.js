import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout'; // PageLayout 임포트
import { FiPlus } from 'react-icons/fi';
import API_BASE from '../utils/api'; // API_BASE import 추가
import '../App.css';

function DiaryPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 데이터 로딩 로직 (생략) ---
  useEffect(() => {
    const fetchDiaries = async () => {
      try {
        setLoading(true);
        // 목업 데이터 대신 실제 API 호출
        const response = await fetch(`${API_BASE}/diaries/child/${childId}`);
        const data = await response.json();
        if (data.success) {
          // 새 스키마: date, content 기반. 최신 날짜 순
          setDiaries(
            (data.diaries || []).sort((a, b) => new Date(b.date) - new Date(a.date))
          );
        } else {
          console.error("일지 목록 조회 실패:", data.message);
        }
      } catch (error) {
        console.error("일지 목록 조회 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiaries();
  }, [childId]);

  // --- 날짜 관련 헬퍼 함수 (생략) ---
  const toDateKey = (dateValue) => {
    const d = new Date(dateValue);
    if (isNaN(d)) return String(dateValue);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getRelativeLabel = (dateValue) => {
    const target = new Date(dateValue);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const targetKey = toDateKey(target);
    const todayKey = toDateKey(today);
    const yKey = toDateKey(yesterday);
    if (targetKey === todayKey) return '오늘';
    if (targetKey === yKey) return '어제';
    return new Date(dateValue).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };
  
  const getKoreanDate = (dateValue) => {
    return new Date(dateValue).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  };

  const timelineItems = useMemo(() => {
    const byDateKey = new Map();
    for (const diary of diaries) {
      const key = toDateKey(diary.date);
      if (!byDateKey.has(key)) {
        byDateKey.set(key, diary);
      }
    }
    return Array.from(byDateKey.values());
  }, [diaries]);

  const titleStyle = {
    fontSize: '16px',
    color: '#000000',
    fontWeight: 'bold',
  };

  const rightNode = (
    <button
      onClick={() => navigate(`/diary/${childId}`, { state: { mode: 'create' } })}
      aria-label="새 일기 작성"
      className="header-action-button"
      title="새 일기"
    >
      <FiPlus size={22} />
    </button>
  );

  if (loading) return <PageLayout title="일지 목록" titleStyle={titleStyle} showNavBar={true} rightNode={rightNode} backTo="/main"><div>로딩 중...</div></PageLayout>;

  return (
    <PageLayout title="일지 목록" titleStyle={titleStyle} showNavBar={true} rightNode={rightNode} backTo="/main">
      <div className="timeline-container">
        {timelineItems.map((item, index) => {
          const label = getRelativeLabel(item.date);
          const sub = getKoreanDate(item.date);
          const isFirst = index === 0;
          const calendarIcon = 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/d67u1cc4_expires_30_days.png'; // 연한 녹색 아이콘으로 통일

          return (
            <div
              key={item.id}
              onClick={() =>
                navigate(`/diary/detail/${item.id}`, {
                  state: { childId }
                })
              }
              style={{width: '100%'}}
            >
              {isFirst ? (
                <div className="row-view2">
                  <div className="column2">
                    <img src={calendarIcon} alt="today" className="image2" />
                  </div>
                  <div className="column3">
                    <span className="text2">{label}</span>
                    <span className="text3">{sub}</span>
                  </div>
                </div>
              ) : (
                <div className="row-view3">
                  <div className="column2">
                    <img src={calendarIcon} alt="date" className="image2" />
                  </div>
                  <div className="column3">
                    <span className="text2">{label}</span>
                    <span className="text3">{sub}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}

export default DiaryPage;