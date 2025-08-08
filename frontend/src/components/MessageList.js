import React from 'react';

function MessageList({ messages, isLoading }) {
  return (
    <div className="message-list">
      {[...messages].reverse().map((message, index) => (
        <div key={index} className={`message ${message.sender === 'user' ? 'user' : 'ai'}`}>
          {message.text}
        </div>
      ))}
      {isLoading && <div className="message ai">생각 중...</div>}
    </div>
  );
}

export default MessageList;
