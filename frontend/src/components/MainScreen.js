// src/components/MainScreen.js

import React, { useState, useEffect, useRef } from "react";
import '../App.css'; 

import { FiChevronDown, FiBell, FiPlus, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import MessageInput from "./MessageInput";
import babyProfile from '../assets/baby_image.png';
import { useNavigate, Link } from "react-router-dom"; // Link 추가
import BottomNavBar from "./BottomNavBar";
import CircularScore from "./CircularScore";


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

    const handleInitialSend = (messageText, file) => {
        if (children.length > 0 && currentChildIndex >= 0) {
            const childId = children[currentChildIndex].id;
            // 채팅 화면으로 먼저 이동하고, 이동한 화면에서 초기 메시지를 전송합니다.
            navigate(`/chat/${childId}`, { state: { initialMessage: messageText, initialFile: file } });
        } else {
            alert("먼저 아이를 등록하고 대화를 시작해주세요.");
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
    const fetchChildrenAndDiaries = async () => {
        try {
            if (!currentUser) return;
            setLoading(true);
            
            const childrenResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/children/parent/${currentUser.id}`);
            const childrenData = await childrenResponse.json();
            
            if (childrenData.success && childrenData.children.length > 0) {
                setChildren(childrenData.children);
                
                // 첫 번째 자녀의 최신 일지 가져오기
                const firstChildId = childrenData.children[0].id;
                // 첫 자녀 ID를 localStorage에 저장
                localStorage.setItem('currentChildId', firstChildId);
                const diaryResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/diaries/child/${firstChildId}`);
                const diaryData = await diaryResponse.json();

                if (diaryData.success && diaryData.diaries.length > 0) {
                    setDiaries(diaryData.diaries);
                } else {
                    setDiaries([]); // 일지가 없을 경우
                }
            } else {
                setChildren([]); // 자녀가 없을 경우
                setDiaries([]);
            }
        } catch (error) {
            console.error('자녀 및 일지 조회 오류:', error);
        } finally {
            setLoading(false);
        }
    };

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
        let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
        if (today.getDate() < birth.getDate()) {
            months -= 1;
        }
        return Math.max(0, months);
    };

    // 아동 정보 페이지로 이동하는 함수
    const handleAddChildClick = () => {
        navigate('/child-info');
    };

    // 이전/다음 자녀로 이동
    const handlePrevChild = async () => { // async로 변경
        if (children.length > 0) {
            const newIndex = currentChildIndex > 0 ? currentChildIndex - 1 : children.length - 1;
            setCurrentChildIndex(newIndex);
            const newChildId = children[newIndex].id;
            localStorage.setItem('currentChildId', newChildId); // localStorage에 저장
            await fetchDiaries(newChildId); // 새 자녀의 일지 불러오기
        }
    };

    const handleNextChild = async () => { // async로 변경
        if (children.length > 0) {
            const newIndex = currentChildIndex < children.length - 1 ? currentChildIndex + 1 : 0;
            setCurrentChildIndex(newIndex);
            const newChildId = children[newIndex].id;
            localStorage.setItem('currentChildId', newChildId); // localStorage에 저장
            await fetchDiaries(newChildId); // 새 자녀의 일지 불러오기
        }
    };

    const handleSelectChildIndex = async (index) => {
        if (index < 0 || index >= children.length) return;
        setCurrentChildIndex(index);
        const newChildId = children[index].id;
        localStorage.setItem('currentChildId', newChildId);
        await fetchDiaries(newChildId);
        setIsChildMenuOpen(false);
    };

    const toggleChildMenu = () => {
        if (children.length === 0) return;
        setIsChildMenuOpen(prev => !prev);
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
            const diaryResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/diaries/child/${childId}`);
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

    // 채팅 시작 핸들러
    const handleStartChat = () => {
        if (children.length > 0 && currentChildIndex >= 0) {
            const childId = children[currentChildIndex].id;
            navigate(`/chat/${childId}`); // 수정: childId를 URL에 포함
        } else {
            alert("먼저 아이를 등록해주세요.");
            navigate('/child-info');
        }
    };

    // 현재 선택된 자녀 정보
    const currentChild = children[currentChildIndex];

    // 컴포넌트 마운트 시 자녀 목록 및 첫 자녀의 일지 조회
    useEffect(() => {
        if (currentUser) {
            fetchChildrenAndDiaries();
        }
    }, [currentUser]);

    // 외부 클릭으로는 닫히지 않도록 변경 (토글 버튼/항목 선택 시에만 닫힘)

    // 드롭다운이 닫힐 때 스크롤 잠금 해제 보장
    useEffect(() => {
        if (!isChildMenuOpen) {
            document.body.style.overflow = '';
        }
    }, [isChildMenuOpen]);

    // 필요 시 디버깅 로그 사용

    // 날짜별로 유일한 최신 일지만 필터링
    const uniqueDiaries = [];
    if (diaries.length > 0) {
        const seenDates = new Set();
        for (const diary of diaries) {
            const diaryDate = new Date(diary.diary_date).toLocaleDateString('ko-KR');
            if (!seenDates.has(diaryDate)) {
                uniqueDiaries.push(diary);
                seenDates.add(diaryDate);
            }
        }
    }

	return (
		<div className="main-screen-container"> 
			<div className="main-screen">
                {/* 상단 바: 뒤로가기 + 아이 선택 드롭다운 + 자리맞춤 */}
                <div className="main-topbar">
                    <button className="global-back-button" onClick={() => navigate(-1)} aria-label="뒤로가기"><FiChevronLeft /></button>
                    <button className="child-selector" onClick={toggleChildMenu} aria-haspopup="listbox" aria-expanded={isChildMenuOpen}>
                        <span>{children[currentChildIndex]?.name || '아이'}</span>
                        <FiChevronDown />
                    </button>
                    <div className="fig-header__right">
                        <button className="icon-button" aria-label="알림"><FiBell /></button>
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
                                    <span className="child-dropdown__sub">생후 {calculateMonths(c.birth_date)}개월</span>
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
									<p>위의 + 버튼을 눌러 자녀 정보를 등록하고<br/>AI 맞춤 케어를 시작하세요.</p>
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
												src={children[currentChildIndex]?.profile_image || babyProfile}
												alt={`${children[currentChildIndex]?.name} 프로필`}
												className="profile-hero__image"
											/>
											<button 
												className="main-screen__add-child-button"
												onClick={handleAddChildClick}
												title="아이 추가하기"
											>
												<FiPlus size={20} />
											</button>
										</div>
										<div className="profile-hero__name">{children[currentChildIndex]?.name}</div>
										<div className="profile-hero__months">생후 {calculateMonths(children[currentChildIndex]?.birth_date)}개월</div>
									</div>

							{/* 하단 컨텐츠 영역 */}
                            <div className="main-screen__content-box">
                                {/* 아이 정보 카드 */}
                                <div className="card card--info">
                                    <div className="card__header">
                                        <div className="card__title">아이 정보</div>
                                        <button className="card__action" onClick={() => navigate(`/child-detail/${children[currentChildIndex]?.id || ''}`)}>전체보기</button>
                                    </div>
                                    <div className="info-grid">
                                        <div className="info-grid__row"><span>나이</span><span>{calculateAge(children[currentChildIndex]?.birth_date)}세</span></div>
                                        {children[currentChildIndex]?.birth_date && (
                                            <div className="info-grid__row"><span>생년월일</span><span>{new Date(children[currentChildIndex].birth_date).toLocaleDateString('ko-KR')}</span></div>
                                        )}
                                        {children[currentChildIndex]?.height && (
                                            <div className="info-grid__row"><span>키</span><span>{children[currentChildIndex].height}cm</span></div>
                                        )}
                                        {children[currentChildIndex]?.weight && (
                                            <div className="info-grid__row"><span>몸무게</span><span>{children[currentChildIndex].weight}kg</span></div>
                                        )}
                                    </div>
                                </div>

                                {/* 발달 영역 현황 카드 */}
                                <div className="card">
                                    <div className="card__header">
                                        <div className="card__title">발달 영역 현황</div>
                                    </div>
                                    <div className="card__center">
                                        <CircularScore score={90} label="종합발달점수" subLabel="상위 10%" />
                                        <button className="main-screen__report-button" onClick={() => navigate('/ai-analysis')}>리포트 보기</button>
                                    </div>
                                </div>

                                {/* 최근 일지 카드 */}
                                <div className="card">
                                    <div className="card__header">
                                        <div className="card__title">최근 일지</div>
                                        <button className="card__action" onClick={() => {
                                            const cc = children[currentChildIndex];
                                            if (cc && cc.id) navigate(`/diary/${cc.id}`, { state: { childName: cc.name } });
                                        }}>전체보기</button>
                                    </div>
                                    <div className="list">
                                        {uniqueDiaries.length > 0 ? (
                                            uniqueDiaries.slice(0, 2).map(diary => (
                                                <div key={diary.id} className="list-item" onClick={() => navigate(`/diary/detail/${diary.id}`)}>
                                                    <div className="list-item__text">
                                                        <div className="list-item__title">{new Date(diary.diary_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 두 발로 점프 성공!</div>
                                                        <div className="list-item__subtitle">{new Date(diary.diary_date).getFullYear()}년 {new Date(diary.diary_date).toLocaleDateString('ko-KR')}</div>
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
				<MessageInput 
					onSendMessage={handleInitialSend} 
					isLoading={false}
				/>
			</div>
			<BottomNavBar />
		</div>
	);
}
