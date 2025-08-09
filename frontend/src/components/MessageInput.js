// src/components/MessageInput.js (수정 예시)

import React, { useRef, useState } from 'react';
// 아이콘이 필요하다면 import 합니다.
import { FiPlus } from "react-icons/fi"; 
import { IoPaperPlaneOutline } from "react-icons/io5";

// onSendMessage, isLoading props를 받습니다.
const MessageInput = ({ onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() || attachedFiles.length > 0) {
      onSendMessage(inputText, attachedFiles);
      setInputText('');
      setAttachedFiles([]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      {/* 첨부파일 미리보기 영역 */}
      {attachedFiles.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
          padding: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          {attachedFiles.map((file, index) => (
            <div key={index} style={{
              position: 'relative',
              display: 'inline-block',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {file.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={file.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.name}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* 기존 form - 디자인 그대로 유지 */}
      <form className="new-chat-form" onSubmit={handleSubmit}>
      {/* 왼쪽 '+' 버튼 */}
      <button
        type="button"
        className="new-chat-button-plus"
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        disabled={isLoading}
      >
        <FiPlus />
      </button>

      {/* 숨김 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        multiple
        accept="image/*,video/*,audio/*"
        onChange={handleFileSelect}
      />

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
    </div>
  );
};

export default MessageInput;