import React from 'react';
import BackButton from './BackButton';
import BottomNavBar from './BottomNavBar'; // BottomNavBar 임포트

function PageLayout({
  children,
  title,
  titleStyle,
  showNavBar = false,
  rightNode = null,
  backTo,
  noScroll = false,
  compactHeader = false,
}) {
  // 우측 액션 슬롯 추가
  return (
    <div className={`page-container${compactHeader ? ' page-container--compact' : ''}`}>
      {' '}
      {/* 전체 컨테이너 (헤더~네비 합산 884px) */}
      <header className="page-header">
        <BackButton to={backTo} />
        {title && (
          <h1 className="page-title" style={titleStyle}>
            {title}
          </h1>
        )}
        {rightNode ? rightNode : <div className="header-placeholder" />}
      </header>
      {/* 콘텐츠 영역은 스크롤 가능하도록 */}
      <main className={`page-content${noScroll ? ' no-scroll' : ''}`}>{children}</main>
      {/* 하단 네비게이션: 컨테이너 내부에 포함 */}
      {showNavBar && <BottomNavBar />}
    </div>
  );
}

export default PageLayout;
