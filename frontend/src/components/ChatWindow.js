// src/components/ChatWindow.js (최종 수정본)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../App.css'; // App.css를 import 합니다.
import { FiChevronLeft } from 'react-icons/fi'; // 뒤로가기 아이콘

// App.js에서 내려주는 messages와 onSendMessage를 props로 받습니다.
function ChatWindow({ messages, onSendMessage }) {
  const navigate = useNavigate();
  const isLoading = false; 

  return (
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

      {/* 채팅 입력창 */}
      <div className="main-screen__chat-bar">
        <MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default ChatWindow;