// src/components/MainScreen.js

import React from "react";
import '../App.css'; 
import { FiChevronLeft, FiChevronRight, FiEdit2 } from "react-icons/fi"; // 연필 아이콘 추가
import MessageInput from "./MessageInput";
import babyProfile from '../assets/baby_image.png';
import { useNavigate, Link } from "react-router-dom"; // Link 추가

// App.js로부터 onSendMessage와 childInfo를 props로 받습니다.
export default function MainScreen({ onSendMessage, childInfo }) {
    const navigate = useNavigate();

    const handleInitialSend = async (messageText) => {
        await onSendMessage(messageText); 
        navigate('/chat');
    };

    // 나이를 계산하는 함수
    const calculateAge = (birthDate) => {
        if (!birthDate) return '나이 정보 없음';

        const today = new Date();
        const birth = new Date(birthDate);
        
        // 개월 수 차이 계산
        let months = (today.getFullYear() - birth.getFullYear()) * 12;
        months -= birth.getMonth();
        months += today.getMonth();
        
        // 날짜를 고려하여 정확한 개월 수 보정
        if (today.getDate() < birth.getDate()) {
            months--;
        }

        if (months <= 36) {
            return `${months}개월`;
        } else {
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return `만 ${age}세`;
        }
    };

	return (
		<div className="main-screen">
			<div className="main-screen__scroll-view">
				<div className="main-screen__profile-container">
					<button className="main-screen__arrow-button">
						<FiChevronLeft size={30} />
					</button>
					<img
						src={babyProfile}
						alt="Profile"
						className="main-screen__profile-image"
					/>
					<button className="main-screen__arrow-button">
						<FiChevronRight size={30} />
					</button>
				</div>

				<div className="main-screen__content-box">
					<div className="main-screen__title-bar">
						{/* childInfo를 사용하여 나이와 이름을 표시합니다. */}
						<span className="main-screen__badge">{calculateAge(childInfo.birthDate)}</span>
						<h1 className="main-screen__name">{childInfo.name || '아이 이름'}</h1>
						{/* 수정 페이지로 이동하는 연필 아이콘 버튼 */}
						<Link to="/child-info" style={{ textDecoration: 'none', color: 'inherit', marginLeft: '10px' }}>
							<FiEdit2 size={20} cursor="pointer" />
						</Link>
					</div>
					<div className="main-screen__checklist-section">
						<h2 className="main-screen__subtitle">체크리스트</h2>
						<div className="main-screen__widgets-container">
							<div className="main-screen__widget">
								<div className="main-screen__widget-item"><span>결핵 주사 맞기</span><span className="main-screen__checkmark">✔</span></div>
								<div className="main-screen__widget-item"><span>B형 간염 2차</span><span className="main-screen__checkmark">✔</span></div>
								<div className="main-screen__widget-item"><span>예방접종 알림</span><span className="main-screen__checkmark">✔</span></div>
							</div>
							<div className="main-screen__widget">
								<div className="main-screen__widget-item-small">08.13 창톨이 첫 걸음마</div>
								<div className="main-screen__widget-item-small">08.15 집안일을 해요</div>
								<div className="main-screen__widget-item-small">08.19 유치원 놀이를 해요</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="main-screen__chat-bar">
				<MessageInput 
                    onSendMessage={handleInitialSend} 
                    isLoading={false}
                />
			</div>
		</div>
	);
}
