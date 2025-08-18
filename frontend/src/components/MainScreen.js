// src/components/MainScreen.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import API_BASE, { questionsAPI } from '../utils/api';
import '../App.css';

import { FiChevronDown, FiBell, FiPlus, FiChevronRight } from 'react-icons/fi';
import MessageInput from './MessageInput';
import babyProfile from '../assets/baby_image.png';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from './BottomNavBar';
import CircularScore from './CircularScore';

// 2. props에서 onSendMessage 함수를 받도록 수정합니다.
export default function MainScreen({ onSendMessage, currentUser, onLogout }) {
  // 3. useNavigate를 초기화하여 페이지 이동 기능을 사용할 수 있게 합니다.
  const navigate = useNavigate();

  // 자녀 정보 상태 관리
  const [children, setChildren] = useState([]);
  const [currentChildIndex, setCurrentChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [diaries, setDiaries] = useState([]); // 최신 일지 목록 상태 추가
  const [isChildMenuOpen, setIsChildMenuOpen] = useState(false);
  const childMenuRef = useRef(null);
  const [, setChildQuestions] = useState([]); // 자녀별 질문 데이터 (console 출력용)

  const handleInitialSend = (messageText, file) => {
    if (children.length > 0 && currentChildIndex >= 0) {
      const childId = children[currentChildIndex].id;
      // 채팅 화면으로 먼저 이동하고, 이동한 화면에서 초기 메시지를 전송합니다.
      navigate(`/chat/${childId}`, { state: { initialMessage: messageText, initialFile: file } });
    } else {
      alert('먼저 아이를 등록하고 대화를 시작해주세요.');
    }
  };

  // 로그아웃 처리 함수
  const handleLogoutClick = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      onLogout();
      navigate('/login');
    }
  };

  // 자녀 목록 조회
  const fetchChildrenAndDiaries = useCallback(async () => {
    try {
      console.log('=== 자녀 정보 조회 시작 ===');
      console.log('currentUser:', currentUser);

      if (!currentUser) {
        console.error('currentUser가 없습니다');
        return;
      }

      if (!currentUser.id) {
        console.error('currentUser.id가 없습니다:', currentUser);
        return;
      }

      setLoading(true);
      console.log('API 호출 시작, URL:', `${API_BASE}/children/parent/${currentUser.id}`);

      const childrenResponse = await fetch(`${API_BASE}/children/parent/${currentUser.id}`);
      console.log('자녀 조회 응답 상태:', childrenResponse.status);
      console.log('자녀 조회 응답 헤더:', childrenResponse.headers);

      const childrenData = await childrenResponse.json();
      console.log('자녀 조회 응답 데이터:', childrenData);

      if (childrenData.success && childrenData.children.length > 0) {
        console.log('자녀 데이터 설정:', childrenData.children);
        setChildren(childrenData.children);

        // 현재 계정에서 선택된 자녀가 없다면 첫 번째 자녀로 초기화
        const storedChildId = localStorage.getItem('currentChildId');
        const firstChildId =
          storedChildId && childrenData.children.some((c) => String(c.id) === String(storedChildId))
            ? storedChildId
            : childrenData.children[0].id;
        localStorage.setItem('currentChildId', firstChildId);

        console.log('첫 번째 자녀 ID:', firstChildId);
        const firstChildObj = childrenData.children.find(
          (c) => String(c.id) === String(firstChildId)
        );
        console.log('첫 번째 자녀 이름:', firstChildObj?.name || '(알 수 없음)');

        const diaryResponse = await fetch(`${API_BASE}/diaries/child/${firstChildId}`);
        console.log('일지 조회 응답 상태:', diaryResponse.status);

        const diaryData = await diaryResponse.json();
        console.log('일지 조회 응답 데이터:', diaryData);

        if (diaryData.success && diaryData.diaries.length > 0) {
          setDiaries(diaryData.diaries);
        } else {
          console.log('일지가 없음, 빈 배열 설정');
          setDiaries([]); // 일지가 없을 경우
        }

        // 첫 번째 자녀의 질문 데이터는 별도 useEffect에서 처리
      } else {
        console.log('자녀가 없음 또는 조회 실패');
        console.log('success:', childrenData.success);
        console.log('children length:', childrenData.children?.length);
        setChildren([]); // 자녀가 없을 경우
        setDiaries([]);
      }
    } catch (error) {
      console.error('자녀 및 일지 조회 오류:', error);
      console.error('오류 상세:', error.message);
      console.error('오류 스택:', error.stack);
    } finally {
      setLoading(false);
      console.log('=== 자녀 정보 조회 완료 ===');
    }
  }, [currentUser && currentUser.id]);

  // 나이 계산 함수
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  // 개월 수 계산 (생후 N개월)
  const calculateMonths = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let months =
      (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }
    return Math.max(0, months);
  };

  // 아동 정보 페이지로 이동하는 함수
  const handleAddChildClick = () => {
    navigate('/child-info');
  };

  // 현재 선택된 아동 정보 편집 페이지로 이동
  const handleEditChildClick = () => {
    if (!children || children.length === 0) return;
    const child = children[currentChildIndex];
    if (!child) return;
    navigate('/child-info', {
      state: {
        mode: 'edit',
        childId: child.id,
        child: {
          name: child.name || '',
          gender: child.gender || '',
          birthdate: child.birth_date || '',
          weight: child.weight || '',
          height: child.height || '',
          notes: child.special_needs || '',
          profile_image: child.profile_image || '',
        },
      },
    });
  };

  // 이전/다음 자녀로 이동
  // 자녀 이전/다음 전환 UI 미사용으로 핸들러 제거

  const handleSelectChildIndex = async (index) => {
    if (index < 0 || index >= children.length) return;
    setCurrentChildIndex(index);
    const newChildId = children[index].id;
    const newChildName = children[index].name;
    localStorage.setItem('currentChildId', newChildId);
    await fetchDiaries(newChildId);
    // 질문 데이터는 useEffect에서 자동으로 로드됨
    setIsChildMenuOpen(false);
  };

  const toggleChildMenu = () => {
    if (children.length === 0) return;
    setIsChildMenuOpen((prev) => !prev);
    // 스크롤 잠금/해제
    const body = document.body;
    if (!isChildMenuOpen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = '';
    }
  };

  // 특정 자녀의 최신 일지를 불러오는 함수
  const fetchDiaries = async (childId) => {
    try {
      const diaryResponse = await fetch(`${API_BASE}/diaries/child/${childId}`);
      const diaryData = await diaryResponse.json();

      if (diaryData.success && diaryData.diaries.length > 0) {
        setDiaries(diaryData.diaries);
      } else {
        setDiaries([]);
      }
    } catch (error) {
      console.error(`${childId} 자녀의 일지 조회 오류:`, error);
      setDiaries([]);
    }
  };

  // 자녀별 질문 데이터를 불러오는 함수
  const fetchChildQuestions = useCallback(async (childId, childName) => {
    if (!childId) {
      console.log('❌ childId가 없습니다. 질문 데이터를 조회하지 않습니다.');
      return;
    }

    try {
      console.log('🔍 [메인페이지] 자녀 질문 데이터 조회 시작');
      console.log('   - 자녀 ID:', childId);
      console.log('   - 자녀 이름:', childName);
      console.log('   - API 호출 중...');

      const questionsData = await questionsAPI.getQuestionsForChild(childId);

      console.log('✅ [메인페이지] 자녀 질문 데이터 조회 성공!');
      console.log('   - 전체 응답 데이터:', questionsData);

      if (questionsData.child) {
        console.log('👶 자녀 정보:');
        console.log('   - 이름:', questionsData.child.name);
        console.log('   - 나이(개월):', questionsData.child.ageInMonths);
      }

      // 안전한 데이터 확인
      console.log('📊 questionsData 상세 정보:');
      console.log('   - questionsData:', questionsData);
      console.log('   - questionsData.questions:', questionsData?.questions);
      console.log('   - questions 타입:', typeof questionsData?.questions);
      console.log('   - questions 길이:', questionsData?.questions?.length);

      if (
        questionsData &&
        questionsData.questions &&
        Array.isArray(questionsData.questions) &&
        questionsData.questions.length > 0
      ) {
        console.log('📝 조회된 질문 수:', questionsData.questions.length + '개');
        console.log('📋 질문 목록:');

        // 발달 영역별로 그룹핑하여 출력
        const questionsByDomain = {};

        try {
          questionsData.questions.forEach((q, index) => {
            console.log('   - 질문 처리 중:', index, q);

            const domainName = q?.domain_name || '알 수 없는 영역';

            if (!questionsByDomain[domainName]) {
              questionsByDomain[domainName] = [];
            }
            questionsByDomain[domainName].push(q);
          });

          Object.keys(questionsByDomain).forEach((domainName) => {
            console.log(
              '🎯 [' + domainName + '] 영역 (' + questionsByDomain[domainName].length + '개 질문):'
            );

            questionsByDomain[domainName].forEach((q, idx) => {
              console.log(
                '   ' +
                  (idx + 1) +
                  '. [ID: ' +
                  (q?.question_id || 'N/A') +
                  '] ' +
                  (q?.question_text || '질문 없음')
              );

              if (q?.question_note) {
                console.log('      💡 참고: ' + q.question_note);
              }
              if (q?.is_additional) {
                console.log(
                  '      ➕ 추가 질문 (카테고리: ' + (q.additional_category || 'N/A') + ')'
                );
              }
            });
          });
        } catch (groupingError) {
          console.error('❌ 질문 그룹핑 중 오류:', groupingError);
          console.log('📝 전체 질문 목록 (그룹핑 없이):');
          questionsData.questions.forEach((q, idx) => {
            console.log('   ' + (idx + 1) + '. ' + (q?.question_text || '질문 없음'));
          });
        }
      } else {
        console.log('⚠️ 해당 자녀의 나이에 맞는 질문이 없습니다.');
        console.log('   - questionsData 존재:', !!questionsData);
        console.log('   - questions 존재:', !!questionsData?.questions);
        console.log('   - questions 배열 여부:', Array.isArray(questionsData?.questions));
        console.log('   - questions 길이:', questionsData?.questions?.length || 0);
      }

      setChildQuestions(questionsData.questions || []);
    } catch (error) {
      console.error('❌ [메인페이지] 자녀 질문 데이터 조회 실패:');
      console.error('   - 오류 메시지:', error.message);
      console.error('   - 전체 오류:', error);
      // 실패해도 메인페이지는 계속 사용 가능하도록 빈 배열 설정
      setChildQuestions([]);
    }
  }, []);

  // 채팅 시작 핸들러 (현재 사용하지 않으므로 주석 처리)
  // const handleStartChat = () => {
  //     if (children.length > 0 && currentChildIndex >= 0) {
  //         const childId = children[currentChildIndex].id;
  //         navigate(`/chat/${childId}`);
  //     } else {
  //         alert("먼저 아이를 등록해주세요.");
  //         navigate('/child-info');
  //     }
  // };

  // 현재 선택된 자녀 정보 (현재 사용하지 않으므로 주석 처리)
  // const currentChild = children[currentChildIndex];

  // 컴포넌트 마운트 시 자녀 목록 및 첫 자녀의 일지 조회
  useEffect(() => {
    if (currentUser) {
      fetchChildrenAndDiaries();
    }
  }, [currentUser, fetchChildrenAndDiaries]);

  // 자녀가 변경될 때마다 질문 데이터 로드
  useEffect(() => {
    console.log('🔄 useEffect 실행됨 - 자녀 질문 데이터 로드 시도');
    console.log('   - children.length:', children.length);
    console.log('   - currentChildIndex:', currentChildIndex);
    console.log('   - children:', children);

    if (children.length > 0 && currentChildIndex >= 0) {
      const currentChild = children[currentChildIndex];
      console.log('   - currentChild:', currentChild);
      if (currentChild) {
        console.log('✅ fetchChildQuestions 호출 시작!');
        fetchChildQuestions(currentChild.id, currentChild.name);
      } else {
        console.log('❌ currentChild가 없습니다');
      }
    } else {
      console.log('❌ 조건 불만족 - children 없거나 currentChildIndex 잘못됨');
    }
  }, [children, currentChildIndex, fetchChildQuestions]);

  // 외부 클릭으로는 닫히지 않도록 변경 (토글 버튼/항목 선택 시에만 닫힘)

  // 드롭다운이 닫힐 때 스크롤 잠금 해제 보장
  useEffect(() => {
    if (!isChildMenuOpen) {
      document.body.style.overflow = '';
    }
  }, [isChildMenuOpen]);

  // 언마운트 시 스크롤 잠금 해제 보장
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // 필요 시 디버깅 로그 사용

  // 날짜별로 유일한 최신 일지만 필터링
  const uniqueDiaries = [];
  if (diaries.length > 0) {
    const seenDates = new Set();
    for (const diary of diaries) {
      const diaryDate = new Date(diary.date).toLocaleDateString('ko-KR');
      if (!seenDates.has(diaryDate)) {
        uniqueDiaries.push(diary);
        seenDates.add(diaryDate);
      }
    }
  }

  // 최근 일지 미리보기용 포맷터들
  const formatMonthDay = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return String(dateString);
    return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const formatFullDateKorean = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return String(dateString);
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const buildPreviewTitle = (diary) => {
    const dateLabel = formatMonthDay(diary.date);
    const firstLine = (diary.content || '').split('\n')[0].trim();
    const preview = firstLine.length > 20 ? `${firstLine.slice(0, 20)}…` : firstLine || '일지';
    return `${dateLabel} ${preview}`;
  };

  return (
    <div className="main-screen-container">
      <div className="main-screen">
        {/* 상단 바: 아이 선택 드롭다운 + 알림 */}
        <div className="main-topbar">
          <button
            className="child-selector"
            onClick={toggleChildMenu}
            aria-haspopup="listbox"
            aria-expanded={isChildMenuOpen}
          >
            <span>{children[currentChildIndex]?.name || '아이'}</span>
            <FiChevronDown />
          </button>
          <div className="fig-header__right">
            <button className="icon-button" aria-label="알림">
              <FiBell />
            </button>
            <button className="logout-button" onClick={handleLogoutClick} aria-label="로그아웃">
              로그아웃
            </button>
          </div>
        </div>
        {isChildMenuOpen && (
          <div className="child-dropdown" ref={childMenuRef} role="listbox">
            {children.map((c, idx) => (
              <button
                key={c.id}
                className={`child-dropdown__item ${idx === currentChildIndex ? 'active' : ''}`}
                onClick={() => handleSelectChildIndex(idx)}
                role="option"
                aria-selected={idx === currentChildIndex}
              >
                <span className="child-dropdown__name">{c.name}</span>
                {c.birth_date && (
                  <span className="child-dropdown__sub">
                    생후 {calculateMonths(c.birth_date)}개월
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 스크롤되는 영역 */}
        <div className="main-screen__scroll-view">
          {loading ? (
            <div className="main-screen__loading">
              <p>로딩 중...</p>
            </div>
          ) : children.length === 0 ? (
            /* 자녀가 없을 때 */
            <div className="main-screen__no-children">
              <div className="main-screen__profile-container">
                <div className="main-screen__empty-profile">
                  <div className="main-screen__empty-image">
                    <FiPlus size={40} />
                  </div>
                  <button
                    className="main-screen__add-child-button-large"
                    onClick={handleAddChildClick}
                  >
                    <FiPlus size={20} />
                  </button>
                </div>
              </div>
              <div className="main-screen__content-box">
                <div className="main-screen__empty-content">
                  <h2>첫 번째 자녀를 추가해주세요!</h2>
                  <p>
                    위의 + 버튼을 눌러 자녀 정보를 등록하고
                    <br />
                    AI 맞춤 케어를 시작하세요.
                  </p>
                  <button
                    className="main-screen__add-child-text-button"
                    onClick={handleAddChildClick}
                  >
                    자녀 추가하기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 자녀가 있을 때 */
            <>
              {/* 상단 프로필 히어로 */}
              <div className="profile-hero">
                <div className="profile-hero__image-wrapper">
                  <img
                    src={
                      children[currentChildIndex]?.profile_image
                        ? `${API_BASE}/uploads/children/${children[currentChildIndex]?.profile_image}`
                        : babyProfile
                    }
                    alt={`${children[currentChildIndex]?.name} 프로필`}
                    className="profile-hero__image"
                    onClick={handleEditChildClick}
                  />
                  <button
                    className="main-screen__add-child-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddChildClick();
                    }}
                    title="아이 추가하기"
                  >
                    <FiPlus size={20} />
                  </button>
                </div>
                <div className="profile-hero__name">{children[currentChildIndex]?.name}</div>
                <div className="profile-hero__months">
                  생후 {calculateMonths(children[currentChildIndex]?.birth_date)}개월
                </div>
              </div>

              {/* 하단 컨텐츠 영역 */}
              <div className="main-screen__content-box">
                {/* 아이 정보 카드 */}
                <div className="card card--info">
                  <div className="card__header">
                    <div className="card__title">아이 정보</div>
                    <button
                      className="card__action"
                      onClick={handleEditChildClick}
                    >
                      전체보기
                    </button>
                  </div>
                  <div className="info-grid">
                    <div className="info-grid__row">
                      <span>나이</span>
                      <span>{calculateAge(children[currentChildIndex]?.birth_date)}세</span>
                    </div>
                    {children[currentChildIndex]?.birth_date && (
                      <div className="info-grid__row">
                        <span>생년월일</span>
                        <span>
                          {new Date(children[currentChildIndex].birth_date).toLocaleDateString(
                            'ko-KR'
                          )}
                        </span>
                      </div>
                    )}
                    {children[currentChildIndex]?.height && (
                      <div className="info-grid__row">
                        <span>키</span>
                        <span>{children[currentChildIndex].height}cm</span>
                      </div>
                    )}
                    {children[currentChildIndex]?.weight && (
                      <div className="info-grid__row">
                        <span>몸무게</span>
                        <span>{children[currentChildIndex].weight}kg</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 발달 영역 현황 카드 */}
                <div className="card">
                  <div className="card__header">
                    <div className="card__title">발달 영역 현황</div>
                  </div>
                  <div className="card__center">
                    <CircularScore
                      score={90}
                      size={110}
                      strokeWidth={8}
                      label="종합발달점수"
                      subLabel="상위 10%"
                      showRing={false}
                      contentOffsetY={10}
                      labelPosition="top"
                    />
                    <button
                      className="main-screen__report-button"
                      onClick={() => navigate('/ai-analysis')}
                    >
                      리포트 보기
                    </button>
                  </div>
                </div>

                {/* 최근 일지 카드 */}
                <div className="card">
                  <div className="card__header">
                    <div className="card__title">최근 일지</div>
                    <button
                      className="card__action"
                      onClick={() => {
                        const cc = children[currentChildIndex];
                        if (cc && cc.id)
                          navigate(`/diary/list/${cc.id}`, { state: { childName: cc.name } });
                      }}
                    >
                      전체보기
                    </button>
                  </div>
                  <div className="list">
                    {uniqueDiaries.length > 0 ? (
                      uniqueDiaries.slice(0, 2).map((diary) => (
                        <div
                          key={diary.id}
                          className="list-item"
                          onClick={() =>
                            navigate(`/diary/detail/${diary.id}`, {
                              state: { childId: children[currentChildIndex]?.id },
                            })
                          }
                        >
                          <div className="list-item__text">
                            <div className="list-item__title">{buildPreviewTitle(diary)}</div>
                            <div className="list-item__subtitle">
                              {formatFullDateKorean(diary.date)}
                            </div>
                          </div>
                          <FiChevronRight className="list-item__chevron" />
                        </div>
                      ))
                    ) : (
                      <div className="list-item list-item--empty">
                        <div className="list-item__text">아직 작성된 일지가 없습니다.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="main-screen__chat-bar">
        <MessageInput onSendMessage={handleInitialSend} isLoading={false} />
      </div>
      <BottomNavBar />
    </div>
  );
}
