// src/components/ChatWindow.js (수정된 최종 버전)

import React, { useState, useMemo } from 'react';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

// 필요한 컴포넌트들을 불러옵니다.
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChildProfileCard from './ChildProfileCard'; 
import MainLayout from './MainScreen'; // 1. 방금 만든 MainLayout을 import 합니다.

import { FaCreativeCommonsSampling } from "react-icons/fa";
// toBase64 등 유틸리티 함수는 그대로 둡니다.

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // chatModel과 handleSendMessage 로직은 그대로 유지합니다.
  const chatModel = useMemo(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key가 .env 파일에 없습니다!");
      return null;
    }
    return new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      modelName: "gemini-1.5-flash-latest",
    });
  }, []);

  const handleSendMessage = async (inputText, selectedFile) => {
    if (!inputText && !selectedFile) return;
    const newUserMessage = new HumanMessage(inputText || "파일 전송");
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    setTimeout(() => {
        setMessages(prev => [...prev, new AIMessage("메시지를 받았습니다.")]);
        setIsLoading(false);
    }, 1000);
  };

  // 2. return 부분을 MainLayout을 사용하는 구조로 변경합니다.
  return (
    <MainLayout
      profile={
        // 원래 이미지 대신 ChildProfileCard를 넣습니다.
        <ChildProfileCard /> 
      }
      mainContent={
        // 체크리스트 대신 MessageList를 넣습니다.
        <MessageList messages={messages} isLoading={isLoading} />
      }
      inputArea={
        // 하단 입력창 부분입니다.
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      }
    />
    // FAB 버튼은 MainLayout 바깥에 두어 화면 위에 떠 있도록 할 수 있습니다.
    // 필요 없다면 이 부분을 삭제해도 됩니다.
    /*
    <button className="fab-button">
      <FaCreativeCommonsSampling />
    </button>
    */
  );
}

export default ChatWindow;