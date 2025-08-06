import React, { useState, useRef } from 'react';

function MessageInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // 부모 컴포넌트(ChatWindow)로 입력값과 파일 전달
    onSendMessage(input, selectedFile);
    // 입력 상태 초기화
    setInput('');
    setSelectedFile(null);
  };

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
    setIsAttachmentMenuOpen(false);
  };

  // 파일을 선택하면 파일 객체만 저장하도록 수정
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
    event.target.value = null;
  };

  return (
    <form className="message-form" onSubmit={handleFormSubmit}>
      {isAttachmentMenuOpen && (
        <div className="attachment-menu">
          <button type="button" onClick={handleFileUploadClick}>📎 파일 업로드</button>
        </div>
      )}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
      <button type="button" className="attachment-button" onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}>+</button>
      
      <div className="input-wrapper">
        {/* 선택된 파일의 이름만 표시하도록 UI 변경 */}
        {selectedFile && (
          <div className="file-preview">
            <div className="file-icon">📄 {selectedFile.name}</div>
            <button type="button" onClick={() => setSelectedFile(null)}>×</button>
          </div>
        )}
        <input
          type="text"
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
        />
      </div>
      <button type="submit" className="send-button" disabled={isLoading}>➤</button>
    </form>
  );
}

export default MessageInput;
