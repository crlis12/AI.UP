// src/components/MainScreen.js (수정된 최종 버전)

import React, { useState, useEffect } from "react";
import '../App.css'; 
import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import MessageInput from "./MessageInput";
import babyProfile from '../assets/baby_image.png';
// 1. 페이지 이동을 위한 useNavigate hook을 import 합니다.
import { useNavigate } from "react-router-dom";


// 2. props에서 onSendMessage 함수를 받도록 수정합니다.
export default function MainScreen({ onSendMessage, currentUser, onLogout }) {
    // 3. useNavigate를 초기화하여 페이지 이동 기능을 사용할 수 있게 합니다.
    const navigate = useNavigate();
    
    // 자녀 정보 상태 관리
    const [children, setChildren] = useState([]);
    const [currentChildIndex, setCurrentChildIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // 4. 메시지 전송과 페이지 이동을 함께 처리하는 함수를 만듭니다.
    const handleInitialSend = (messageText) => {
        // App.js에서 받은 함수를 실행 -> 대화 내용이 App.js에 저장됩니다.
        onSendMessage(messageText); 
        // '/chat' 페이지로 이동합니다.
        navigate('/chat');
    };

    // 로그아웃 처리 함수
    const handleLogoutClick = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            onLogout();
            navigate('/login');
        }
    };

    // 자녀 목록 조회
    const fetchChildren = async () => {
        try {
            if (!currentUser) return;
            
            const response = await fetch(`http://localhost:3001/children/parent/${currentUser.id}`);
            const data = await response.json();
            
            if (data.success) {
                setChildren(data.children);
            } else {
                console.error('자녀 목록 조회 실패:', data.message);
            }
        } catch (error) {
            console.error('자녀 목록 조회 오류:', error);
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

    // 아동 정보 페이지로 이동하는 함수
    const handleAddChildClick = () => {
        navigate('/child-info');
    };

    // 이전/다음 자녀로 이동
    const handlePrevChild = () => {
        if (children.length > 0) {
            setCurrentChildIndex((prev) => (prev > 0 ? prev - 1 : children.length - 1));
        }
    };

    const handleNextChild = () => {
        if (children.length > 0) {
            setCurrentChildIndex((prev) => (prev < children.length - 1 ? prev + 1 : 0));
        }
    };

    // 컴포넌트 마운트 시 자녀 목록 조회
    useEffect(() => {
        if (currentUser) {
            fetchChildren();
        }
    }, [currentUser]);

	return (
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
								<h2 className="main-screen__subtitle">자녀 정보</h2>
								<div className="main-screen__widgets-container">
									<div className="main-screen__widget">
										{/* 기본 정보 */}
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
									</div>
									<div className="main-screen__widget">
										{children[currentChildIndex]?.school_name && (
											<div className="main-screen__widget-item-small">
												학교: {children[currentChildIndex].school_name}
											</div>
										)}
										{children[currentChildIndex]?.grade_level && (
											<div className="main-screen__widget-item-small">
												학년: {children[currentChildIndex].grade_level}
											</div>
										)}
										{children[currentChildIndex]?.interests && (
											<div className="main-screen__widget-item-small">
												관심사: {children[currentChildIndex].interests}
											</div>
										)}
										{children[currentChildIndex]?.favorite_activities && (
											<div className="main-screen__widget-item-small">
												좋아하는 활동: {children[currentChildIndex].favorite_activities}
											</div>
										)}
										{children[currentChildIndex]?.special_needs && (
											<div className="main-screen__widget-item-small">
												특별 요구사항: {children[currentChildIndex].special_needs}
											</div>
										)}
										{children.length > 1 && (
											<div className="main-screen__widget-item-small">
												{currentChildIndex + 1} / {children.length} 번째 자녀
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</>
				)}
			</div>

			{/* 하단 채팅 입력창 */}
			<div className="main-screen__chat-bar">
				<MessageInput 
                    // 5. onSendMessage prop에 console.log 대신 새로 만든 함수를 연결합니다.
                    onSendMessage={handleInitialSend} 
                    isLoading={false}
                />
			</div>
		</div>
	);
}