// src/components/ChatWindow.js (최종 수정본)

import React, { useState, useEffect, useRef } from 'react'; // useEffect, useRef 추가
import { useNavigate, useParams, useLocation } from 'react-router-dom'; // useLocation 추가
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import '../App.css'; 
import { FiChevronLeft, FiFileText } from 'react-icons/fi'; // 아이콘 변경
import BottomNavBar from './BottomNavBar';

// App.js에서 내려주는 messages와 onSendMessage를 props로 받습니다.
function ChatWindow({ messages, onSendMessage }) {
  const navigate = useNavigate();
  const { childId } = useParams();
  const location = useLocation(); // location 훅 사용
  const [isLoading, setIsLoading] = useState(false);
  const initialMessageSent = useRef(false); // 메시지를 보냈는지 추적하는 ref

  useEffect(() => {
    // 이전에 메시지를 보낸 적이 없고, 보낼 메시지가 있을 때만 실행
    if (!initialMessageSent.current && location.state?.initialMessage) {
      const initialMessage = location.state.initialMessage;
      onSendMessage(initialMessage);
      initialMessageSent.current = true; // 메시지를 보냈다고 표시
      
      // state에서 메시지를 제거하여 뒤로가기/새로고침 시 중복 실행 방지
      navigate('.', { replace: true, state: {} });
    }
  }, []); // 의존성 배열을 비워서 최초 1회만 실행되도록 보장


  // 대화 요약 및 저장 핸들러
  const handleSummarizeAndSave = async () => {
    if (isLoading || messages.length === 0) return;
    setIsLoading(true);

    try {
      // 1. 백엔드에 요약 요청
      const summarizeResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const summarizeData = await summarizeResponse.json();

      if (!summarizeData.success) {
        throw new Error(summarizeData.message || '요약 생성에 실패했습니다.');
      }
      
      const summaryText = summarizeData.summary;
      const fullText = messages.map(msg => `${msg._getType() === 'human' ? '나' : 'AI'}: ${msg.content}`).join('\n');
        
      // 2. 요약된 내용으로 바로 일지 저장 요청
      const diaryResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001'}/diaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: childId,
          summary: summaryText,
          full_text: fullText,
        }),
      });
      
      const diaryData = await diaryResponse.json();

      if (diaryData.success) {
        alert('대화 내용이 일지로 저장되었습니다.');
        navigate('/main'); // 메인 화면으로 이동
      } else {
        throw new Error(diaryData.message || '일지 저장에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('일지 저장 과정 중 오류 발생:', error);
      alert(error.message || '일지를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-screen-container">
		<div className="main-screen">
			{/* 고정되는 헤더 영역을 스크롤 뷰 바깥으로 이동 */}
			<div className="main-screen__header">
				<button onClick={() => navigate(-1)} className="chat-window-back-button">
				<FiChevronLeft size={25} /> 
				<span>뒤로가기</span>
				</button>
				<button onClick={handleSummarizeAndSave} className="chat-window-action-button" disabled={isLoading}>
				<FiFileText size={20} />
				<span>{isLoading ? '저장 중...' : '요약 및 저장'}</span>
				</button>
			</div>

			{/* 스크롤 가능한 메시지 영역 */}
			<div className="main-screen__scroll-view chat-window__messages-container">
				<MessageList messages={messages} isLoading={isLoading} />
			</div>
		</div>
		<div className="main-screen__chat-bar">
			<MessageInput onSendMessage={onSendMessage} isLoading={isLoading} />
		</div>
		<BottomNavBar />
    </div>
  );
}

export default ChatWindow;