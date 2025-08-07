// src/components/MainScreen.js (이 코드로 교체하세요)

import React from "react";
import '../App.css'; 
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
// MessageInput을 실제로 사용하기 위해 import 합니다.
import MessageInput from "./MessageInput";
import babyProfile from '../assets/baby_image.png';

export default function MainScreen(props) {
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
				{/* 임시 플레이스홀더를 실제 MessageInput 컴포넌트로 교체했습니다. */}
				<MessageInput 
                    onSendMessage={(message) => console.log("메시지 전송:", message)} 
                    isLoading={false}
                />
			</div>
		</div>
	);
}