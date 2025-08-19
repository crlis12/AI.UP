import React, { useState } from 'react';
import './ChildDetailFigma.css';
import PageLayout from '../components/PageLayout';
import API_BASE, { childrenAPI } from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';

function ChildInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, childId, child } = location.state || {};
  const isEditMode = mode === 'edit' && childId;

  const [childInfo, setChildInfo] = useState({
    name: '',
    gender: '',
    birthdate: '',
    weight: '',
    height: '',
    notes: '',
  });

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // ISO/Date 값을 YYYY-MM-DD로 정상화
  const toYMD = (value) => {
    if (!value) return '';
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
    }
    const d = new Date(value);
    if (isNaN(d)) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 편집 모드일 때 초기값 주입
  React.useEffect(() => {
    if (isEditMode && child) {
      setChildInfo({
        name: child.name || '',
        gender: child.gender || '',
        birthdate: toYMD(child.birthdate || child.birth_date || ''),
        weight: child.weight || '',
        height: child.height || '',
        notes: child.notes || '',
        profile_image: child.profile_image || '',
      });
    }
  }, [isEditMode, child]);

  const labels = {
    name: '이름',
    gender: '성별',
    birthdate: '생년월일',
    weight: '체중',
    height: '키',
    notes: '특이사항',
  };

  const openModal = (field) => {
    setEditingField(field);
    setTempValue(childInfo[field] || '');
  };

  const closeModal = () => setEditingField(null);
  const saveModal = () => {
    if (!editingField) return;
    setChildInfo({ ...childInfo, [editingField]: tempValue });
    setEditingField(null);
  };

  const formatUnit = (value, unit) => {
    if (!value && value !== 0) return '';
    const str = String(value).trim();
    if (str === '') return '';
    return `${str} ${unit}`; // 숫자와 단위 사이 공백
  };

  return (
    <PageLayout title="아이 정보" showNavBar={true} noScroll={true} compactHeader={true}>
      <div className="child-info-page contain">
        <div className="scroll-view">
          <div className="column">
            <div className="view">
              <div className="column2">
                <img
                  src={
                    childInfo.profile_image
                      ? `${API_BASE}/uploads/children/${childInfo.profile_image}`
                      : 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/2d8zb17o_expires_30_days.png'
                  }
                  className="image2"
                  alt="profile"
                />
                <label
                  htmlFor="profile-upload"
                  className="absolute-image"
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={
                      'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/kwrjxphl_expires_30_days.png'
                    }
                    alt="edit"
                    style={{ width: '100%', height: '100%' }}
                  />
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    try {
                      const { path, url } = await childrenAPI.uploadProfileImage(file);
                      // DB에는 파일명만 저장 (절대/상대 경로 금지)
                      const filename = (path || url || '').split('/').pop();
                      setChildInfo((prev) => ({ ...prev, profile_image: filename }));
                    } catch (err) {
                      console.error('이미지 업로드 실패:', err);
                      alert(err.message || '이미지 업로드에 실패했습니다.');
                    } finally {
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
            <div className="view2">
              <span className="text">{''}</span>
            </div>
            <span className="text2">{''}</span>
            <div className="column3">
              <span className="text3">{'기본 정보'}</span>
              <div className="field-box">
                <div className="row-view2" onClick={() => openModal('name')}>
                  <div className="column4">
                    <span className="text4">{'이름'}</span>
                    <span className="text5">{childInfo.name}</span>
                  </div>
                  <img
                    src={
                      'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/i77hklqx_expires_30_days.png'
                    }
                    className="image3"
                    alt="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('name');
                    }}
                  />
                </div>
              </div>
              <div className="field-box">
                <div className="row-view2" onClick={() => openModal('gender')}>
                  <div className="column4">
                    <span className="text4">{'성별'}</span>
                    <span className="text5">{childInfo.gender}</span>
                  </div>
                  <img
                    src={
                      'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/i77hklqx_expires_30_days.png'
                    }
                    className="image3"
                    alt="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('gender');
                    }}
                  />
                </div>
              </div>
              <div className="field-box">
                <div className="row-view2" onClick={() => openModal('birthdate')}>
                  <div className="column4">
                    <span className="text4">{'생년월일'}</span>
                    <span className="text7">{childInfo.birthdate}</span>
                  </div>
                  <img
                    src={
                      'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/xq1hcauy_expires_30_days.png'
                    }
                    className="image3"
                    alt="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('birthdate');
                    }}
                  />
                </div>
              </div>
              <div className="field-box">
                <div className="row-view2" onClick={() => openModal('weight')}>
                  <div className="column4">
                    <span className="text4">{'체중'}</span>
                    <span className="text8">{formatUnit(childInfo.weight, 'kg')}</span>
                  </div>
                  <img
                    src={
                      'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/kucwi3nl_expires_30_days.png'
                    }
                    className="image3"
                    alt="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('weight');
                    }}
                  />
                </div>
              </div>
              <div className="field-box">
                <div className="row-view2" onClick={() => openModal('height')}>
                  <div className="column5">
                    <span className="text4">{'키'}</span>
                    <span className="text5">{formatUnit(childInfo.height, 'cm')}</span>
                  </div>
                  <img
                    src={
                      'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/fwiethdd_expires_30_days.png'
                    }
                    className="image3"
                    alt="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('height');
                    }}
                  />
                </div>
              </div>
              <div className="field-box field-box--multiline">
                <div className="row-view2" onClick={() => openModal('notes')}>
                  <div className="column5" style={{ flex: 1 }}>
                    <span className="text4">{'특이사항'}</span>
                    <span className="text5">{childInfo.notes}</span>
                  </div>
                  <img
                    src={
                      'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/hbXC9Bjksi/nwim1sc8_expires_30_days.png'
                    }
                    className="image4"
                    alt="edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal('notes');
                    }}
                  />
                </div>
              </div>
            </div>
            {/* 하단 이미지 탭 제거: 공통 BottomNavBar 사용 */}
            <div className="child-info__footer">
              {isEditMode && (
                <button
                  type="button"
                  className="add-child-btn child-info__delete-btn"
                  onClick={async () => {
                    if (!childId) return;
                    if (
                      !window.confirm(
                        '해당 아이 정보를 삭제하시겠어요?\n삭제 후에는 복구할 수 없습니다.'
                      )
                    )
                      return;
                    try {
                      await childrenAPI.deleteChild(childId);
                      alert('삭제되었습니다.');
                      navigate('/main');
                    } catch (err) {
                      console.error('아동 삭제 실패:', err);
                      alert(err.message || '아이 삭제에 실패했습니다.');
                    }
                  }}
                >
                  아이 삭제
                </button>
              )}
              <button
                type="button"
                className="add-child-btn child-info__add-btn"
                onClick={async () => {
                  try {
                    const storedUser = localStorage.getItem('currentUser');
                    const user = storedUser ? JSON.parse(storedUser) : null;
                    const parentId = user?.id;
                    if (!parentId) {
                      alert('로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
                      return;
                    }
                    const payload = {
                      parent_id: parentId,
                      name: childInfo.name || '아이',
                      birth_date: childInfo.birthdate || null,
                      gender: childInfo.gender || null,
                      nickname: null,
                      profile_image: childInfo.profile_image || null,
                      height: childInfo.height || null,
                      weight: childInfo.weight || null,
                      development_stage: null,
                      special_needs: childInfo.notes || null,
                      medical_notes: null,
                      school_name: null,
                      grade_level: null,
                      interests: null,
                      favorite_activities: null,
                      personality_traits: null,
                      learning_style: null,
                      communication_level: null,
                    };

                    let targetChildId = childId;
                    if (isEditMode) {
                      await childrenAPI.updateChild(childId, payload);
                    } else {
                      const res = await childrenAPI.registerChild(payload);
                      targetChildId = res?.child?.id || res?.id || targetChildId;
                    }
                    if (targetChildId) {
                      localStorage.setItem('currentChildId', String(targetChildId));
                    }
                    navigate('/main');
                  } catch (err) {
                    console.error(isEditMode ? '아동 수정 실패:' : '아동 등록 실패:', err);
                    alert(
                      err.message ||
                        (isEditMode ? '아이 수정에 실패했습니다.' : '아이 등록에 실패했습니다.')
                    );
                  }
                }}
              >
                {isEditMode ? '저장' : '아이 추가'}
              </button>
            </div>
            {editingField && (
              <div className="modal-overlay" onClick={closeModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h3 className="modal-title">{labels[editingField]}</h3>

                  {editingField === 'gender' ? (
                    <div className="gender-segment">
                      <button
                        type="button"
                        className={`gender-option${tempValue === '남' ? ' active' : ''}`}
                        onClick={() => setTempValue('남')}
                        aria-pressed={tempValue === '남'}
                      >
                        남
                      </button>
                      <button
                        type="button"
                        className={`gender-option${tempValue === '여' ? ' active' : ''}`}
                        onClick={() => setTempValue('여')}
                        aria-pressed={tempValue === '여'}
                      >
                        여
                      </button>
                    </div>
                  ) : (
                    <input
                      className="modal-input"
                      type={
                        editingField === 'birthdate'
                          ? 'date'
                          : editingField === 'weight' || editingField === 'height'
                            ? 'number'
                            : 'text'
                      }
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder={labels[editingField]}
                    />
                  )}

                  <div className="modal-actions">
                    <button type="button" className="modal-btn cancel" onClick={closeModal}>
                      취소
                    </button>
                    <button type="button" className="modal-btn save" onClick={saveModal}>
                      저장
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default ChildInfoPage;
