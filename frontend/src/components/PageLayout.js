import React from 'react';
import BackButton from './BackButton';

// 이 컴포넌트는 다른 페이지들을 감싸서 공통 헤더(뒤로가기 버튼)를 제공합니다.
function PageLayout({ children }) {
  return (
    <div className="page-layout-container">
      <header className="page-header">
        <BackButton />
      </header>
      <main className="page-content">
        {children} {/* 이 부분에 각 페이지의 실제 내용이 들어옵니다. */}
      </main>
    </div>
  );
}

export default PageLayout;
