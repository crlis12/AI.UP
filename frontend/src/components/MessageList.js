import React from 'react';

function isImage(fileOrUrl) {
  if (!fileOrUrl) return false;
  if (typeof fileOrUrl === 'string') return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileOrUrl);
  return (fileOrUrl.type || '').startsWith('image/');
}

function isVideo(fileOrUrl) {
  if (!fileOrUrl) return false;
  if (typeof fileOrUrl === 'string') return /\.(mp4|webm|ogg|mov|m4v)$/i.test(fileOrUrl);
  return (fileOrUrl.type || '').startsWith('video/');
}

function isAudio(fileOrUrl) {
  if (!fileOrUrl) return false;
  if (typeof fileOrUrl === 'string') return /\.(mp3|wav|ogg|m4a|aac)$/i.test(fileOrUrl);
  return (fileOrUrl.type || '').startsWith('audio/');
}

function AttachmentPreview({ attachment }) {
  if (!attachment) return null;

  const url = typeof attachment === 'string' ? attachment : URL.createObjectURL(attachment);

  if (isImage(attachment)) {
    return <img src={url} alt="attachment" className="message-attachment image" />;
  }
  if (isVideo(attachment)) {
    return (
      <video className="message-attachment video" controls>
        <source src={url} />
      </video>
    );
  }
  if (isAudio(attachment)) {
    return (
      <audio className="message-attachment audio" controls>
        <source src={url} />
      </audio>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" className="message-attachment file">
      첨부 파일 열기
    </a>
  );
}

function MessageList({ messages, isLoading }) {
  return (
    <div className="message-list">
      {isLoading && <div className="message ai">생각 중...</div>}
      {[...messages].reverse().map((message, index) => (
        <div key={index} className={`message ${message.sender === 'user' ? 'user' : 'ai'}`}>
          {message.text && <div className="message-text">{message.text}</div>}
          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
            <div className="message-attachments">
              {message.attachments.map((att, i) => (
                <AttachmentPreview key={i} attachment={att} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MessageList;
