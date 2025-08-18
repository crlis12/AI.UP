// src/components/MessageInput.js (수정 예시)

import React, { useState, useRef, useMemo, useEffect } from 'react';
// 아이콘이 필요하다면 import 합니다.
import { FiPlus, FiX } from 'react-icons/fi'; // FiX 아이콘 추가
import { IoPaperPlaneOutline } from 'react-icons/io5';

// onSendMessage, isLoading 같은 props는 그대로 받습니다.
const MessageInput = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // 선택된 파일 상태 추가
  const fileInputRef = useRef(null);

  // 미리보기 URL은 파일이 바뀔 때만 생성하고, 언마운트/변경 시 revoke
  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() || selectedFile) {
      // onSendMessage에 파일 정보도 함께 전달 (부모 컴포넌트 수정 필요)
      onSendMessage(inputText, selectedFile);
      setInputText('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // 파일 입력 값 초기화
      }
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file);
      setSelectedFile(file); // 상태에 파일 저장
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // 파일 입력 값 초기화
    }
  };

  return (
    <div className="message-input-container">
      {selectedFile && (
        <div className="file-preview">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {selectedFile.type.startsWith('image/') && (
              <img
                src={previewUrl}
                alt="preview"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
            {selectedFile.type.startsWith('video/') && (
              <video
                src={previewUrl}
                style={{ width: 120, maxHeight: 80, borderRadius: 8 }}
                controls
              />
            )}
            <span>{selectedFile.name}</span>
          </div>
          <button type="button" onClick={removeSelectedFile} className="remove-file-button">
            <FiX size={18} />
          </button>
        </div>
      )}
      <form className="new-chat-form" onSubmit={handleSubmit}>
        <button type="button" className="new-chat-button-plus" onClick={handlePlusClick}>
          <FiPlus />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*,video/*"
        />
        <input
          type="text"
          className="new-chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="내 아이에 대해 질문하기"
          disabled={isLoading}
        />
        <button type="submit" className="new-chat-button-send" disabled={isLoading}>
          <IoPaperPlaneOutline />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
