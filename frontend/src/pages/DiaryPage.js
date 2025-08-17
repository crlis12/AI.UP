import React, { useState, useEffect } from 'react';
import './DiaryPage.css';

const DiaryPage = () => {
  const [diaries, setDiaries] = useState([]);
  const [newDiary, setNewDiary] = useState({
    title: '',
    content: '',
    mood: 'happy'
  });
  const [isWriting, setIsWriting] = useState(false);
  
  // 로그인된 사용자 ID 가져오기
  const getCurrentUserId = () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        return user.id || 1; // 기본값 1 (fallback)
      } catch (e) {
        console.error('사용자 정보 파싱 실패:', e);
        return 1; // 기본값 1 (fallback)
      }
    }
    return 1; // 기본값 1 (fallback)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/diaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: getCurrentUserId(), // 동적으로 사용자 ID 가져오기
          ...newDiary
        }),
      });
      
      if (response.ok) {
        setNewDiary({ title: '', content: '', mood: 'happy' });
        setIsWriting(false);
        fetchDiaries();
      }
    } catch (error) {
      console.error('일기 저장 실패:', error);
    }
  };

  const fetchDiaries = async () => {
    try {
      // 로그인된 사용자 ID로 일기 조회
      const userId = getCurrentUserId();
      const response = await fetch(`http://localhost:3001/diaries/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDiaries(data.diaries || []);
      } else {
        console.log('일기 조회 실패:', response.status);
        setDiaries([]); // 빈 배열로 설정
      }
    } catch (error) {
      console.error('일기 조회 실패:', error);
      setDiaries([]); // 에러 시 빈 배열로 설정
    }
  };

  useEffect(() => {
    fetchDiaries();
  }, []);

  return (
    <div className="diary-page">
      <h1>�� 일기장</h1>
      
      {!isWriting ? (
        <button 
          className="write-btn"
          onClick={() => setIsWriting(true)}
        >
          ✏️ 새 일기 쓰기
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="diary-form">
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={newDiary.title}
            onChange={(e) => setNewDiary({...newDiary, title: e.target.value})}
            required
          />
          <textarea
            placeholder="오늘 하루는 어땠나요?"
            value={newDiary.content}
            onChange={(e) => setNewDiary({...newDiary, content: e.target.value})}
            required
          />
          <select
            value={newDiary.mood}
            onChange={(e) => setNewDiary({...newDiary, mood: e.target.value})}
          >
            <option value="happy">😊 행복</option>
            <option value="sad">😢 슬픔</option>
            <option value="angry">😠 화남</option>
            <option value="excited">🤩 설렘</option>
            <option value="calm">😌 평온</option>
          </select>
          <div className="form-buttons">
            <button type="submit">저장</button>
            <button type="button" onClick={() => setIsWriting(false)}>
              취소
            </button>
          </div>
        </form>
      )}

      <div className="diaries-list">
        <h2> 내 일기들</h2>
        {diaries.map((diary) => (
          <div key={diary.id} className="diary-item">
            <h3>{diary.title}</h3>
            <p>{diary.content}</p>
            <div className="diary-meta">
              <span className="mood">{diary.mood}</span>
              <span className="date">
                {new Date(diary.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiaryPage;
