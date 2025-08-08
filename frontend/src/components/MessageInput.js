// src/components/MessageInput.js (수정 예시)

import React, { useState } from 'react';
// 아이콘이 필요하다면 import 합니다.
import { FiPlus } from "react-icons/fi"; 
import { IoPaperPlaneOutline } from "react-icons/io5";

// onSendMessage, isLoading 같은 props는 그대로 받습니다.
const MessageInput = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    // form의 className을 'new-chat-form'으로 변경합니다.
    <form className="new-chat-form" onSubmit={handleSubmit}>
      {/* 왼쪽 '+' 버튼 */}
      <button type="button" className="new-chat-button-plus">
        <FiPlus />
      </button>

      {/* input의 className을 'new-chat-input'으로 변경합니다. */}
      <input
        type="text"
        className="new-chat-input"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="내 아이에 대해 질문하기"
        disabled={isLoading}
      />
      
      {/* 오른쪽 '전송' 버튼 */}
      <button type="submit" className="new-chat-button-send" disabled={isLoading}>
        <IoPaperPlaneOutline />
      </button>
    </form>
  );
};

export default MessageInput;