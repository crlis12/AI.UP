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
  const mode = location.state?.mode || 'auto'; // 'create' | 'auto' | 'edit'
  const diaryId = location.state?.diaryId;
  const existingDiary = location.state?.existingDiary;
  const isEditMode = mode === 'edit' && diaryId && existingDiary;
  const didInitDateRef = useRef(false);

  // 디버깅용 로그
  console.log('DiaryWritePage 초기화:', {
    mode,
    diaryId,
    existingDiary,
    isEditMode,
    locationState: location.state
  });

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
      // 편집 모드와 새 작성 모드 모두 FormData 사용
      const form = new FormData();
      form.append('child_id', childId);
      form.append('content', content.trim());
      form.append('date', dateValue);
      files.forEach((f) => form.append('files', f));
      
      let resp;
      if (isEditMode) {
        // 편집 모드: FormData로 PUT 요청 (파일 업로드 지원)
        resp = await fetch(`${API_BASE}/diaries/${diaryId}`, {
          method: 'PUT',
          body: form,
        });
      } else {
        // 새 일지 작성: FormData로 POST 요청 (파일 업로드 지원)
        resp = await fetch(`${API_BASE}/diaries`, {
          method: 'POST',
          body: form,
        });
      }
      
      const data = await resp.json();
      console.log('서버 응답:', data);
      
      if (!data.success) {
        throw new Error(data.message || '일지 저장 실패');
      }
      
      alert(isEditMode ? '일지가 성공적으로 수정되었습니다.' : '일지가 성공적으로 저장되었습니다.');
      navigate(`/diary/list/${childId}`, { replace: true });
    } catch (err) {
      console.error('저장 오류:', err);
      
      // 에러 메시지 개선
      let errorMessage = '저장 중 오류가 발생했습니다.';
      if (err.message) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
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

  // 편집 모드일 때 기존 일지 데이터로 초기화
  useEffect(() => {
    if (isEditMode && existingDiary) {
      console.log('편집 모드 초기화:', existingDiary);
      console.log('기존 일지 날짜:', existingDiary.date);
      
      // 날짜 형식 정규화 (YYYY-MM-DD)
      const normalizeDate = (dateStr) => {
        if (!dateStr) return today.value;
        // 이미 YYYY-MM-DD 형식인 경우
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        // Date 객체로 변환 후 YYYY-MM-DD 형식으로 변환
        const d = new Date(dateStr);
        if (isNaN(d)) return today.value;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const normalizedDate = normalizeDate(existingDiary.date);
      console.log('정규화된 날짜:', normalizedDate);
      
      setDateValue(normalizedDate);
      setContent(existingDiary.content || '');
      setExistingMedia(existingDiary.children_img || null);
      setHasExisting(true);
      didInitDateRef.current = true; // 편집 모드에서도 플래그 설정
    }
  }, [isEditMode, existingDiary, today.value]);

  useEffect(() => {
    if (mode === 'create') {
      setHasExisting(false);
      setContent('');
      return;
    }
    if (isEditMode) {
      // 편집 모드일 때는 이미 기존 데이터로 초기화되었으므로 추가 조회 불필요
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
  }, [childId, dateValue, mode, isEditMode]);

  return (
    <PageLayout title={isEditMode ? "육아 일기 수정" : "육아 일기 작성"} titleStyle={titleStyle} showNavBar={true}>
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

        {/* 편집 모드 안내 메시지 */}
        {isEditMode && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px', 
            border: '1px solid #ffeaa7',
            color: '#856404',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⚠️ 편집 모드에서 새 파일을 첨부하면 기존 첨부 파일이 모두 교체됩니다.
          </div>
        )}

        {/* 기존 서버 첨부 미리보기 */}
        {isEditMode && existingDiary && existingDiary.files && existingDiary.files.length > 0 && files.length === 0 && (
          <div className="diary-write__previews" style={{ marginTop: 12 }}>
            <div style={{ marginBottom: '8px', fontSize: '14px', color: '#6c757d' }}>
              현재 첨부된 파일들:
            </div>
            {existingDiary.files.map((file, index) => (
              <div key={file.id || index} className="diary-write__preview" style={{ width: 120, height: 120 }}>
                {file.file_type === 'video' ? (
                  <video 
                    src={file.file_path} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    controls 
                  />
                ) : (
                  <img 
                    src={file.file_path} 
                    alt="첨부" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 레거시 children_img 미리보기 (기존 호환성) */}
        {existingMedia && files.length === 0 && !isEditMode && (
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
            : isEditMode
              ? '수정하기'
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
