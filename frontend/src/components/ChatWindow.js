// src/components/ChatWindow.js (최종 수정본)

import React, { useState, useEffect, useRef } from 'react'; // useEffect, useRef 추가
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // useLocation 추가
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../App.css'; 
import { FiChevronLeft } from 'react-icons/fi';
import BottomNavBar from './BottomNavBar';

// App.js에서 내려주는 messages와 onSendMessage를 props로 받습니다.
function ChatWindow({ messages, onSendMessage }) {
  const navigate = useNavigate();
  const { childId } = useParams();
  const location = useLocation(); // location 훅 사용
  const [isLoading, setIsLoading] = useState(false);
  const initialMessageSent = useRef(false); // 메시지를 보냈는지 추적하는 ref

  // 채팅 화면으로 진입 즉시, 메인에서 전달된 초기 메시지를 전송합니다.
  useEffect(() => {
    if (!initialMessageSent.current && (location.state?.initialMessage || location.state?.initialFile)) {
      const initialMessage = location.state?.initialMessage || '';
      const initialFile = location.state?.initialFile || null;
      onSendMessage(initialMessage, initialFile);
      initialMessageSent.current = true;
      // 뒤로가기/새로고침 시 중복 방지
      navigate('.', { replace: true, state: {} });
    }
  }, [location, navigate, onSendMessage]);


  // 요약 기능 제거됨

  return (
    <div className="main-screen-container">
		<div className="main-screen">
			{/* 고정되는 헤더 영역을 스크롤 뷰 바깥으로 이동 */}
			<div className="main-screen__header">
				<button onClick={() => navigate(-1)} className="chat-window-back-button">
				<FiChevronLeft size={25} /> 
				<span>뒤로가기</span>
				</button>
			</div>

			{/* 스크롤 가능한 메시지 영역 */}
			<div className="main-screen__scroll-view chat-window__messages-container">
				<MessageList messages={messages} isLoading={isLoading} />
			</div>
		</div>
		<div className="main-screen__chat-bar">
			<MessageInput onSendMessage={onSendMessage} isLoading={false} />
		</div>
		<BottomNavBar />
    </div>
  );
}

export default ChatWindow;