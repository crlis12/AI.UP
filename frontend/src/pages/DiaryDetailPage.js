import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';
import API_BASE from '../utils/api';


function DiaryDetailPage() {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const childIdFromState = location.state?.childId;

  const buildUploadsUrl = (filename) => {
    if (!filename) return '';
    return `${API_BASE}/uploads/diaries/${filename}`;
  };

  useEffect(() => {
    const fetchDiaryDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/diaries/${diaryId}`);
        const data = await response.json();

        if (data.success) {
          setDiary(data.diary);
        } else {
          console.error('일지 상세 정보 조회 실패:', data.message);
          alert(data.message);
        }
      } catch (error) {
        console.error('일지 상세 정보 조회 중 오류 발생:', error);
        alert('일지 정보를 불러오는데 실패했습니다.');
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
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d)) return dateString; // YYYY-MM-DD 같은 문자열 그대로 표시
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return d.toLocaleDateString('ko-KR', options);
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
            <span className="diary-detail__date">{formatDate(diary.date)}</span>
            <h1 className="diary-detail__title">대화 일지</h1>
          </div>
          <div className="diary-detail__body">
            <p>{diary.content}</p>
            {diary.children_img && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#f5f5f5',
                  }}
                >
                  {/\.(mp4|webm|ogg)$/i.test(diary.children_img) ? (
                    <video
                      src={buildUploadsUrl(diary.children_img)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      controls
                    />
                  ) : (
                    <img
                      src={buildUploadsUrl(diary.children_img)}
                      alt="첨부"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              className="diary-action-button"
              onClick={() => {
                const targetChildId = childIdFromState || diary.child_id;
                navigate(`/diary/${targetChildId}`, {
                  state: { mode: 'edit', date: diary.date },
                });
              }}
            >
              수정하기
            </button>
            <button
              className="diary-action-button delete"
              onClick={async () => {
                if (!window.confirm('이 일지를 삭제하시겠습니까?')) return;
                try {
                  const resp = await fetch(`${API_BASE}/diaries/${diary.id}`, { method: 'DELETE' });
                  const data = await resp.json();
                  if (!data.success) throw new Error(data.message || '삭제 실패');
                  const backChildId = childIdFromState || diary.child_id;
                  navigate(`/diary/list/${backChildId}`, { replace: true });
                } catch (e) {
                  alert('삭제 중 오류가 발생했습니다.');
                }
              }}
            >
              삭제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiaryDetailPage;
