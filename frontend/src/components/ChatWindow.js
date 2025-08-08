// src/components/ChatWindow.js (최종 수정본)

import React from 'react';
import { useNavigate } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../App.css'; // App.css를 import 합니다.
import { FiChevronLeft } from 'react-icons/fi'; // 뒤로가기 아이콘

// App.js에서 내려주는 messages, isLoading, onSendMessage를 props로 받습니다.
function ChatWindow({ messages, isLoading, onSendMessage }) {
  const navigate = useNavigate();
  

  return (
    // 1. MainScreen과 동일한 클래스 이름을 사용합니다.
    <div className="main-screen">
      {/* 2. 스크롤 영역도 동일하게 유지합니다. */}
      <div className="main-screen__scroll-view">
        
        {/* 뒤로가기 버튼을 추가하여 MainScreen으로 돌아갈 수 있게 합니다. */}
        <div className="chat-window-header">
          <button onClick={() => navigate(-1)} className="chat-window-back-button">
            <FiChevronLeft size={25} /> 
            <span>뒤로가기</span>
          </button>
        </div>

        {/* 3. 프로필과 컨텐츠 박스 대신, MessageList만 넣습니다. */}
        <div className="chat-window-messages">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>

      </div>

      {/* 4. 채팅 입력창도 MainScreen과 동일한 구조와 클래스 이름을 사용합니다. */}
      <div className="main-screen__chat-bar">
        <MessageInput
          onSendMessage={onSendMessage}
          onAttachFiles={(files) => onSendMessage('', files)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default ChatWindow;