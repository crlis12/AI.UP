import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import { FiCalendar, FiChevronDown, FiPlus, FiX } from 'react-icons/fi';
import '../App.css';
import './DiaryWritePage.css'; // DiaryWritePage 전용 CSS 추가
import API_BASE from '../utils/api'; // API_BASE import 추가

function DiaryWritePage() {
  const navigate = useNavigate();
  const { childId } = useParams();
  const location = useLocation();
  const mode = location.state?.mode || 'auto'; // 'create' | 'auto'
  const didInitDateRef = useRef(false);

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      display: d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      value: `${year}-${month}-${day}`,
    };
  }, []);

  const [dateValue, setDateValue] = useState(today.value);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [existingMedia, setExistingMedia] = useState(null); // 서버 저장된 파일명
  const existingMediaUrl = existingMedia ? `${API_BASE}/uploads/diaries/${existingMedia}` : null;

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
      const form = new FormData();
      form.append('child_id', childId);
      form.append('content', content.trim());
      form.append('date', dateValue);
      files.forEach((f) => form.append('files', f));
      const resp = await fetch(`${API_BASE}/diaries`, {
        method: 'POST',
        body: form,
      });
      const data = await resp.json();
      if (!data.success) throw new Error(data.message || '일지 저장 실패');
      navigate(`/diary/list/${childId}`, { replace: true });
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const titleStyle = { fontSize: '16px', color: '#000000', fontWeight: 'bold' };

  useEffect(() => {
    if (!didInitDateRef.current && location.state?.date) {
      setDateValue(location.state.date);
      didInitDateRef.current = true;
    }
  }, [location.state]);

  useEffect(() => {
    if (mode === 'create') {
      setHasExisting(false);
      setContent('');
      return;
    }
    const fetchExisting = async () => {
      try {
        const resp = await fetch(`${API_BASE}/diaries/child/${childId}?date=${dateValue}`);
        const data = await resp.json();
        if (data.success && Array.isArray(data.diaries) && data.diaries.length > 0) {
          const first = data.diaries[0];
          setContent(first.content || '');
          setExistingMedia(first.children_img || null);
          setHasExisting(true);
        } else {
          setHasExisting(false);
          setContent('');
          setExistingMedia(null);
        }
      } catch (_) {
        setHasExisting(false);
        setExistingMedia(null);
      }
    };
    fetchExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, dateValue, mode]);

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

        {/* 기존 서버 첨부 미리보기 */}
        {existingMedia && files.length === 0 && (
          <div className="diary-write__previews" style={{ marginTop: 12 }}>
            <div className="diary-write__preview" style={{ width: 120, height: 120 }}>
              {/\.(mp4|webm|ogg)$/i.test(existingMedia) ? (
                <video src={existingMediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
              ) : (
                <img src={existingMediaUrl} alt="첨부" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <button
                type="button"
                className="diary-write__remove"
                onClick={async () => {
                  if (!window.confirm('기존 첨부를 삭제하시겠습니까?')) return;
                  try {
                    const findResp = await fetch(`${API_BASE}/diaries/child/${childId}?date=${dateValue}`);
                    const findData = await findResp.json();
                    const targetId = findData?.diaries?.[0]?.id;
                    if (!targetId) throw new Error('일지를 찾을 수 없습니다.');
                    const del = await fetch(`${API_BASE}/diaries/${targetId}/image`, { method: 'DELETE' });
                    const delData = await del.json();
                    if (!delData.success) throw new Error(delData.message || '삭제 실패');
                    setExistingMedia(null);
                  } catch (e) {
                    alert('첨부 삭제 중 오류가 발생했습니다.');
                  }
                }}
                aria-label="기존 첨부 삭제"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}

        {/* 새로 선택한 파일 미리보기 */}
        {files.length > 0 && (
          <div className="diary-write__previews">
            {files.map((file, idx) => {
              const isImage = file.type.startsWith('image/');
              const url = URL.createObjectURL(file);
              return (
                <div className="diary-write__preview" key={`${file.name}-${idx}`}>
                  {isImage ? <img src={url} alt={file.name} /> : <video src={url} />}
                  <button
                    type="button"
                    className="diary-write__remove"
                    onClick={() => handleRemoveFile(idx)}
                    aria-label="첨부 삭제"
                  >
                    <FiX />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 저장 버튼 */}
        <button className="diary-write__save-button" onClick={handleSave} disabled={isSaving}>
          {isSaving
            ? '저장 중...'
            : mode === 'create'
              ? '저장하기'
              : hasExisting
                ? '수정하기'
                : '저장하기'}
        </button>
      </div>
    </PageLayout>
  );
}

export default DiaryWritePage;
