// src/components/MainScreen.js (수정된 최종 버전)

import React from "react";
import '../App.css'; 
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import MessageInput from "./MessageInput";
import babyProfile from '../assets/baby_image.png';
// 1. 페이지 이동을 위한 useNavigate hook을 import 합니다.
import { useNavigate } from "react-router-dom";


// 2. props에서 onSendMessage 함수를 받도록 수정합니다.
export default function MainScreen({ onSendMessage }) {
    // 3. useNavigate를 초기화하여 페이지 이동 기능을 사용할 수 있게 합니다.
    const navigate = useNavigate();

    // 4. 메시지 전송과 페이지 이동을 함께 처리하는 함수를 만듭니다.
    const handleInitialSend = (messageText) => {
        // App.js에서 받은 함수를 실행 -> 대화 내용이 App.js에 저장됩니다.
        onSendMessage(messageText); 
        // '/chat' 페이지로 이동합니다.
        navigate('/chat');
    };

    const handleAttachFiles = (files) => {
        // 파일 첨부 시에도 채팅 화면으로 이동하여 미리보기를 보여주기 위해
        onSendMessage('', files);
        navigate('/chat');
    };

	return (
		<div className="main-screen">
			{/* 스크롤되는 영역 */}
			<div className="main-screen__scroll-view">
				{/* 상단 프로필 영역 */}
				<div className="main-screen__profile-container">
					<button className="main-screen__arrow-button">
						<FiChevronLeft size={30} />
					</button>
					<img
						src={babyProfile} // import한 이미지 변수를 사용
						alt="Profile"
						className="main-screen__profile-image"
					/>
					<button className="main-screen__arrow-button">
						<FiChevronRight size={30} />
					</button>
				</div>

				{/* 하단 컨텐츠 영역 */}
				<div className="main-screen__content-box">
					<div className="main-screen__title-bar">
						<span className="main-screen__badge">영아기</span>
						<h1 className="main-screen__name">창톨이</h1>
					</div>
					<div className="main-screen__checklist-section">
						<h2 className="main-screen__subtitle">체크리스트</h2>
						<div className="main-screen__widgets-container">
							<div className="main-screen__widget">
								<div className="main-screen__widget-item"><span>결핵 주사 맞기</span><span className="main-screen__checkmark">✔</span></div>
								<div className="main-screen__widget-item"><span>결핵 주사 맞기</span><span className="main-screen__checkmark">✔</span></div>
								<div className="main-screen__widget-item"><span>List item</span><span className="main-screen__checkmark">✔</span></div>
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

			{/* 하단 채팅 입력창 */}
			<div className="main-screen__chat-bar">
                <MessageInput 
                    // 5. onSendMessage prop에 console.log 대신 새로 만든 함수를 연결합니다.
                    onSendMessage={handleInitialSend}
                    onAttachFiles={handleAttachFiles}
                    isLoading={false}
                />
			</div>
		</div>
	);
}