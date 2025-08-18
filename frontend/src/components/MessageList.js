import React from 'react';

function MessageList({ messages, isLoading }) {
  return (
    <div className="message-list">
      {messages.map((message, index) => {
        const isUser = message._getType() === 'human';
        const hasMedia =
          Array.isArray(message.content) &&
          message.content.some((p) => p?.type === 'image_url' || p?.type === 'video_url');
        const classNames = ['message', isUser ? 'user' : 'ai'];
        if (isUser && hasMedia) classNames.push('media');
        return (
          <div key={index} className={classNames.join(' ')}>
            {Array.isArray(message.content)
              ? message.content.map((part, partIndex) => {
                  if (part.type === 'text') {
                    return <p key={partIndex}>{part.text}</p>;
                  }
                  if (part.type === 'image_url') {
                    return (
                      <img
                        key={partIndex}
                        src={part.image_url}
                        alt="Uploaded content"
                        className="message-image"
                      />
                    );
                  }
                  if (part.type === 'video_url') {
                    return (
                      <video
                        key={partIndex}
                        src={part.video_url}
                        className="message-video"
                        controls
                      />
                    );
                  }
                  return null;
                })
              : message.content}
          </div>
        );
      })}
      {isLoading && <div className="message ai">생각 중...</div>}
    </div>
  );
}

export default MessageList;
