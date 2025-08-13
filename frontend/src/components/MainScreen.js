// src/components/MainScreen.js

import React, { useState, useEffect } from "react";
import API_BASE from '../utils/api';
import '../App.css'; 

import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import MessageInput from "./MessageInput";
import babyProfile from '../assets/baby_image.png';
import { useNavigate, Link } from "react-router-dom"; // Link 추가
import BottomNavBar from "./BottomNavBar";


// 2. props에서 onSendMessage 함수를 받도록 수정합니다.
export default function MainScreen({ onSendMessage, currentUser, onLogout }) {
    // 3. useNavigate를 초기화하여 페이지 이동 기능을 사용할 수 있게 합니다.
    const navigate = useNavigate();
    
    // 자녀 정보 상태 관리
    const [children, setChildren] = useState([]);
    const [currentChildIndex, setCurrentChildIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [diaries, setDiaries] = useState([]); // 최신 일지 목록 상태 추가

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
                
                // 첫 번째 자녀의 최신 일지 가져오기
                const firstChildId = childrenData.children[0].id;
                console.log('첫 번째 자녀 ID:', firstChildId);
                
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
				{/* 사용자 정보 헤더 */}
				<div className="main-screen__user-header">
					<div className="main-screen__user-info">
						<span className="main-screen__nickname">{currentUser?.nickname || '사용자'}</span>
						<button 
							className="main-screen__logout-button"
							onClick={handleLogoutClick}
						>
							로그아웃
						</button>
					</div>
				</div>


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
							{/* 상단 프로필 영역 */}
							<div className="main-screen__profile-container">
								<button 
									className="main-screen__arrow-button"
									onClick={handlePrevChild}
									disabled={children.length <= 1}
								>
									<FiChevronLeft size={30} />
								</button>
								<div className="main-screen__profile-image-wrapper">
									<img
										src={children[currentChildIndex]?.profile_image || babyProfile}
										alt={`${children[currentChildIndex]?.name} 프로필`}
										className="main-screen__profile-image"
									/>
									<button 
										className="main-screen__add-child-button"
										onClick={handleAddChildClick}
										title="아이 추가하기"
									>
										<FiPlus size={20} />
									</button>
								</div>
								<button 
									className="main-screen__arrow-button"
									onClick={handleNextChild}
									disabled={children.length <= 1}
								>
									<FiChevronRight size={30} />
								</button>
							</div>

							{/* 하단 컨텐츠 영역 */}
							<div className="main-screen__content-box">
								<div className="main-screen__title-bar">
									<span className="main-screen__badge">
										{children[currentChildIndex]?.development_stage || `${calculateAge(children[currentChildIndex]?.birth_date)}세`}
									</span>
									<h1 className="main-screen__name">
										{children[currentChildIndex]?.name}
										{children[currentChildIndex]?.nickname && (
											<span className="main-screen__nickname"> "{children[currentChildIndex].nickname}"</span>
										)}
									</h1>
								</div>
								<div className="main-screen__checklist-section">
									<div className="main-screen__widgets-container">
										{/* 자녀 정보 섹션 */}
										<div className="main-screen__info-section">
											<h2 className="main-screen__subtitle">자녀 정보</h2>
											<div className="main-screen__widget">
												<div className="main-screen__widget-item">
													<span>나이: {calculateAge(children[currentChildIndex]?.birth_date)}세</span>
												</div>
												{children[currentChildIndex]?.birth_date && (
													<div className="main-screen__widget-item">
														<span>생년월일: {new Date(children[currentChildIndex].birth_date).toLocaleDateString('ko-KR')}</span>
													</div>
												)}
												{children[currentChildIndex]?.weight && (
													<div className="main-screen__widget-item">
														<span>몸무게: {children[currentChildIndex].weight}kg</span>
													</div>
												)}
												{children[currentChildIndex]?.height && (
													<div className="main-screen__widget-item">
														<span>키: {children[currentChildIndex].height}cm</span>
													</div>
												)}
												{/* 발달 리포트 버튼 추가 */}
												<div className="main-screen__widget-item">
													<button 
														className="main-screen__report-button"
														onClick={() => {
															const childId = children[currentChildIndex]?.id;
															console.log('리포트 버튼 클릭, childId:', childId);
															if (childId) {
																navigate(`/report/${childId}`);
															} else {
																alert('자녀 정보를 찾을 수 없습니다.');
															}
														}}
													>
														📊 발달 리포트 보기
													</button>
												</div>
											</div>
										</div>
										{/* 오늘의 일지 섹션 */}
										<div className="main-screen__info-section">
											<h2 className="main-screen__subtitle">오늘의 일지</h2>
											<div 
												className="main-screen__widget diary-widget clickable"
												onClick={() => {
													const currentChild = children[currentChildIndex];
													if (currentChild && currentChild.id) {
														navigate(`/diary/${currentChild.id}`, { state: { childName: currentChild.name } });
													} else {
														console.error("일지 페이지로 이동할 수 없습니다: 자녀 정보가 없습니다.");
													}
												}}
											>
												{uniqueDiaries.length > 0 ? (
													uniqueDiaries.map(diary => (
														<p key={diary.id} className="main-screen__diary-summary">
															{new Date(diary.diary_date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} - {diary.summary.slice(0, 30)}{diary.summary.length > 30 ? '...' : ''}
														</p>
													))
												) : (
													<p className="main-screen__diary-summary">
														아직 작성된 일지가 없습니다.
													</p>
												)}
											</div>
										</div>
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
