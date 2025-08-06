import React from 'react';

function MessageList({ messages, isLoading }) {
  return (
    <div className="message-list">
      {[...messages].reverse().map((message, index) => (
        <div key={index} className={`message ${message._getType() === 'human' ? 'user' : 'ai'}`}>
          {Array.isArray(message.content) ? (
            message.content.map((part, partIndex) => {
              if (part.type === 'text') {
                return <p key={partIndex}>{part.text}</p>;
              }
              if (part.type === 'image_url') {
                return <img key={partIndex} src={part.image_url} alt="Uploaded content" className="message-image" />;
              }
              return null;
            })
          ) : (
            message.content
          )}
        </div>
      ))}
      {isLoading && <div className="message ai">생각 중...</div>}
    </div>
  );
}

export default MessageList;
