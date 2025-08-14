import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { FiCalendar, FiChevronDown, FiPlus, FiX } from 'react-icons/fi';
import '../App.css';

function DiaryWritePage() {
  const navigate = useNavigate();
  const { childId } = useParams();

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return { display: d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }), value: `${year}-${month}-${day}` };
  }, []);

  const [dateValue, setDateValue] = useState(today.value);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...fileList]);
    event.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    setIsSaving(true);
    try {
      const summary = content.trim().slice(0, 100);
      const resp = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/diaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: childId, summary, full_text: content.trim() }),
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || '일지 저장 실패');
      // 저장 후 목록으로 이동
      navigate(`/diary/list/${childId}`, { replace: true });
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const titleStyle = { fontSize: '16px', color: '#000000', fontWeight: 'bold' };

  return (
    <PageLayout title="육아 일기 작성" titleStyle={titleStyle} showNavBar={true}>
      <div className="diary-write__container">
        {/* 날짜 선택 영역 */}
        <div className="diary-write__date-box">
          <div className="diary-write__date-left">
            <FiCalendar />
            <input
              type="date"
              className="diary-write__date-input"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
            />
          </div>
          <FiChevronDown />
        </div>

        {/* 텍스트 입력 */}
        <textarea
          className="diary-write__textarea"
          placeholder="오늘 우리 아이는.."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* 첨부 박스 */}
        <label className="diary-write__upload-box">
          <FiPlus size={28} />
          <span>사진/영상 첨부</span>
          <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} hidden />
        </label>

        {/* 미리보기 */}
        {files.length > 0 && (
          <div className="diary-write__previews">
            {files.map((file, idx) => {
              const isImage = file.type.startsWith('image/');
              const url = URL.createObjectURL(file);
              return (
                <div className="diary-write__preview" key={`${file.name}-${idx}`}>
                  {isImage ? (
                    <img src={url} alt={file.name} />
                  ) : (
                    <video src={url} />
                  )}
                  <button type="button" className="diary-write__remove" onClick={() => handleRemoveFile(idx)} aria-label="첨부 삭제">
                    <FiX />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 저장 버튼 */}
        <button className="diary-write__save-button" onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </PageLayout>
  );
}

export default DiaryWritePage;


