import React, { useState, useMemo } from 'react';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import MessageList from './MessageList';
import MessageInput from './MessageInput';

function ChatWindow() {
  const [messages, setMessages] = useState([
    new AIMessage("안녕하세요! 아이에 대해 궁금한 점을 이야기해주세요.")
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const chatModel = useMemo(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key가 .env 파일에 없습니다!");
      return null;
    }
    return new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      modelName: "gemini-2.5-flash",
    });
  }, []);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const handleSendMessage = async (inputText, selectedFile) => {
    if ((!inputText.trim() && !selectedFile) || isLoading || !chatModel) return;

    setIsLoading(true);
    const userMessageContent = [];

    if (inputText.trim()) {
      userMessageContent.push({ type: "text", text: inputText });
    }
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const base64Image = await toBase64(selectedFile);
      userMessageContent.push({
        type: "image_url",
        image_url: `data:${selectedFile.type};base64,${base64Image}`,
      });
    } else if (selectedFile) {
        userMessageContent.push({ type: "text", text: `(첨부된 파일: ${selectedFile.name})` });
    }
    
    const userMessage = new HumanMessage({ content: userMessageContent });
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const response = await chatModel.invoke(newMessages);
      setMessages(prev => [...prev, response]);
    } catch (error) { // 문법 오류 수정: catch 블록에 중괄호({}) 추가
      console.error("LangChain 연동 중 오류 발생:", error);
      const errorMessage = new AIMessage("죄송합니다, 답변을 생성하는 중 오류가 발생했습니다.");
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="chat-container">
      <div className="chat-header"></div>
      <MessageList messages={messages} isLoading={isLoading} />
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </main>
  );
} // 문법 오류 수정: ChatWindow 함수를 닫는 중괄호({}) 추가

export default ChatWindow;
