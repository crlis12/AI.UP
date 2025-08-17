import React from 'react';
import BackButton from './BackButton';
import BottomNavBar from './BottomNavBar'; // BottomNavBar 임포트

function PageLayout({ children, title, titleStyle, showNavBar = false, rightNode = null, backTo }) { // 우측 액션 슬롯 추가
  return (
    <div className="page-container"> {/* 전체 컨테이너 클래스 변경 */}
      <header className="page-header">
        <BackButton to={backTo} />
        {title && <h1 className="page-title" style={titleStyle}>{title}</h1>}
        {rightNode ? rightNode : <div className="header-placeholder" />}
      </header>
      
      {/* 콘텐츠 영역은 스크롤 가능하도록 */}
      <main className="page-content">
        {children} 
      </main>

      {/* showNavBar가 true일 때만 하단 바를 렌더링 */}
      {showNavBar && <BottomNavBar />}
    </div>
  );
}

export default PageLayout;
